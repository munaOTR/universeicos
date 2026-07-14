import { useState } from 'react'
import { ScrollReveal } from './ScrollReveal'

const FAQS = [
  {
    q: 'Who can join Universe?',
    a: 'Currently, Universe is exclusively for students enrolled in verified Nigerian universities. You will need access to your student email (.edu.ng) or alternative verification methods during the full launch.',
  },
  {
    q: 'Is the platform free?',
    a: 'Yes. The core Universe platform is completely free for students. Some premium features (like promoting a marketplace listing) may have small fees in the future, but the essential tools will always be free.',
  },
  {
    q: 'When does the Marketplace launch?',
    a: 'The Marketplace module will unlock once we hit 10,000 verified students on the waitlist. Invite your friends to help us reach the goal faster!',
  },
  {
    q: 'How does the referral system work?',
    a: 'When you join the waitlist, you get a unique link. For every friend who signs up using your link, you earn 100 points. The top 500 students on the leaderboard will get early beta access and exclusive "Founder" badges.',
  },
  {
    q: 'What is the Study Hub?',
    a: 'The Study Hub is a crowdsourced repository of past questions, lecture slides, and course notes specific to your university and department. It also includes tutor matching.',
  },
  {
    q: 'Is my data safe?',
    a: 'We take privacy seriously. We only collect what is necessary to verify your student status. We will never sell your personal data to third-party advertisers.',
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="bg-zinc-50 py-32 px-5 border-t border-zinc-200">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-500 text-lg">
            Everything you need to know about Universe and the waitlist.
          </p>
        </ScrollReveal>

        <div className="space-y-4">
          {FAQS.map(({ q, a }, i) => {
            const isOpen = openIndex === i
            return (
              <ScrollReveal key={q} delay={i * 50}>
                <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all duration-200 hover:border-primary-300">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between p-6 text-left focus:outline-none focus-visible:bg-zinc-50"
                    aria-expanded={isOpen}
                  >
                    <span className="font-bold text-zinc-900 pr-4">{q}</span>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-primary-100 text-primary-600' : ''}`}>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  <div
                    className={`px-6 text-zinc-600 text-sm leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 pb-0 opacity-0'
                    }`}
                  >
                    {a}
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
