#!/usr/bin/env node
/**
 * Reset every Supabase Auth user's password to 0000 and ensure the
 * three crew auth users + profile rows exist. Run from the web/ folder:
 *
 *   cd edge-crew-v3/web
 *   node scripts/reset-passwords.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CREW = ['peter', 'chinny', 'jimmy']
const DEFAULT_PIN = '000000'

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '..', '.env')
  const raw = fs.readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (match) {
      let value = match[2]
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
      env[match[1]] = value
    }
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

async function listAllUsers() {
  const users = []
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })
    if (error) throw error
    users.push(...(data.users || []))
    if ((data.users || []).length < perPage) break
    page++
  }
  return users
}

async function main() {
  console.log('Fetching existing auth users...')
  const users = await listAllUsers()
  const byEmail = new Map(users.map((u) => [u.email?.toLowerCase(), u]))

  // Update every existing user's password to the default PIN.
  for (const user of users) {
    process.stdout.write(`Updating password for ${user.email || user.id} ... `)
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: DEFAULT_PIN,
    })
    if (error) {
      console.log(`ERROR: ${error.message}`)
    } else {
      console.log('OK')
    }
  }

  // Ensure each crew member exists.
  for (const username of CREW) {
    const email = `${username}@edgecrew.local`
    if (byEmail.has(email)) {
      console.log(`Crew user ${username} already exists (${byEmail.get(email).id})`)
      continue
    }

    process.stdout.write(`Creating crew user ${username} ... `)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_PIN,
      email_confirm: true,
    })
    if (error) {
      console.log(`ERROR: ${error.message}`)
      continue
    }
    console.log(`OK (${data.user.id})`)

    // Ensure a profile row exists so the app can map username/display name.
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          username,
          display_name: username.charAt(0).toUpperCase() + username.slice(1),
          starting_bankroll: 0,
          current_bankroll: 0,
        },
        { onConflict: 'id' }
      )
    if (profileError) {
      console.log(`  Profile upsert warning: ${profileError.message}`)
    } else {
      console.log('  Profile row ensured')
    }
  }

  console.log(`\nAll ${users.length} existing user(s) password reset to ${DEFAULT_PIN}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
