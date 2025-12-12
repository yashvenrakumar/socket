import { Link } from 'react-router-dom'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            Socket App
          </Link>
          <ul className="nav-menu">
            <li>
              <Link to="/" className="nav-link">
                Home
              </Link>
            </li>
            <li>
              <Link to="/chat" className="nav-link">
                Chat
              </Link>
            </li>
            <li>
              <Link to="/analytics" className="nav-link">
                Analytics
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/feedback" className="nav-link">
                Feedback
              </Link>
            </li>
            <li>
              <Link to="/about" className="nav-link">
                About
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout
