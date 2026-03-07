import { Link } from 'react-router-dom'

const categoryColors = {
  'GitOps':         { bg: 'rgba(88, 166, 255, 0.1)',  border: 'rgba(88, 166, 255, 0.3)',  text: '#58a6ff' },
  'Kubernetes':     { bg: 'rgba(63, 185, 80, 0.1)',   border: 'rgba(63, 185, 80, 0.3)',   text: '#3fb950' },
  'CI/CD':          { bg: 'rgba(210, 153, 34, 0.1)',  border: 'rgba(210, 153, 34, 0.3)',  text: '#d29922' },
  'Monitoring':     { bg: 'rgba(248, 81, 73, 0.1)',   border: 'rgba(248, 81, 73, 0.3)',   text: '#f85149' },
  'Docker':         { bg: 'rgba(139, 148, 158, 0.1)', border: 'rgba(139, 148, 158, 0.3)', text: '#8b949e' },
  'Infrastructure': { bg: 'rgba(188, 140, 255, 0.1)', border: 'rgba(188, 140, 255, 0.3)', text: '#bc8cff' },
}

export default function ArticleCard({ article }) {
  const color = categoryColors[article.category] || categoryColors['Docker']
  const date = new Date(article.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })

  return (
    <Link to={`/article/${article.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        transition: 'border-color 0.2s, transform 0.2s',
        cursor: 'pointer'
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '20px',
            background: color.bg,
            border: `1px solid ${color.border}`,
            color: color.text,
            fontFamily: 'var(--font-mono)'
          }}>
            {article.category}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {article.readTime} min read
          </span>
        </div>

        <h2 style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
          lineHeight: 1.4
        }}>
          {article.title}
        </h2>

        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '1rem'
        }}>
          {article.excerpt}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {article.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)'
              }}>
                #{tag}
              </span>
            ))}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{date}</span>
        </div>
      </div>
    </Link>
  )
}