import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Lumora</h1>
        <div className="flex gap-4">
          <Link href="/login" className="px-5 py-2 text-gray-300 hover:text-white transition">
            Log in
          </Link>
          <Link href="/signup" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <div className="inline-block bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm px-4 py-1.5 rounded-full mb-6">
          AI-Powered Learning Platform
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Learn Smarter.<br />
          <span className="text-indigo-400">Not Harder.</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mb-10">
          Lumora is your personal AI tutor that generates flashcards, MCQs, and explains anything instantly. Built for students who want real results.
        </p>
        <div className="flex gap-4">
          <Link href="/signup" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl transition">
            Start for Free
          </Link>
          <Link href="/login" className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg rounded-xl transition">
            Log In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-4">Everything you need to ace your exams</h2>
        <p className="text-gray-400 text-center mb-16">No more passive reading. Lumora makes you actively recall, practice, and master.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🃏', title: 'AI Flashcards', desc: 'Generate smart flashcards on any topic in seconds. Powered by active recall science.' },
            { icon: '📝', title: 'MCQ Practice', desc: 'Exam-style questions generated instantly. Get explanations for every answer.' },
            { icon: '🤖', title: 'AI Tutor', desc: 'Ask anything. Get clear, simple explanations with examples. Like a personal teacher.' },
            { icon: '🔁', title: 'Spaced Repetition', desc: 'Lumora remembers what you struggle with and shows it again at the right time.' },
            { icon: '📊', title: 'Progress Tracking', desc: 'See your weak topics, daily streaks, and how much you\'ve improved over time.' },
            { icon: '📄', title: 'Upload & Learn', desc: 'Upload a PDF or image and Lumora will teach you from it directly.' },
          ].map((f, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500 transition">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6 py-24 border-t border-gray-800">
        <h2 className="text-4xl font-bold text-white mb-4">Ready to start learning?</h2>
        <p className="text-gray-400 mb-8">Join students already using Lumora. Free forever to start.</p>
        <Link href="/signup" className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl transition">
          Get Started Free
        </Link>
      </section>
    </main>
  )
}