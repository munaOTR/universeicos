import { WaitlistForm } from '../../components/WaitlistForm'

export function WaitlistPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 p-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Join the Universe
          </h1>
          <p className="mt-2 text-zinc-500">
            Sign up for the waitlist to get early access to the ultimate campus operating system.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <WaitlistForm />
        </div>
      </div>
    </div>
  )
}
