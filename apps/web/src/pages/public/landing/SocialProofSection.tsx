import { ScrollReveal } from './ScrollReveal'
import { AnimatedCounter } from './AnimatedCounter'
import { UserGroupIcon, GlobeIcon, StarIcon } from 'hugeicons-react'

const STATS = [
  {
    icon: UserGroupIcon,
    value: 4800,
    suffix: '+',
    label: 'Students waiting',
    color: 'text-primary-400',
  },
  {
    icon: StarIcon,
    value: 20,
    suffix: '+',
    label: 'Universities represented',
    color: 'text-sky-400',
  },
  {
    icon: GlobeIcon,
    value: 12,
    suffix: '',
    label: 'Modules planned',
    color: 'text-violet-400',
  },
  {
    icon: StarIcon,
    value: 100,
    suffix: '%',
    label: 'Student-built',
    color: 'text-amber-400',
  },
]

const UNIVERSITIES = [
  'UNILAG', 'UI', 'OAU', 'UNN', 'UNIBEN',
  'ABU', 'UNIPORT', 'LASU', 'FUTA', 'Covenant',
  'Babcock', 'UNILORIN', 'UNIJOS', 'UNICAL', 'NAU',
]

export function SocialProofSection() {
  return (
    <section
      id="social-proof"
      aria-label="Social proof"
      className="relative overflow-hidden border-t border-white/5 bg-zinc-950 py-20 px-5"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <ScrollReveal className="mb-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            Early traction
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Students are already waiting.
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto text-base">
            Before we launch, thousands of Nigerian students have already secured their spot.
          </p>
        </ScrollReveal>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {STATS.map(({ icon: Icon, value, suffix, label, color }, i) => (
            <ScrollReveal key={label} delay={i * 80}>
              <div className="rounded-2xl border border-white/5 bg-white/3 p-6 text-center hover:border-white/10 hover:bg-white/5 transition-all duration-300">
                <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className={`text-3xl font-black ${color} mb-1`}>
                  <AnimatedCounter end={value} suffix={suffix} />
                </div>
                <div className="text-xs text-zinc-500 font-medium">{label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* University marquee */}
        <ScrollReveal>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-6">
            Students from across Nigeria
          </p>
          <div className="relative overflow-hidden">
            {/* Gradient masks */}
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-zinc-950 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-zinc-950 to-transparent" />
            {/* Scrolling track */}
            <div
              className="flex gap-3 whitespace-nowrap"
              style={{
                animation: 'marquee 25s linear infinite',
                width: 'max-content',
              }}
            >
              {[...UNIVERSITIES, ...UNIVERSITIES].map((uni, i) => (
                <span
                  key={`${uni}-${i}`}
                  className="inline-flex items-center rounded-full border border-white/8 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-400"
                >
                  {uni}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
