import React from 'react';
import { TopNav } from './TopNav';
import { BreadcrumbBar } from './BreadcrumbBar';

interface AppShellProps {
  children: React.ReactNode;
  experience: 'learner' | 'admin';
  onExperienceChange: (exp: 'learner' | 'admin') => void;
  breadcrumb?: string;
}

export function AppShell({ 
  children, 
  experience, 
  onExperienceChange,
  breadcrumb 
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#09090b]">
      <TopNav 
        experience={experience} 
        onExperienceChange={onExperienceChange} 
      />
      
      {breadcrumb && <BreadcrumbBar text={breadcrumb} />}
      
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
