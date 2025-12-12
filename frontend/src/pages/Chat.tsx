import { useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import './Chat.css';

const Chat = () => {
  const [conversationId, setConversationId] = useState('');
  const [username, setUsername] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeUsername, setActiveUsername] = useState<string>('');

  const handleJoinConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (conversationId.trim()) {
      setActiveConversationId(conversationId.trim());
      setActiveUsername(username.trim() || `User-${Date.now().toString().slice(-6)}`);
    }
  };

  const handleLeaveConversation = () => {
    setActiveConversationId(null);
    setConversationId('');
  };

  if (activeConversationId) {
    return (
      <div className="chat-page">
        <div className="chat-controls">
          <button onClick={handleLeaveConversation} className="leave-button">
            Leave Conversation
          </button>
          <span className="current-conversation">Active: {activeConversationId}</span>
        </div>
        <ChatWindow 
          conversationId={activeConversationId} 
          username={activeUsername}
          onChatEnd={handleLeaveConversation}
        />
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-setup">
        <div className="setup-card">
          <h1>Join Conversation</h1>
          <p className="setup-description">
            Enter a conversation ID to join a chat room. Multiple users can join the same conversation ID
            and communicate in real-time via Socket.IO.
          </p>
          <form onSubmit={handleJoinConversation} className="conversation-form">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name (optional)"
              className="conversation-input"
            />
            <input
              type="text"
              value={conversationId}
              onChange={(e) => setConversationId(e.target.value)}
              placeholder="Enter conversation ID (e.g., 123, 234, 555)"
              className="conversation-input"
              required
            />
            <button type="submit" className="join-button">
              Join Conversation
            </button>
          </form>
          <div className="setup-info">
            <h3>How it works:</h3>
            <ul>
              <li>Enter a conversation ID to join a Socket.IO room</li>
              <li>Send messages in the chat window</li>
              <li>All users in the same conversation ID receive messages in real-time</li>
              <li>Multiple users can join the same conversation ID (N users per room)</li>
              <li>Create multiple rooms with different conversation IDs</li>
            </ul>
            <div className="example-conversations">
              <p><strong>Example conversation IDs:</strong></p>
              <div className="example-buttons">
                <button onClick={() => setConversationId('123')} className="example-btn">123</button>
                <button onClick={() => setConversationId('234')} className="example-btn">234</button>
                <button onClick={() => setConversationId('555')} className="example-btn">555</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

