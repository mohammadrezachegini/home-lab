import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export default function ArticleDetail() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(`${API_URL}/articles/${slug}`)
        const data = await res.json()
        if (data.success) setArticle(data.data)
        else setError(data.error)
      } catch (err) {
        setError('Failed to load article')
      } finally {
        setLoading(false)
      }
    }
    fetchArticle()
  }, [slug])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
      $ loading article...
    </div>
  )

  if (error) return (
    <div style={{ color: '#f85149', fontFamily: 'var(--font-mono)', padding: '2rem' }}>
      ❌ {error} — <Link to="/">← back to articles</Link>
    </div>
  )

  const date = new Date(article.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <Link to="/" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        marginBottom: '2rem',
        fontFamily: 'var(--font-mono)'
      }}>
        ← cd ..
      </Link>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '2.5rem'
      }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent)',
            background: 'rgba(88,166,255,0.1)',
            border: '1px solid rgba(88,166,255,0.3)',
            padding: '3px 10px',
            borderRadius: '20px'
          }}>
            {article.category}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {date} · {article.readTime} min read
          </span>
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.3 }}>
          {article.title}
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          marginBottom: '2rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--border)',
          lineHeight: 1.7
        }}>
          {article.excerpt}
        </p>

        <div style={{
          color: 'var(--text-primary)',
          lineHeight: 1.8,
          fontSize: '0.95rem',
          whiteSpace: 'pre-wrap',
          fontFamily: 'var(--font-sans)'
        }}>
          {article.content
            .replace(/```[\w]*\n/g, '')
            .replace(/```/g, '')
            .replace(/^#{1,3} /gm, '')
            .replace(/\*\*/g, '')
            .replace(/`/g, '')}
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {article.tags.map(tag => (
            <span key={tag} style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              padding: '3px 10px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)'
            }}>
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}