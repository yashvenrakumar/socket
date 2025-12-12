/**
 * Utility to detect URLs in text and extract them
 */
export const detectLinks = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
};

/**
 * Check if text contains a URL
 */
export const hasLink = (text: string): boolean => {
  return detectLinks(text).length > 0;
};

/**
 * Extract first URL from text
 */
export const getFirstLink = (text: string): string | null => {
  const links = detectLinks(text);
  return links.length > 0 ? links[0] : null;
};

