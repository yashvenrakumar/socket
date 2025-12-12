import { useState } from 'react';
import { Visitor, RecentChat, VisitorActivity, Note } from '../types/dashboard.types';
import './VisitorInfoPanel.css';

interface VisitorInfoPanelProps {
  visitor: Visitor | null;
  recentChats?: RecentChat[];
  activities?: VisitorActivity[];
  notes?: Note[];
  conversationInfo?: {
    duration: number;
    messageCount: number;
    tags: string[];
  };
  onAddNote?: (content: string, type: 'private' | 'team') => void;
  onUpdateNote?: (noteId: string, content: string) => void;
  onDeleteNote?: (noteId: string) => void;
}

type TabType = 'info' | 'recent' | 'notes';

const VisitorInfoPanel = ({
  visitor,
  recentChats = [],
  activities = [],
  notes = [],
  conversationInfo,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: VisitorInfoPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<'private' | 'team'>('private');
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  if (!visitor) {
    return (
      <div className="visitor-info-panel-empty">
        <div className="empty-content">
          <p>Select a chat to view visitor information</p>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleAddNote = () => {
    if (newNoteContent.trim() && onAddNote) {
      onAddNote(newNoteContent.trim(), newNoteType);
      setNewNoteContent('');
      setShowNoteEditor(false);
    }
  };

  const getDeviceIcon = (type: 'desktop' | 'mobile' | 'tablet'): string => {
    switch (type) {
      case 'desktop':
        return '🖥️';
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      default:
        return '💻';
    }
  };

  return (
    <div className="visitor-info-panel-container">
      <div className="visitor-info-header">
        <h3>Visitor Info</h3>
      </div>

      <div className="visitor-info-tabs">
        <button
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Info
        </button>
        <button
          className={`tab ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          Recent Chats
        </button>
        <button
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
      </div>

      <div className="visitor-info-content">
        {activeTab === 'info' && (
          <div className="info-tab-content">
            {/* Visitor Profile */}
            <div className="visitor-profile-section">
              <div className="visitor-avatar">
                {visitor.name ? (
                  <span className="avatar-text">{visitor.name.charAt(0).toUpperCase()}</span>
                ) : (
                  <span className="avatar-icon">👤</span>
                )}
              </div>
              <div className="visitor-name-section">
                <h4>{visitor.name || `Visitor ${visitor.id.substring(0, 6)}`}</h4>
                <p className="visitor-id">ID: {visitor.id}</p>
              </div>
            </div>

            {visitor.location && (
              <div className="visitor-location">
                <span className="location-icon">📍</span>
                <span>{visitor.location.city || ''} {visitor.location.country || ''}</span>
              </div>
            )}

            {visitor.email && (
              <button
                className="more-info-link"
                onClick={() => setShowMoreInfo(!showMoreInfo)}
              >
                {showMoreInfo ? 'Less Info' : 'More Info'}
              </button>
            )}

            {/* Details Section */}
            <div className="details-section">
              <h5>Details</h5>
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className={`visitor-type ${visitor.type}`}>
                  {visitor.type.charAt(0).toUpperCase() + visitor.type.slice(1)} Visitor
                </span>
              </div>

              {visitor.device && (
                <div className="detail-item">
                  <span className="detail-label">Source:</span>
                  <span className="device-icon">{getDeviceIcon(visitor.device.type)}</span>
                  <span className="device-info">
                    {visitor.device.browser || 'Unknown'} / {visitor.device.os || 'Unknown'}
                  </span>
                </div>
              )}

              {visitor.device?.ipAddress && (
                <div className="detail-item">
                  <span className="detail-label">IP Address:</span>
                  <span className="detail-value">{visitor.device.ipAddress}</span>
                </div>
              )}

              {visitor.location?.timezone && (
                <div className="detail-item">
                  <span className="detail-label">Timezone:</span>
                  <span className="detail-value">{visitor.location.timezone}</span>
                </div>
              )}

              {visitor.language && (
                <div className="detail-item">
                  <span className="detail-label">Language:</span>
                  <span className="detail-value">{visitor.language}</span>
                </div>
              )}

              {showMoreInfo && (
                <>
                  {visitor.email && (
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{visitor.email}</span>
                    </div>
                  )}
                  {visitor.phone && (
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{visitor.phone}</span>
                    </div>
                  )}
                  {visitor.customFields && Object.keys(visitor.customFields).length > 0 && (
                    <div className="custom-fields">
                      <h6>Custom Fields</h6>
                      {Object.entries(visitor.customFields).map(([key, value]) => (
                        <div key={key} className="detail-item">
                          <span className="detail-label">{key}:</span>
                          <span className="detail-value">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Activity Section */}
            <div className="activity-section">
              <h5>Activity</h5>
              {activities.length > 0 ? (
                <div className="activity-timeline">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {activity.type === 'page_view' && '📄'}
                        {activity.type === 'click' && '🖱️'}
                        {activity.type === 'navigation' && '🧭'}
                        {activity.type === 'chat_start' && '💬'}
                        {activity.type === 'chat_end' && '✅'}
                      </div>
                      <div className="activity-content">
                        <p className="activity-text">
                          {activity.type === 'page_view' && `Viewed ${activity.page || 'page'}`}
                          {activity.type === 'click' && 'Clicked element'}
                          {activity.type === 'navigation' && 'Navigated'}
                          {activity.type === 'chat_start' && 'Started chat'}
                          {activity.type === 'chat_end' && 'Ended chat'}
                        </p>
                        <span className="activity-time">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-activity">
                  <p>No activity found</p>
                </div>
              )}
            </div>

            {/* Conversation Info Section */}
            {conversationInfo && (
              <div className="conversation-info-section">
                <h5>Conversation Info</h5>
                <div className="info-item">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">{formatDuration(conversationInfo.duration)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Messages:</span>
                  <span className="info-value">{conversationInfo.messageCount}</span>
                </div>
                {conversationInfo.tags.length > 0 && (
                  <div className="info-item">
                    <span className="info-label">Tags:</span>
                    <div className="tags-list">
                      {conversationInfo.tags.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="recent-tab-content">
            {recentChats.length > 0 ? (
              <div className="recent-chats-list">
                {recentChats.map((chat) => (
                  <div key={chat.id} className="recent-chat-item">
                    <div className="recent-chat-header">
                      <span className="chat-status-badge">{chat.status}</span>
                      <span className="chat-date">{formatDate(chat.createdAt)}</span>
                    </div>
                    {chat.lastMessage && (
                      <p className="recent-chat-preview">{chat.lastMessage.text}</p>
                    )}
                    <div className="recent-chat-meta">
                      <span>{chat.messageCount} messages</span>
                      <span>•</span>
                      <span>{formatDuration(chat.duration)}</span>
                    </div>
                    {chat.tags.length > 0 && (
                      <div className="recent-chat-tags">
                        {chat.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag-small">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-recent-chats">
                <p>No recent chats found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="notes-tab-content">
            <div className="notes-header">
              <button
                className="add-note-button"
                onClick={() => setShowNoteEditor(!showNoteEditor)}
              >
                + Add Note
              </button>
            </div>

            {showNoteEditor && (
              <div className="note-editor">
                <div className="note-type-selector">
                  <label>
                    <input
                      type="radio"
                      value="private"
                      checked={newNoteType === 'private'}
                      onChange={(e) => setNewNoteType(e.target.value as 'private' | 'team')}
                    />
                    Private
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="team"
                      checked={newNoteType === 'team'}
                      onChange={(e) => setNewNoteType(e.target.value as 'private' | 'team')}
                    />
                    Team
                  </label>
                </div>
                <textarea
                  className="note-textarea"
                  placeholder="Write a note..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={4}
                />
                <div className="note-editor-actions">
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setShowNoteEditor(false);
                      setNewNoteContent('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="save-button"
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="notes-list">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div key={note.id} className="note-item">
                    <div className="note-header">
                      <div className="note-author">
                        {note.author.avatar ? (
                          <img src={note.author.avatar} alt={note.author.name} className="note-avatar" />
                        ) : (
                          <span className="note-avatar-text">{note.author.name.charAt(0)}</span>
                        )}
                        <div className="note-author-info">
                          <span className="note-author-name">{note.author.name}</span>
                          <span className="note-type-badge">{note.type}</span>
                        </div>
                      </div>
                      <span className="note-date">{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="note-content">{note.content}</p>
                    {note.category && (
                      <span className="note-category">{note.category}</span>
                    )}
                    {(onUpdateNote || onDeleteNote) && (
                      <div className="note-actions">
                        {onUpdateNote && (
                          <button
                            className="note-action-button"
                            onClick={() => {
                              // TODO: Implement edit note
                              console.log('Edit note', note.id);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {onDeleteNote && (
                          <button
                            className="note-action-button danger"
                            onClick={() => onDeleteNote(note.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-notes">
                  <p>No notes yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorInfoPanel;

