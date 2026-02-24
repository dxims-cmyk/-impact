// lib/integrations/slack.ts

const SLACK_OAUTH_URL = 'https://slack.com/oauth/v2/authorize'
const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access'

export interface SlackTokens {
  access_token: string
  team_id: string
  team_name: string
  bot_user_id: string
  incoming_webhook?: {
    channel: string
    channel_id: string
    configuration_url: string
    url: string
  }
}

export interface SlackNotificationOptions {
  webhookUrl: string
  leadName: string
  leadCompany?: string
  leadEmail?: string
  leadPhone?: string
  aiScore?: string
  source?: string
}

export interface SlackWebhookResponse {
  ok: boolean
}

// Generate Slack OAuth URL
export function getSlackAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'chat:write,channels:read,incoming-webhook',
    response_type: 'code',
  })

  return `${SLACK_OAUTH_URL}?${params}`
}

// Exchange authorization code for access token
export async function exchangeSlackCode(
  code: string,
  redirectUri: string
): Promise<SlackTokens> {
  const response = await fetch(SLACK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    throw new Error(`Slack OAuth request failed with status ${response.status}`)
  }

  const data = await response.json()

  if (!data.ok) {
    throw new Error(`Slack OAuth error: ${data.error}`)
  }

  return {
    access_token: data.access_token,
    team_id: data.team?.id ?? '',
    team_name: data.team?.name ?? '',
    bot_user_id: data.bot_user_id ?? '',
    incoming_webhook: data.incoming_webhook
      ? {
          channel: data.incoming_webhook.channel,
          channel_id: data.incoming_webhook.channel_id,
          configuration_url: data.incoming_webhook.configuration_url,
          url: data.incoming_webhook.url,
        }
      : undefined,
  }
}

// Build Block Kit message blocks for a lead notification
function buildLeadBlocks(options: SlackNotificationOptions): Record<string, unknown>[] {
  const {
    leadName,
    leadCompany,
    leadEmail,
    leadPhone,
    aiScore,
    source,
  } = options

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':sparkles: New Lead Received',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Name:*\n${leadName}`,
        },
        ...(leadCompany
          ? [
              {
                type: 'mrkdwn',
                text: `*Company:*\n${leadCompany}`,
              },
            ]
          : []),
      ],
    },
  ]

  // Contact details section
  const contactFields: Record<string, unknown>[] = []

  if (leadEmail) {
    contactFields.push({
      type: 'mrkdwn',
      text: `*Email:*\n${leadEmail}`,
    })
  }

  if (leadPhone) {
    contactFields.push({
      type: 'mrkdwn',
      text: `*Phone:*\n${leadPhone}`,
    })
  }

  if (contactFields.length > 0) {
    blocks.push({
      type: 'section',
      fields: contactFields,
    })
  }

  // AI score and source section
  const metaFields: Record<string, unknown>[] = []

  if (aiScore) {
    metaFields.push({
      type: 'mrkdwn',
      text: `*AI Score:*\n${aiScore}`,
    })
  }

  if (source) {
    metaFields.push({
      type: 'mrkdwn',
      text: `*Source:*\n${source}`,
    })
  }

  if (metaFields.length > 0) {
    blocks.push({
      type: 'section',
      fields: metaFields,
    })
  }

  // Divider at the bottom
  blocks.push({
    type: 'divider',
  })

  // Timestamp context
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Received at <!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`,
      },
    ],
  })

  return blocks
}

// Send a formatted lead notification to a Slack channel via incoming webhook URL
export async function sendSlackNotification(
  options: SlackNotificationOptions
): Promise<SlackWebhookResponse> {
  const blocks = buildLeadBlocks(options)

  const fallbackText = `New lead: ${options.leadName}${options.leadCompany ? ` from ${options.leadCompany}` : ''}`

  const response = await fetch(options.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: fallbackText,
      blocks,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to send Slack notification: ${errorText}`)
  }

  return { ok: true }
}
