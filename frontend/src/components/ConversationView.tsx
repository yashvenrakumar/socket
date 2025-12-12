import { useState } from 'react';
import { Chat, ConversationSummary, Rating, ConversationInfo } from '../types/dashboard.types';
import { ChatMessage } from '../types/message.types';
import { useFeedback } from '../hooks/useFeedback';
import ChatWindow from './ChatWindow';
import './ConversationView.css';

interface ConversationViewProps {
  chat: Chat | null;
  messages: ChatMessage[];
  onSendMessage?: (message: string, files?: File[]) => void;
  onCloseChat?: () => void;
  onTransferChat?: (agentId: string) => void;
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  summary?: ConversationSummary;
  rating?: Rating;
  conversationInfo?: ConversationInfo;
  onUpdateSummary?: (summary: Partial<ConversationSummary>) => void;
  currentUsername?: string;
}

type TabType = 'conversation' | 'summary' | 'ratings' | 'info';

const ConversationView = ({
  chat,
  messages,
  onSendMessage,
  onCloseChat,
  onTransferChat,
  onAddTag,
  onRemoveTag,
  summary,
  rating,
  conversationInfo,
  onUpdateSummary,
  currentUsername,
}: ConversationViewProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('conversation');
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Fetch feedback when ratings tab is active and conversationId is available
  const { feedback, totalFeedback, loading: feedbackLoading, error: feedbackError, refetch: refetchFeedback } = useFeedback({
    conversationId: chat?.conversationId,
    enabled: activeTab === 'ratings' && !!chat?.conversationId,
  });

  if (!chat) {
    return (
      <div className="conversation-view-empty">
        <div className="empty-content">
          <p>Select a chat to view conversation</p>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m`;
    } else {
      return `${Math.round(seconds / 3600)}h`;
    }
  };

  return (
    <div className="conversation-view-container">
      {/* Header */}
      <div className="conversation-header">
        <div className="conversation-header-left">
          <div className="chat-id-display">
            <span className="chat-id-label">#{chat.id}</span>
            {chat.status === 'active' && <span className="status-indicator active"></span>}
            {chat.status === 'closed' && <span className="status-badge completed">CHAT COMPLETED</span>}
          </div>
          {chat.tags.length > 0 && (
            <div className="chat-tags-header">
              {chat.tags.map((tag) => (
                <span key={tag} className="tag-header">
                  {tag}
                  {onRemoveTag && (
                    <button
                      className="tag-remove"
                      onClick={() => onRemoveTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          {chat.agent && (
            <div className="agent-info-header">
              <span className="agent-name">{chat.agent.name}</span>
              <span className={`agent-status ${chat.agent.status}`}>{chat.agent.status}</span>
            </div>
          )}
        </div>
        <div className="conversation-header-right">
          <div className="header-actions">
            {onTransferChat && (
              <button
                className="action-button"
                onClick={() => {
                  // TODO: Show transfer dialog
                  console.log('Transfer chat');
                }}
                title="Transfer chat"
              >
                Transfer
              </button>
            )}
            <div className="action-menu-container">
              <button
                className="action-button icon-only"
                onClick={() => setShowActionMenu(!showActionMenu)}
                aria-label="More actions"
              >
                ⋮
              </button>
              {showActionMenu && (
                <div className="action-menu">
                  <button
                    className="menu-item"
                    onClick={() => {
                      // TODO: Export conversation
                      console.log('Export conversation');
                      setShowActionMenu(false);
                    }}
                  >
                    Export Conversation
                  </button>
                  <button
                    className="menu-item"
                    onClick={() => {
                      // TODO: Print conversation
                      console.log('Print conversation');
                      setShowActionMenu(false);
                    }}
                  >
                    Print Conversation
                  </button>
                  {onCloseChat && (
                    <button
                      className="menu-item danger"
                      onClick={() => {
                        onCloseChat();
                        setShowActionMenu(false);
                      }}
                    >
                      Close Chat
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="conversation-tabs">
        <button
          className={`tab ${activeTab === 'conversation' ? 'active' : ''}`}
          onClick={() => setActiveTab('conversation')}
        >
          Conversation
        </button>
        <button
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`tab ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('ratings')}
        >
          Ratings & Feedback
        </button>
        <button
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Conversation Info
        </button>
      </div>

      {/* Tab Content */}
      <div className="conversation-content">
        {activeTab === 'conversation' && chat && (
          <div className="conversation-tab-content">
            <ChatWindow
              conversationId={chat.conversationId}
              username={currentUsername}
              isDashboard={true}
            />
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="summary-tab-content">
            {summary ? (
              <div className="summary-content">
                <div className="summary-header">
                  <h3>Conversation Summary</h3>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={summary.enabled}
                      onChange={(e) => {
                        if (onUpdateSummary) {
                          onUpdateSummary({ enabled: e.target.checked });
                        }
                      }}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">Enable Summary</span>
                  </label>
                </div>
                {summary.enabled && summary.summary ? (
                  <div className="summary-body">
                    <div className="summary-text">
                      <p>{summary.summary}</p>
                    </div>
                    {summary.keyPoints && summary.keyPoints.length > 0 && (
                      <div className="key-points">
                        <h4>Key Points</h4>
                        <ul>
                          {summary.keyPoints.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {summary.sentiment && (
                      <div className="sentiment-analysis">
                        <h4>Sentiment</h4>
                        <div className={`sentiment-badge ${summary.sentiment}`}>
                          {summary.sentiment.charAt(0).toUpperCase() + summary.sentiment.slice(1)}
                          {summary.sentimentScore !== undefined && (
                            <span className="sentiment-score"> ({summary.sentimentScore}%)</span>
                          )}
                        </div>
                      </div>
                    )}
                    {summary.resolutionStatus && (
                      <div className="resolution-status">
                        <h4>Resolution Status</h4>
                        <span className={`resolution-badge ${summary.resolutionStatus}`}>
                          {summary.resolutionStatus.charAt(0).toUpperCase() + summary.resolutionStatus.slice(1)}
                        </span>
                      </div>
                    )}
                    {summary.tags && summary.tags.length > 0 && (
                      <div className="summary-tags">
                        <h4>Tags</h4>
                        <div className="tags-list">
                          {summary.tags.map((tag) => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="summary-empty">
                    <p>Summary generation is disabled or not available yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="summary-empty">
                <p>No summary available for this conversation.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ratings' && (
          <div className="ratings-tab-content">
            {feedbackLoading ? (
              <div className="ratings-loading">
                <p>Loading feedback...</p>
              </div>
            ) : feedbackError ? (
              <div className="ratings-error">
                <p>Error loading feedback: {feedbackError}</p>
                <button onClick={refetchFeedback} className="retry-button">
                  Retry
                </button>
              </div>
            ) : feedback && feedback.length > 0 ? (
              <div className="ratings-content">
                <div className="ratings-header">
                  <h3>Ratings & Feedback</h3>
                  <span className="feedback-count">({totalFeedback} feedback{totalFeedback !== 1 ? 's' : ''})</span>
                </div>
                <div className="feedback-list">
                  {feedback.map((item) => (
                    <div key={item.id} className="feedback-item">
                      <div className="feedback-header">
                        <div className="feedback-user">
                          <span className="feedback-username">{item.username || 'Anonymous'}</span>
                          <span className="feedback-timestamp">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="feedback-rating">
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
                      {item.description && (
                        <div className="feedback-description">
                          <p>{item.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ratings-empty">
                <p>No ratings or feedback available for this conversation.</p>
              </div>
            )}
            {/* Legacy rating display (if rating prop is provided) */}
            {rating && (!feedback || feedback.length === 0) && (
              <div className="ratings-content">
                <h3>Visitor Feedback</h3>
                {rating.stars !== undefined && (
                  <div className="rating-stars">
                    <h4>Star Rating</h4>
                    <div className="stars-display">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star ${star <= (rating.stars || 0) ? 'filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                      <span className="rating-value">{rating.stars}/5</span>
                    </div>
                  </div>
                )}
                {rating.nps !== undefined && (
                  <div className="rating-nps">
                    <h4>Net Promoter Score (NPS)</h4>
                    <div className="nps-display">
                      <span className="nps-value">{rating.nps}</span>
                      <span className="nps-label">/ 10</span>
                    </div>
                  </div>
                )}
                {rating.feedback && (
                  <div className="rating-feedback">
                    <h4>Feedback</h4>
                    <p>{rating.feedback}</p>
                  </div>
                )}
                {rating.agentRating !== undefined && (
                  <div className="agent-rating">
                    <h4>Agent Rating</h4>
                    <div className="stars-display">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star ${star <= rating.agentRating! ? 'filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="info-tab-content">
            {conversationInfo ? (
              <div className="info-content">
                <div className="info-section">
                  <h4>Chat Duration</h4>
                  <p className="info-value">{formatDuration(conversationInfo.duration)}</p>
                </div>
                <div className="info-section">
                  <h4>Message Count</h4>
                  <p className="info-value">{conversationInfo.messageCount}</p>
                </div>
                <div className="info-section">
                  <h4>Average Response Time</h4>
                  <p className="info-value">{formatTime(conversationInfo.averageResponseTime)}</p>
                </div>
                <div className="info-section">
                  <h4>First Response Time</h4>
                  <p className="info-value">{formatTime(conversationInfo.firstResponseTime)}</p>
                </div>
                {conversationInfo.resolutionTime !== undefined && (
                  <div className="info-section">
                    <h4>Resolution Time</h4>
                    <p className="info-value">{formatTime(conversationInfo.resolutionTime)}</p>
                  </div>
                )}
                {conversationInfo.tags.length > 0 && (
                  <div className="info-section">
                    <h4>Tags</h4>
                    <div className="tags-list">
                      {conversationInfo.tags.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {conversationInfo.agent && (
                  <div className="info-section">
                    <h4>Assigned Agent</h4>
                    <div className="agent-info">
                      <span className="agent-name">{conversationInfo.agent.name}</span>
                      <span className={`agent-status ${conversationInfo.agent.status}`}>
                        {conversationInfo.agent.status}
                      </span>
                    </div>
                  </div>
                )}
                {conversationInfo.attachments.length > 0 && (
                  <div className="info-section">
                    <h4>Attachments ({conversationInfo.attachments.length})</h4>
                    <div className="attachments-list">
                      {conversationInfo.attachments.map((attachment) => (
                        <div key={attachment.id} className="attachment-item">
                          <span className="attachment-name">{attachment.name}</span>
                          <span className="attachment-size">({(attachment.size / 1024).toFixed(2)} KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="info-empty">
                <p>No conversation information available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationView;

