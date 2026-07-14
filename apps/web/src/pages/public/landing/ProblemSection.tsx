import { ScrollReveal } from './ScrollReveal'
import {
  File01Icon,
  ShoppingBag01Icon,
  MessageQuestionIcon,
  Home03Icon,
  Megaphone01Icon,
} from 'hugeicons-react'

const PROBLEMS = [
  {
    icon: File01Icon,
    title: 'Fragmented Tools',
    desc: 'WhatsApp groups for notes, Twitter for news, physical boards for housing. Nothing connects.',
  },
  {
    icon: ShoppingBag01Icon,
    title: 'Sketchy Marketplace',
    desc: 'Buying from strangers online is risky. No verified student-only marketplace exists.',
  },
  {
    icon: File01Icon,
    title: 'Lost Materials',
    desc: 'Past questions and slides get lost in infinite chat histories right before exams.',
  },
  {
    icon: Home03Icon,
    title: 'Housing Nightmares',
    desc: 'Finding off-campus housing or roommates relies entirely on word of mouth and shady agents.',
  },
  {
    icon: MessageQuestionIcon,
    title: 'Who to Ask?',
    desc: 'Freshmen struggle to find reliable information about courses, lecturers, and campus life.',
  },
  {
    icon: Megaphone01Icon,
    title: 'Missed Opportunities',
    desc: 'Scholarships, gigs, and important announcements slip through the cracks every day.',
  },
]

export function ProblemSection() {
  return (
    <section
      id="problem"
      className="bg-white py-24 px-5 text-zinc-900"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-600 mb-3">
            The Status Quo
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Campus life is unnecessarily hard.
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Nigerian students are highly resourceful, but the tools available to them are completely fragmented and disconnected.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROBLEMS.map(({ icon: Icon, title, desc }, i) => (
            <ScrollReveal key={title} delay={i * 100}>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 h-full hover:border-zinc-300 hover:shadow-md transition-all">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-zinc-900 shadow-sm border border-zinc-200">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-zinc-600 leading-relaxed text-sm">
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
