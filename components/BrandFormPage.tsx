import React, { useState } from 'react';
import BrandHeader from './BrandHeader';
import BrandForm from './BrandForm';
import BrandSummary from './BrandSummary';
import { BrandFormData } from '../types';
import { GoogleGenAI } from "@google/genai";

const BrandFormPage: React.FC = () => {
  const [formData, setFormData] = useState<BrandFormData>({
    brandName: '',
    offering: '',
    purpose: '',
    problem: '',
    tone: [],     // Initialized as array
    feeling: '',
    adjectives: '',
    palette: '',
    customPalette: '',
    customColor1: '#000000',
    customColor2: '#ffffff',
    vibe: [],     // Initialized as array
    customVibe: '',
    typography: '',
    customFont: '',
    audience: [], // Initialized as array
    customerCare: '',
    differentiation: '',
    competitors: '',
    tagline: '',
    logoExists: '',
    logoPreference: '',
    fashion: '',
    soundtrack: '',
    inspiration: '',
  });

  const [showSummary, setShowSummary] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');

  const generateBrandAnalysis = async (data: BrandFormData) => {
    try {
      // Gracefully handle missing API key
      if (!process.env.API_KEY) {
        return "AI Strategy Analysis unavailable (API Key not configured).\n\nPlease review your complete brand summary below.";
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const paletteStr = data.palette === 'Custom' 
        ? `${data.customPalette} (Hex: ${data.customColor1}, ${data.customColor2})` 
        : data.palette;

      // Handle arrays for prompt
      const vibeList = [...data.vibe];
      if (vibeList.includes('Custom') && data.customVibe) {
        vibeList[vibeList.indexOf('Custom')] = `Custom: ${data.customVibe}`;
      }
      const vibeStr = vibeList.join(', ');
      const toneStr = data.tone.join(', ');
      const audienceStr = data.audience.join(', ');
      
      const typeStr = data.typography === 'Custom' ? data.customFont : data.typography;

      const prompt = `
        You are an expert creative brand strategist. 
        Analyze the following raw brand data for a "Brand Mosaic".
        
        Brand Data:
        - Name: ${data.brandName}
        - Offering: ${data.offering}
        - Purpose: ${data.purpose}
        - Problem: ${data.problem}
        - Tone: ${toneStr}
        - Feeling: ${data.feeling}
        - Adjectives: ${data.adjectives}
        - Palette: ${paletteStr}
        - Visual Vibe: ${vibeStr}
        - Typography: ${typeStr}
        - Audience: ${audienceStr}
        - Customer Care: ${data.customerCare}
        - Differentiation: ${data.differentiation}
        - Inspiration: ${data.inspiration}

        Task:
        1. Strategic Synthesis (approx 80-100 words):
           Write a concise, evocative summary that captures the essence of this brand. Combine the visual direction, audience, and purpose into a cohesive narrative. Write in the third person.
        
        2. Brand Application Guide:
           Provide a structured guide on how to apply this brand identity, clearly separating the "Look" from the "Voice".
           
           VISUAL TOUCHPOINTS (Applying Vibe & Palette):
           Suggest 2-3 concrete examples of how to translate the visual vibe into reality (e.g., "Use the [Vibe] style for Instagram grid layouts, employing [Palette] for high-contrast backgrounds").
           
           VERBAL TOUCHPOINTS (Applying Tone & Voice):
           Suggest 2-3 concrete examples of how to use the brand tone (e.g., "Adopt the [Tone] voice for email subject lines to increase open rates, but soften it for customer support responses").

        Tone of voice for the output: Professional, insightful, and slightly poetic.
        Do not use Markdown (no bolding, no headers via #). Just plain text with line breaks for separation.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || "Analysis completed but returned no text.";
    } catch (error) {
      console.error("Error generating analysis", error);
      // User-friendly error message
      return "We encountered a temporary issue generating the AI strategy analysis.\n\nPlease review your manually entered brand choices below.";
    }
  };

  const handleFormSubmit = async () => {
    setIsAnalyzing(true);
    
    // Generate AI analysis (or error message)
    const analysis = await generateBrandAnalysis(formData);
    setAiAnalysis(analysis);

    setIsAnalyzing(false);
    setShowSummary(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = () => {
    setShowSummary(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="brand-page">
      {!showSummary ? (
        <>
          <BrandHeader />
          <BrandForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleFormSubmit}
            isAnalyzing={isAnalyzing}
          />
        </>
      ) : (
        <BrandSummary 
          formData={formData} 
          aiAnalysis={aiAnalysis}
          onEdit={handleEdit} 
        />
      )}
    </div>
  );
};

export default BrandFormPage;