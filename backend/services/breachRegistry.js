'use strict';

// Static registry of known SaaS data breaches.
// Each entry has name/developer patterns (lowercase) for matching against DiscoveredApp rows.
const BREACHES = [
  {
    namePatterns: ['okta'],
    developerPatterns: ['okta'],
    app_name: 'Okta',
    breaches: [
      {
        date: '2023-10-20',
        title: 'Okta Support System Breach',
        severity: 'high',
        affected_data: ['customer names', 'email addresses', 'support case details', 'authentication tokens'],
        description: 'Threat actors accessed Okta\'s customer support case management system using stolen credentials. HAR files containing session tokens were compromised.',
        cve: null,
      },
      {
        date: '2022-03-22',
        title: 'Okta Lapsus$ Breach',
        severity: 'high',
        affected_data: ['internal systems', 'customer tenant data'],
        description: 'The Lapsus$ extortion group posted screenshots of alleged access to Okta\'s internal admin tools, affecting ~366 customers.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['lastpass', 'last pass'],
    developerPatterns: ['lastpass'],
    app_name: 'LastPass',
    breaches: [
      {
        date: '2022-12-22',
        title: 'LastPass Vault Data Stolen',
        severity: 'critical',
        affected_data: ['encrypted password vaults', 'usernames', 'URLs', 'company names', 'billing addresses'],
        description: 'Attackers exfiltrated encrypted customer vault data and unencrypted metadata. Users with weak master passwords are at severe risk.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['slack'],
    developerPatterns: ['slack', 'salesforce'],
    app_name: 'Slack',
    breaches: [
      {
        date: '2023-01-05',
        title: 'Slack GitHub Repository Breach',
        severity: 'medium',
        affected_data: ['source code repositories', 'internal tooling code'],
        description: 'Slack\'s private GitHub repositories were accessed via stolen employee tokens. No customer data or Slack service code was affected.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['twilio'],
    developerPatterns: ['twilio'],
    app_name: 'Twilio',
    breaches: [
      {
        date: '2022-08-04',
        title: 'Twilio SMS Phishing Attack',
        severity: 'high',
        affected_data: ['customer account data', 'phone numbers', 'API keys'],
        description: 'Twilio employees were phished via SMS, allowing attackers to access customer data and view Authy 2FA phone numbers.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['mailchimp', 'mail chimp'],
    developerPatterns: ['mailchimp', 'intuit'],
    app_name: 'Mailchimp',
    breaches: [
      {
        date: '2023-01-13',
        title: 'Mailchimp Social Engineering Attack',
        severity: 'high',
        affected_data: ['audience data', 'email addresses', 'account metadata'],
        description: 'Attackers used social engineering to access Mailchimp employee tools, exfiltrating data from ~133 Mailchimp accounts.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['github'],
    developerPatterns: ['github', 'microsoft'],
    app_name: 'GitHub',
    breaches: [
      {
        date: '2022-04-15',
        title: 'GitHub OAuth Token Theft (Heroku/Travis CI)',
        severity: 'high',
        affected_data: ['private repository contents', 'NPM package data', 'secrets'],
        description: 'Attackers stole OAuth tokens issued to Heroku and Travis CI, used to access dozens of organizations\' private GitHub repositories including npm.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['dropbox'],
    developerPatterns: ['dropbox'],
    app_name: 'Dropbox',
    breaches: [
      {
        date: '2022-11-01',
        title: 'Dropbox Source Code Breach',
        severity: 'medium',
        affected_data: ['source code', 'API keys', 'employee names', 'email addresses'],
        description: 'A phishing attack on a Dropbox employee gave attackers access to 130 GitHub repositories containing source code and internal credentials.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['hubspot'],
    developerPatterns: ['hubspot'],
    app_name: 'HubSpot',
    breaches: [
      {
        date: '2022-03-18',
        title: 'HubSpot Insider Data Breach',
        severity: 'high',
        affected_data: ['contact data', 'company names', 'email addresses', 'phone numbers'],
        description: 'A rogue HubSpot employee accessed and exfiltrated customer data from ~30 companies, including multiple crypto firms.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['trello'],
    developerPatterns: ['atlassian', 'trello'],
    app_name: 'Trello',
    breaches: [
      {
        date: '2024-01-20',
        title: 'Trello Public Board Data Scrape',
        severity: 'medium',
        affected_data: ['email addresses', 'full names', 'usernames'],
        description: '15 million Trello user profiles (email addresses + names) were scraped via an exposed API and posted on a hacking forum.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['docusign'],
    developerPatterns: ['docusign'],
    app_name: 'DocuSign',
    breaches: [
      {
        date: '2017-05-09',
        title: 'DocuSign Email Address Data Breach',
        severity: 'medium',
        affected_data: ['email addresses'],
        description: 'A DocuSign system used to send service-related announcements was compromised, leading to phishing campaigns targeting customers.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['zendesk'],
    developerPatterns: ['zendesk'],
    app_name: 'Zendesk',
    breaches: [
      {
        date: '2022-10-25',
        title: 'Zendesk Social Engineering Attack',
        severity: 'high',
        affected_data: ['customer support ticket data', 'email addresses', 'phone numbers', 'names'],
        description: 'Zendesk employees were targeted by a voice phishing (vishing) campaign, resulting in employee credentials and MFA codes being stolen.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['atlassian', 'confluence', 'jira', 'bitbucket'],
    developerPatterns: ['atlassian'],
    app_name: 'Atlassian',
    breaches: [
      {
        date: '2023-02-20',
        title: 'Atlassian Data Breach via Envision',
        severity: 'medium',
        affected_data: ['employee names', 'email addresses', 'job titles', 'organizational data'],
        description: 'A third-party contractor\'s credentials were used to access Atlassian\'s internal employee directory and IT tooling.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['circleci', 'circle ci'],
    developerPatterns: ['circleci'],
    app_name: 'CircleCI',
    breaches: [
      {
        date: '2023-01-04',
        title: 'CircleCI Security Incident — Token Compromise',
        severity: 'critical',
        affected_data: ['environment variables', 'API tokens', 'SSH keys', 'secrets'],
        description: 'Malware on an engineer\'s laptop allowed attackers to steal session tokens. Any secrets stored in CircleCI should be considered compromised.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['heroku'],
    developerPatterns: ['heroku', 'salesforce'],
    app_name: 'Heroku',
    breaches: [
      {
        date: '2022-04-09',
        title: 'Heroku OAuth Token Theft',
        severity: 'high',
        affected_data: ['GitHub OAuth tokens', 'private repository contents', 'customer database credentials'],
        description: 'Stolen Heroku OAuth tokens were used to access private GitHub repos. Heroku also had its own customer database breached exposing hashed passwords.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['twitch'],
    developerPatterns: ['twitch', 'amazon'],
    app_name: 'Twitch',
    breaches: [
      {
        date: '2021-10-06',
        title: 'Twitch Source Code & Payout Data Leaked',
        severity: 'high',
        affected_data: ['source code', 'creator payout data', 'internal security tools'],
        description: 'A misconfigured server change exposed the entirety of Twitch\'s source code (125GB), including internal tools and creator payout records.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['zoom'],
    developerPatterns: ['zoom'],
    app_name: 'Zoom',
    breaches: [
      {
        date: '2020-04-01',
        title: 'Zoom Credential Stuffing — 500K Accounts',
        severity: 'high',
        affected_data: ['email addresses', 'passwords', 'personal meeting URLs', 'host keys'],
        description: '500,000 Zoom account credentials obtained via credential stuffing were sold on dark web forums for as little as $0.002 each.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['adobe'],
    developerPatterns: ['adobe'],
    app_name: 'Adobe',
    breaches: [
      {
        date: '2023-10-11',
        title: 'Adobe Acrobat Sign Phishing Abuse',
        severity: 'medium',
        affected_data: ['email credentials', 'corporate account data'],
        description: 'Adobe Acrobat Sign was abused to distribute malware via legitimate-looking document signing emails.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['monday', 'monday.com'],
    developerPatterns: ['monday'],
    app_name: 'Monday.com',
    breaches: [
      {
        date: '2021-08-09',
        title: 'Monday.com Employee Data Exposure',
        severity: 'medium',
        affected_data: ['employee names', 'email addresses', 'phone numbers', 'job titles'],
        description: 'A third-party vendor exposed Monday.com employee and customer contact data through a misconfigured system.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['notion'],
    developerPatterns: ['notion'],
    app_name: 'Notion',
    breaches: [
      {
        date: '2022-05-20',
        title: 'Notion Third-Party Vendor Incident',
        severity: 'medium',
        affected_data: ['email addresses', 'account activity'],
        description: 'A Notion third-party vendor exposed some user email addresses and account activity data through a security misconfiguration.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['figma'],
    developerPatterns: ['figma', 'adobe'],
    app_name: 'Figma',
    breaches: [
      {
        date: '2022-09-27',
        title: 'Figma Credential Stuffing Attack',
        severity: 'medium',
        affected_data: ['account credentials', 'design files'],
        description: 'Figma detected a credential stuffing attack using leaked username/password combinations from other breaches.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['salesforce'],
    developerPatterns: ['salesforce'],
    app_name: 'Salesforce',
    breaches: [
      {
        date: '2023-06-01',
        title: 'Salesforce Community Data Leak',
        severity: 'high',
        affected_data: ['customer records', 'PII', 'financial data'],
        description: 'Misconfigured Salesforce Community sites at multiple companies (including banks) exposed sensitive data publicly due to guest user access settings.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['microsoft', 'teams', 'outlook', 'sharepoint', 'onedrive'],
    developerPatterns: ['microsoft'],
    app_name: 'Microsoft 365',
    breaches: [
      {
        date: '2023-07-11',
        title: 'Microsoft Exchange Online — Storm-0558',
        severity: 'critical',
        affected_data: ['email accounts', 'email content', 'government communications'],
        description: 'Chinese hackers (Storm-0558) forged authentication tokens to access email accounts of ~25 organizations including US government agencies.',
        cve: 'CVE-2023-35628',
      },
    ],
  },
  {
    namePatterns: ['sendgrid', 'twilio sendgrid'],
    developerPatterns: ['twilio', 'sendgrid'],
    app_name: 'SendGrid',
    breaches: [
      {
        date: '2022-08-08',
        title: 'SendGrid Phishing Campaign (Twilio Breach)',
        severity: 'high',
        affected_data: ['email addresses', 'API keys', 'customer contact lists'],
        description: 'As part of the broader Twilio breach, SendGrid employee accounts were compromised, enabling targeted phishing of SendGrid customers.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['npm', 'npmjs'],
    developerPatterns: ['github', 'npm'],
    app_name: 'npm',
    breaches: [
      {
        date: '2022-05-24',
        title: 'npm Package Registry Account Takeovers',
        severity: 'high',
        affected_data: ['npm packages', 'developer accounts', 'downstream dependencies'],
        description: 'GitHub detected unauthorized access to npm\'s user accounts used for publishing packages, with some maintainer tokens stolen via the Heroku/Travis CI breach.',
        cve: null,
      },
    ],
  },
  {
    namePatterns: ['pypi', 'python package'],
    developerPatterns: ['pypi', 'python'],
    app_name: 'PyPI',
    breaches: [
      {
        date: '2023-05-24',
        title: 'PyPI Malicious Package Supply Chain Attack',
        severity: 'high',
        affected_data: ['developer credentials', 'downstream package consumers'],
        description: 'PyPI was forced to temporarily suspend new user registration and project creation due to a surge of malicious packages targeting developer credentials.',
        cve: null,
      },
    ],
  },
];

/**
 * Look up breach records for an app by name and developer.
 * Returns array of breach records, or empty array if none known.
 */
function lookupBreaches(appName, developerName) {
  const nameLower = (appName || '').toLowerCase();
  const devLower = (developerName || '').toLowerCase();

  for (const entry of BREACHES) {
    const nameMatch = entry.namePatterns.some(p => nameLower.includes(p));
    const devMatch = entry.developerPatterns.some(p => devLower.includes(p));
    if (nameMatch || devMatch) {
      return { app_name: entry.app_name, breaches: entry.breaches };
    }
  }
  return null;
}

/**
 * Returns the most severe breach level for a set of breach records.
 */
function highestSeverity(breaches) {
  if (breaches.some(b => b.severity === 'critical')) return 'critical';
  if (breaches.some(b => b.severity === 'high')) return 'high';
  return 'medium';
}

module.exports = { lookupBreaches, highestSeverity };
