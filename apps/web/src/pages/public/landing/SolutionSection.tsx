import { ScrollReveal } from './ScrollReveal'
import {
  Link01Icon,
  ShoppingBag01Icon,
  BookOpen01Icon,
  Home03Icon,
  MessageQuestionIcon,
  AiBrain01Icon,
  Briefcase01Icon,
} from 'hugeicons-react'

const MODULES = [
  { icon: ShoppingBag01Icon, label: 'Marketplace' },
  { icon: BookOpen01Icon, label: 'Study Hub' },
  { icon: Home03Icon, label: 'Housing' },
  { icon: MessageQuestionIcon, label: 'Communities' },
  { icon: Briefcase01Icon, label: 'Student Jobs' },
  { icon: AiBrain01Icon, label: 'AI Assistant' },
]

export function SolutionSection() {
  return (
    <section
      id="solution"
      className="bg-zinc-50 py-24 px-5 border-t border-zinc-200"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          {/* Left: Ecosystem Diagram */}
          <ScrollReveal>
            <div className="relative aspect-square max-w-md mx-auto w-full flex items-center justify-center">
              {/* Central Hub */}
              <div className="absolute inset-0 m-auto h-32 w-32 rounded-full bg-white shadow-2xl flex items-center justify-center z-20 border border-zinc-200">
                <div className="text-center">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-primary-500 text-white font-black text-xl shadow-lg shadow-primary-500/40 mb-1">
                    U
                  </div>
                  <span className="text-[10px] font-bold text-zinc-900 tracking-widest uppercase">One App</span>
                </div>
              </div>

              {/* Connecting Lines */}
              <div className="absolute inset-0 m-auto h-64 w-64 rounded-full border border-zinc-200 border-dashed animate-[spin_60s_linear_infinite]" />

              {/* Orbiting Modules */}
              {MODULES.map(({ icon: Icon, label }, i) => {
                const angle = (i * 60 * Math.PI) / 180
                const radius = 128 // Half of 64 (w-64 = 256px) -> 128px radius
                const x = Math.cos(angle) * radius
                const y = Math.sin(angle) * radius

                return (
                  <div
                    key={label}
                    className="absolute z-30 flex flex-col items-center gap-2"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-zinc-200 text-primary-600 transition-transform hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    {/* Only show label on larger screens or specifically positioned so it doesn't overlap */}
                    <div className="absolute top-14 w-max text-center hidden sm:block">
                      <span className="rounded-md bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-bold text-zinc-700 shadow-sm border border-zinc-200">
                        {label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>

          {/* Right: Text Content */}
          <ScrollReveal delay={200}>
            <div className="text-center lg:text-left">
              <div className="mb-5 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary-100 text-primary-600">
                <Link01Icon className="h-6 w-6" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-6">
                One platform to connect them all.
              </h2>
              <p className="text-lg text-zinc-600 leading-relaxed mb-8">
                We're not building just a marketplace, or just a study app. We're building the underlying operating system that connects every aspect of your university experience.
              </p>
              
              <ul className="space-y-4 text-left">
                {[
                  'Single Identity — Sign in once, access everything.',
                  'Verified Network — Only verified students allowed. High trust.',
                  'Seamless Data — Your study schedule syncs with your errands.',
                  'Gamified Ecosystem — Earn rewards across all modules.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-zinc-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
