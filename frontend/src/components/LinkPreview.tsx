import { useState, useEffect } from 'react';
import { LinkPreview as LinkPreviewType } from '../types/message.types';
import './LinkPreview.css';

interface LinkPreviewProps {
  url: string;
}

const LinkPreview = ({ url }: LinkPreviewProps) => {
  const [preview, setPreview] = useState<LinkPreviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // In a real application, you would call your backend API to fetch link preview
        // For now, we'll create a basic preview from the URL
        const urlObj = new URL(url);
        
        const basicPreview: LinkPreviewType = {
          url,
          title: urlObj.hostname,
          description: `Link to ${urlObj.hostname}`,
          siteName: urlObj.hostname.replace('www.', ''),
        };
        
        setPreview(basicPreview);
      } catch (err) {
        console.error('Error fetching link preview:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchPreview();
    }
  }, [url]);

  if (loading) {
    return (
      <div className="link-preview loading">
        <div className="link-preview-skeleton"></div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="link-preview-fallback">
        🔗 {url}
      </a>
    );
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-preview"
    >
      {preview.image && (
        <div className="link-preview-image">
          <img src={preview.image} alt={preview.title} />
        </div>
      )}
      <div className="link-preview-content">
        <div className="link-preview-title">{preview.title || preview.url}</div>
        {preview.description && (
          <div className="link-preview-description">{preview.description}</div>
        )}
        <div className="link-preview-url">
          {preview.siteName || new URL(preview.url).hostname}
        </div>
      </div>
    </a>
  );
};

export default LinkPreview;

