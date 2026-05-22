import React from 'react';
import { TopNav } from './TopNav';
import { BreadcrumbBar } from './BreadcrumbBar';

interface AppShellProps {
  children: React.ReactNode;
  breadcrumb?: string;
  playerMode?: boolean; // when true, relaxes constraints so ModulePlayer can take full available space
}

export function AppShell({ 
  children, 
  breadcrumb,
  playerMode = false,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#09090b]">
      <TopNav />

      {breadcrumb && <BreadcrumbBar text={breadcrumb} />}

      <main
        className={
          playerMode
            ? 'max-w-none px-3 py-2'
            : 'max-w-[1200px] mx-auto px-6 py-8'
        }
      >
        {children}
      </main>
    </div>
  );
}
