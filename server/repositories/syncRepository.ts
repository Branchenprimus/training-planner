import type Database from 'better-sqlite3'
import type { SyncStatus } from '../../shared/types'

function mapStatus(row: Record<string, unknown>): SyncStatus {
  return {
    connected: Boolean(row.connected),
    isSyncing: Boolean(row.is_syncing),
    lastSyncAt: (row.last_sync_at as string | null) ?? null,
    lastSyncStatus: row.last_sync_status as SyncStatus['lastSyncStatus'],
    lastSyncMessage: (row.last_sync_message as string | null) ?? null,
    importedActivities: Number(row.imported_activities ?? 0)
  }
}

export function getSyncStatus(db: Database.Database): SyncStatus {
  const row = db.prepare('SELECT * FROM sync_state WHERE id = 1').get() as Record<string, unknown>
  return mapStatus(row)
}

export function updateSyncStatus(db: Database.Database, input: Partial<SyncStatus>): SyncStatus {
  const current = getSyncStatus(db)
  const next: SyncStatus = {
    ...current,
    ...input
  }
  const now = new Date().toISOString()

  db.prepare(`
    UPDATE sync_state
    SET connected = @connected,
        is_syncing = @isSyncing,
        last_sync_at = @lastSyncAt,
        last_sync_status = @lastSyncStatus,
        last_sync_message = @lastSyncMessage,
        imported_activities = @importedActivities,
        updated_at = @updatedAt
    WHERE id = 1
  `).run({
    connected: next.connected ? 1 : 0,
    isSyncing: next.isSyncing ? 1 : 0,
    lastSyncAt: next.lastSyncAt,
    lastSyncStatus: next.lastSyncStatus,
    lastSyncMessage: next.lastSyncMessage,
    importedActivities: next.importedActivities,
    updatedAt: now
  })

  return next
}
