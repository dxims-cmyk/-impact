// trigger/jobs/sync-meta-ads.ts
import { task, schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/lib/supabase/server"
import { syncMetaAdsData, getLongLivedToken } from "@/lib/integrations/meta-ads"
import { decryptTokens, encryptTokens } from "@/lib/encryption"

export const syncMetaAdsTask = schedules.task({
  id: "sync-meta-ads",
  cron: "0 * * * *", // Every hour
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async () => {
    logger.info("Starting Meta Ads sync")

    const supabase = createAdminClient()

    // Get all active Meta integrations
    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('provider', 'meta_ads')
      .eq('status', 'connected')

    if (intError) {
      logger.error("Failed to fetch integrations", { error: intError })
      return { success: false, error: "Database error" }
    }

    if (!integrations || integrations.length === 0) {
      logger.info("No Meta integrations to sync")
      return { success: true, synced: 0 }
    }

    logger.info(`Found ${integrations.length} integrations to sync`)

    const results: { id: string; success: boolean; error?: string }[] = []

    for (const integration of integrations) {
      try {
        // Decrypt token from DB
        let accessToken: string
        try {
          const decrypted = decryptTokens({ access_token: integration.access_token! })
          accessToken = decrypted.access_token
        } catch {
          // Fallback for pre-encryption plaintext tokens
          accessToken = integration.access_token!
        }

        if (integration.token_expires_at) {
          const expiresAt = new Date(integration.token_expires_at)
          const now = new Date()

          // Refresh if expiring in less than 1 day
          if (expiresAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
            logger.info("Refreshing token", { integrationId: integration.id })

            const newTokens = await getLongLivedToken(accessToken)
            accessToken = newTokens.access_token

            // Re-encrypt and update stored token
            const encrypted = encryptTokens({ access_token: accessToken })
            await supabase
              .from('integrations')
              .update({
                access_token: encrypted.access_token,
                token_expires_at: newTokens.expires_at?.toISOString()
              })
              .eq('id', integration.id)
          }
        }

        // Sync data
        await syncMetaAdsData(
          accessToken,
          integration.account_id!,
          integration.organization_id,
          integration.id,
          supabase
        )

        logger.info("Sync complete", { integrationId: integration.id })
        results.push({ id: integration.id, success: true })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        logger.error("Sync failed", {
          integrationId: integration.id,
          error: errorMessage
        })

        // Update integration status
        await supabase
          .from('integrations')
          .update({
            status: 'error',
            sync_error: errorMessage
          })
          .eq('id', integration.id)

        results.push({ id: integration.id, success: false, error: errorMessage })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    logger.info("Meta Ads sync complete", {
      total: integrations.length,
      success: successCount,
      failed: failCount
    })

    return {
      success: true,
      synced: successCount,
      failed: failCount,
      results
    }
  }
})

// Manual sync trigger
export const manualSyncMetaAdsTask = task({
  id: "sync-meta-ads-manual",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: { integrationId: string }) => {
    const { integrationId } = payload

    logger.info("Starting manual Meta Ads sync", { integrationId })

    const supabase = createAdminClient()

    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single()

    if (error || !integration) {
      logger.error("Integration not found", { integrationId, error })
      return { success: false, error: "Integration not found" }
    }

    try {
      // Decrypt token from DB
      let accessToken: string
      try {
        const decrypted = decryptTokens({ access_token: integration.access_token! })
        accessToken = decrypted.access_token
      } catch {
        accessToken = integration.access_token!
      }

      if (integration.token_expires_at) {
        const expiresAt = new Date(integration.token_expires_at)
        const now = new Date()

        if (expiresAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
          logger.info("Refreshing token for manual sync", { integrationId })

          const newTokens = await getLongLivedToken(accessToken)
          accessToken = newTokens.access_token

          const encrypted = encryptTokens({ access_token: accessToken })
          await supabase
            .from('integrations')
            .update({
              access_token: encrypted.access_token,
              token_expires_at: newTokens.expires_at?.toISOString()
            })
            .eq('id', integrationId)
        }
      }

      await syncMetaAdsData(
        accessToken,
        integration.account_id!,
        integration.organization_id,
        integration.id,
        supabase
      )

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      await supabase
        .from('integrations')
        .update({
          status: 'error',
          sync_error: errorMessage
        })
        .eq('id', integrationId)

      return { success: false, error: errorMessage }
    }
  }
})
