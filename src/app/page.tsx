import Link from 'next/link'

export default function Home() {
  return (
    <>
      <style>{`
        .landing {
          min-height: 100vh;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 40px;
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #e8e0f0;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .nav-logo {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a2e;
        }
        .nav-login {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 10px;
          transition: color 0.15s;
        }
        .nav-login:hover { color: #1a1a2e; }
        .nav-cta {
          font-size: 0.875rem;
          font-weight: 600;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 50px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          transition: opacity 0.15s;
        }
        .nav-cta:hover { opacity: 0.9; }
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 100px 24px 80px;
        }
        .hero-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 500;
          color: #a855f7;
          background: rgba(168,85,247,0.08);
          border: 1px solid rgba(168,85,247,0.2);
          padding: 6px 16px;
          border-radius: 50px;
          margin-bottom: 28px;
          letter-spacing: 0.03em;
        }
        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 800;
          color: #1a1a2e;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -0.02em;
        }
        .hero-title span {
          background: linear-gradient(135deg, #a855f7, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: 1.1rem;
          color: #6b7280;
          max-width: 540px;
          line-height: 1.7;
          margin-bottom: 40px;
        }
        .hero-btns {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .btn-primary {
          font-size: 0.9rem;
          font-weight: 600;
          color: white;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 50px;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          transition: opacity 0.15s, transform 0.15s;
          box-shadow: 0 4px 20px rgba(168,85,247,0.3);
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-secondary {
          font-size: 0.9rem;
          font-weight: 600;
          color: #6b7280;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 50px;
          background: rgba(255,255,255,0.8);
          border: 1px solid #e8e0f0;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-secondary:hover { border-color: #a855f7; color: #9333ea; }
        .features {
          padding: 80px 40px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .features-label {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #a855f7;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .features-title {
          text-align: center;
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }
        .features-sub {
          text-align: center;
          color: #9ca3af;
          font-size: 0.95rem;
          margin-bottom: 56px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 768px) {
          .features-grid { grid-template-columns: 1fr; }
          .nav { padding: 16px 20px; }
          .features { padding: 60px 20px; }
        }
        .feature-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          border: 1px solid #e8e0f0;
          border-radius: 16px;
          padding: 24px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .feature-card:hover {
          border-color: #a855f7;
          box-shadow: 0 4px 24px rgba(168,85,247,0.08);
        }
        .feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(168,85,247,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          margin-bottom: 16px;
        }
        .feature-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 8px;
        }
        .feature-desc {
          font-size: 0.85rem;
          color: #9ca3af;
          line-height: 1.6;
        }
        .cta-section {
          text-align: center;
          padding: 80px 24px;
          border-top: 1px solid #e8e0f0;
        }
        .cta-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }
        .cta-sub {
          color: #9ca3af;
          font-size: 0.95rem;
          margin-bottom: 32px;
        }
      `}</style>

      <main className="landing">
        {/* Navbar */}
        <nav className="nav">
          <span className="nav-logo">Lumora</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/login" className="nav-login">Log in</Link>
            <Link href="/signup" className="nav-cta">Get started free</Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <span className="hero-badge">AI-Powered Learning Platform</span>
          <h1 className="hero-title">
            Learn smarter.<br />
            <span>Not harder.</span>
          </h1>
          <p className="hero-sub">
            Lumora is your personal AI tutor — generates flashcards, MCQs, and explains any topic clearly. Built for students who want real results.
          </p>
          <div className="hero-btns">
            <Link href="/signup" className="btn-primary">Start for free</Link>
            <Link href="/login" className="btn-secondary">Log in</Link>
          </div>
        </section>

        {/* Features */}
        <section className="features">
          <p className="features-label">Everything you need</p>
          <h2 className="features-title">Study smarter with AI</h2>
          <p className="features-sub">No more passive reading. Lumora makes you actively recall, practice, and master.</p>
          <div className="features-grid">
            {[
              { icon: '▦', title: 'AI Flashcards', desc: 'Generate smart flashcards on any topic in seconds. Powered by active recall science.' },
              { icon: '◈', title: 'MCQ Practice', desc: 'Exam-style questions generated instantly with explanations for every answer.' },
              { icon: '✦', title: 'AI Tutor', desc: 'Ask anything. Get clear, step-by-step explanations tailored to your level.' },
              { icon: '↻', title: 'Spaced Repetition', desc: 'Lumora remembers what you struggle with and brings it back at the right time.' },
              { icon: '◎', title: 'Progress Tracking', desc: 'See your weak topics, daily streaks, and improvement over time.' },
              { icon: '↑', title: 'Upload & Learn', desc: 'Upload a PDF or image and let Lumora teach you from your own notes.' },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2 className="cta-title">Ready to start learning?</h2>
          <p className="cta-sub">Join students already using Lumora.</p>
          <Link href="/signup" className="btn-primary">Get started free</Link>
        </section>
      </main>
    </>
  )
}