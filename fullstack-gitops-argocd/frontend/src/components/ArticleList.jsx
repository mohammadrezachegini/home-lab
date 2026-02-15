import { useState, useEffect } from 'react'
import ArticleCard from './ArticleCard.jsx'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export default function ArticleList() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_URL}/articles/meta/categories`)
        const data = await res.json()
        if (data.success) setCategories(['All', ...data.data])
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true)
        const url = activeCategory === 'All'
          ? `${API_URL}/articles`
          : `${API_URL}/articles?category=${activeCategory}`
        const res = await fetch(url)
        const data = await res.json()
        if (data.success) setArticles(data.data)
        else setError(data.error)
      } catch (err) {
        setError('Failed to connect to API. Is the backend running?')
      } finally {
        setLoading(false)
      }
    }
    fetchArticles()
  }, [activeCategory])

  return (
    <div>
      {/* Hero */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-green)',
          fontSize: '0.85rem',
          marginBottom: '0.5rem'
        }}>
          // root access newsletter
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          DevOps Field Notes
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Real-world Kubernetes, GitOps, CI/CD and Infrastructure stories from the home lab.
        </p>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: '6px 16px',
            borderRadius: '20px',
            border: '1px solid',
            borderColor: activeCategory === cat ? 'var(--accent)' : 'var(--border)',
            background: activeCategory === cat ? 'rgba(88,166,255,0.1)' : 'transparent',
            color: activeCategory === cat ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            transition: 'all 0.2s'
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
            $ fetching articles...
          </div>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(248,81,73,0.1)',
          border: '1px solid rgba(248,81,73,0.3)',
          borderRadius: '8px',
          padding: '1rem 1.5rem',
          color: '#f85149',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem'
        }}>
          ❌ Error: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}>
            {articles.map(article => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
          {articles.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>
              No articles found.
            </p>
          )}
        </>
      )}
    </div>
  )
}