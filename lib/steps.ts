export interface MgrClient {
  id: string
  name: string
  business_name: string
  client_email: string
  domain: string
  mgr_project_slug: string
  mgr_secret_key: string
  mgr_id?: number          // numeric MGR project id — required for API writes
  website?: string
  brand_color?: string
  steps_completed: Record<string, boolean>
  notes: string
  created_at: string
  updated_at: string
}

export interface Step {
  id: string
  label: string
  description: string
  mgrPath: (slug: string) => string
  copyValue?: (client: MgrClient) => string
  copyLabel?: string
  slugInput?: boolean // step 1 only — needs slug pasted back
}

const BASE = process.env.NEXT_PUBLIC_MGR_BASE_URL ?? 'https://testimonials.msplaunchpad.com'
const CNAME_TARGET = process.env.NEXT_PUBLIC_MGR_CNAME_TARGET ?? 'reviews.msplaunchpad.com'

export const STEPS: Step[] = [
  {
    id: 'project_created',
    label: 'Create Project',
    description: 'Create a new project for this client in MGR. Paste the project slug back here.',
    mgrPath: () => `${BASE}/projects/create`,
    copyValue: (c) => c.business_name,
    copyLabel: 'Business Name',
    slugInput: true,
  },
  {
    id: 'samples_removed',
    label: 'Remove Sample Reviews',
    description: 'Open the reviews page and delete all sample/demo reviews.',
    mgrPath: (slug) => `${BASE}/projects/${slug}/reviews`,
  },
  {
    id: 'domain_configured',
    label: 'Set Custom Domain',
    description: 'Add a CNAME record for the client domain pointing to MGR.',
    mgrPath: (slug) => `${BASE}/projects/${slug}/settings/domain`,
    copyValue: () => CNAME_TARGET,
    copyLabel: 'CNAME Target',
  },
  {
    id: 'review_page_configured',
    label: 'Configure Review Page',
    description: 'Set the review page title, body text, and T&C URL.',
    mgrPath: (slug) => `${BASE}/projects/${slug}/settings`,
    copyValue: (c) => `Share your experience with ${c.business_name}`,
    copyLabel: 'Review Page Title',
  },
  {
    id: 'appearance_set',
    label: 'Appearance & Branding',
    description: 'Upload the client logo and configure brand colours.',
    mgrPath: (slug) => `${BASE}/projects/${slug}/settings/appearance`,
  },
  {
    id: 'email_configured',
    label: 'Email Settings',
    description: 'Set from name and reply-to email address.',
    mgrPath: (slug) => `${BASE}/projects/${slug}/settings/email`,
    copyValue: (c) => c.client_email,
    copyLabel: 'Reply-To Email',
  },
  {
    id: 'strategy_set',
    label: 'Review Strategy',
    description: 'Configure the review request flow and timing.',
    mgrPath: (slug) => `${BASE}/projects/${slug}/settings/strategy`,
  },
  {
    id: 'location_added',
    label: 'Add Business Location',
    description: 'Add the client\'s business location(s).',
    mgrPath: (slug) => `${BASE}/projects/${slug}/locations/create`,
    copyValue: (c) => c.business_name,
    copyLabel: 'Business Name',
  },
]
