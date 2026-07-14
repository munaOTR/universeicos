import { ScrollReveal } from './ScrollReveal'

export function ProductPreviewSection() {
  return (
    <section className="bg-zinc-950 py-24 px-5 border-t border-white/5 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-500 mb-3">
            Sneak Peek
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Designed for students, built like a startup.
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
            We sweat the details. The interface is meticulously crafted to be fast, responsive, and beautiful across all devices.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          {/* Mock Browser Window */}
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50 overflow-hidden">
            
            {/* Browser Chrome */}
            <div className="flex h-12 items-center border-b border-white/10 bg-zinc-900/50 px-4">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="mx-auto flex h-6 w-64 items-center justify-center rounded-md bg-zinc-800/50 text-[10px] text-zinc-500 font-mono">
                app.universeicos.app
              </div>
            </div>

            {/* Dashboard Mock Content */}
            <div className="flex min-h-[400px] bg-zinc-50">
              {/* Sidebar */}
              <div className="w-64 border-r border-zinc-200 bg-white p-4 hidden md:block">
                <div className="flex items-center gap-2 mb-8 px-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary-500 text-white font-black text-[10px]">U</div>
                  <span className="font-bold text-zinc-900 text-sm">Universe</span>
                </div>
                
                <div className="space-y-1">
                  <div className="rounded-lg bg-primary-50 text-primary-700 font-medium px-3 py-2 text-sm">Dashboard</div>
                  <div className="rounded-lg text-zinc-500 font-medium px-3 py-2 text-sm">Leaderboard</div>
                  <div className="rounded-lg text-zinc-500 font-medium px-3 py-2 text-sm">Referrals</div>
                  <div className="rounded-lg text-zinc-500 font-medium px-3 py-2 text-sm">Settings</div>
                </div>
              </div>

              {/* Main Area */}
              <div className="flex-1 p-8">
                <div className="h-8 w-48 rounded bg-zinc-200 mb-6" />
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="h-24 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="h-4 w-20 rounded bg-zinc-100 mb-4" />
                    <div className="h-6 w-12 rounded bg-zinc-200" />
                  </div>
                  <div className="h-24 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="h-4 w-20 rounded bg-zinc-100 mb-4" />
                    <div className="h-6 w-12 rounded bg-zinc-200" />
                  </div>
                  <div className="h-24 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="h-4 w-20 rounded bg-zinc-100 mb-4" />
                    <div className="h-6 w-12 rounded bg-zinc-200" />
                  </div>
                </div>

                <div className="h-64 rounded-xl border border-zinc-200 bg-white shadow-sm flex flex-col p-4">
                  <div className="h-4 w-32 rounded bg-zinc-100 mb-6" />
                  <div className="space-y-4 flex-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-zinc-100" />
                          <div className="space-y-2">
                            <div className="h-3 w-24 rounded bg-zinc-200" />
                            <div className="h-2 w-16 rounded bg-zinc-100" />
                          </div>
                        </div>
                        <div className="h-4 w-12 rounded bg-zinc-100" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Gradient Overlay for bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-900 to-transparent" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

