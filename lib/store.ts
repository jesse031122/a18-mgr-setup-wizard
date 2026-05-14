import fs from 'fs'
import path from 'path'
import { type MgrClient } from './steps'

const DATA_FILE = path.join(process.cwd(), 'data', 'clients.json')
const CONFIG_FILE = path.join(process.cwd(), 'data', 'config.json')

export function readConfig(): Record<string, string> {
  if (!fs.existsSync(CONFIG_FILE)) return {}
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) } catch { return {} }
}

export function writeConfig(config: Record<string, string>) {
  const dir = path.dirname(CONFIG_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8')
}

function ensureFile() {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8')
}

export function readClients(): MgrClient[] {
  ensureFile()
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}

export function writeClients(clients: MgrClient[]) {
  ensureFile()
  fs.writeFileSync(DATA_FILE, JSON.stringify(clients, null, 2), 'utf8')
}

export function getClient(id: string): MgrClient | undefined {
  return readClients().find((c) => c.id === id)
}

export function upsertClient(client: MgrClient) {
  const clients = readClients()
  const idx = clients.findIndex((c) => c.id === client.id)
  if (idx >= 0) clients[idx] = client
  else clients.unshift(client)
  writeClients(clients)
  return client
}

export function deleteClient(id: string) {
  writeClients(readClients().filter((c) => c.id !== id))
}
