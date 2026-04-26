interface PageShellProps {
  number: number
  title: string
  children: React.ReactNode
}

export function PageShell({ number, title, children }: PageShellProps): React.JSX.Element {
  return (
    <section
      id={`page-${number}`}
      className="welcome-page mx-auto w-full max-w-3xl scroll-mt-24 border-t border-navy/10 px-6 py-16 first:border-t-0 sm:px-10 md:py-24 print:break-before-page print:py-12 print:first:break-before-auto"
    >
      <div className="mb-8 flex items-baseline gap-4">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-impact">
          Page {number} of 12
        </span>
        <span className="h-px flex-1 bg-navy/15" />
      </div>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-navy sm:text-4xl md:text-5xl">
        {title}
      </h2>
      <div className="prose-welcome mt-8 text-[17px] leading-relaxed text-navy/80">
        {children}
      </div>
    </section>
  )
}
