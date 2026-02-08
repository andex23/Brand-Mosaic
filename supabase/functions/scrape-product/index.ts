import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the page
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandMosaic/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch page: ${pageResponse.status}`);
    }

    const html = await pageResponse.text();

    // Extract metadata
    const ogImage = extractMeta(html, 'og:image')
      || extractMeta(html, 'twitter:image')
      || extractMeta(html, 'twitter:image:src');
    const ogTitle = extractMeta(html, 'og:title')
      || extractMeta(html, 'twitter:title')
      || extractTitle(html);
    const ogDescription = extractMeta(html, 'og:description')
      || extractMeta(html, 'description');
    const ogPrice = extractMeta(html, 'product:price:amount')
      || extractMeta(html, 'og:price:amount');
    const ogBrand = extractMeta(html, 'product:brand')
      || extractMeta(html, 'og:brand');

    // Resolve relative URLs
    let imageUrl = ogImage;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = new URL(imageUrl, url).toString();
    }

    // Fallback: JSON-LD structured data
    if (!imageUrl) {
      imageUrl = extractJsonLdImage(html);
    }

    // Fetch image and convert to base64
    let imageBase64: string | null = null;
    if (imageUrl) {
      try {
        const imgResponse = await fetch(imageUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BrandMosaic/1.0)' },
        });
        if (imgResponse.ok) {
          const arrayBuffer = await imgResponse.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          // Convert to base64 in chunks to avoid stack overflow
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode(...chunk);
          }
          const base64 = btoa(binary);
          const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
          imageBase64 = `data:${contentType};base64,${base64}`;
        }
      } catch (imgError) {
        console.error('Failed to fetch product image:', imgError);
      }
    }

    return new Response(
      JSON.stringify({
        productName: ogTitle || '',
        imageUrl: imageUrl || null,
        imageBase64,
        metadata: {
          description: ogDescription || '',
          price: ogPrice || '',
          brand: ogBrand || '',
          sourceUrl: url,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to scrape product page' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ── Helpers ───────────────────────────────────────────

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() || null;
}

function extractJsonLdImage(html: string): string | null {
  const jsonLdMatches = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!jsonLdMatches) return null;

  for (const match of jsonLdMatches) {
    try {
      const content = match.replace(/<\/?script[^>]*>/gi, '');
      const data = JSON.parse(content);
      if (data.image) {
        const img = Array.isArray(data.image) ? data.image[0] : data.image;
        return typeof img === 'string' ? img : img?.url || null;
      }
    } catch {
      // Ignore parse errors
    }
  }
  return null;
}
