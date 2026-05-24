import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/training'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  foundry_author: 'Foundry Author',
  manager: 'Manager',
  learner: 'Learner',
}

function getInitials(email: string): string {
  const [localPart = 'U'] = email.split('@')
  const parts = localPart.split(/[._-]/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
  }

  return localPart.slice(0, 2).toUpperCase()
}

function getDisplayName(email: string): string {
  const [localPart = email] = email.split('@')
  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}

export function TopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, signOut } = useAuth()

  const isLearnerActive = location.pathname === '/' || location.pathname.startsWith('/learn')
  const isAdminActive = location.pathname.startsWith('/admin')
  const isManagerActive = location.pathname.startsWith('/manager')
  const canSeeAdmin = role === 'admin' || role === 'foundry_author'
  const canSeeManager = role === 'admin' || role === 'manager'
  const userEmail = user?.email ?? ''
  const roleLabel = role ? ROLE_LABELS[role] : 'Signed in'

  async function handleSignOut() {
    await signOut()
    navigate('/sign-in')
  }

  return (
    <nav
      aria-label="Primary navigation"
      className="bg-redex-black text-white min-h-14 flex items-center px-4 py-3 border-b border-white/10 sm:px-6"
    >
      <div className="flex w-full max-w-[1200px] flex-col gap-3 mx-auto lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-3 lg:justify-start">
          <button className="flex items-center gap-2 text-left" onClick={() => navigate('/learn')} type="button">
            <div className="w-6 h-6 rounded bg-redex-red flex items-center justify-center" aria-hidden="true">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <span className="truncate font-semibold tracking-tight text-[15px]">Redex Academy</span>
          </button>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:w-auto lg:justify-end">
          <div className="flex w-full items-center gap-1 bg-[#15161a] rounded-xl p-1 text-sm sm:w-auto">
            <button
              type="button"
              aria-pressed={isLearnerActive}
              onClick={() => navigate('/learn')}
              className={cn(
                'flex-1 px-3 py-1 rounded-lg transition-all sm:flex-none sm:px-5',
                isLearnerActive
                  ? 'bg-redex-red text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/10',
              )}
            >
              <span className="sm:hidden">Learner</span>
              <span className="hidden sm:inline">Academy</span>
            </button>

            {canSeeManager ? (
              <button
                type="button"
                aria-pressed={isManagerActive}
                onClick={() => navigate('/manager')}
                className={cn(
                  'flex-1 px-3 py-1 rounded-lg transition-all sm:flex-none sm:px-5',
                  isManagerActive
                    ? 'bg-redex-red text-white font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/10',
                )}
              >
                <span className="sm:hidden">Manager</span>
                <span className="hidden sm:inline">Team</span>
              </button>
            ) : null}

            {canSeeAdmin ? (
              <button
                type="button"
                aria-pressed={isAdminActive}
                onClick={() => navigate('/admin')}
                className={cn(
                  'flex-1 px-3 py-1 rounded-lg transition-all sm:flex-none sm:px-5',
                  isAdminActive
                    ? 'bg-redex-red text-white font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/10',
                )}
              >
                <span className="sm:hidden">Admin</span>
                <span className="hidden sm:inline">Foundry</span>
              </button>
            ) : null}
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-end gap-3 rounded-xl px-2 py-1 text-left transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:min-w-48"
                  type="button"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-9 w-9 border border-white/20">
                    <AvatarFallback className="bg-redex-red text-xs font-semibold text-white">
                      {getInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden min-w-0 flex-1 sm:block">
                    <span className="block truncate text-sm font-medium">{getDisplayName(userEmail)}</span>
                    <span className="mt-0.5 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                      {roleLabel}
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="space-y-1">
                  <span className="block truncate text-sm font-medium">{userEmail}</span>
                  <span className="inline-flex rounded-full bg-redex-red/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-redex-red">
                    {roleLabel}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-redex-red focus:text-redex-red" onSelect={() => void handleSignOut()}>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
