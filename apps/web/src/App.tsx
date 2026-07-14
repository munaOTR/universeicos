import { useState } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge } from '@universe/ui'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-zinc-50 text-zinc-900 p-4 md:p-8 space-y-8">

      <div className="text-center space-y-2">
        <Badge variant="success" className="mb-2">Design System Live</Badge>
        <h1 className="text-4xl font-bold tracking-tight">Universe UI</h1>
        <p className="text-zinc-500">A live showcase of the Universe component library.</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Component Showcase</CardTitle>
          <CardDescription>Buttons, Inputs, and Badges — all styled with the Universe Design System.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Buttons */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Buttons</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setCount(c => c + 1)}>Primary ({count})</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Danger</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Inputs</p>
            <div className="space-y-2">
              <Input placeholder="Default input..." />
              <Input placeholder="Error state..." error />
              <p className="text-xs text-red-500">This field has an error.</p>
            </div>
          </div>

          {/* Badges */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Badges</p>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>

        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-xs text-zinc-400">Universe v1.0</span>
          <Button variant="link" size="sm">View docs</Button>
        </CardFooter>
      </Card>

    </div>
  )
}

export default App
