import { useEffect, useState } from 'react'
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
import { useAuth } from '@universe/auth'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@universe/constants'
import { useInteractionState } from '../../hooks/useInteractionState'
import { WelcomeBackModal } from '../../components/WelcomeBackModal'

export function LandingPage() {
  const { session, isLoading } = useAuth()
  const navigate = useNavigate()
  const { hasInteracted } = useInteractionState()
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        navigate(ROUTES.DASHBOARD, { replace: true })
      } else if (hasInteracted) {
        setShowWelcomeBack(true)
      }
    }
  }, [session, isLoading, hasInteracted, navigate])

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
      
      {showWelcomeBack && (
        <WelcomeBackModal 
          isOpen={showWelcomeBack} 
          onClose={() => setShowWelcomeBack(false)} 
        />
      )}
    </div>
  )
}
