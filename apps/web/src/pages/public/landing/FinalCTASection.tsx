import { ScrollReveal } from './ScrollReveal'
import { RocketIcon } from 'hugeicons-react'

export function FinalCTASection() {
  const scrollToWaitlist = () => {
    const el = document.getElementById('waitlist')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <section className="relative py-32 px-5 overflow-hidden bg-zinc-950">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 -z-10 bg-primary-900/20" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/20 blur-[100px]" />

      <div className="mx-auto max-w-4xl text-center">
        <ScrollReveal>
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-xl shadow-primary-500/30">
            <RocketIcon className="h-8 w-8" />
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6">
            Ready to upgrade your campus experience?
          </h2>
          
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Join thousands of students already on the waitlist. Be the first to know when we launch at your university.
          </p>

          <button
            onClick={scrollToWaitlist}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-bold px-8 py-4 text-lg shadow-xl shadow-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Join the Waitlist
          </button>
        </ScrollReveal>
      </div>
    </section>
  )
}
