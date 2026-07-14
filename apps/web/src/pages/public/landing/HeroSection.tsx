import { useEffect, useState } from 'react'
import {
  ShoppingCart01Icon,
  BookOpen01Icon,
  Home02Icon,
  Message01Icon,
  AiBrain01Icon,
  GridViewIcon,
  StarIcon,
} from 'hugeicons-react'

const scrollToWaitlist = () => {
  const el = document.getElementById('waitlist')
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-400">
      <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
      {children}
    </div>
  )
}

/* ── Floating module cards for hero visual ──────────────────────────────── */
const MODULES = [
  { icon: ShoppingCart01Icon, label: 'Marketplace', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { icon: BookOpen01Icon, label: 'Study Hub', color: 'text-sky-400', bg: 'bg-sky-400/10' },
  { icon: StarIcon, label: 'Student Jobs', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { icon: Home02Icon, label: 'Housing', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { icon: Message01Icon, label: 'Messaging', color: 'text-teal-400', bg: 'bg-teal-400/10' },
  { icon: AiBrain01Icon, label: 'AI Assistant', color: 'text-primary-400', bg: 'bg-primary-400/10' },
]

function HeroVisual() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="relative w-full max-w-sm mx-auto lg:mx-0 lg:max-w-md select-none"
    >
      {/* Central platform card */}
      <div className="relative z-10 rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white font-black text-lg shadow-lg shadow-primary-500/40">
            U
          </div>
          <div>
            <div className="text-sm font-bold text-white">Universe Platform</div>
            <div className="text-xs text-zinc-500">12 modules · 1 ecosystem</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-primary-500/20 px-2.5 py-1 text-xs font-semibold text-primary-400">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
            Live
          </div>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-3 gap-2">
          {MODULES.map(({ icon: Icon, label, color, bg }, i) => (
            <div
              key={label}
              className={`flex flex-col items-center gap-1.5 rounded-xl ${bg} border border-white/5 p-3 transition-all duration-300`}
              style={{
                transform: tick % 6 === i ? 'scale(1.05)' : 'scale(1)',
                borderColor: tick % 6 === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="text-[10px] text-zinc-400 font-medium text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
          {[
            { val: '4.8k+', label: 'Students' },
            { val: '20+', label: 'Schools' },
            { val: '#1', label: 'Referral' },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <div className="text-sm font-bold text-white">{val}</div>
              <div className="text-[10px] text-zinc-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative blobs behind card */}
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary-500/5 blur-2xl" />
      <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl" />
    </div>
  )
}

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-20 pb-24 px-5 lg:pt-32 lg:pb-36"
      aria-label="Hero"
    >
      {/* Background grid pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(16,185,129,0.08) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(16,185,129,0.05) 0%, transparent 50%)`,
        }}
      />
      {/* Subtle grid lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          {/* Left: Text */}
          <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            <div
              className="mb-6 inline-flex"
              style={{ animation: 'fadeInDown 0.6s ease both' }}
            >
              <Badge>Built for Nigerian Students · Launching Soon</Badge>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08] mb-6"
              style={{ animation: 'fadeInUp 0.7s ease 0.1s both' }}
            >
              Your campus life,{' '}
              <span className="text-primary-400 relative">
                finally connected.
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 300 6"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 3 Q75 0 150 3 Q225 6 300 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-primary-500/50"
                  />
                </svg>
              </span>
            </h1>

            <p
              className="text-lg text-zinc-400 leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0"
              style={{ animation: 'fadeInUp 0.7s ease 0.2s both' }}
            >
              Universe is the all-in-one operating system for Nigerian university students.
              Marketplace, study groups, housing, jobs, errands — one platform.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start"
              style={{ animation: 'fadeInUp 0.7s ease 0.3s both' }}
            >
              <button
                onClick={scrollToWaitlist}
                id="hero-join-waitlist"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-bold px-7 py-3.5 text-sm shadow-xl shadow-primary-500/30 transition-all duration-200 hover:shadow-primary-500/50 hover:-translate-y-0.5 active:translate-y-0"
              >
                <GridViewIcon className="h-4 w-4" />
                Secure Your Spot
              </button>
              <button
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-semibold px-7 py-3.5 text-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                Explore Features
              </button>
            </div>

            {/* Trust row */}
            <div
              className="mt-10 flex items-center gap-4 justify-center lg:justify-start"
              style={{ animation: 'fadeInUp 0.7s ease 0.4s both' }}
            >
              <div className="flex -space-x-2">
                {['T', 'A', 'C', 'E', 'O'].map((initial, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full border-2 border-zinc-950 bg-primary-500/20 flex items-center justify-center text-[10px] font-bold text-primary-400"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div className="text-xs text-zinc-500">
                <span className="text-white font-semibold">4,800+</span> students on the waitlist
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div style={{ animation: 'fadeInUp 0.8s ease 0.3s both' }}>
            <HeroVisual />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
