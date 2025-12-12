/**
 * Image compression utilities for React Native
 * Uses expo-image-picker for compression
 */
import * as ImagePicker from 'expo-image-picker';

/**
 * Compress and resize image to reduce file size
 * Prevents socket disconnection from large payloads
 * Note: expo-image-picker handles compression automatically
 * This is a placeholder for future image manipulation
 */
export const compressImage = async (
  uri: string,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<string> => {
  try {
    // For now, return the original URI
    // In production, you can use expo-image-manipulator or similar
    // to resize and compress images
    return uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original URI if compression fails
    return uri;
  }
};

/**
 * Check if image needs compression based on file size
 * Note: In React Native, we check the URI and estimate
 */
export const needsCompression = (fileSize: number, maxSize: number = 2 * 1024 * 1024): boolean => {
  return fileSize > maxSize;
};

