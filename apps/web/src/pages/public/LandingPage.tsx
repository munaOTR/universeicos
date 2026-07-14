import { useEffect } from 'react'
import { HeroSection } from './landing/HeroSection'
import { SocialProofSection } from './landing/SocialProofSection'
import { ProblemSection } from './landing/ProblemSection'
import { SolutionSection } from './landing/SolutionSection'
import { FeaturePreviewSection } from './landing/FeaturePreviewSection'
import { ProductPreviewSection } from './landing/ProductPreviewSection'
import { ReferralSection } from './landing/ReferralSection'
import { WaitlistSection } from './landing/WaitlistSection'
import { RoadmapSection } from './landing/RoadmapSection'
import { FAQSection } from './landing/FAQSection'
import { FinalCTASection } from './landing/FinalCTASection'
import { FooterSection } from './landing/FooterSection'

export function LandingPage() {
  useEffect(() => {
    // Basic SEO Setup - In a real SSR framework like Next.js this would be handled differently
    document.title = 'Universe | The OS for Nigerian University Students'
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Universe is the all-in-one operating system for Nigerian university students. Connect, study, buy, sell, and thrive on one unified platform.'
      )
    }
  }, [])

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-zinc-950">
      <HeroSection />
      <SocialProofSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturePreviewSection />
      <ProductPreviewSection />
      <ReferralSection />
      <WaitlistSection />
      <RoadmapSection />
      <FAQSection />
      <FinalCTASection />
      <FooterSection />
    </div>
  )
}
