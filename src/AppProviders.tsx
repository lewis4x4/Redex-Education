import { Toaster } from 'sonner'
import { EducationProvider } from '@/contexts/EducationContext'
import { AuthProvider } from '@/hooks/use-auth'
import { useAuth } from '@/hooks/useAuth'
import App from './App.tsx'

function EducationProviderWithAuth() {
  const { user } = useAuth()

  return (
    <EducationProvider userId={user?.id ?? null}>
      <App />
      <Toaster position="top-center" richColors closeButton />
    </EducationProvider>
  )
}

export function AppProviders() {
  return (
    <AuthProvider>
      <EducationProviderWithAuth />
    </AuthProvider>
  )
}
