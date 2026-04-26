import Link from 'next/link'

export default function NotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm-white px-6 text-center">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-impact">
        : Welcome Pack
      </span>
      <h1 className="mt-6 font-display text-4xl font-semibold text-navy">
        Pack not found
      </h1>
      <p className="mt-4 max-w-md text-navy/70">
        We couldn&apos;t find a welcome pack at this address. Double-check the link
        with Colm.
      </p>
      <Link
        href="https://driveimpact.io"
        className="mt-8 rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-warm-white hover:bg-navy-light"
      >
        Back to driveimpact.io
      </Link>
    </div>
  )
}
