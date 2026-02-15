import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px'
      }}>
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none'
        }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            fontSize: '1.1rem',
            color: 'var(--text-primary)'
          }}>
            root<span style={{ color: 'var(--accent)' }}>@devops</span>:~$
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--accent-green)',
            fontFamily: 'var(--font-mono)',
            background: 'rgba(63, 185, 80, 0.1)',
            padding: '3px 10px',
            borderRadius: '20px',
            border: '1px solid rgba(63, 185, 80, 0.3)'
          }}>
            ● live
          </span>
        </div>
      </div>
    </nav>
  )
}