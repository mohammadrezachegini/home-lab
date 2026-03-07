import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ArticleList from './components/ArticleList.jsx'
import ArticleDetail from './components/ArticleDetail.jsx'

function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <Routes>
          <Route path="/" element={<ArticleList />} />
          <Route path="/article/:slug" element={<ArticleDetail />} />
        </Routes>
      </main>
    </div>
  )
}

export default App