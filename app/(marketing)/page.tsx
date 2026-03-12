import { HeroSection } from '@/components/marketing/hero-section'
import { PainPointStats } from '@/components/marketing/pain-point-stats'
import { ProductShowcase } from '@/components/marketing/product-showcase'
import { ResponsibilitySplit } from '@/components/marketing/responsibility-split'
import { FeaturesSection } from '@/components/marketing/features-section'
import { IntegrationsSection } from '@/components/marketing/integrations-section'
import { PricingSection } from '@/components/marketing/pricing-section'
import { TrustSection } from '@/components/marketing/trust-section'
import { SecuritySection } from '@/components/marketing/security-section'
import { FaqSection } from '@/components/marketing/faq-section'
import { CtaSection } from '@/components/marketing/cta-section'

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <PainPointStats />
      <ProductShowcase />
      <ResponsibilitySplit />
      <FeaturesSection />
      <IntegrationsSection />
      <PricingSection />
      <TrustSection />
      <SecuritySection />
      <FaqSection />
      <CtaSection />
    </>
  )
}
