import { HeroSection } from '@/components/marketing/hero-section'
import { ClientCarousel } from '@/components/marketing/client-carousel'
import { PainPointStats } from '@/components/marketing/pain-point-stats'
import { BeforeAfter } from '@/components/marketing/before-after'
import { InteractiveDemo } from '@/components/marketing/interactive-demo'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { FeaturesSection } from '@/components/marketing/features-section'
import { IntegrationsSection } from '@/components/marketing/integrations-section'
import { VideoSection } from '@/components/marketing/video-section'
import { TestimonialsSection } from '@/components/marketing/testimonials-section'
import { SocialProofSection } from '@/components/marketing/social-proof-stat'
import { PricingSection } from '@/components/marketing/pricing-section'
import { AgencySection } from '@/components/marketing/agency-section'
import { FaqSection } from '@/components/marketing/faq-section'
import { CtaSection } from '@/components/marketing/cta-section'

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ClientCarousel />
      <PainPointStats />
      <BeforeAfter />
      <InteractiveDemo />
      <HowItWorks />
      <FeaturesSection />
      <IntegrationsSection />
      <VideoSection />
      <TestimonialsSection />
      <SocialProofSection />
      <PricingSection />
      <AgencySection />
      <FaqSection />
      <CtaSection />
    </>
  )
}
