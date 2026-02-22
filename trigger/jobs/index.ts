// trigger/jobs/index.ts
// Re-export all tasks for Trigger.dev to discover
export { qualifyLeadTask } from './qualify-lead'
export { speedToLeadTask } from './speed-to-lead'
export { aiConversationTask } from './ai-conversation'
export { syncMetaAdsTask, manualSyncMetaAdsTask } from './sync-meta-ads'
export { weeklyReportTask } from './weekly-report'
