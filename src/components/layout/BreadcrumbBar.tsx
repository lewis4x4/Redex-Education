

interface BreadcrumbBarProps {
  text: string;
}

export function BreadcrumbBar({ text }: BreadcrumbBarProps) {
  return (
    <div className="border-b bg-white/70 backdrop-blur-sm">
      <div className="max-w-[1200px] mx-auto px-6 py-2 text-sm text-[#6b7280]">
        {text}
      </div>
    </div>
  );
}
