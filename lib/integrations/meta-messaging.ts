// lib/integrations/meta-messaging.ts
// Send messages via Instagram DM and Facebook Messenger using Meta Graph API

interface SendMessageResult {
  recipient_id: string
  message_id: string
}

/**
 * Send a text message via Instagram DM
 * Requires META_PAGE_ACCESS_TOKEN with instagram_manage_messages permission
 */
export async function sendInstagramMessage(
  recipientId: string,
  text: string,
): Promise<SendMessageResult> {
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('META_PAGE_ACCESS_TOKEN not configured')
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(
      errorData.error?.message || `Instagram send failed with status ${response.status}`,
    )
  }

  return response.json() as Promise<SendMessageResult>
}

/**
 * Send a text message via Facebook Messenger
 * Requires META_PAGE_ACCESS_TOKEN with pages_messaging permission
 */
export async function sendMessengerMessage(
  recipientId: string,
  text: string,
): Promise<SendMessageResult> {
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('META_PAGE_ACCESS_TOKEN not configured')
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    },
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(
      errorData.error?.message || `Messenger send failed with status ${response.status}`,
    )
  }

  return response.json() as Promise<SendMessageResult>
}
