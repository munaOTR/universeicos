import { Outlet, Link } from 'react-router-dom'
import { ROUTES } from '@universe/constants'

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 sm:justify-center sm:py-12">
      <div className="relative py-3 sm:mx-auto sm:max-w-xl w-full px-4 sm:px-0">
        
        {/* Logo */}
        <div className="mb-8 text-center sm:mb-12">
          <Link to={ROUTES.HOME} className="text-2xl font-bold text-primary-600">
            Universe
          </Link>
        </div>

        {/* Auth Card Content */}
        <div className="relative bg-white px-6 py-8 shadow-soft sm:rounded-xl sm:px-12 sm:py-10 border border-zinc-200">
          <Outlet />
        </div>
        
        {/* Footer links */}
        <div className="mt-8 text-center text-sm text-zinc-500 flex justify-center gap-4">
           <Link to={ROUTES.PRIVACY} className="hover:text-zinc-900 transition-colors">Privacy</Link>
           <span>&middot;</span>
           <Link to={ROUTES.TERMS} className="hover:text-zinc-900 transition-colors">Terms</Link>
        </div>
      </div>
    </div>
  )
}
