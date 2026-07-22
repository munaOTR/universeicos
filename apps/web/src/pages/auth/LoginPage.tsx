import { LoginForm } from '@universe/auth'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@universe/constants'

export function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Sign in to your account</h1>
        <p className="mt-2 text-sm text-zinc-600">Welcome back to Universe</p>
      </div>
      <LoginForm onSuccess={() => navigate(ROUTES.DASHBOARD)} />
    </div>
  )
}
