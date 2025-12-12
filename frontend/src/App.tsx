import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Feedback from './pages/Feedback'
import Analytics from './pages/Analytics'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  )
}

export default App
