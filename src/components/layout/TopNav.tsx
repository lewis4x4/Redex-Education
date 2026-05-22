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
      className="bg-redex-black text-white h-14 flex items-center px-6 border-b border-white/10"
    >
      <div className="flex items-center justify-between w-full max-w-[1200px] mx-auto">
        {/* Logo + Brand - matches the mockup header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-redex-red flex items-center justify-center">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <span className="font-semibold tracking-tight text-[15px]">Redex Academy</span>
          </div>
          <span className="text-[10px] text-white/40 font-mono tracking-[1px]">Interactive UI Mockup - v3</span>
        </div>

        {/* Experience Toggle - now backed by real routes */}
        <div className="flex items-center gap-1 bg-[#15161a] rounded-xl p-1 text-sm">
          <button
            type="button"
            aria-pressed={isLearnerActive}
            onClick={() => navigate('/learn')}
            className={cn(
              'px-5 py-1 rounded-lg transition-all',
              isLearnerActive
                ? 'bg-redex-red text-white font-medium'
                : 'text-white/60 hover:text-white hover:bg-white/10',
            )}
          >
            Learner experience
          </button>
          <button
            type="button"
            aria-pressed={isAdminActive}
            onClick={() => navigate('/admin')}
            className={cn(
              'px-5 py-1 rounded-lg transition-all',
              isAdminActive
                ? 'bg-redex-red text-white font-medium'
                : 'text-white/60 hover:text-white hover:bg-white/10',
            )}
          >
            Admin experience
          </button>
        </div>
      </div>
    </nav>
  );
}
