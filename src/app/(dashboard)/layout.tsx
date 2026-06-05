export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-6">
        <h1 className="text-2xl font-bold text-white mb-8">Lumora</h1>
        <nav className="flex flex-col gap-2">
          <a href="/dashboard" className="text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition">🏠 Dashboard</a>
          <a href="/flashcards" className="text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition">🃏 Flashcards</a>
          <a href="/mcq" className="text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition">📝 MCQ Practice</a>
          <a href="/tutor" className="text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition">🤖 AI Tutor</a>
          <a href="/review" className="text-gray-300 hover:text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition">🔁 Review</a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}