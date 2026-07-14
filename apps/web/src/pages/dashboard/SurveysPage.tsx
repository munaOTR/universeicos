import { Card, CardContent } from '@universe/ui'
import { Message01Icon } from 'hugeicons-react'

export function SurveysPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Surveys</h1>
        <p className="text-sm text-zinc-500 mt-1">Help shape Universe and earn points.</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <div className="h-16 w-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Message01Icon size={32} />
          </div>
          <h2 className="text-lg font-bold text-zinc-900">No available surveys</h2>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto">
            You're all caught up! We'll notify you when new surveys are available to earn more points.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
