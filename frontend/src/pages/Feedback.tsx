import { useState } from 'react';
import { useFeedback } from '../hooks/useFeedback';
import { ChatFeedback } from '../services/api.service';
import './Feedback.css';

const Feedback = () => {
  const { feedback, totalFeedback, loading, error, refetch } = useFeedback({
    enabled: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating'>('newest');

  // Filter and sort feedback
  const filteredAndSortedFeedback = feedback
    .filter((item) => {
      if (filterRating === null) return true;
      return item.rating === filterRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAverageRating = (): number => {
    if (feedback.length === 0) return 0;
    const sum = feedback.reduce((acc, item) => acc + item.rating, 0);
    return Math.round((sum / feedback.length) * 10) / 10;
  };

  const getRatingDistribution = (): Record<number, number> => {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedback.forEach((item) => {
      distribution[item.rating] = (distribution[item.rating] || 0) + 1;
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        {/* Header */}
        <div className="feedback-header">
          <div className="feedback-header-content">
            <h1>All Feedback</h1>
            <p className="feedback-subtitle">View and manage all customer feedback</p>
          </div>
          <button onClick={refetch} className="refresh-button" disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Statistics */}
        {!loading && !error && feedback.length > 0 && (
          <div className="feedback-stats">
            <div className="stat-card">
              <div className="stat-value">{totalFeedback}</div>
              <div className="stat-label">Total Feedback</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{getAverageRating()}</div>
              <div className="stat-label">Average Rating</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {feedback.filter((f) => f.rating >= 4).length}
              </div>
              <div className="stat-label">Positive (4+)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {feedback.filter((f) => f.rating <= 2).length}
              </div>
              <div className="stat-label">Negative (≤2)</div>
            </div>
          </div>
        )}

        {/* Filters and Sort */}
        {!loading && !error && feedback.length > 0 && (
          <div className="feedback-controls">
            <div className="filter-group">
              <label htmlFor="rating-filter">Filter by Rating:</label>
              <select
                id="rating-filter"
                value={filterRating === null ? 'all' : filterRating}
                onChange={(e) =>
                  setFilterRating(e.target.value === 'all' ? null : parseInt(e.target.value))
                }
                className="filter-select"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="sort-by">Sort by:</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'rating')}
                className="filter-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating">Highest Rating</option>
              </select>
            </div>
          </div>
        )}

        {/* Rating Distribution */}
        {!loading && !error && feedback.length > 0 && (
          <div className="rating-distribution">
            <h3>Rating Distribution</h3>
            <div className="distribution-bars">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating] || 0;
                const percentage = totalFeedback > 0 ? (count / totalFeedback) * 100 : 0;
                return (
                  <div key={rating} className="distribution-item">
                    <div className="distribution-label">
                      <span className="distribution-rating">{rating} ★</span>
                      <span className="distribution-count">{count}</span>
                    </div>
                    <div className="distribution-bar-container">
                      <div
                        className="distribution-bar"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="distribution-percentage">{percentage.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="feedback-loading">
            <div className="loading-spinner"></div>
            <p>Loading feedback...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="feedback-error">
            <p>Error loading feedback: {error}</p>
            <button onClick={refetch} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && feedback.length === 0 && (
          <div className="feedback-empty">
            <p>No feedback available yet.</p>
          </div>
        )}

        {/* Feedback List */}
        {!loading && !error && filteredAndSortedFeedback.length > 0 && (
          <div className="feedback-list">
            <h2>
              Feedback ({filteredAndSortedFeedback.length}
              {filterRating !== null && ` filtered by ${filterRating} stars`})
            </h2>
            {filteredAndSortedFeedback.map((item: ChatFeedback) => (
              <div key={item.id} className="feedback-item">
                <div className="feedback-item-header">
                  <div className="feedback-item-left">
                    <div className="feedback-username">{item.username || 'Anonymous'}</div>
                    <div className="feedback-conversation-id">
                      Conversation: <span className="conversation-link">#{item.conversationId}</span>
                    </div>
                    <div className="feedback-timestamp">{formatDate(item.timestamp)}</div>
                  </div>
                  <div className="feedback-item-right">
                    <div className="feedback-rating-display">
                      <div className="stars-display">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`star ${star <= item.rating ? 'filled' : ''}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="rating-value">{item.rating}/5</span>
                    </div>
                  </div>
                </div>
                {item.description && (
                  <div className="feedback-description">
                    <p>{item.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No Results for Filter */}
        {!loading &&
          !error &&
          feedback.length > 0 &&
          filteredAndSortedFeedback.length === 0 && (
            <div className="feedback-empty">
              <p>No feedback found matching the selected filter.</p>
              <button
                onClick={() => setFilterRating(null)}
                className="clear-filter-button"
              >
                Clear Filter
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default Feedback;

