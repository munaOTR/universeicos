import { useAuth } from '@universe/auth'
import { useProfile } from '../../hooks/queries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input } from '@universe/ui'

export function ProfilePage() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile(user?.id)

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-48 bg-zinc-100 rounded-xl"></div>
      <div className="h-64 bg-zinc-100 rounded-xl"></div>
    </div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Profile</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your public information and university details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your photo and personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6 pb-6 border-b border-zinc-100">
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">
              {profile?.full_name?.slice(0, 2).toUpperCase() || '??'}
            </div>
            <div>
              <Button variant="outline" size="sm" className="mb-2">Change Avatar</Button>
              <p className="text-xs text-zinc-500">JPG, GIF or PNG. Max size of 800K.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Full Name</label>
              <Input defaultValue={profile?.full_name || ''} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Email Address</label>
              <Input defaultValue={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Phone Number</label>
              <Input defaultValue={profile?.phone || ''} placeholder="+234..." />
            </div>
          </div>
          
          <div className="pt-4">
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Information</CardTitle>
          <CardDescription>Your university affiliation and study details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">University</label>
              <Input defaultValue={profile?.university || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Graduation Year</label>
              <Input defaultValue={profile?.graduation_year || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Faculty</label>
              <Input defaultValue={profile?.faculty || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Department</label>
              <Input defaultValue={profile?.department || ''} disabled />
            </div>
          </div>
          <p className="text-xs text-zinc-500 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            Academic information is currently locked while we verify your student status. Contact support if you need to make changes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
