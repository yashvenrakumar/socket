import { useState } from 'react';
import './FeedbackModal.css';

interface FeedbackModalProps {
  isOpen: boolean;
  conversationId: string;
  username?: string;
  onClose: () => void;
  onSubmit: (rating: number, description: string) => Promise<void>;
}

const FeedbackModal = ({ isOpen, conversationId, username, onClose, onSubmit }: FeedbackModalProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStarClick = (value: number) => {
    setRating(value);
    setError(null);
  };

  const handleStarHover = (value: number) => {
    setHoveredRating(value);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating from 1 to 5 stars');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(rating, description.trim());
      // Reset form
      setRating(0);
      setDescription('');
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setDescription('');
      setError(null);
      onClose();
    }
  };

  return (
    <div className="feedback-modal-overlay" onClick={handleClose}>
      <div className="feedback-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-modal-header">
          <h2>End Chat Session</h2>
          <button 
            className="feedback-modal-close" 
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="feedback-modal-content">
          <p className="feedback-modal-description">
            Your feedback helps us improve. Please rate your chat experience and provide any additional comments.
          </p>

          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="feedback-rating-section">
              <label className="feedback-label">Rate your experience *</label>
              <div className="feedback-stars-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`feedback-star ${
                      star <= (hoveredRating || rating) ? 'filled' : 'empty'
                    }`}
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    onMouseLeave={handleStarLeave}
                    disabled={isSubmitting}
                    aria-label={`Rate ${star} out of 5 stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="feedback-rating-text">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            <div className="feedback-description-section">
              <label htmlFor="feedback-description" className="feedback-label">
                Additional Comments (optional)
              </label>
              <textarea
                id="feedback-description"
                className="feedback-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={5}
                disabled={isSubmitting}
                maxLength={1000}
              />
              <div className="feedback-character-count">
                {description.length}/1000 characters
              </div>
            </div>

            {error && (
              <div className="feedback-error">
                {error}
              </div>
            )}

            <div className="feedback-modal-actions">
              <button
                type="button"
                className="feedback-button feedback-button-cancel"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="feedback-button feedback-button-submit"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Submit & End Chat'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;

