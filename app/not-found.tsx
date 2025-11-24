import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-dark-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="btn btn-primary">
          Go home
        </Link>
      </div>
    </div>
  )
}

