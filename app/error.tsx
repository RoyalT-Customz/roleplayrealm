'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
        <p className="text-dark-400 mb-8">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={reset}
            className="btn btn-primary"
          >
            Try again
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn btn-secondary"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  )
}

