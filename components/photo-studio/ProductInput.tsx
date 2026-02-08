import React, { useState, useRef } from 'react';
import { ProductInputData } from '../../types';
import { supabase } from '../../lib/supabase';

interface ProductInputProps {
  onConfirm: (product: ProductInputData) => void;
  isLocalMode: boolean;
  showError: (code: string, options?: { message?: string }) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 1024;

/**
 * Resize image to max dimension using canvas
 * Returns a PNG base64 data URL
 */
function normalizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context unavailable'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

const MAX_IMAGES = 5; // Max product images (primary + 4 additional angles)

// ── Image Scoring & Crawling ─────────────────────────────

interface CandidateImage {
  url: string;
  score: number;
  width?: number;
  height?: number;
  alt?: string;
  source: string; // where we found it: 'json-ld', 'og', 'dom-img', 'srcset'
}

/**
 * Check if URL is likely NOT a product image (logo, icon, tracking pixel, etc.)
 */
function isJunkImage(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('logo') ||
    lower.includes('favicon') ||
    lower.includes('icon') ||
    lower.includes('brand-mark') ||
    lower.includes('/sprites') ||
    lower.includes('badge') ||
    lower.includes('rating') ||
    lower.includes('stars') ||
    lower.includes('payment') ||
    lower.includes('shipping') ||
    lower.includes('banner') ||
    lower.includes('promo') ||
    lower.includes('advert') ||
    lower.includes('tracking') ||
    lower.includes('analytics') ||
    lower.includes('pixel') ||
    lower.includes('spacer') ||
    lower.includes('placeholder') ||
    lower.includes('avatar') ||
    lower.includes('profile') ||
    lower.includes('social') ||
    lower.includes('facebook') ||
    lower.includes('twitter') ||
    lower.includes('instagram') ||
    lower.includes('pinterest') ||
    lower.includes('youtube') ||
    lower.includes('trustpilot') ||
    lower.includes('trust-badge') ||
    lower.includes('secure-checkout') ||
    lower.includes('1x1') ||
    lower.endsWith('.svg') ||
    lower.endsWith('.ico') ||
    lower.endsWith('.gif') ||
    // Tiny base64 images (tracking pixels)
    (lower.startsWith('data:') && lower.length < 200)
  );
}

/**
 * Score a URL based on how "product-like" it is.
 * Higher score = more likely a product image.
 */
function scoreUrl(url: string): number {
  let s = 0;
  const lower = url.toLowerCase();

  // Positive signals — product image URL patterns
  if (lower.includes('product')) s += 15;
  if (lower.includes('catalog')) s += 10;
  if (lower.includes('item')) s += 8;
  if (lower.includes('goods')) s += 8;
  if (lower.includes('gallery')) s += 10;
  if (lower.includes('main')) s += 5;
  if (lower.includes('hero')) s += 8;
  if (lower.includes('featured')) s += 5;
  if (lower.includes('primary')) s += 5;
  if (lower.includes('zoom')) s += 12;
  if (lower.includes('large')) s += 8;
  if (lower.includes('full')) s += 5;
  if (lower.includes('1024') || lower.includes('1200') || lower.includes('2000')) s += 10;
  if (lower.includes('800x') || lower.includes('1000x') || lower.includes('1200x')) s += 10;

  // Image CDNs commonly used for product photos
  if (lower.includes('shopify') && lower.includes('cdn')) s += 10;
  if (lower.includes('scene7')) s += 10; // Adobe Scene7 — major product image CDN
  if (lower.includes('cloudinary')) s += 5;
  if (lower.includes('imgix')) s += 5;

  // Negative signals — these are NOT product photos
  if (lower.includes('thumb') && !lower.includes('thumbnail')) s -= 5;
  if (lower.includes('50x') || lower.includes('100x') || lower.includes('150x')) s -= 10;
  if (lower.includes('tiny') || lower.includes('small') || lower.includes('mini')) s -= 5;
  if (lower.includes('nav') || lower.includes('header') || lower.includes('footer')) s -= 15;
  if (lower.includes('bg') || lower.includes('background')) s -= 10;

  return s;
}

/**
 * Score a DOM context (class names, IDs, parent hierarchy) for product relevance.
 */
function scoreDomContext(contextHints: string): number {
  let s = 0;
  const lower = contextHints.toLowerCase();

  // Strong product signals
  if (lower.includes('product')) s += 20;
  if (lower.includes('gallery')) s += 15;
  if (lower.includes('slider')) s += 10;
  if (lower.includes('carousel')) s += 10;
  if (lower.includes('swiper')) s += 10;
  if (lower.includes('main-image') || lower.includes('mainimage')) s += 20;
  if (lower.includes('hero-image') || lower.includes('heroimage')) s += 15;
  if (lower.includes('featured')) s += 10;
  if (lower.includes('primary')) s += 12;
  if (lower.includes('pdp')) s += 15; // Product Detail Page
  if (lower.includes('zoom')) s += 12;
  if (lower.includes('detail')) s += 8;
  if (lower.includes('media')) s += 5;
  if (lower.includes('image-container') || lower.includes('imagecontainer')) s += 10;

  // Weak positive signals
  if (lower.includes('content')) s += 3;
  if (lower.includes('main')) s += 5;

  // Negative signals
  if (lower.includes('logo')) s -= 20;
  if (lower.includes('nav') || lower.includes('navigation')) s -= 15;
  if (lower.includes('header')) s -= 10;
  if (lower.includes('footer')) s -= 20;
  if (lower.includes('sidebar')) s -= 15;
  if (lower.includes('related') || lower.includes('recommend')) s -= 10;
  if (lower.includes('review')) s -= 10;
  if (lower.includes('banner') || lower.includes('advert') || lower.includes('promo')) s -= 15;
  if (lower.includes('social')) s -= 15;
  if (lower.includes('breadcrumb')) s -= 15;
  if (lower.includes('cart') || lower.includes('checkout')) s -= 10;
  if (lower.includes('newsletter')) s -= 15;

  return s;
}

/**
 * Deep DOM Crawler — extract ALL potential product images from raw HTML.
 * Scores each image by URL patterns, DOM context (class/id/parent), and size hints.
 */
function crawlHtmlForImages(html: string, baseUrl: string): CandidateImage[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const candidates: CandidateImage[] = [];
  const seenUrls = new Set<string>();

  const resolveUrl = (u: string): string => {
    if (!u || u.startsWith('data:')) return u;
    try { return new URL(u, baseUrl).href; } catch { return u; }
  };

  const addCandidate = (url: string, score: number, source: string, width?: number, height?: number, alt?: string) => {
    const resolved = resolveUrl(url);
    if (!resolved || resolved.startsWith('data:') || seenUrls.has(resolved)) return;
    if (isJunkImage(resolved)) return;
    seenUrls.add(resolved);
    candidates.push({ url: resolved, score, source, width, height, alt });
  };

  // ── Priority 1: JSON-LD Product structured data ──

  const ldScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  ldScripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent || '');
      const processItem = (item: any) => {
        if (item['@type'] === 'Product' || item['@type']?.includes?.('Product')) {
          // Product images from JSON-LD are the most reliable
          if (Array.isArray(item.image)) {
            item.image.forEach((img: string, idx: number) => {
              addCandidate(img, 100 - idx * 2, 'json-ld');
            });
          } else if (typeof item.image === 'string') {
            addCandidate(item.image, 100, 'json-ld');
          } else if (item.image?.url) {
            addCandidate(item.image.url, 100, 'json-ld');
          }
        }
      };
      if (Array.isArray(data)) data.forEach(processItem);
      else if (data['@graph']) data['@graph'].forEach(processItem);
      else processItem(data);
    } catch { /* invalid JSON-LD */ }
  });

  // ── Priority 2: OG/meta tags ──

  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  if (ogImage) addCandidate(ogImage, 60, 'og');

  const twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
  if (twitterImage) addCandidate(twitterImage, 55, 'og');

  const productImage = doc.querySelector('meta[property="product:image"]')?.getAttribute('content');
  if (productImage) addCandidate(productImage, 70, 'og');

  // ── Priority 3: Deep DOM scan — all <img> elements ──

  const allImages = doc.querySelectorAll('img');
  allImages.forEach((img) => {
    const src = img.getAttribute('src') || '';
    const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original') || '';
    const dataZoom = img.getAttribute('data-zoom-image') || img.getAttribute('data-zoom') || img.getAttribute('data-large') || '';
    const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset') || '';
    const alt = img.getAttribute('alt') || '';

    // Get width/height hints from attributes
    const attrWidth = parseInt(img.getAttribute('width') || '0');
    const attrHeight = parseInt(img.getAttribute('height') || '0');

    // Build DOM context: collect class names and IDs from the image and its ancestors (up 5 levels)
    let contextStr = '';
    let el: Element | null = img;
    for (let depth = 0; depth < 5 && el; depth++) {
      const cls = el.getAttribute('class') || '';
      const id = el.getAttribute('id') || '';
      const role = el.getAttribute('role') || '';
      const itemprop = el.getAttribute('itemprop') || '';
      contextStr += ` ${cls} ${id} ${role} ${itemprop}`;
      el = el.parentElement;
    }

    // itemprop="image" on the img itself is a very strong product signal
    const itemprop = img.getAttribute('itemprop') || '';
    const hasItempropImage = itemprop.includes('image');

    // Score each source URL variant
    const urlsToScore: { url: string; bonus: number }[] = [];
    if (src) urlsToScore.push({ url: src, bonus: 0 });
    if (dataSrc) urlsToScore.push({ url: dataSrc, bonus: 3 }); // lazy-loaded = likely important
    if (dataZoom) urlsToScore.push({ url: dataZoom, bonus: 20 }); // zoom = definitely the product

    // Parse srcset for the largest image
    if (srcset) {
      const srcsetParts = srcset.split(',').map(s => s.trim());
      let bestSrcsetUrl = '';
      let bestSrcsetSize = 0;
      for (const part of srcsetParts) {
        const pieces = part.split(/\s+/);
        const url = pieces[0];
        const descriptor = pieces[1] || '';
        const sizeVal = parseInt(descriptor) || 0;
        if (sizeVal > bestSrcsetSize) {
          bestSrcsetSize = sizeVal;
          bestSrcsetUrl = url;
        }
      }
      if (bestSrcsetUrl) {
        urlsToScore.push({ url: bestSrcsetUrl, bonus: 8 }); // srcset largest = high quality
      }
    }

    for (const { url, bonus } of urlsToScore) {
      const resolved = resolveUrl(url);
      if (!resolved || resolved.startsWith('data:') || isJunkImage(resolved)) continue;

      let score = 0;
      score += scoreUrl(resolved);
      score += scoreDomContext(contextStr);
      score += bonus;

      // Size bonuses — larger images are more likely the product
      if (attrWidth >= 400 || attrHeight >= 400) score += 15;
      else if (attrWidth >= 200 || attrHeight >= 200) score += 5;
      else if (attrWidth > 0 && attrWidth < 80) score -= 20; // tiny image
      else if (attrHeight > 0 && attrHeight < 80) score -= 20;

      // Alt text analysis
      if (alt) {
        const altLower = alt.toLowerCase();
        if (altLower.includes('product')) score += 10;
        if (altLower.includes('image') && altLower.length > 15) score += 3;
      }

      // itemprop="image" is a schema.org product signal
      if (hasItempropImage) score += 25;

      addCandidate(resolved, score, 'dom-img', attrWidth || undefined, attrHeight || undefined, alt || undefined);
    }
  });

  // ── Priority 4: <picture> elements with <source> ──

  const pictures = doc.querySelectorAll('picture source');
  pictures.forEach((source) => {
    const srcset = source.getAttribute('srcset') || '';
    if (!srcset) return;
    const parts = srcset.split(',').map(s => s.trim());
    let bestUrl = '';
    let bestSize = 0;
    for (const part of parts) {
      const pieces = part.split(/\s+/);
      const sizeVal = parseInt(pieces[1] || '0') || 0;
      if (sizeVal > bestSize) {
        bestSize = sizeVal;
        bestUrl = pieces[0];
      }
    }
    if (!bestUrl && parts.length > 0) bestUrl = parts[parts.length - 1].split(/\s+/)[0];
    if (bestUrl) {
      let contextStr = '';
      let el: Element | null = source.parentElement;
      for (let d = 0; d < 4 && el; d++) {
        contextStr += ` ${el.getAttribute('class') || ''} ${el.getAttribute('id') || ''}`;
        el = el.parentElement;
      }
      const score = scoreUrl(bestUrl) + scoreDomContext(contextStr) + 5;
      addCandidate(bestUrl, score, 'picture-source');
    }
  });

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Deduplicate by similar URLs (some CDNs differ only in size params)
  const deduped: CandidateImage[] = [];
  const normalizedSeen = new Set<string>();
  for (const c of candidates) {
    // Normalize: strip common size parameters for dedup
    const normalized = c.url
      .replace(/[?&](w|width|h|height|size|resize|fit|crop|quality|q|format|f|auto)=[^&]*/gi, '')
      .replace(/\?$/, '');
    if (!normalizedSeen.has(normalized)) {
      normalizedSeen.add(normalized);
      deduped.push(c);
    }
  }

  return deduped;
}

/**
 * Extract product metadata from parsed HTML (name, description, price, brand)
 */
function extractMetadata(html: string, baseUrl: string): {
  productName: string;
  metadata: ProductInputData['metadata'];
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const getMeta = (selectors: string[]): string => {
    for (const sel of selectors) {
      const el = doc.querySelector(sel);
      if (el) {
        const content = el.getAttribute('content') || el.textContent || '';
        if (content.trim()) return content.trim();
      }
    }
    return '';
  };

  // Try JSON-LD first
  let name = '';
  let description = '';
  let price = '';
  let brand = '';

  const ldScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  ldScripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent || '');
      const processItem = (item: any) => {
        if (item['@type'] === 'Product' || item['@type']?.includes?.('Product')) {
          name = name || item.name || '';
          description = description || item.description || '';
          brand = brand || item.brand?.name || (typeof item.brand === 'string' ? item.brand : '');
          if (item.offers) {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offer?.price) price = `${offer.priceCurrency || ''} ${offer.price}`;
          }
        }
      };
      if (Array.isArray(data)) data.forEach(processItem);
      else if (data['@graph']) data['@graph'].forEach(processItem);
      else processItem(data);
    } catch { /* invalid JSON-LD */ }
  });

  // Fall back to meta tags
  if (!name) name = getMeta(['meta[property="og:title"]', 'meta[name="twitter:title"]', 'title']);
  if (!description) description = getMeta(['meta[property="og:description"]', 'meta[name="description"]']);
  if (!brand) brand = getMeta(['meta[property="og:site_name"]', 'meta[property="product:brand"]']);
  if (!price) price = getMeta(['meta[property="product:price:amount"]']);

  return {
    productName: name || 'Product',
    metadata: {
      description: description || undefined,
      price: price || undefined,
      brand: brand || undefined,
    },
  };
}

// ── CORS Proxy Chain ─────────────────────────────────────

/**
 * Try fetching HTML through multiple CORS proxies until one works.
 */
async function fetchHtmlViaCorsProxy(targetUrl: string): Promise<string | null> {
  const proxies = [
    // allorigins returns JSON with contents field — most reliable
    {
      url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
      parseJson: true,
      field: 'contents',
    },
    // corsproxy.io returns raw HTML
    {
      url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      parseJson: false,
    },
    // api.codetabs.com
    {
      url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
      parseJson: false,
    },
  ];

  for (const proxy of proxies) {
    try {
      const resp = await fetch(proxy.url, { signal: AbortSignal.timeout(15000) });
      if (!resp.ok) continue;
      if (proxy.parseJson) {
        const json = await resp.json();
        const html = json[proxy.field!];
        if (html && typeof html === 'string' && html.length > 500) return html;
      } else {
        const text = await resp.text();
        if (text && text.length > 500) return text;
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Load an image URL and get its real dimensions.
 * Returns { width, height } or null if the image can't be loaded.
 */
function probeImageDimensions(url: string, timeout = 8000): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => {
      img.src = '';
      resolve(null);
    }, timeout);
    img.onload = () => {
      clearTimeout(timer);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Load a remote image URL and convert to base64 via canvas.
 * Normalizes to max 1024px.
 */
function imageUrlToBase64(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas unavailable'));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load product image'));
    img.src = imageUrl;
  });
}

/**
 * Proxy an image URL through a CORS-friendly service for loading.
 * Needed when the image itself blocks cross-origin requests.
 */
function corsProxyImageUrl(url: string): string {
  return `https://corsproxy.io/?${encodeURIComponent(url)}`;
}

// ══════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════

const ProductInput: React.FC<ProductInputProps> = ({
  onConfirm,
  isLocalMode,
  showError,
}) => {
  const [mode, setMode] = useState<'url' | 'upload'>('upload');
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [productName, setProductName] = useState('');
  const [sourceUrl, setSourceUrl] = useState<string | undefined>();
  const [metadata, setMetadata] = useState<ProductInputData['metadata']>();
  const [showManualImageInput, setShowManualImageInput] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);

  // Candidate images for user selection
  const [candidateImages, setCandidateImages] = useState<CandidateImage[]>([]);
  const [showCandidates, setShowCandidates] = useState(false);
  const [loadingCandidate, setLoadingCandidate] = useState<string | null>(null);

  // ── URL Fetch Handler ────────────────────────────────

  const handleFetchUrl = async () => {
    if (!url.trim()) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      showError('scene/invalid-url');
      return;
    }

    setIsScraping(true);
    setScrapingStatus('Connecting...');
    setCandidateImages([]);
    setShowCandidates(false);

    try {
      const targetUrl = url.trim();

      // Strategy 0: Supabase Edge Function (if deployed)
      if (supabase) {
        try {
          setScrapingStatus('Trying server-side fetch...');
          const { data, error } = await supabase.functions.invoke('scrape-product', {
            body: { url: targetUrl },
          });
          if (!error && data?.imageBase64) {
            setPreviewImage(data.imageBase64);
            setProductName(data.productName || '');
            setSourceUrl(targetUrl);
            setMetadata(data.metadata);
            setIsScraping(false);
            return;
          }
        } catch {
          // Edge function not deployed — continue
        }
      }

      // Strategy 1: Fetch full HTML via CORS proxy and deep-crawl it
      setScrapingStatus('Crawling page for product images...');
      const html = await fetchHtmlViaCorsProxy(targetUrl);

      if (html) {
        // Extract metadata
        const meta = extractMetadata(html, targetUrl);
        setProductName(meta.productName);
        setMetadata(meta.metadata);
        setSourceUrl(targetUrl);

        // Deep crawl for images
        const allCandidates = crawlHtmlForImages(html, targetUrl);

        if (allCandidates.length > 0) {
          // Take top candidates (max 8) and probe their real dimensions
          setScrapingStatus(`Found ${allCandidates.length} images — checking quality...`);
          const topCandidates = allCandidates.slice(0, 12);

          // Probe dimensions in parallel (with timeout)
          const probed = await Promise.all(
            topCandidates.map(async (c) => {
              const dims = await probeImageDimensions(c.url, 6000);
              if (dims) {
                c.width = dims.width;
                c.height = dims.height;
                // Boost score based on real dimensions
                if (dims.width >= 600 && dims.height >= 600) c.score += 25;
                else if (dims.width >= 400 || dims.height >= 400) c.score += 12;
                else if (dims.width < 100 || dims.height < 100) c.score -= 30;
                else if (dims.width < 150 || dims.height < 150) c.score -= 15;
              }
              return c;
            })
          );

          // Filter out images that are too small (less than 100px) or couldn't be loaded
          const validCandidates = probed
            .filter(c => {
              if (c.width && c.height) {
                return c.width >= 100 && c.height >= 100;
              }
              return true; // keep unprobed ones
            })
            .sort((a, b) => b.score - a.score);

          if (validCandidates.length === 0) {
            // No valid candidates found
            setShowManualImageInput(true);
            showError('scene/scrape-failed', {
              message: 'Found images but none were large enough. You can paste the product image URL directly below, or switch to Upload.',
            });
            setIsScraping(false);
            return;
          }

          // If the top candidate has a significantly higher score, auto-select it
          const top = validCandidates[0];
          const secondScore = validCandidates[1]?.score ?? -999;

          if (top.score >= 80 && top.score - secondScore >= 20) {
            // High-confidence auto-select
            setScrapingStatus('Loading product image...');
            try {
              const base64 = await imageUrlToBase64(top.url);
              setPreviewImage(base64);
              setIsScraping(false);
              return;
            } catch {
              // CORS blocked — try proxied
              try {
                const base64 = await imageUrlToBase64(corsProxyImageUrl(top.url));
                setPreviewImage(base64);
                setIsScraping(false);
                return;
              } catch {
                // Fall through to candidate picker
              }
            }
          }

          // Show candidate picker — let user choose
          const displayCandidates = validCandidates.slice(0, 6);
          setCandidateImages(displayCandidates);
          setShowCandidates(true);
          setIsScraping(false);
          return;
        }
      }

      // Strategy 2: Microlink API (for sites that block CORS proxies)
      setScrapingStatus('Trying alternate fetch...');
      try {
        const mlResp = await fetch(
          `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=true`,
          { signal: AbortSignal.timeout(15000) }
        );
        if (mlResp.ok) {
          const mlJson = await mlResp.json();
          if (mlJson.status === 'success' && mlJson.data) {
            const d = mlJson.data;
            const name = d.title || 'Product';
            setProductName(name);
            setSourceUrl(targetUrl);
            setMetadata({
              description: d.description || undefined,
              brand: d.publisher || undefined,
            });

            // Collect candidate images from Microlink
            const mlCandidates: CandidateImage[] = [];
            if (d.image?.url && !isJunkImage(d.image.url)) {
              mlCandidates.push({ url: d.image.url, score: 50, source: 'microlink-og' });
            }
            // Microlink may also return a screenshot as fallback
            if (d.screenshot?.url) {
              mlCandidates.push({ url: d.screenshot.url, score: 20, source: 'microlink-screenshot' });
            }

            if (mlCandidates.length > 0) {
              if (mlCandidates.length === 1 && mlCandidates[0].score >= 50) {
                // Single good candidate — auto-select
                try {
                  const base64 = await imageUrlToBase64(mlCandidates[0].url);
                  setPreviewImage(base64);
                  setIsScraping(false);
                  return;
                } catch {
                  try {
                    const base64 = await imageUrlToBase64(corsProxyImageUrl(mlCandidates[0].url));
                    setPreviewImage(base64);
                    setIsScraping(false);
                    return;
                  } catch { /* fall through */ }
                }
              }

              setCandidateImages(mlCandidates);
              setShowCandidates(true);
              setIsScraping(false);
              return;
            }
          }
        }
      } catch { /* Microlink failed */ }

      // All strategies failed — show manual input
      setShowManualImageInput(true);
      showError('scene/scrape-failed', {
        message: 'Could not find product images automatically. Paste the product image URL below, or switch to Upload.',
      });
    } catch (err: any) {
      console.error('URL scrape failed:', err);
      showError('scene/scrape-failed', {
        message: 'Could not fetch product info. Try pasting the image URL directly or upload an image.',
      });
      setShowManualImageInput(true);
    } finally {
      setIsScraping(false);
      setScrapingStatus('');
    }
  };

  // ── Candidate Selection ────────────────────────────────

  const handleSelectCandidate = async (candidate: CandidateImage) => {
    setLoadingCandidate(candidate.url);
    try {
      const base64 = await imageUrlToBase64(candidate.url);
      setPreviewImage(base64);
      setShowCandidates(false);
      setCandidateImages([]);
    } catch {
      // CORS blocked — try proxied URL
      try {
        const base64 = await imageUrlToBase64(corsProxyImageUrl(candidate.url));
        setPreviewImage(base64);
        setShowCandidates(false);
        setCandidateImages([]);
      } catch {
        showError('scene/scrape-failed', {
          message: 'Cannot load this image (CORS blocked). Try a different one or paste the image URL directly.',
        });
      }
    } finally {
      setLoadingCandidate(null);
    }
  };

  // ── File Upload Handlers ───────────────────────────────

  const validateAndNormalize = async (file: File): Promise<string | null> => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showError('scene/invalid-image');
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      showError('scene/image-too-large');
      return null;
    }
    try {
      return await normalizeImage(file);
    } catch {
      showError('scene/invalid-image');
      return null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const normalized = await validateAndNormalize(file);
    if (!normalized) return;

    setPreviewImage(normalized);
    setProductName(file.name.replace(/\.\w+$/, '').replace(/[-_]/g, ' '));
    setSourceUrl(undefined);
    setMetadata(undefined);
  };

  const handleAdditionalFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_IMAGES - 1 - additionalImages.length;
    if (remaining <= 0) {
      showError('scene/invalid-image', {
        message: `Maximum ${MAX_IMAGES} images allowed (1 primary + ${MAX_IMAGES - 1} additional angles).`,
      });
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remaining);
    const newImages: string[] = [];

    for (const file of filesToProcess) {
      const normalized = await validateAndNormalize(file);
      if (normalized) newImages.push(normalized);
    }

    if (newImages.length > 0) {
      setAdditionalImages(prev => [...prev, ...newImages]);
    }

    if (additionalInputRef.current) additionalInputRef.current.value = '';
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  // ── Confirm & Reset ────────────────────────────────────

  const handleConfirm = () => {
    if (!previewImage || !productName.trim()) return;

    onConfirm({
      imageBase64: previewImage,
      additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
      productName: productName.trim(),
      sourceType: sourceUrl ? 'url' : 'upload',
      sourceUrl,
      metadata,
    });
  };

  const handleManualImageUrl = async () => {
    if (!manualImageUrl.trim()) return;
    try {
      const base64 = await imageUrlToBase64(manualImageUrl.trim());
      setPreviewImage(base64);
      setShowManualImageInput(false);
      setShowCandidates(false);
      if (!productName) setProductName('Product');
    } catch {
      // CORS blocked — try proxied
      try {
        const base64 = await imageUrlToBase64(corsProxyImageUrl(manualImageUrl.trim()));
        setPreviewImage(base64);
        setShowManualImageInput(false);
        setShowCandidates(false);
        if (!productName) setProductName('Product');
      } catch {
        // Last resort: use URL directly (won't convert to base64)
        setPreviewImage(manualImageUrl.trim());
        setShowManualImageInput(false);
        setShowCandidates(false);
        if (!productName) setProductName('Product');
      }
    }
  };

  const handleReset = () => {
    setPreviewImage(null);
    setAdditionalImages([]);
    setProductName('');
    setSourceUrl(undefined);
    setMetadata(undefined);
    setUrl('');
    setShowManualImageInput(false);
    setManualImageUrl('');
    setCandidateImages([]);
    setShowCandidates(false);
    setLoadingCandidate(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (additionalInputRef.current) additionalInputRef.current.value = '';
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="ps-product-input">
      <h3 className="ps-section-title">Your Product</h3>
      <p className="ps-section-desc">
        Upload product images (multiple angles supported) or paste a product page URL.
        The AI will use these to generate scene photography.
      </p>

      {/* Input Mode Tabs */}
      <div className="ps-input-tabs">
        <button
          className={`ps-tab ${mode === 'upload' ? 'ps-tab-active' : ''}`}
          onClick={() => { setMode('upload'); handleReset(); }}
        >
          [ UPLOAD IMAGE ]
        </button>
        <button
          className={`ps-tab ${mode === 'url' ? 'ps-tab-active' : ''}`}
          onClick={() => { setMode('url'); handleReset(); }}
        >
          [ PRODUCT LINK ]
        </button>
      </div>

      {/* Upload Mode */}
      {mode === 'upload' && !previewImage && (
        <div
          className="ps-upload-area"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ps-upload-dragover'); }}
          onDragLeave={(e) => { e.currentTarget.classList.remove('ps-upload-dragover'); }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('ps-upload-dragover');
            const file = e.dataTransfer.files[0];
            if (file) {
              const dt = new DataTransfer();
              dt.items.add(file);
              if (fileInputRef.current) {
                fileInputRef.current.files = dt.files;
                fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            hidden
          />
          <div className="ps-upload-content">
            <span className="ps-upload-icon">[ + ]</span>
            <span className="ps-upload-label">Drop image here or click to upload</span>
            <span className="ps-upload-hint">JPG, PNG, or WEBP — max 10MB</span>
          </div>
        </div>
      )}

      {/* URL Mode */}
      {mode === 'url' && !previewImage && !showCandidates && (
        <div className="ps-url-input">
          <input
            type="url"
            className="brand-question-input"
            placeholder="https://example.com/product..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
            disabled={isScraping}
          />
          <button
            className="brand-submit-btn"
            onClick={handleFetchUrl}
            disabled={isScraping || !url.trim()}
          >
            {isScraping ? `[ ${scrapingStatus || 'FETCHING...'} ]` : '[ FETCH PRODUCT ]'}
          </button>

          {/* Manual image URL fallback when auto-fetch fails */}
          {showManualImageInput && (
            <div className="ps-manual-image-fallback">
              <p className="ps-manual-hint">
                Right-click the product image on the page, then
                "Copy image address" and paste below:
              </p>
              <input
                type="url"
                className="brand-question-input"
                placeholder="https://example.com/product-image.jpg"
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualImageUrl()}
              />
              <input
                type="text"
                className="brand-question-input"
                placeholder="Product name..."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
              <button
                className="brand-submit-btn"
                onClick={handleManualImageUrl}
                disabled={!manualImageUrl.trim()}
              >
                [ LOAD IMAGE ]
              </button>
            </div>
          )}
        </div>
      )}

      {/* Candidate Image Picker */}
      {showCandidates && candidateImages.length > 0 && !previewImage && (
        <div className="ps-candidates">
          <h4 className="ps-candidates-title">
            Found {candidateImages.length} product image{candidateImages.length !== 1 ? 's' : ''} — pick the best one:
          </h4>
          <div className="ps-candidates-grid">
            {candidateImages.map((c, i) => (
              <button
                key={i}
                className={`ps-candidate-card ${loadingCandidate === c.url ? 'ps-candidate-loading' : ''}`}
                onClick={() => handleSelectCandidate(c)}
                disabled={loadingCandidate !== null}
              >
                <div className="ps-candidate-img-wrap">
                  <img
                    src={c.url}
                    alt={c.alt || `Image option ${i + 1}`}
                    className="ps-candidate-img"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      // If direct load fails, try proxied URL
                      const img = e.target as HTMLImageElement;
                      if (!img.src.includes('corsproxy.io')) {
                        img.src = corsProxyImageUrl(c.url);
                      }
                    }}
                  />
                  {loadingCandidate === c.url && (
                    <div className="ps-candidate-overlay">Loading...</div>
                  )}
                </div>
                {c.width && c.height && (
                  <span className="ps-candidate-size">{c.width} x {c.height}</span>
                )}
              </button>
            ))}
          </div>

          <div className="ps-candidates-actions">
            <button
              className="nav-link-btn"
              onClick={() => {
                setShowCandidates(false);
                setShowManualImageInput(true);
              }}
            >
              None of these — paste image URL manually
            </button>
            <button
              className="nav-link-btn"
              onClick={() => {
                setShowCandidates(false);
                setCandidateImages([]);
                handleReset();
              }}
            >
              Start over
            </button>
          </div>
        </div>
      )}

      {/* Preview + Confirm */}
      {previewImage && (
        <div className="ps-product-preview">
          <div className="ps-preview-img-container">
            <img
              src={previewImage}
              alt="Product preview — primary"
              className="ps-preview-img"
            />
            <span className="ps-preview-badge">PRIMARY</span>
          </div>

          {/* Additional angle thumbnails */}
          {additionalImages.length > 0 && (
            <div className="ps-additional-grid">
              {additionalImages.map((img, i) => (
                <div key={i} className="ps-additional-thumb">
                  <img src={img} alt={`Angle ${i + 2}`} />
                  <button
                    className="ps-additional-remove"
                    onClick={() => removeAdditionalImage(i)}
                    title="Remove this image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add more angles — upload mode only */}
          {mode === 'upload' && additionalImages.length < MAX_IMAGES - 1 && (
            <div className="ps-add-angles">
              <input
                ref={additionalInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleAdditionalFiles}
                hidden
              />
              <button
                className="nav-link-btn"
                onClick={() => additionalInputRef.current?.click()}
              >
                + Add more angles ({additionalImages.length}/{MAX_IMAGES - 1})
              </button>
              <span className="ps-add-angles-hint">
                Different angles help the AI understand your product better
              </span>
            </div>
          )}

          {metadata?.brand && (
            <p className="ps-preview-meta">{metadata.brand}</p>
          )}

          <input
            type="text"
            className="brand-question-input"
            placeholder="Product name..."
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />

          <div className="ps-preview-actions">
            <button
              className="brand-submit-btn"
              onClick={handleConfirm}
              disabled={!productName.trim()}
            >
              [ CONFIRM PRODUCT ]
            </button>
            <button
              className="nav-link-btn"
              onClick={handleReset}
            >
              Change image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInput;
