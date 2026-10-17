import { get, set } from 'idb-keyval'
import { createWorkspace } from './sample'
import { workspaceSchema, type Workspace } from './types'

const key = 'nearmint-workspace-v1'
let writes = Promise.resolve()
export async function loadWorkspace(): Promise<Workspace> {
  const stored = await get(key)
  return stored === undefined ? createWorkspace() : workspaceSchema.parse(stored)
}
export function saveWorkspace(workspace: Workspace): Promise<void> {
  const parsed = workspaceSchema.parse(workspace)
  const pending = writes.catch(() => undefined).then(() => set(key, parsed))
  writes = pending
  return pending
}
export function validateBackup(text: string): Workspace {
  if (text.length > 30_000_000) throw new Error('Backup files must be smaller than 30 MB.')
  try {
    return workspaceSchema.parse(JSON.parse(text))
  } catch {
    throw new Error('This is not a valid Nearmint backup. Export a JSON backup from Your data.')
  }
}
