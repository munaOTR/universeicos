import { ScrollReveal } from './ScrollReveal'
import {
  Tick02Icon,
  CrownIcon,
  DashboardSquare01Icon,
  Settings02Icon,
  LockKeyIcon,
} from 'hugeicons-react'

const ACTIVE_MODULES = [
  {
    icon: Tick02Icon,
    title: 'Waitlist System',
    desc: 'Secure your spot. Built with anti-spam and verified university domain checks.',
    status: 'Live',
    color: 'bg-primary-500',
  },
  {
    icon: CrownIcon,
    title: 'Referral Engine',
    desc: 'Invite your course mates. Earn points and climb the national leaderboard.',
    status: 'Live',
    color: 'bg-amber-500',
  },
  {
    icon: DashboardSquare01Icon,
    title: 'Student Dashboard',
    desc: 'Your personal command center. Track rank, profile completion, and rewards.',
    status: 'Live',
    color: 'bg-sky-500',
  },
  {
    icon: Settings02Icon,
    title: 'Admin Command',
    desc: 'God-mode for campus ambassadors and community managers.',
    status: 'Live',
    color: 'bg-rose-500',
  },
]

export function FeaturePreviewSection() {
  return (
    <section
      id="features"
      className="bg-white py-24 px-5 text-zinc-900"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-600 mb-3">
            MVP Launch
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            What's inside V1.0?
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto text-lg leading-relaxed">
            We are rolling out Universe in phases. Our first release focuses on building the strongest, most verified network of Nigerian students.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          {ACTIVE_MODULES.map(({ icon: Icon, title, desc, status, color }, i) => (
            <ScrollReveal key={title} delay={i * 100}>
              <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 hover:shadow-xl hover:border-zinc-300 transition-all duration-300">
                <div className="absolute right-6 top-6">
                  <span className={`inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
                    {status}
                  </span>
                </div>
                
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-lg ${color}`}>
                  <Icon className="h-7 w-7" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3">{title}</h3>
                <p className="text-zinc-500 leading-relaxed">
                  {desc}
                </p>
                
                {/* Decorative background icon */}
                <Icon className="absolute -bottom-8 -right-8 h-48 w-48 text-zinc-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Coming soon teaser */}
        <ScrollReveal delay={400} className="mt-12 text-center border-t border-zinc-100 pt-12">
          <p className="text-sm font-medium text-zinc-500 flex items-center justify-center gap-2">
            <LockKeyIcon className="h-4 w-4" />
            Marketplace, Study Hub, and Housing unlock at 10,000 waitlist signups.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
