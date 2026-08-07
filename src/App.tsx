import { GeneratorPanel } from './features/generators/GeneratorPanel'
import { createDefaultRegistry } from './modules/built-in'

const categories = [
  {
    label: 'Local',
    description: 'Utilitas yang berjalan langsung di perangkat.',
    status: '1 generator aktif',
  },
  {
    label: 'Template',
    description: 'Dokumen kerja konsisten dari form sederhana.',
    status: 'Segera hadir',
  },
  {
    label: 'AI',
    description: 'Bantuan opsional dengan provider pilihan Anda.',
    status: 'Segera hadir',
  },
]

const registry = createDefaultRegistry()

function getDemoGenerator() {
  const generator = registry.get('local.json-formatter')

  if (!generator) {
    throw new Error('Default registry tidak memuat local.json-formatter.')
  }

  return generator
}

const demoGenerator = getDemoGenerator()

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="WorkGen home">
          <span className="brand-mark">W</span>
          <span>WorkGen</span>
        </a>
        <span className="offline-badge">
          <span className="status-dot" aria-hidden="true" />
          Local-first
        </span>
      </header>

      <section className="hero" aria-labelledby="welcome-title">
        <p className="eyebrow">Kotak alat kerja pribadi</p>
        <h1 id="welcome-title">Selesaikan pekerjaan rutin dengan lebih tenang.</h1>
        <p className="hero-copy">
          WorkGen sedang disiapkan sebagai aplikasi web yang cepat, privat, dan tetap berguna
          tanpa koneksi internet.
        </p>
      </section>

      <section className="category-grid" aria-label="Kategori generator">
        {categories.map((category) => (
          <article className="category-card" key={category.label}>
            <div className="card-heading">
              <span className="card-icon" aria-hidden="true">
                {category.label.slice(0, 1)}
              </span>
              <span className="card-status">{category.status}</span>
            </div>
            <h2>{category.label}</h2>
            <p>{category.description}</p>
          </article>
        ))}
      </section>

      <GeneratorPanel generator={demoGenerator} />

      <footer className="footer-note">
        <span>Fondasi proyek M0.4</span>
        <span aria-hidden="true">•</span>
        <span>Demo generator berjalan tanpa network</span>
      </footer>
    </main>
  )
}

export default App
