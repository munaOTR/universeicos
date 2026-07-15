import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Providers } from './providers'
import { router } from './router'
import './index.css'

import { ErrorBoundary } from '@universe/ui'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Ensure there is a <div id="root"> in index.html.')
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ErrorBoundary>
  </StrictMode>,
)
