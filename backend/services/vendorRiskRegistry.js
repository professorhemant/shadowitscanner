'use strict';

// Static vendor registry — legal entity, jurisdiction, certifications, privacy policy.
// Data sourced from public trust centers / privacy policies (accurate as of 2025).
// Match by lower-cased app_name or developer substring patterns.

const VENDORS = [
  // ── Google ────────────────────────────────────────────────────────────────
  { patterns: [/^google/i, /gmail/i, /google drive/i, /google meet/i, /google analytics/i, /google sheets/i, /google docs/i, /google calendar/i, /google cloud/i, /firebase/i, /gemini/i],
    legal_entity: 'Google LLC', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU', 'APAC'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'ISO 27017', 'ISO 27018', 'GDPR DPA'],
  },
  // ── Microsoft ────────────────────────────────────────────────────────────
  { patterns: [/^microsoft/i, /azure/i, /office 365/i, /teams/i, /onedrive/i, /sharepoint/i, /outlook/i, /copilot/i],
    legal_entity: 'Microsoft Corporation', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: true,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU', 'APAC'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP', 'GDPR DPA', 'HIPAA BAA'],
  },
  // ── Slack / Salesforce ───────────────────────────────────────────────────
  { patterns: [/^slack$/i, /^slack /i],
    legal_entity: 'Slack Technologies LLC (Salesforce)', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-09', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'GDPR DPA'],
  },
  { patterns: [/^salesforce/i],
    legal_entity: 'Salesforce Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: true,
    privacy_policy_date: '2024-03', data_centers: ['US', 'EU', 'APAC'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP', 'GDPR DPA', 'HIPAA BAA'],
  },
  // ── Atlassian ────────────────────────────────────────────────────────────
  { patterns: [/^atlassian/i, /^jira/i, /^confluence/i, /^trello/i, /^bitbucket/i],
    legal_entity: 'Atlassian Pty Ltd', hq_country: 'AU', hq_region: 'APAC',
    soc2: true, iso27001: true, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU', 'APAC'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'GDPR DPA'],
  },
  // ── GitHub ───────────────────────────────────────────────────────────────
  { patterns: [/^github/i],
    legal_entity: 'GitHub Inc. (Microsoft)', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: true,
    privacy_policy_date: '2024-02', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP', 'GDPR DPA'],
  },
  // ── OpenAI / ChatGPT ─────────────────────────────────────────────────────
  { patterns: [/^openai/i, /^chatgpt/i],
    legal_entity: 'OpenAI OpCo LLC', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-04', data_centers: ['US'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
    notes: 'Training data opt-out required for API; ChatGPT uses conversations for training by default.',
  },
  // ── Anthropic / Claude ───────────────────────────────────────────────────
  { patterns: [/^anthropic/i, /^claude$/i, /^claude /i],
    legal_entity: 'Anthropic PBC', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-03', data_centers: ['US'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Notion ───────────────────────────────────────────────────────────────
  { patterns: [/^notion/i, /notion labs/i],
    legal_entity: 'Notion Labs Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-11', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Zoom ─────────────────────────────────────────────────────────────────
  { patterns: [/^zoom/i],
    legal_entity: 'Zoom Video Communications Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: true,
    privacy_policy_date: '2024-05', data_centers: ['US', 'EU', 'APAC'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP', 'GDPR DPA', 'HIPAA BAA'],
    notes: 'HQ is US but has significant R&D in China. Data stored on US/EU servers by default.',
  },
  // ── Dropbox ──────────────────────────────────────────────────────────────
  { patterns: [/^dropbox/i],
    legal_entity: 'Dropbox Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-07', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'GDPR DPA'],
  },
  // ── Box ───────────────────────────────────────────────────────────────────
  { patterns: [/^box\.com/i, /^box inc/i, /^box$/i],
    legal_entity: 'Box Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: true,
    privacy_policy_date: '2024-02', data_centers: ['US', 'EU', 'APAC'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP', 'GDPR DPA', 'HIPAA BAA'],
  },
  // ── HubSpot ──────────────────────────────────────────────────────────────
  { patterns: [/^hubspot/i],
    legal_entity: 'HubSpot Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Zendesk ───────────────────────────────────────────────────────────────
  { patterns: [/^zendesk/i],
    legal_entity: 'Zendesk Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-09', data_centers: ['US', 'EU', 'APAC'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'GDPR DPA'],
  },
  // ── Intercom ──────────────────────────────────────────────────────────────
  { patterns: [/^intercom/i],
    legal_entity: 'Intercom R&D Unlimited Company', hq_country: 'IE', hq_region: 'Europe',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Asana ─────────────────────────────────────────────────────────────────
  { patterns: [/^asana/i],
    legal_entity: 'Asana Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-12', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Monday.com ────────────────────────────────────────────────────────────
  { patterns: [/^monday\.com/i, /monday\.com/i],
    legal_entity: 'monday.com Ltd.', hq_country: 'IL', hq_region: 'Middle East',
    soc2: true, iso27001: true, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'GDPR DPA'],
  },
  // ── Figma ─────────────────────────────────────────────────────────────────
  { patterns: [/^figma/i],
    legal_entity: 'Figma Inc. (Adobe)', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-02', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Canva ─────────────────────────────────────────────────────────────────
  { patterns: [/^canva/i],
    legal_entity: 'Canva Pty Ltd', hq_country: 'AU', hq_region: 'APAC',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-11', data_centers: ['US', 'EU', 'APAC'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Okta ──────────────────────────────────────────────────────────────────
  { patterns: [/^okta/i],
    legal_entity: 'Okta Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: true,
    privacy_policy_date: '2024-03', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP', 'GDPR DPA', 'HIPAA BAA'],
  },
  // ── Workday ───────────────────────────────────────────────────────────────
  { patterns: [/^workday/i],
    legal_entity: 'Workday Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: true,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP', 'GDPR DPA', 'HIPAA BAA'],
  },
  // ── Rippling ──────────────────────────────────────────────────────────────
  { patterns: [/^rippling/i],
    legal_entity: 'Rippling People Center Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-08', data_centers: ['US'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Gusto ─────────────────────────────────────────────────────────────────
  { patterns: [/^gusto/i],
    legal_entity: 'Gusto Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: false, fedramp: false,
    privacy_policy_date: '2023-06', data_centers: ['US'],
    certifications: ['SOC 2 Type II'],
  },
  // ── BambooHR ──────────────────────────────────────────────────────────────
  { patterns: [/^bamboo/i],
    legal_entity: 'BambooHR LLC', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-05', data_centers: ['US'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Expensify ─────────────────────────────────────────────────────────────
  { patterns: [/^expensify/i],
    legal_entity: 'Expensify Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-03', data_centers: ['US'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
    notes: 'All expense receipts stored on US servers; vendor has had past privacy controversies.',
  },
  // ── Ramp ──────────────────────────────────────────────────────────────────
  { patterns: [/^ramp/i],
    legal_entity: 'Ramp Business Corporation', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: false, fedramp: false,
    privacy_policy_date: '2023-09', data_centers: ['US'],
    certifications: ['SOC 2 Type II'],
  },
  // ── Stripe ────────────────────────────────────────────────────────────────
  { patterns: [/^stripe/i],
    legal_entity: 'Stripe Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-04', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'PCI DSS Level 1', 'GDPR DPA'],
  },
  // ── Perplexity AI ─────────────────────────────────────────────────────────
  { patterns: [/^perplexity/i],
    legal_entity: 'Perplexity AI Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: false, iso27001: false, gdpr: false, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US'],
    certifications: [],
    notes: 'No SOC 2 or GDPR DPA as of 2025. Data may be used for training.',
  },
  // ── Midjourney ────────────────────────────────────────────────────────────
  { patterns: [/^midjourney/i],
    legal_entity: 'Midjourney Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: false, iso27001: false, gdpr: false, fedramp: false,
    privacy_policy_date: '2023-02', data_centers: ['US'],
    certifications: [],
    notes: 'All generated images and prompts stored; no enterprise data processing agreement.',
  },
  // ── ClickUp ───────────────────────────────────────────────────────────────
  { patterns: [/^clickup/i, /mango technologies/i],
    legal_entity: 'Mango Technologies Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-10', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Linear ────────────────────────────────────────────────────────────────
  { patterns: [/^linear$/i, /^linear /i],
    legal_entity: 'Linear Orbit Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-12', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Vercel ────────────────────────────────────────────────────────────────
  { patterns: [/^vercel/i],
    legal_entity: 'Vercel Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Netlify ───────────────────────────────────────────────────────────────
  { patterns: [/^netlify/i],
    legal_entity: 'Netlify Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-07', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Datadog ───────────────────────────────────────────────────────────────
  { patterns: [/^datadog/i],
    legal_entity: 'Datadog Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: true,
    privacy_policy_date: '2024-02', data_centers: ['US', 'EU', 'APAC'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP', 'GDPR DPA', 'HIPAA BAA'],
  },
  // ── Sentry ────────────────────────────────────────────────────────────────
  { patterns: [/^sentry/i],
    legal_entity: 'Functional Software Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-10', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── PagerDuty ─────────────────────────────────────────────────────────────
  { patterns: [/^pagerduty/i],
    legal_entity: 'PagerDuty Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: true,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP', 'GDPR DPA'],
  },
  // ── Mailchimp / Intuit ────────────────────────────────────────────────────
  { patterns: [/^mailchimp/i, /^intuit/i],
    legal_entity: 'Intuit Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-12', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Postman ───────────────────────────────────────────────────────────────
  { patterns: [/^postman/i],
    legal_entity: 'Postdot Technologies Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Supabase ──────────────────────────────────────────────────────────────
  { patterns: [/^supabase/i],
    legal_entity: 'Supabase Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU', 'APAC'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Mixpanel ──────────────────────────────────────────────────────────────
  { patterns: [/^mixpanel/i],
    legal_entity: 'Mixpanel Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-09', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Amplitude ─────────────────────────────────────────────────────────────
  { patterns: [/^amplitude/i],
    legal_entity: 'Amplitude Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-11', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Pipedrive ─────────────────────────────────────────────────────────────
  { patterns: [/^pipedrive/i],
    legal_entity: 'Pipedrive OÜ', hq_country: 'EE', hq_region: 'Europe',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Freshworks ────────────────────────────────────────────────────────────
  { patterns: [/^freshworks/i, /^freshdesk/i, /^freshservice/i],
    legal_entity: 'Freshworks Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-08', data_centers: ['US', 'EU', 'APAC', 'IN'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'GDPR DPA'],
    notes: 'Engineering based in India (Chennai). Data can be stored in India region.',
  },
  // ── Apollo.io ─────────────────────────────────────────────────────────────
  { patterns: [/^apollo\.io/i, /^apollo/i],
    legal_entity: 'Apollo.io Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-07', data_centers: ['US'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
    notes: 'Aggregates third-party contact data. Review data provenance for GDPR compliance.',
  },
  // ── Outreach ──────────────────────────────────────────────────────────────
  { patterns: [/^outreach/i],
    legal_entity: 'Outreach Corporation', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-10', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Gamma ─────────────────────────────────────────────────────────────────
  { patterns: [/^gamma/i],
    legal_entity: 'Gamma Tech Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: false, iso27001: false, gdpr: false, fedramp: false,
    privacy_policy_date: '2023-08', data_centers: ['US'],
    certifications: [],
    notes: 'Early-stage company. No SOC 2 or GDPR DPA as of 2025.',
  },
  // ── Jasper AI ─────────────────────────────────────────────────────────────
  { patterns: [/^jasper/i],
    legal_entity: 'Jasper AI Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-09', data_centers: ['US'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Runway ────────────────────────────────────────────────────────────────
  { patterns: [/^runway/i],
    legal_entity: 'Runway AI Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: false, iso27001: false, gdpr: false, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US'],
    certifications: [],
    notes: 'AI video generation. Content may be used for model improvement by default.',
  },
  // ── Discord ───────────────────────────────────────────────────────────────
  { patterns: [/^discord/i],
    legal_entity: 'Discord Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-11', data_centers: ['US'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
    notes: 'Not designed for enterprise use. Messages indexed and retained indefinitely.',
  },
  // ── Buffer ────────────────────────────────────────────────────────────────
  { patterns: [/^buffer/i],
    legal_entity: 'Buffer Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: false, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2022-06', data_centers: ['US'],
    certifications: ['GDPR DPA'],
    notes: 'No SOC 2. Privacy policy last updated 2022.',
  },
  // ── Hootsuite ─────────────────────────────────────────────────────────────
  { patterns: [/^hootsuite/i],
    legal_entity: 'Hootsuite Inc.', hq_country: 'CA', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US', 'CA', 'EU'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'GDPR DPA'],
  },
  // ── New Relic ─────────────────────────────────────────────────────────────
  { patterns: [/^new relic/i],
    legal_entity: 'New Relic Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: true, gdpr: true, fedramp: true,
    privacy_policy_date: '2024-02', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'ISO 27001', 'FedRAMP', 'GDPR DPA'],
  },
  // ── Grafana ───────────────────────────────────────────────────────────────
  { patterns: [/^grafana/i],
    legal_entity: 'Grafana Labs Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2023-10', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── 1Password ─────────────────────────────────────────────────────────────
  { patterns: [/^1password/i, /^agilebits/i],
    legal_entity: 'AgileBits Inc.', hq_country: 'CA', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-01', data_centers: ['US', 'EU', 'CA'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
  // ── Bitwarden ─────────────────────────────────────────────────────────────
  { patterns: [/^bitwarden/i],
    legal_entity: 'Bitwarden Inc.', hq_country: 'US', hq_region: 'North America',
    soc2: true, iso27001: false, gdpr: true, fedramp: false,
    privacy_policy_date: '2024-02', data_centers: ['US', 'EU'],
    certifications: ['SOC 2 Type II', 'GDPR DPA'],
  },
];

// High-risk jurisdiction flags
const HIGH_RISK_COUNTRIES = new Set(['CN', 'RU', 'BY', 'IR', 'KP', 'SY', 'CU']);
const MEDIUM_RISK_COUNTRIES = new Set(['IN', 'VN', 'PK', 'BD']);

const COUNTRY_NAMES = {
  US: 'United States', GB: 'United Kingdom', DE: 'Germany', FR: 'France',
  IE: 'Ireland', AU: 'Australia', CA: 'Canada', IL: 'Israel', EE: 'Estonia',
  NL: 'Netherlands', SE: 'Sweden', CH: 'Switzerland', SG: 'Singapore',
  JP: 'Japan', IN: 'India', CN: 'China', RU: 'Russia', KP: 'North Korea',
  BR: 'Brazil', AR: 'Argentina', MX: 'Mexico', ZA: 'South Africa',
};

const COUNTRY_FLAGS = {
  US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', IE: '🇮🇪', AU: '🇦🇺',
  CA: '🇨🇦', IL: '🇮🇱', EE: '🇪🇪', NL: '🇳🇱', SE: '🇸🇪', CH: '🇨🇭',
  SG: '🇸🇬', JP: '🇯🇵', IN: '🇮🇳', CN: '🇨🇳', RU: '🇷🇺', KP: '🇰🇵',
  BR: '🇧🇷', AR: '🇦🇷', MX: '🇲🇽', ZA: '🇿🇦',
};

function lookupVendor(appName, developer) {
  const combined = (appName || '') + ' ' + (developer || '');
  for (const v of VENDORS) {
    if (v.patterns.some(p => p.test(combined))) return v;
  }
  return null;
}

function scoreVendor(vendor) {
  const factors = [];
  let score = 0;

  if (vendor) {
    // Country risk
    if (HIGH_RISK_COUNTRIES.has(vendor.hq_country)) {
      score += 40;
      factors.push({ factor: 'high_risk_jurisdiction', weight: 40, detail: `HQ in ${COUNTRY_NAMES[vendor.hq_country] || vendor.hq_country} — a high-risk data jurisdiction` });
    } else if (MEDIUM_RISK_COUNTRIES.has(vendor.hq_country)) {
      score += 10;
      factors.push({ factor: 'medium_risk_jurisdiction', weight: 10, detail: `HQ in ${COUNTRY_NAMES[vendor.hq_country] || vendor.hq_country} — review data localisation requirements` });
    }

    // SOC 2
    if (!vendor.soc2) {
      score += 25;
      factors.push({ factor: 'no_soc2', weight: 25, detail: 'No SOC 2 Type II certification — security controls unaudited' });
    }

    // GDPR DPA
    if (!vendor.gdpr) {
      score += 15;
      factors.push({ factor: 'no_gdpr_dpa', weight: 15, detail: 'No GDPR Data Processing Agreement — non-compliant for EU data' });
    }

    // ISO 27001
    if (!vendor.iso27001) {
      score += 8;
      factors.push({ factor: 'no_iso27001', weight: 8, detail: 'No ISO 27001 certification' });
    }

    // Privacy policy staleness
    if (vendor.privacy_policy_date) {
      const pDate = new Date(vendor.privacy_policy_date + '-01');
      const monthsOld = (Date.now() - pDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld > 36) {
        score += 12;
        factors.push({ factor: 'stale_privacy_policy', weight: 12, detail: `Privacy policy last updated ${vendor.privacy_policy_date} (over 3 years ago)` });
      } else if (monthsOld > 24) {
        score += 7;
        factors.push({ factor: 'aging_privacy_policy', weight: 7, detail: `Privacy policy last updated ${vendor.privacy_policy_date} (over 2 years ago)` });
      }
    } else {
      score += 12;
      factors.push({ factor: 'missing_privacy_policy_date', weight: 12, detail: 'Privacy policy date unknown' });
    }

    // Vendor notes (warnings)
    if (vendor.notes) {
      factors.push({ factor: 'vendor_note', weight: 0, detail: vendor.notes });
    }
  } else {
    // Unknown vendor
    score += 20;
    factors.push({ factor: 'unknown_vendor', weight: 20, detail: 'Vendor not found in registry — security posture unknown' });
  }

  const level = score >= 60 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low';
  return { vendor_risk_score: Math.min(score, 100), vendor_risk_level: level, vendor_risk_factors: factors };
}

module.exports = { lookupVendor, scoreVendor, COUNTRY_NAMES, COUNTRY_FLAGS, HIGH_RISK_COUNTRIES };
