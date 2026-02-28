'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <div className="max-w-md w-full text-center">
        <img
          src="/ampm-logo.png"
          alt="AM:PM Media"
          className="w-16 h-16 rounded-xl mx-auto mb-6 shadow-lg object-cover"
        />
        <h1 className="text-2xl font-bold text-ivory mb-2">You're offline</h1>
        <p className="text-ivory/60 mb-6">
          It looks like you've lost your internet connection. Please check your network and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary inline-flex items-center gap-2 px-6 py-3"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
