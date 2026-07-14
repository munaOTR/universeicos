import { ROUTES } from '@universe/constants'
import {
  NewTwitterIcon,
  InstagramIcon,
  Linkedin01Icon,
} from 'hugeicons-react'

export function FooterSection() {
  return (
    <footer className="bg-zinc-950 border-t border-white/10 pt-16 pb-8 px-5">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-black text-xl text-white mb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary-500 text-[10px] text-white">U</span>
              Universe
            </div>
            <p className="text-zinc-400 text-sm max-w-xs mb-6">
              The operating system for Nigerian university students. Connect, study, buy, sell, and thrive.
            </p>
            <div className="flex gap-4 text-zinc-500">
              <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">
                <NewTwitterIcon className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin01Icon className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#roadmap" className="hover:text-white transition-colors">Roadmap</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href={ROUTES.ABOUT} className="hover:text-white transition-colors">About Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><a href={ROUTES.PRIVACY} className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href={ROUTES.TERMS} className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><a href="mailto:hello@universeicos.app" className="hover:text-white transition-colors">hello@universeicos.app</a></li>
              <li><a href="mailto:support@universeicos.app" className="hover:text-white transition-colors">support@universeicos.app</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Universe Technologies. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Built with passion in Nigeria 🇳🇬</p>
        </div>
      </div>
    </footer>
  )
}

