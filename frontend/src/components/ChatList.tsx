import { useState, useMemo } from 'react';
import { Chat, ChatStatus, ChatPriority } from '../types/dashboard.types';
import './ChatList.css';

interface ChatListProps {
  chats: Chat[];
  selectedChatId?: string;
  onChatSelect: (chat: Chat) => void;
  onChatFilter?: (filter: { status?: ChatStatus; priority?: ChatPriority; search?: string }) => void;
  onChatSort?: (sortBy: 'date' | 'priority' | 'lastActivity') => void;
}

type TabType = 'active' | 'missed' | 'closed';

const ChatList = ({ chats, selectedChatId, onChatSelect, onChatFilter, onChatSort }: ChatListProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'lastActivity'>('date');
  const [showFilters, setShowFilters] = useState(false);

  // Filter chats by active tab
  const filteredChatsByTab = useMemo(() => {
    return chats.filter((chat) => {
      if (activeTab === 'active') {
        return chat.status === 'active' || chat.status === 'waiting';
      } else if (activeTab === 'missed') {
        return chat.status === 'missed';
      } else {
        return chat.status === 'closed';
      }
    });
  }, [chats, activeTab]);

  // Apply search filter
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredChatsByTab;
    }

    const query = searchQuery.toLowerCase();
    return filteredChatsByTab.filter((chat) => {
      const visitorName = chat.visitor.name?.toLowerCase() || '';
      const visitorId = chat.visitor.id.toLowerCase();
      const lastMessage = chat.lastMessage?.text.toLowerCase() || '';
      const tags = chat.tags.join(' ').toLowerCase();

      return (
        visitorName.includes(query) ||
        visitorId.includes(query) ||
        lastMessage.includes(query) ||
        tags.includes(query) ||
        chat.conversationId.toLowerCase().includes(query)
      );
    });
  }, [filteredChatsByTab, searchQuery]);

  // Sort chats
  const sortedChats = useMemo(() => {
    const sorted = [...filteredChats];
    
    switch (sortBy) {
      case 'priority':
        const priorityOrder: Record<ChatPriority, number> = { high: 3, medium: 2, low: 1 };
        sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        break;
      case 'lastActivity':
        sorted.sort((a, b) => {
          const aTime = new Date(a.updatedAt).getTime();
          const bTime = new Date(b.updatedAt).getTime();
          return bTime - aTime;
        });
        break;
      case 'date':
      default:
        sorted.sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime;
        });
        break;
    }

    return sorted;
  }, [filteredChats, sortBy]);

  // Count chats by status
  const counts = useMemo(() => {
    return {
      active: chats.filter((c) => c.status === 'active' || c.status === 'waiting').length,
      missed: chats.filter((c) => c.status === 'missed').length,
      closed: chats.filter((c) => c.status === 'closed').length,
    };
  }, [chats]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (onChatFilter) {
      onChatFilter({ status: tab === 'active' ? 'active' : tab === 'missed' ? 'missed' : 'closed' });
    }
  };

  const handleSortChange = (newSortBy: 'date' | 'priority' | 'lastActivity') => {
    setSortBy(newSortBy);
    if (onChatSort) {
      onChatSort(newSortBy);
    }
  };

  const formatTimestamp = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const getPriorityColor = (priority: ChatPriority): string => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h2 className="chat-list-title">My Chats</h2>
        <div className="chat-list-actions">
          <button
            className="icon-button"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Filter and sort"
            title="Filter and sort"
          >
            <span className="icon">⚙️</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="chat-list-filters">
          <div className="filter-group">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as 'date' | 'priority' | 'lastActivity')}
            >
              <option value="date">Date</option>
              <option value="priority">Priority</option>
              <option value="lastActivity">Last Activity</option>
            </select>
          </div>
        </div>
      )}

      <div className="chat-list-search">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="chat-list-tabs">
        <button
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => handleTabChange('active')}
        >
          Active {counts.active > 0 && <span className="tab-count">{counts.active}</span>}
        </button>
        <button
          className={`tab-button ${activeTab === 'missed' ? 'active' : ''}`}
          onClick={() => handleTabChange('missed')}
        >
          Missed {counts.missed > 0 && <span className="tab-count">{counts.missed}</span>}
        </button>
        <button
          className={`tab-button ${activeTab === 'closed' ? 'active' : ''}`}
          onClick={() => handleTabChange('closed')}
        >
          Closed {counts.closed > 0 && <span className="tab-count">{counts.closed}</span>}
        </button>
      </div>

      <div className="chat-list-items">
        {sortedChats.length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab} chats found</p>
          </div>
        ) : (
          sortedChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${selectedChatId === chat.id ? 'selected' : ''} ${getPriorityColor(chat.priority)} ${chat.unreadCount > 0 ? 'has-unread' : ''}`}
              onClick={() => onChatSelect(chat)}
            >
              <div className="chat-item-header">
                <div className="chat-item-avatar">
                  {chat.visitor.name ? (
                    <span className="avatar-text">{chat.visitor.name.charAt(0).toUpperCase()}</span>
                  ) : (
                    <span className="avatar-icon">👤</span>
                  )}
                  {chat.unreadCount > 0 && <span className="unread-indicator"></span>}
                </div>
                <div className="chat-item-info">
                  <div className="chat-item-title">
                    <span className="visitor-name">{chat.visitor.name || `Visitor ${chat.visitor.id.substring(0, 6)}`}</span>
                    <span className="chat-number">#{chat.id}</span>
                  </div>
                  <div className="chat-item-meta">
                    <span className="chat-timestamp">{formatTimestamp(chat.updatedAt)}</span>
                    {chat.priority === 'high' && <span className="priority-badge">High</span>}
                  </div>
                </div>
              </div>
              {chat.lastMessage && (
                <div className="chat-item-preview">
                  <p className="preview-text">{chat.lastMessage.text}</p>
                </div>
              )}
              <div className="chat-item-footer">
                {chat.unreadCount > 0 && (
                  <span className="unread-badge">{chat.unreadCount}</span>
                )}
                {chat.tags.length > 0 && (
                  <div className="chat-tags">
                    {chat.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                    {chat.tags.length > 2 && <span className="tag-more">+{chat.tags.length - 2}</span>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;

