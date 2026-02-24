import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-impact/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-impact">404</span>
        </div>
        <h1 className="text-2xl font-bold text-navy mb-2">Page not found</h1>
        <p className="text-navy/60 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="btn-primary inline-flex items-center gap-2 px-6 py-3"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
