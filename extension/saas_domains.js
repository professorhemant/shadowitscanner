'use strict';

// Maps hostname patterns to { app_id, app_name, category, developer }
// Used by both background.js (service worker) and popup.js
const SAAS_DOMAINS = [
  // Productivity & Collaboration
  { pattern: 'notion.so', app_id: 'ext_notion', app_name: 'Notion', category: 'productivity', developer: 'Notion Labs' },
  { pattern: 'www.notion.so', app_id: 'ext_notion', app_name: 'Notion', category: 'productivity', developer: 'Notion Labs' },
  { pattern: 'app.clickup.com', app_id: 'ext_clickup', app_name: 'ClickUp', category: 'productivity', developer: 'Mango Technologies' },
  { pattern: 'trello.com', app_id: 'ext_trello', app_name: 'Trello', category: 'productivity', developer: 'Atlassian' },
  { pattern: 'asana.com', app_id: 'ext_asana', app_name: 'Asana', category: 'productivity', developer: 'Asana Inc.' },
  { pattern: 'app.asana.com', app_id: 'ext_asana', app_name: 'Asana', category: 'productivity', developer: 'Asana Inc.' },
  { pattern: 'monday.com', app_id: 'ext_monday', app_name: 'Monday.com', category: 'productivity', developer: 'monday.com Ltd.' },
  { pattern: 'basecamp.com', app_id: 'ext_basecamp', app_name: 'Basecamp', category: 'productivity', developer: 'Basecamp LLC' },
  { pattern: 'app.basecamp.com', app_id: 'ext_basecamp', app_name: 'Basecamp', category: 'productivity', developer: 'Basecamp LLC' },
  { pattern: 'linear.app', app_id: 'ext_linear', app_name: 'Linear', category: 'productivity', developer: 'Linear' },
  { pattern: 'height.app', app_id: 'ext_height', app_name: 'Height', category: 'productivity', developer: 'Height' },

  // Communication
  { pattern: 'slack.com', app_id: 'ext_slack', app_name: 'Slack', category: 'communication', developer: 'Salesforce' },
  { pattern: 'app.slack.com', app_id: 'ext_slack', app_name: 'Slack', category: 'communication', developer: 'Salesforce' },
  { pattern: 'discord.com', app_id: 'ext_discord', app_name: 'Discord', category: 'communication', developer: 'Discord Inc.' },
  { pattern: 'web.whatsapp.com', app_id: 'ext_whatsapp', app_name: 'WhatsApp Web', category: 'communication', developer: 'Meta' },
  { pattern: 'telegram.org', app_id: 'ext_telegram', app_name: 'Telegram', category: 'communication', developer: 'Telegram' },
  { pattern: 'web.telegram.org', app_id: 'ext_telegram', app_name: 'Telegram', category: 'communication', developer: 'Telegram' },
  { pattern: 'teams.microsoft.com', app_id: 'ext_msteams', app_name: 'Microsoft Teams', category: 'communication', developer: 'Microsoft' },
  { pattern: 'zoom.us', app_id: 'ext_zoom', app_name: 'Zoom', category: 'communication', developer: 'Zoom Video' },
  { pattern: 'meet.google.com', app_id: 'ext_gmeet', app_name: 'Google Meet', category: 'communication', developer: 'Google' },
  { pattern: 'whereby.com', app_id: 'ext_whereby', app_name: 'Whereby', category: 'communication', developer: 'Whereby AS' },

  // AI Tools
  { pattern: 'chat.openai.com', app_id: 'ext_chatgpt', app_name: 'ChatGPT', category: 'ai', developer: 'OpenAI' },
  { pattern: 'chatgpt.com', app_id: 'ext_chatgpt', app_name: 'ChatGPT', category: 'ai', developer: 'OpenAI' },
  { pattern: 'claude.ai', app_id: 'ext_claude', app_name: 'Claude', category: 'ai', developer: 'Anthropic' },
  { pattern: 'gemini.google.com', app_id: 'ext_gemini', app_name: 'Gemini', category: 'ai', developer: 'Google' },
  { pattern: 'copilot.microsoft.com', app_id: 'ext_mscopilot', app_name: 'Microsoft Copilot', category: 'ai', developer: 'Microsoft' },
  { pattern: 'perplexity.ai', app_id: 'ext_perplexity', app_name: 'Perplexity AI', category: 'ai', developer: 'Perplexity AI' },
  { pattern: 'www.perplexity.ai', app_id: 'ext_perplexity', app_name: 'Perplexity AI', category: 'ai', developer: 'Perplexity AI' },
  { pattern: 'midjourney.com', app_id: 'ext_midjourney', app_name: 'Midjourney', category: 'ai', developer: 'Midjourney Inc.' },
  { pattern: 'www.midjourney.com', app_id: 'ext_midjourney', app_name: 'Midjourney', category: 'ai', developer: 'Midjourney Inc.' },
  { pattern: 'gamma.app', app_id: 'ext_gamma', app_name: 'Gamma', category: 'ai', developer: 'Gamma' },
  { pattern: 'otter.ai', app_id: 'ext_otter', app_name: 'Otter.ai', category: 'ai', developer: 'AISense Inc.' },
  { pattern: 'fireflies.ai', app_id: 'ext_fireflies', app_name: 'Fireflies.ai', category: 'ai', developer: 'Fireflies' },
  { pattern: 'writesonic.com', app_id: 'ext_writesonic', app_name: 'Writesonic', category: 'ai', developer: 'Writesonic' },
  { pattern: 'jasper.ai', app_id: 'ext_jasper', app_name: 'Jasper AI', category: 'ai', developer: 'Jasper AI' },
  { pattern: 'copy.ai', app_id: 'ext_copyai', app_name: 'Copy.ai', category: 'ai', developer: 'Copy.ai' },
  { pattern: 'www.copy.ai', app_id: 'ext_copyai', app_name: 'Copy.ai', category: 'ai', developer: 'Copy.ai' },
  { pattern: 'runway.com', app_id: 'ext_runway', app_name: 'Runway ML', category: 'ai', developer: 'Runway' },
  { pattern: 'app.runway.com', app_id: 'ext_runway', app_name: 'Runway ML', category: 'ai', developer: 'Runway' },
  { pattern: 'lovable.dev', app_id: 'ext_lovable', app_name: 'Lovable', category: 'ai', developer: 'Lovable' },
  { pattern: 'v0.dev', app_id: 'ext_v0', app_name: 'v0 by Vercel', category: 'ai', developer: 'Vercel' },
  { pattern: 'bolt.new', app_id: 'ext_bolt', app_name: 'Bolt.new', category: 'ai', developer: 'StackBlitz' },
  { pattern: 'cursor.sh', app_id: 'ext_cursor', app_name: 'Cursor', category: 'ai', developer: 'Anysphere' },
  { pattern: 'www.cursor.com', app_id: 'ext_cursor', app_name: 'Cursor', category: 'ai', developer: 'Anysphere' },

  // Dev Tools
  { pattern: 'github.com', app_id: 'ext_github', app_name: 'GitHub', category: 'dev', developer: 'Microsoft' },
  { pattern: 'gitlab.com', app_id: 'ext_gitlab', app_name: 'GitLab', category: 'dev', developer: 'GitLab Inc.' },
  { pattern: 'bitbucket.org', app_id: 'ext_bitbucket', app_name: 'Bitbucket', category: 'dev', developer: 'Atlassian' },
  { pattern: 'vercel.com', app_id: 'ext_vercel', app_name: 'Vercel', category: 'dev', developer: 'Vercel' },
  { pattern: 'netlify.com', app_id: 'ext_netlify', app_name: 'Netlify', category: 'dev', developer: 'Netlify' },
  { pattern: 'app.netlify.com', app_id: 'ext_netlify', app_name: 'Netlify', category: 'dev', developer: 'Netlify' },
  { pattern: 'railway.app', app_id: 'ext_railway', app_name: 'Railway', category: 'dev', developer: 'Railway' },
  { pattern: 'render.com', app_id: 'ext_render', app_name: 'Render', category: 'dev', developer: 'Render' },
  { pattern: 'dashboard.render.com', app_id: 'ext_render', app_name: 'Render', category: 'dev', developer: 'Render' },
  { pattern: 'app.supabase.com', app_id: 'ext_supabase', app_name: 'Supabase', category: 'dev', developer: 'Supabase' },
  { pattern: 'console.firebase.google.com', app_id: 'ext_firebase', app_name: 'Firebase', category: 'dev', developer: 'Google' },
  { pattern: 'postman.com', app_id: 'ext_postman', app_name: 'Postman', category: 'dev', developer: 'Postman Inc.' },
  { pattern: 'go.postman.com', app_id: 'ext_postman', app_name: 'Postman', category: 'dev', developer: 'Postman Inc.' },
  { pattern: 'figma.com', app_id: 'ext_figma', app_name: 'Figma', category: 'design', developer: 'Figma Inc.' },
  { pattern: 'www.figma.com', app_id: 'ext_figma', app_name: 'Figma', category: 'design', developer: 'Figma Inc.' },

  // CRM & Sales
  { pattern: 'salesforce.com', app_id: 'ext_salesforce', app_name: 'Salesforce', category: 'crm', developer: 'Salesforce' },
  { pattern: 'app.hubspot.com', app_id: 'ext_hubspot', app_name: 'HubSpot', category: 'crm', developer: 'HubSpot' },
  { pattern: 'pipedrive.com', app_id: 'ext_pipedrive', app_name: 'Pipedrive', category: 'crm', developer: 'Pipedrive' },
  { pattern: 'app.pipedrive.com', app_id: 'ext_pipedrive', app_name: 'Pipedrive', category: 'crm', developer: 'Pipedrive' },
  { pattern: 'close.com', app_id: 'ext_close', app_name: 'Close CRM', category: 'crm', developer: 'Close' },
  { pattern: 'app.close.com', app_id: 'ext_close', app_name: 'Close CRM', category: 'crm', developer: 'Close' },
  { pattern: 'app.apollo.io', app_id: 'ext_apollo', app_name: 'Apollo.io', category: 'crm', developer: 'Apollo.io' },
  { pattern: 'outreach.io', app_id: 'ext_outreach', app_name: 'Outreach', category: 'crm', developer: 'Outreach' },
  { pattern: 'app.outreach.io', app_id: 'ext_outreach', app_name: 'Outreach', category: 'crm', developer: 'Outreach' },

  // Finance & HR
  { pattern: 'app.expensify.com', app_id: 'ext_expensify', app_name: 'Expensify', category: 'finance', developer: 'Expensify' },
  { pattern: 'app.ramp.com', app_id: 'ext_ramp', app_name: 'Ramp', category: 'finance', developer: 'Ramp' },
  { pattern: 'app.brex.com', app_id: 'ext_brex', app_name: 'Brex', category: 'finance', developer: 'Brex' },
  { pattern: 'app.mercury.com', app_id: 'ext_mercury', app_name: 'Mercury', category: 'finance', developer: 'Mercury' },
  { pattern: 'app.rippling.com', app_id: 'ext_rippling', app_name: 'Rippling', category: 'hr', developer: 'Rippling' },
  { pattern: 'app.gusto.com', app_id: 'ext_gusto', app_name: 'Gusto', category: 'hr', developer: 'Gusto' },
  { pattern: 'app.workday.com', app_id: 'ext_workday', app_name: 'Workday', category: 'hr', developer: 'Workday' },
  { pattern: 'bamboohr.com', app_id: 'ext_bamboohr', app_name: 'BambooHR', category: 'hr', developer: 'BambooHR' },

  // Cloud Storage & Docs
  { pattern: 'drive.google.com', app_id: 'ext_gdrive', app_name: 'Google Drive', category: 'storage', developer: 'Google' },
  { pattern: 'docs.google.com', app_id: 'ext_gdocs', app_name: 'Google Docs', category: 'storage', developer: 'Google' },
  { pattern: 'sheets.google.com', app_id: 'ext_gsheets', app_name: 'Google Sheets', category: 'storage', developer: 'Google' },
  { pattern: 'dropbox.com', app_id: 'ext_dropbox', app_name: 'Dropbox', category: 'storage', developer: 'Dropbox' },
  { pattern: 'www.dropbox.com', app_id: 'ext_dropbox', app_name: 'Dropbox', category: 'storage', developer: 'Dropbox' },
  { pattern: 'box.com', app_id: 'ext_box', app_name: 'Box', category: 'storage', developer: 'Box Inc.' },
  { pattern: 'app.box.com', app_id: 'ext_box', app_name: 'Box', category: 'storage', developer: 'Box Inc.' },
  { pattern: 'onedrive.live.com', app_id: 'ext_onedrive', app_name: 'OneDrive', category: 'storage', developer: 'Microsoft' },

  // Marketing
  { pattern: 'mailchimp.com', app_id: 'ext_mailchimp', app_name: 'Mailchimp', category: 'marketing', developer: 'Intuit' },
  { pattern: 'us1.admin.mailchimp.com', app_id: 'ext_mailchimp', app_name: 'Mailchimp', category: 'marketing', developer: 'Intuit' },
  { pattern: 'app.convertkit.com', app_id: 'ext_convertkit', app_name: 'ConvertKit', category: 'marketing', developer: 'ConvertKit' },
  { pattern: 'app.beehiiv.com', app_id: 'ext_beehiiv', app_name: 'Beehiiv', category: 'marketing', developer: 'Beehiiv' },
  { pattern: 'canva.com', app_id: 'ext_canva', app_name: 'Canva', category: 'design', developer: 'Canva Pty Ltd' },
  { pattern: 'www.canva.com', app_id: 'ext_canva', app_name: 'Canva', category: 'design', developer: 'Canva Pty Ltd' },
  { pattern: 'buffer.com', app_id: 'ext_buffer', app_name: 'Buffer', category: 'marketing', developer: 'Buffer' },
  { pattern: 'publish.buffer.com', app_id: 'ext_buffer', app_name: 'Buffer', category: 'marketing', developer: 'Buffer' },
  { pattern: 'hootsuite.com', app_id: 'ext_hootsuite', app_name: 'Hootsuite', category: 'marketing', developer: 'Hootsuite' },

  // Support & Analytics
  { pattern: 'app.intercom.com', app_id: 'ext_intercom', app_name: 'Intercom', category: 'support', developer: 'Intercom' },
  { pattern: 'zendesk.com', app_id: 'ext_zendesk', app_name: 'Zendesk', category: 'support', developer: 'Zendesk' },
  { pattern: 'freshdesk.com', app_id: 'ext_freshdesk', app_name: 'Freshdesk', category: 'support', developer: 'Freshworks' },
  { pattern: 'analytics.google.com', app_id: 'ext_ga4', app_name: 'Google Analytics', category: 'analytics', developer: 'Google' },
  { pattern: 'mixpanel.com', app_id: 'ext_mixpanel', app_name: 'Mixpanel', category: 'analytics', developer: 'Mixpanel' },
  { pattern: 'app.mixpanel.com', app_id: 'ext_mixpanel', app_name: 'Mixpanel', category: 'analytics', developer: 'Mixpanel' },
  { pattern: 'amplitude.com', app_id: 'ext_amplitude', app_name: 'Amplitude', category: 'analytics', developer: 'Amplitude' },
  { pattern: 'app.amplitude.com', app_id: 'ext_amplitude', app_name: 'Amplitude', category: 'analytics', developer: 'Amplitude' },
  { pattern: 'app.posthog.com', app_id: 'ext_posthog', app_name: 'PostHog', category: 'analytics', developer: 'PostHog' },

  // Infra / DevOps
  { pattern: 'console.aws.amazon.com', app_id: 'ext_aws', app_name: 'AWS Console', category: 'cloud', developer: 'Amazon' },
  { pattern: 'console.cloud.google.com', app_id: 'ext_gcp', app_name: 'Google Cloud Console', category: 'cloud', developer: 'Google' },
  { pattern: 'portal.azure.com', app_id: 'ext_azure', app_name: 'Azure Portal', category: 'cloud', developer: 'Microsoft' },
  { pattern: 'app.datadoghq.com', app_id: 'ext_datadog', app_name: 'Datadog', category: 'devops', developer: 'Datadog' },
  { pattern: 'app.pagerduty.com', app_id: 'ext_pagerduty', app_name: 'PagerDuty', category: 'devops', developer: 'PagerDuty' },
  { pattern: 'sentry.io', app_id: 'ext_sentry', app_name: 'Sentry', category: 'devops', developer: 'Sentry' },
  { pattern: 'app.opsgenie.com', app_id: 'ext_opsgenie', app_name: 'OpsGenie', category: 'devops', developer: 'Atlassian' },
  { pattern: 'grafana.com', app_id: 'ext_grafana', app_name: 'Grafana Cloud', category: 'devops', developer: 'Grafana Labs' },
  { pattern: 'newrelic.com', app_id: 'ext_newrelic', app_name: 'New Relic', category: 'devops', developer: 'New Relic' },
  { pattern: 'one.newrelic.com', app_id: 'ext_newrelic', app_name: 'New Relic', category: 'devops', developer: 'New Relic' },

  // Atlassian
  { pattern: 'atlassian.net', app_id: 'ext_jira', app_name: 'Jira / Confluence', category: 'productivity', developer: 'Atlassian' },

  // Password Managers & Security
  { pattern: 'my.1password.com', app_id: 'ext_1password', app_name: '1Password', category: 'security', developer: 'AgileBits' },
  { pattern: 'vault.bitwarden.com', app_id: 'ext_bitwarden', app_name: 'Bitwarden', category: 'security', developer: 'Bitwarden' },
  { pattern: 'lastpass.com', app_id: 'ext_lastpass', app_name: 'LastPass', category: 'security', developer: 'LastPass' },
];

// Returns matched entry or null
function matchDomain(hostname) {
  for (const entry of SAAS_DOMAINS) {
    if (hostname === entry.pattern || hostname.endsWith('.' + entry.pattern)) {
      return entry;
    }
  }
  return null;
}

if (typeof module !== 'undefined') module.exports = { SAAS_DOMAINS, matchDomain };
