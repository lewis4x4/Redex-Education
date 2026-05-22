import { cn } from '@/lib/utils';

interface TopNavProps {
  experience: 'learner' | 'admin';
  onExperienceChange: (exp: 'learner' | 'admin') => void;
}

export function TopNav({ experience, onExperienceChange }: TopNavProps) {
  return (
    <nav className="bg-[#08090b] text-white h-14 flex items-center px-6 border-b border-white/10">
      <div className="flex items-center justify-between w-full max-w-[1200px] mx-auto">
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#ed1f24] flex items-center justify-center">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <span className="font-semibold tracking-tight text-lg">Redex Academy</span>
          </div>
          <span className="text-[10px] text-white/40 font-mono tracking-widest">Interactive UI Mockup - v3</span>
        </div>

        {/* Experience Toggle - matches the provided mockup exactly */}
        <div className="flex items-center gap-1 bg-[#15161a] rounded-md p-1">
          <button
            onClick={() => onExperienceChange('learner')}
            className={cn(
              "px-4 py-1.5 text-sm rounded transition-all",
              experience === 'learner' 
                ? "bg-[#ed1f24] text-white font-medium shadow-sm" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            Learner experience
          </button>
          <button
            onClick={() => onExperienceChange('admin')}
            className={cn(
              "px-4 py-1.5 text-sm rounded transition-all",
              experience === 'admin' 
                ? "bg-[#ed1f24] text-white font-medium shadow-sm" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            Admin experience
          </button>
        </div>
      </div>
    </nav>
  );
}
