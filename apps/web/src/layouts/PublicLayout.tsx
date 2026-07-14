'use client'
import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@universe/constants'

const NAV_SECTIONS = [
  { id: 'features', label: 'Features' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'faq', label: 'FAQ' },
]

export function PublicLayout() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Close mobile nav on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Observe sections for active highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { threshold: 0.35, rootMargin: '-80px 0px 0px 0px' }
    )
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [location.pathname])

  const scrollTo = useCallback((id: string) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const scrollToWaitlist = useCallback(() => {
    setMobileOpen(false)
    const el = document.getElementById('waitlist')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-white">
      {/* ── Sticky Navigation ──────────────────────────────────────────── */}
      <header
        className={[
          'sticky top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-lg shadow-black/20'
            : 'bg-transparent',
        ].join(' ')}
        role="banner"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          {/* Logo */}
          <a
            href={ROUTES.HOME}
            aria-label="Universe — go to home"
            className="group flex items-center gap-2.5 font-black text-xl tracking-tight text-white"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-sm font-black text-white shadow-lg shadow-primary-500/40"
              aria-hidden="true"
            >
              U
            </span>
            <span>Universe</span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={[
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200',
                  activeSection === id
                    ? 'text-white bg-white/10'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5',
                ].join(' ')}
                aria-current={activeSection === id ? 'page' : undefined}
              >
                {label}
              </button>
            ))}
            <a
              href={ROUTES.ABOUT}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              About
            </a>
          </nav>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={scrollToWaitlist}
              id="nav-join-waitlist"
              className="rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-sm font-bold px-4 py-2.5 shadow-lg shadow-primary-500/30 transition-all duration-200 hover:shadow-primary-500/50 hover:-translate-y-px active:translate-y-0"
            >
              Join Waitlist
            </button>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg transition-colors hover:bg-white/5"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              <span
                className={`h-0.5 w-5 rounded-full bg-zinc-300 transition-all duration-200 ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`}
              />
              <span
                className={`h-0.5 w-5 rounded-full bg-zinc-300 transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`h-0.5 w-5 rounded-full bg-zinc-300 transition-all duration-200 ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className={`md:hidden overflow-hidden transition-all duration-300 border-t border-white/10 bg-zinc-950/95 backdrop-blur-xl ${
            mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="flex flex-col px-5 py-4 gap-1">
            {NAV_SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-left rounded-lg px-3 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                {label}
              </button>
            ))}
            <a
              href={ROUTES.ABOUT}
              className="rounded-lg px-3 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              About
            </a>
            <button
              onClick={scrollToWaitlist}
              className="mt-2 w-full rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-sm font-bold px-4 py-3 transition-colors"
            >
              Join the Waitlist
            </button>
          </nav>
        </div>
      </header>

      {/* ── Page Content ────────────────────────────────────────────────── */}
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
