import { ScrollReveal } from './ScrollReveal'
import {
  Link01Icon,
  Ticket01Icon,
} from 'hugeicons-react'

const STEPS = [
  {
    icon: Link01Icon,
    title: 'Get your link',
    desc: 'Join the waitlist to receive your unique referral code instantly.',
  },
  {
    icon: Ticket01Icon,
    title: 'Invite friends',
    desc: 'Share your link with course mates and faculty members.',
  },
  {
    icon: Ticket01Icon,
    title: 'Climb the ranks',
    desc: 'Earn 100 points per invite. Top students get early beta access and exclusive rewards.',
  },
]

export function ReferralSection() {
  return (
    <section className="bg-zinc-50 py-24 px-5">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-600 mb-3">
            The Referral Engine
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-4">
            Bring your friends. Get rewarded.
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Universe is better with friends. Invite your peers to help your university climb the national leaderboard.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-zinc-200 -translate-y-1/2 -z-10" />

          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <ScrollReveal key={title} delay={i * 150} className="relative bg-zinc-50">
              <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm relative z-10">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 shadow-inner">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
