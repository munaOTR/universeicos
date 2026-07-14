import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-900 text-zinc-900 dark:text-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-4">Universe Admin</h1>
      <p className="text-lg mb-8 text-center max-w-md">
        Admin Dashboard — coming soon.
      </p>

      <div className="flex flex-col items-center space-y-4">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          onClick={() => setCount((c) => c + 1)}
        >
          Count is {count}
        </button>
      </div>
    </div>
  )
}

export default App
