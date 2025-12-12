import { useState, useEffect } from 'react';
import ChatDashboard from '../components/ChatDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const [username, setUsername] = useState<string>('');
  const [agentId, setAgentId] = useState<string>('');

  useEffect(() => {
    // In production, get from authentication context or localStorage
    const storedUsername = localStorage.getItem('agent_username') || 'Agent';
    const storedAgentId = localStorage.getItem('agent_id') || `agent-${Date.now()}`;
    
    setUsername(storedUsername);
    setAgentId(storedAgentId);
  }, []);

  return (
    <div className="dashboard-page">
      <ChatDashboard currentUsername={username} currentAgentId={agentId} />
    </div>
  );
};

export default Dashboard;

