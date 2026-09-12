/**
 * The signup store.
 *
 * Postgres is the source of truth, not Resend. Resend is keyed on email and has
 * nowhere to put a WhatsApp-only signup — and WhatsApp exists here precisely
 * because reaching people by email is the narrower path in this market. Keeping
 * the list in one table also means the NDPR promise on /privacy ("deleted
 * within 30 days of launch", "deleted on request") has exactly one place to be
 * honoured, rather than two systems to remember.
 *
 * Resend is still written to for anyone who gives an email, so the launch
 * broadcast stays a single action there.
 *
 * Schema is created on demand. At this scale a migration tool would be more
 * moving parts than the thing it manages; if the shape grows, introduce one.
 */
import 'server-only'
import { neon } from '@neondatabase/serverless'

export type SignupRow = {
  id: number
  email: string | null
  whatsapp: string | null
  whatsappDisplay: string | null
  source: string | null
  createdAt: Date
}

/**
 * The connection string, under whichever name it arrived.
 *
 * The Neon integration on Vercel provisions `POSTGRES_URL` and friends; it does
 * not create `DATABASE_URL`. Reading only the latter meant the database was
 * attached and working while `dbConfigured()` answered false, so every signup
 * that included a WhatsApp number was reported to the visitor as a failure —
 * the number has nowhere but Postgres to go, so `numberLost` in the notify
 * route treated it as unsaved.
 *
 * `POSTGRES_URL` is the pooled endpoint, which is the right one for a function
 * that opens a connection per request. The non-pooling URL is last, as a
 * fallback rather than a preference.
 */
function connectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  )
}

export function dbConfigured() {
  return Boolean(connectionString())
}

function sql() {
  const url = connectionString()
  if (!url) throw new Error('No Postgres URL is set (DATABASE_URL or POSTGRES_URL)')
  return neon(url)
}

let ready: Promise<void> | null = null

/** Idempotent. Runs once per process, not once per request. */
export function ensureSchema() {
  if (!ready) {
    const q = sql()
    ready = (async () => {
      await q`
        CREATE TABLE IF NOT EXISTS signups (
          id          BIGSERIAL PRIMARY KEY,
          email       TEXT,
          whatsapp    TEXT,
          source      TEXT,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          -- At least one contact route, enforced by the database rather than
          -- only by the form. A row that can reach nobody is not a signup.
          CONSTRAINT signups_has_a_route CHECK (email IS NOT NULL OR whatsapp IS NOT NULL)
        )
      `
      // Partial unique indexes: a NULL email must not collide with another NULL.
      await q`CREATE UNIQUE INDEX IF NOT EXISTS signups_email_key
              ON signups (email) WHERE email IS NOT NULL`
      await q`CREATE UNIQUE INDEX IF NOT EXISTS signups_whatsapp_key
              ON signups (whatsapp) WHERE whatsapp IS NOT NULL`
      await q`CREATE INDEX IF NOT EXISTS signups_created_at_idx ON signups (created_at DESC)`
    })().catch((e) => {
      ready = null // let a later request retry rather than wedging forever
      throw e
    })
  }
  return ready
}

/**
 * Returns 'created' or 'duplicate'. A duplicate is not an error: someone
 * signing up twice has done nothing wrong and should be told it worked.
 *
 * ON CONFLICT is per-column, so a person who signed up with email and returns
 * with the same email plus a WhatsApp number gets the number added rather than
 * a rejection.
 */
export async function saveSignup(input: {
  email: string | null
  whatsapp: string | null
  source: string | null
}): Promise<'created' | 'duplicate'> {
  await ensureSchema()
  const q = sql()

  if (input.email) {
    const insert = (whatsapp: string | null) => q`
      INSERT INTO signups (email, whatsapp, source)
      VALUES (${input.email}, ${whatsapp}, ${input.source})
      ON CONFLICT (email) WHERE email IS NOT NULL
      DO UPDATE SET whatsapp = COALESCE(signups.whatsapp, EXCLUDED.whatsapp)
      RETURNING (xmax = 0) AS inserted
    `
    try {
      const rows = await insert(input.whatsapp)
      return rows[0]?.inserted ? 'created' : 'duplicate'
    } catch (e) {
      // ON CONFLICT infers ONE index, so a new email carrying a number that is
      // already on another row raises a unique violation this statement cannot
      // absorb. It happens for real: a shared handset, or someone signing up
      // again from a second address. Failing here would tell a person their
      // signup broke when we can already reach them, so keep the email and drop
      // the number, which is stored elsewhere already.
      if (!isUniqueViolation(e, 'signups_whatsapp_key')) throw e
      const rows = await insert(null)
      return rows[0]?.inserted ? 'created' : 'duplicate'
    }
  }

  const rows = await q`
    INSERT INTO signups (email, whatsapp, source)
    VALUES (NULL, ${input.whatsapp}, ${input.source})
    ON CONFLICT (whatsapp) WHERE whatsapp IS NOT NULL DO NOTHING
    RETURNING id
  `
  return rows.length > 0 ? 'created' : 'duplicate'
}

export async function listSignups(): Promise<SignupRow[]> {
  await ensureSchema()
  const q = sql()
  const rows = await q`
    SELECT id, email, whatsapp, source, created_at
    FROM signups ORDER BY created_at DESC
  `
  return rows.map((r) => ({
    id: Number(r.id),
    email: r.email ?? null,
    whatsapp: r.whatsapp ?? null,
    whatsappDisplay: r.whatsapp ? formatNg(String(r.whatsapp)) : null,
    source: r.source ?? null,
    // node-postgres returns a Date for timestamptz; be defensive about strings.
    createdAt: r.created_at instanceof Date ? r.created_at : new Date(String(r.created_at)),
  }))
}

/**
 * Postgres SQLSTATE 23505. Matched on `code` first; the message is only a
 * fallback, because a driver that stops attaching `code` should degrade to a
 * looser match rather than to a crash.
 */
function isUniqueViolation(e: unknown, constraint: string) {
  const err = e as { code?: string; constraint?: string; message?: string }
  const isUnique = err?.code === '23505' || /duplicate key value/i.test(err?.message ?? '')
  if (!isUnique) return false
  return err?.constraint === constraint || (err?.message ?? '').includes(constraint)
}

/** +2348031234567 -> 0803 123 4567 */
function formatNg(e164: string) {
  const n = e164.replace(/^\+234/, '')
  return n.length === 10 ? `0${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : e164
}
