import type { AdminDashboardSummary } from '@/lib/education';

export const MOCK_ADMIN_SUMMARY: AdminDashboardSummary = {
  metrics: {
    drafts: 3,
    needs_review: 1,
    published: 5,
    learners_in_progress: 14,
  },
  drafts: [
    {
      id: 'mod-draft-001',
      title: 'Field Safety Refresher',
      status: 'Draft',
      meta: 'Updated 2 hours ago',
    },
    {
      id: 'mod-draft-002',
      title: 'Customer Service Standards',
      status: 'Draft',
      meta: 'Updated yesterday',
    },
    {
      id: 'mod-draft-003',
      title: 'New Hire Tools Walkthrough',
      status: 'Draft',
      meta: 'Updated 3 days ago',
    },
  ],
  needs_review: [
    {
      id: 'mod-review-001',
      title: 'HR Onboarding — Pilot Module',
      status: 'Needs review',
      meta: 'Awaiting HR sign-off',
    },
  ],
  published: [
    {
      id: 'mod-published-001',
      title: 'Redex Academy Orientation',
      status: 'Published',
      meta: 'Published 1 week ago',
    },
    {
      id: 'mod-published-002',
      title: 'Safety 101 Acknowledgment',
      status: 'Published',
      meta: 'Published 3 weeks ago',
    },
    {
      id: 'mod-published-003',
      title: 'Time & Attendance Basics',
      status: 'Published',
      meta: 'Published 1 month ago',
    },
    {
      id: 'mod-published-004',
      title: 'Equipment Care Essentials',
      status: 'Published',
      meta: 'Published 2 months ago',
    },
    {
      id: 'mod-published-005',
      title: 'Communication Standards',
      status: 'Published',
      meta: 'Published 2 months ago',
    },
  ],
  assignment_summary: {
    active_assignments: 14,
    overdue: 2,
    completion_rate_percent: 78,
  },
};
