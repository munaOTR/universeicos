import { ScrollReveal } from './ScrollReveal'

const PHASES = [
  {
    phase: 'Phase 1',
    title: 'Waitlist & Foundation',
    status: 'Current',
    items: ['Student Authentication', 'Referral Engine', 'Waitlist Leaderboard', 'Admin Command Center'],
  },
  {
    phase: 'Phase 2',
    title: 'The Core Network',
    status: 'Q3 2026',
    items: ['Student Profiles', 'Campus Communities', 'Direct Messaging', 'Announcements'],
  },
  {
    phase: 'Phase 3',
    title: 'Commerce & Study',
    status: 'Q4 2026',
    items: ['Verified Marketplace', 'Study Hub (Past Questions)', 'Study Groups', 'Tutor Matching'],
  },
  {
    phase: 'Phase 4',
    title: 'The Full Ecosystem',
    status: '2027',
    items: ['Off-campus Housing', 'Student Errands', 'Campus Jobs', 'AI Assistant Integration'],
  },
]

export function RoadmapSection() {
  return (
    <section id="roadmap" className="bg-zinc-950 py-32 px-5 text-white">
      <div className="mx-auto max-w-4xl">
        <ScrollReveal className="text-center mb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-500 mb-3">
            The Master Plan
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            How we take over campus.
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            We are building methodically. Quality and trust over rushing features.
          </p>
        </ScrollReveal>

        <div className="relative border-l border-white/10 ml-4 md:ml-8 space-y-12 pb-8">
          {PHASES.map(({ phase, title, status, items }, i) => (
            <ScrollReveal key={phase} delay={i * 100} className="relative pl-8 md:pl-12">
              {/* Timeline Dot */}
              <div className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ${status === 'Current' ? 'bg-primary-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-zinc-700'}`} />
              
              <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-3">
                <h3 className="text-xl md:text-2xl font-bold">{title}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-500">{phase}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${status === 'Current' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-white/5 text-zinc-400 border border-white/10'}`}>
                    {status}
                  </span>
                </div>
              </div>
              
              <ul className="grid sm:grid-cols-2 gap-3 mt-4">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-zinc-400 text-sm">
                    <span className="h-1 w-1 rounded-full bg-zinc-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
