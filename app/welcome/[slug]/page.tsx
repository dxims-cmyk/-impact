import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllSlugs, getWelcomePack } from '@/lib/welcome-packs/registry'
import { PageNav } from '@/components/welcome/page-nav'
import { WelcomePack } from '@/components/welcome/welcome-pack'

interface PageProps {
  params: { slug: string }
}

export function generateStaticParams(): { slug: string }[] {
  return getAllSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const pack = getWelcomePack(params.slug)
  if (!pack) {
    return { title: 'Welcome Pack' }
  }
  return {
    title: `${pack.client.name} — Welcome Pack | : Impact`,
    description: `Onboarding pack for ${pack.client.name} from AM:PM Media.`,
    robots: { index: false, follow: false },
  }
}

export default function WelcomePackPage({ params }: PageProps): React.JSX.Element {
  const pack = getWelcomePack(params.slug)
  if (!pack) {
    notFound()
  }

  return (
    <>
      <PageNav />
      <WelcomePack pack={pack} />
    </>
  )
}
