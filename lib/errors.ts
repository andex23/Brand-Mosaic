// Error types and utilities for Brand Mosaic
// Themed error messages that fit the notebook aesthetic

export interface ErrorOptions {
  message?: string;
  persistent?: boolean;
  details?: string;
}

export const ERROR_MESSAGES: Record<string, string> = {
  // Authentication Errors
  'auth/invalid-email': '✗ That email doesn\'t look quite right. Mind checking it?',
  'auth/user-not-found': '✗ No account found. Perhaps you meant to sign up?',
  'auth/wrong-password': '✗ Password doesn\'t match. Give it another try.',
  'auth/email-already-in-use': '✗ This email is already taken. Try signing in instead.',
  'auth/weak-password': '✗ Password needs at least 6 characters to be secure.',
  'auth/network-request-failed': '✗ Connection lost. Check your internet and try again.',
  'auth/too-many-requests': '✗ Too many attempts. Take a breather and try again shortly.',
  'auth/invalid-credential': '✗ Email or password is incorrect.',
  
  // API Errors
  'api/invalid-key': '✗ API key issue. Double-check your Gemini key in settings.',
  'api/rate-limit': '✗ Whoa, slow down! Too many requests. Wait a moment.',
  'api/quota-exceeded': '✗ API quota reached. Try again tomorrow or check billing.',
  'api/generation-failed': '✗ Brand generation hit a snag. Let\'s try that again.',
  'api/logo-generation-failed': '✗ Logo generation stumbled. Give it another shot.',
  'api/logo-invalid-prompt': '✗ The logo prompt needs tweaking. Try different words.',
  'api/key-not-found': '✗ No API key found. Add your Gemini key to continue.',
  
  // Payment Errors
  'payment/failed': '✗ Payment didn\'t go through. Try again or contact support.',
  'payment/cancelled': '✗ Payment cancelled. No worries, nothing was charged.',
  'payment/timeout': '✗ Payment timed out. Please try again.',
  'payment/insufficient-credits': '✗ Out of credits. Purchase more to continue creating.',
  
  // Database Errors
  'db/connection-failed': '✗ Server connection lost. Refresh and try again.',
  'db/save-failed': '✗ Couldn\'t save your work. Try again in a moment.',
  'db/load-failed': '✗ Loading failed. Refresh the page to retry.',
  'db/delete-failed': '✗ Delete failed. Give it another try.',
  
  // Validation Errors
  'validation/required': '✗ This field can\'t be empty.',
  'validation/invalid-api-key': '✗ That doesn\'t look like a valid API key.',
  
  // Photo Studio Errors
  'scene/generation-failed': '✗ Scene generation hit a snag. Let\'s try that again.',
  'scene/scrape-failed': '✗ Couldn\'t fetch product info from that URL. Try uploading an image instead.',
  'scene/invalid-url': '✗ That URL doesn\'t look right. Check it and try again.',
  'scene/image-too-large': '✗ Image is too large. Please use an image under 10MB.',
  'scene/invalid-image': '✗ Couldn\'t read that image. Try JPG, PNG, or WEBP format.',
  'scene/no-scenes-selected': '✗ Select at least one scene type to generate.',
  'scene/all-apis-failed': '✗ All image generation services are unavailable. Try again later.',

  // Success Messages
  'success/generated': '✓ Brand kit generated successfully!',
  'success/saved': '✓ Saved.',
  'success/copied': '✓ Copied to clipboard.',
  'success/logo-generated': '✓ Logo created!',
  'success/scene-generated': '✓ Scene photography generated!',
  'success/product-fetched': '✓ Product info loaded.',

  // Generic
  'unknown': '✗ Something unexpected happened. Try again or contact support.',
};

export type ErrorType = 'error' | 'warning' | 'success' | 'info';

export interface ToastMessage {
  id: string;
  type: ErrorType;
  message: string;
  persistent?: boolean;
}

export const getErrorMessage = (errorCode: string, options?: ErrorOptions): string => {
  if (options?.message) {
    return options.message;
  }
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['unknown'];
};

export const generateToastId = (): string => {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

