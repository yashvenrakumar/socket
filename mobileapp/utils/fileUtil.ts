/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file type icon based on file extension
 */
export const getFileIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, string> = {
    // Images
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    webp: '🖼️',
    svg: '🖼️',

    // Documents
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📄',
    rtf: '📄',

    // Spreadsheets
    xls: '📊',
    xlsx: '📊',
    csv: '📊',

    // Archives
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    tar: '📦',
    gz: '📦',

    // Code
    js: '💻',
    ts: '💻',
    jsx: '💻',
    tsx: '💻',
    py: '💻',
    java: '💻',
    cpp: '💻',
    c: '💻',

    // Media
    mp4: '🎥',
    avi: '🎥',
    mov: '🎥',
    mp3: '🎵',
    wav: '🎵',
    flac: '🎵',
  };

  return iconMap[extension || ''] || '📎';
};

/**
 * Check if file is an image
 */
export const isImageFile = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
};

