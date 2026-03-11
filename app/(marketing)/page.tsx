import { HeroSection } from '@/components/marketing/hero-section'
import { PainPointStats } from '@/components/marketing/pain-point-stats'
import { BeforeAfter } from '@/components/marketing/before-after'
import { ProductShowcase } from '@/components/marketing/product-showcase'
import { FeaturesSection } from '@/components/marketing/features-section'
import { IntegrationsSection } from '@/components/marketing/integrations-section'
import { PricingSection } from '@/components/marketing/pricing-section'
import { AgencySection } from '@/components/marketing/agency-section'
import { FaqSection } from '@/components/marketing/faq-section'
import { CtaSection } from '@/components/marketing/cta-section'

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <PainPointStats />
      <BeforeAfter />
      <ProductShowcase />
      <FeaturesSection />
      <IntegrationsSection />
      <PricingSection />
      <AgencySection />
      <FaqSection />
      <CtaSection />
    </>
  )
}
