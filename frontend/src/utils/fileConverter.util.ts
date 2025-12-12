/**
 * Convert file to base64 string for real-time sharing
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Convert base64 string back to blob URL
 */
export const base64ToBlobUrl = (base64String: string): string => {
  // base64String is already a data URL (data:image/png;base64,...)
  return base64String;
};

/**
 * Get file type from base64 data URL
 */
export const getFileTypeFromBase64 = (base64String: string): string => {
  const match = base64String.match(/data:([^;]+);base64/);
  return match ? match[1] : 'application/octet-stream';
};

/**
 * Check if base64 string is an image
 */
export const isBase64Image = (base64String: string): boolean => {
  return base64String.startsWith('data:image/');
};

