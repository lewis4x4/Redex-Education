import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LearnerWelcomePage } from '@/features/learner/pages/LearnerWelcomePage'

// Redex Academy - Active Build
// Slice 0.2 + Slice 1.1 in progress
// Experience toggle is now live in the TopNav (matching the v3 mockup)

function LearnerExperience({ experience, onExperienceChange }: { 
  experience: 'learner' | 'admin'; 
  onExperienceChange: (exp: 'learner' | 'admin') => void;
}) {
  return (
    <AppShell 
      experience={experience} 
      onExperienceChange={onExperienceChange}
      breadcrumb="Learner flow › First-day welcome"
    >
      <LearnerWelcomePage />
    </AppShell>
  )
}

function AdminExperience({ experience, onExperienceChange }: { 
  experience: 'learner' | 'admin'; 
  onExperienceChange: (exp: 'learner' | 'admin') => void;
}) {
  return (
    <AppShell 
      experience={experience} 
      onExperienceChange={onExperienceChange}
      breadcrumb="Admin flow › Course Foundry"
    >
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h1 className="text-3xl font-semibold mb-3">Redex AI Course Foundry</h1>
        <p className="text-[#6b7280]">Admin creation tools coming in the next slices.</p>
        <p className="text-xs text-[#6b7280] mt-4">Click "Learner experience" in the header to return to the welcome mockup.</p>
      </div>
    </AppShell>
  )
}

export default function App() {
  const [experience, setExperience] = useState<'learner' | 'admin'>('learner')

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            experience === 'learner' 
              ? <LearnerExperience experience={experience} onExperienceChange={setExperience} /> 
              : <AdminExperience experience={experience} onExperienceChange={setExperience} />
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}
