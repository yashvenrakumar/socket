/**
 * File conversion utilities for React Native
 */
import * as FileSystem from 'expo-file-system';

/**
 * Convert file URI to base64 string for real-time sharing
 */
export const fileToBase64 = async (uri: string): Promise<string> => {
  try {
    // If already a data URL, return as-is
    if (uri.startsWith('data:')) {
      return uri;
    }

    // Read file and convert to base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Determine MIME type from URI
    const mimeType = getMimeTypeFromUri(uri);
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting file to base64:', error);
    throw error;
  }
};

/**
 * Get MIME type from file URI
 */
const getMimeTypeFromUri = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    zip: 'application/zip',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
  };
  return mimeTypes[extension || ''] || 'application/octet-stream';
};

/**
 * Check if base64 string is an image
 */
export const isBase64Image = (base64String: string): boolean => {
  return base64String.startsWith('data:image/');
};

