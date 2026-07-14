import { WaitlistForm } from '../../../components/WaitlistForm'
import { ScrollReveal } from './ScrollReveal'

export function WaitlistSection() {
  return (
    <section id="waitlist" className="relative py-32 px-5 bg-white overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-50 via-white to-white" />
      
      <div className="mx-auto max-w-md">
        <ScrollReveal className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-4">
            Secure your spot.
          </h2>
          <p className="text-zinc-500 text-base leading-relaxed">
            Join thousands of Nigerian students waiting for the future of campus life. No password required.
          </p>
        </ScrollReveal>
        
        <ScrollReveal delay={200}>
          <div className="relative rounded-3xl border border-zinc-200/60 bg-white p-6 sm:p-8 shadow-2xl shadow-zinc-900/5">
            {/* Soft gradient border effect */}
            <div className="absolute -inset-[1px] -z-10 rounded-3xl bg-gradient-to-b from-primary-200 to-transparent opacity-50" />
            
            <WaitlistForm />
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
