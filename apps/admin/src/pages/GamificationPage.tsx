import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@universe/database'

const supabase = getSupabaseClient()
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner } from '@universe/ui'
import { toast } from 'sonner'

export function GamificationPage() {
  const [badges, setBadges] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<any | null>(null)
  const [selectedReward, setSelectedReward] = useState<any | null>(null)

  const [rewardForm, setRewardForm] = useState({ name: '', description: '', points_required: 0, icon: '' })
  const [badgeForm, setBadgeForm] = useState({ name: '', description: '', image_url: '', criteria: '{}' })
  const [saving, setSaving] = useState(false)


  const loadData = useCallback(async () => {
    setLoading(true)
    const [badgesRes, rewardsRes] = await Promise.all([
      supabase.from('badges').select('*').order('created_at', { ascending: false }),
      supabase.from('rewards').select('*').order('points_required', { ascending: true })
    ])
    if (badgesRes.data) setBadges(badgesRes.data ?? [])
    if (rewardsRes.data) setRewards(rewardsRes.data ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { loadData() }, [loadData])
  // Reward actions
  const handleSaveReward = async () => {
    if (!rewardForm.name || !rewardForm.points_required) {
      toast.error('Name and points required are mandatory.')
      return
    }
    setSaving(true)
    const payload = {
      name: rewardForm.name,
      description: rewardForm.description,
      points_required: rewardForm.points_required,
      icon: rewardForm.icon || null
    }
    const { error } = selectedReward
      ? await supabase.from('rewards').update(payload).eq('id', selectedReward.id)
      : await supabase.from('rewards').insert(payload)

    if (error) toast.error('Error saving reward', { description: error.message })
    else {
      toast.success(selectedReward ? 'Reward updated' : 'Reward created')
      setShowRewardModal(false)
      loadData()
    }
    setSaving(false)
  }

  const handleDeleteReward = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return
    const { error } = await supabase.from('rewards').delete().eq('id', id)
    if (error) toast.error('Error deleting reward', { description: error.message })
    else { toast.success('Reward deleted'); loadData() }
  }

  // Badge actions
  const handleSaveBadge = async () => {
    if (!badgeForm.name || !badgeForm.description) {
      toast.error('Name and description are mandatory.')
      return
    }
    let parsedCriteria = {}
    try {
      parsedCriteria = JSON.parse(badgeForm.criteria)
    } catch {
      toast.error('Criteria must be valid JSON.')
      return
    }

    setSaving(true)
    const payload = {
      name: badgeForm.name,
      description: badgeForm.description,
      image_url: badgeForm.image_url || null,
      criteria: parsedCriteria
    }

    const { error } = selectedBadge
      ? await supabase.from('badges').update(payload).eq('id', selectedBadge.id)
      : await supabase.from('badges').insert(payload)

    if (error) toast.error('Error saving badge', { description: error.message })
    else {
      toast.success(selectedBadge ? 'Badge updated' : 'Badge created')
      setShowBadgeModal(false)
      loadData()
    }
    setSaving(false)
  }

  const handleDeleteBadge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this badge?')) return
    const { error } = await supabase.from('badges').delete().eq('id', id)
    if (error) toast.error('Error deleting badge', { description: error.message })
    else { toast.success('Badge deleted'); loadData() }
  }

  const openRewardModal = (reward?: any) => {
    setSelectedReward(reward || null)
    setRewardForm({
      name: reward?.name || '',
      description: reward?.description || '',
      points_required: reward?.points_required || 0,
      icon: reward?.icon || ''
    })
    setShowRewardModal(true)
  }

  const openBadgeModal = (badge?: any) => {
    setSelectedBadge(badge || null)
    setBadgeForm({
      name: badge?.name || '',
      description: badge?.description || '',
      image_url: badge?.image_url || '',
      criteria: badge?.criteria ? JSON.stringify(badge.criteria, null, 2) : '{\n  "min_referrals": 5\n}'
    })
    setShowBadgeModal(true)
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Gamification Engine</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage badges, rewards, and milestone criteria.</p>
      </div>
      
      {/* Rewards Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-800">Rewards ({rewards.length})</h2>
          <Button size="sm" onClick={() => openRewardModal()}>Add Reward</Button>
        </div>
        
        {rewards.length === 0 ? (
          <Card className="border-dashed bg-zinc-50 text-center py-12">
            <p className="text-sm text-zinc-500">No rewards configured yet. They will appear in the dashboard automatically once created.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map(reward => (
              <Card key={reward.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{reward.name}</CardTitle>
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                      {reward.points_required} pts
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-500 line-clamp-2">{reward.description}</p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => openRewardModal(reward)}>Edit</Button>
                    <Button size="sm" variant="destructive" className="w-full" onClick={() => handleDeleteReward(reward.id)}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Badges Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-800">Badges ({badges.length})</h2>
          <Button size="sm" onClick={() => openBadgeModal()}>Add Badge</Button>
        </div>
        
        {badges.length === 0 ? (
          <Card className="border-dashed bg-zinc-50 text-center py-12">
            <p className="text-sm text-zinc-500">No badges configured yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {badges.map(badge => (
              <Card key={badge.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{badge.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-500 line-clamp-2">{badge.description}</p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => openBadgeModal(badge)}>Edit</Button>
                    <Button size="sm" variant="destructive" className="w-full" onClick={() => handleDeleteBadge(badge.id)}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader><CardTitle>{selectedReward ? 'Edit Reward' : 'New Reward'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input className="w-full border p-2 rounded mt-1" value={rewardForm.name} onChange={e => setRewardForm({...rewardForm, name: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea className="w-full border p-2 rounded mt-1" value={rewardForm.description} onChange={e => setRewardForm({...rewardForm, description: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Points Required</label>
                <input type="number" className="w-full border p-2 rounded mt-1" value={rewardForm.points_required} onChange={e => setRewardForm({...rewardForm, points_required: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-sm font-medium">Icon URL (optional)</label>
                <input className="w-full border p-2 rounded mt-1" value={rewardForm.icon} onChange={e => setRewardForm({...rewardForm, icon: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowRewardModal(false)}>Cancel</Button>
                <Button onClick={handleSaveReward} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showBadgeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader><CardTitle>{selectedBadge ? 'Edit Badge' : 'New Badge'}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input className="w-full border p-2 rounded mt-1" value={badgeForm.name} onChange={e => setBadgeForm({...badgeForm, name: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea className="w-full border p-2 rounded mt-1" value={badgeForm.description} onChange={e => setBadgeForm({...badgeForm, description: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Criteria (JSON format)</label>
                <textarea className="w-full border p-2 rounded mt-1 font-mono text-sm h-24" value={badgeForm.criteria} onChange={e => setBadgeForm({...badgeForm, criteria: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Image URL (optional)</label>
                <input className="w-full border p-2 rounded mt-1" value={badgeForm.image_url} onChange={e => setBadgeForm({...badgeForm, image_url: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowBadgeModal(false)}>Cancel</Button>
                <Button onClick={handleSaveBadge} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
