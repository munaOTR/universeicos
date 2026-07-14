import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSupabaseClient } from '@universe/database'
import { ROUTES } from '@universe/constants'
import { Button, Spinner, toast } from '@universe/ui'
import { useClipboard } from '@universe/hooks'
import type { User } from '@universe/types'

const CopyIcon = ({ copied }: { copied: boolean }) =>
  copied ? (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
    </svg>
  )

export function WaitlistSuccessPage() {
  const navigate = useNavigate()
  const { copied, copy } = useClipboard()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Not logged in (or just refreshed and session lost)
        navigate(ROUTES.WAITLIST)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (data) {
        setProfile(data as User)
      }
      setLoading(false)
    }

    fetchProfile()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50">
        <Spinner size="lg" className="text-primary-500 mb-4" />
        <p className="text-sm font-medium text-zinc-600">Loading your invite details...</p>
      </div>
    )
  }

  const referralUrl = profile?.referral_code
    ? `${window.location.origin}?ref=${profile.referral_code}`
    : window.location.origin

  const handleCopy = () => {
    copy(referralUrl)
    toast.success('Referral link copied!')
  }

  const shareText = encodeURIComponent(
    `I just joined Universe — the new campus super-app for Nigerian students! Sign up with my link to get early access 🚀\n${referralUrl}`
  )
  const shareTextTwitter = encodeURIComponent(
    `Just joined @Universe_NG — the OS for Nigerian students 🎓 Get early access here: ${referralUrl}`
  )

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Universe',
          text: 'I just joined Universe — the new campus super-app for Nigerian students! Sign up with my link to get early access 🚀',
          url: referralUrl,
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 p-4 py-12">
      <div className="w-full max-w-lg text-center space-y-6">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            You're on the list!
          </h1>
          <p className="text-zinc-600">
            Welcome to Universe, {profile?.full_name?.split(' ')[0] || 'student'}. 
            Your email has been verified.
          </p>
        </div>

        {/* Share Card */}
        <div className="rounded-2xl border border-primary-200 bg-white p-6 shadow-xl shadow-primary-900/5">
          <h2 className="text-lg font-bold text-primary-900 mb-2">Move up the line</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Share your unique invite link with friends. Every friend who joins using your link boosts your rank and earns you points.
          </p>

          <div className="flex items-center gap-2 bg-zinc-50 rounded-xl border border-zinc-200 px-3 py-3 mb-6">
            <span className="text-sm text-zinc-600 truncate flex-1 font-mono text-left select-all">
              {referralUrl}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 text-zinc-500 hover:text-primary-600 p-1"
            >
              <CopyIcon copied={copied} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <span className="text-xs font-semibold text-zinc-700">WhatsApp</span>
            </a>

            {/* X (Twitter) */}
            <a
              href={`https://twitter.com/intent/tweet?text=${shareTextTwitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 hover:border-black hover:bg-zinc-100 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </div>
              <span className="text-xs font-semibold text-zinc-700">X (Twitter)</span>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 hover:border-blue-600 hover:bg-blue-50 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <span className="text-xs font-semibold text-zinc-700">Facebook</span>
            </a>

            {/* Telegram / Native */}
            <button
              onClick={handleNativeShare}
              className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary-500 text-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </div>
              <span className="text-xs font-semibold text-zinc-700">Share...</span>
            </button>
          </div>
        </div>

        {/* Dashboard CTA */}
        <div className="pt-4">
          <Link to={ROUTES.DASHBOARD}>
            <Button size="lg" className="w-full sm:w-auto min-w-[240px]">
              Continue to Dashboard →
            </Button>
          </Link>
        </div>

      </div>
    </div>
  )
}
