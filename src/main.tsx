import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/hooks/use-auth'
import { EducationProvider } from '@/contexts/EducationContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EducationProvider>
          <App />
          <Toaster position="top-center" richColors closeButton />
        </EducationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
