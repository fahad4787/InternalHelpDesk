export type AuthSlide = {
  id: string;
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  points: string[];
};

/** Edit this array to add, remove, or reorder auth left-panel slides. */
export const AUTH_SLIDES: AuthSlide[] = [
  {
    id: 'ai-chat',
    eyebrow: 'AI Chat',
    title: 'Ask once. Get the policy',
    accent: 'with proof.',
    description:
      'Employees type a question. Workhub answers from your uploaded documents and shows the citation.',
    points: [
      'Natural-language Q&A over company docs',
      'Source citations on every reply',
      'Built for handbooks, SOPs and guides',
    ],
  },
  {
    id: 'knowledge',
    eyebrow: 'Knowledge base',
    title: 'Your documents become the',
    accent: 'system of record.',
    description:
      'Upload, preview and manage policies so AI answers stay aligned with what leadership approved.',
    points: [
      'PDFs and docs in one place',
      'Grounded answers from approved content',
      'Less hunting through shared drives',
    ],
  },
  {
    id: 'integrations',
    eyebrow: 'Integrations',
    title: 'Connect the stack.',
    accent: 'Surface it on Home.',
    description:
      'Browse the marketplace, connect with OAuth, and pin live widgets from the apps you already pay for.',
    points: [
      'Jira, Slack, Zoom, Outlook and more',
      'Salesforce, Zoho CRM, Dynamics live',
      'Pin widgets the way your team works',
    ],
  },
  {
    id: 'home',
    eyebrow: 'Home',
    title: 'One command center for',
    accent: 'what needs attention.',
    description:
      'See tasks, meetings, mail and approvals in a dashboard you design — not empty chrome.',
    points: [
      'Live widgets from connected tools',
      'Focus on what matters today',
      'One workspace for the whole company',
    ],
  },
  {
    id: 'workspace',
    eyebrow: 'Workspaces',
    title: 'Secure company space,',
    accent: 'ready in minutes.',
    description:
      'Register, invite the team, keep each company isolated — SOC-ready workspaces without the setup grind.',
    points: [
      'Isolated tenants per company',
      'Admin controls for your org',
      'No credit card to start',
    ],
  },
];
