import { cn } from '@/lib/utils';

interface TopNavProps {
  experience: 'learner' | 'admin';
  onExperienceChange: (exp: 'learner' | 'admin') => void;
}

export function TopNav({ experience, onExperienceChange }: TopNavProps) {
  return (
    <nav className="bg-[#08090b] text-white h-14 flex items-center px-6 border-b border-white/10">
      <div className="flex items-center justify-between w-full max-w-[1200px] mx-auto">
        {/* Logo + Brand - matches the mockup header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#e11d48] flex items-center justify-center">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <span className="font-semibold tracking-tight text-[15px]">Redex Academy</span>
          </div>
          <span className="text-[10px] text-white/40 font-mono tracking-[1px]">Interactive UI Mockup - v3</span>
        </div>

        {/* Experience Toggle - clean segmented control like the mockup */}
        <div className="flex items-center gap-1 bg-[#15161a] rounded-xl p-1 text-sm">
          <button
            onClick={() => onExperienceChange('learner')}
            className={cn(
              "px-5 py-1 rounded-lg transition-all",
              experience === 'learner' 
                ? "bg-[#e11d48] text-white font-medium" 
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            Learner experience
          </button>
          <button
            onClick={() => onExperienceChange('admin')}
            className={cn(
              "px-5 py-1 rounded-lg transition-all",
              experience === 'admin' 
                ? "bg-[#e11d48] text-white font-medium" 
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            Admin experience
          </button>
        </div>
      </div>
    </nav>
  );
}
