import { useState, useEffect } from 'react';
import { fileToBase64 } from '../utils/fileConverter.util';
import { isImageFile, formatFileSize, getFileIcon } from '../utils/fileUtil';

interface FilePreviewItemProps {
  file: File;
  index: number;
  onRemove: (index: number) => void;
}

const FilePreviewItem = ({ file, index, onRemove }: FilePreviewItemProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (isImageFile(file)) {
      fileToBase64(file)
        .then((base64) => setPreviewUrl(base64))
        .catch((error) => {
          console.error('Error generating preview:', error);
        });
    }
  }, [file]);

  return (
    <div className="file-preview-item">
      {isImageFile(file) && previewUrl ? (
        <img 
          src={previewUrl} 
          alt={file.name}
          className="file-preview-thumbnail"
        />
      ) : (
        <div className="file-preview-icon">{getFileIcon(file.name)}</div>
      )}
      <div className="file-preview-info">
        <div className="file-preview-name">{file.name}</div>
        <div className="file-preview-size">{formatFileSize(file.size)}</div>
      </div>
      <button 
        className="remove-file-btn"
        onClick={() => onRemove(index)}
      >
        ✕
      </button>
    </div>
  );
};

export default FilePreviewItem;

