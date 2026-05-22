import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isLearnerActive = location.pathname === '/' || location.pathname.startsWith('/learn');
  const isAdminActive = location.pathname.startsWith('/admin');

  return (
    <nav
      aria-label="Primary navigation"
      className="bg-redex-black text-white min-h-14 flex items-center px-4 py-3 border-b border-white/10 sm:px-6"
    >
      <div className="flex w-full max-w-[1200px] flex-col gap-3 mx-auto sm:flex-row sm:items-center sm:justify-between">
        {/* Logo + Brand - matches the mockup header */}
        <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-redex-red flex items-center justify-center">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <span className="truncate font-semibold tracking-tight text-[15px]">Redex Academy</span>
          </div>
          <span className="hidden text-[10px] text-white/40 font-mono tracking-[1px] md:inline">Interactive UI Mockup - v3</span>
        </div>

        {/* Experience Toggle - now backed by real routes */}
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
            <span className="hidden sm:inline">Learner experience</span>
          </button>
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
            <span className="hidden sm:inline">Admin experience</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
