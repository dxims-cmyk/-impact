'use client'

const PAGES = [
  { n: 1, title: 'Welcome' },
  { n: 2, title: 'The Deal' },
  { n: 3, title: '3 Month Plan' },
  { n: 4, title: 'How Ads Work' },
  { n: 5, title: 'Live Ad Spec' },
  { n: 6, title: 'Your Tools' },
  { n: 7, title: 'When a Lead Lands' },
  { n: 8, title: 'Weekly Rhythm' },
  { n: 9, title: 'What I Need' },
  { n: 10, title: 'FAQ + LLM SEO' },
  { n: 11, title: 'When Things Go Wrong' },
  { n: 12, title: 'Beyond Month 3' },
]

export function PageNav(): React.JSX.Element {
  return (
    <nav className="sticky top-0 z-30 hidden border-b border-navy/10 bg-warm-white/95 backdrop-blur-md print:hidden lg:block">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-3">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-impact">
          : Welcome Pack
        </span>
        <div className="scrollbar-none flex flex-1 items-center gap-1 overflow-x-auto">
          {PAGES.map((p) => (
            <a
              key={p.n}
              href={`#page-${p.n}`}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-navy/60 transition-colors hover:bg-navy/5 hover:text-navy"
            >
              {p.n}. {p.title}
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="whitespace-nowrap rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-warm-white transition-colors hover:bg-navy-light"
        >
          Print / Save PDF
        </button>
      </div>
    </nav>
  )
}
