export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Good morning 👋</h1>
      <p className="text-gray-400 mb-8">Ready to study? Let's go.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Daily Streak</p>
          <p className="text-4xl font-bold text-orange-400">🔥 0</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Cards to Review</p>
          <p className="text-4xl font-bold text-indigo-400">0</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">MCQs Done Today</p>
          <p className="text-4xl font-bold text-green-400">0</p>
        </div>
      </div>
    </div>
  )
}