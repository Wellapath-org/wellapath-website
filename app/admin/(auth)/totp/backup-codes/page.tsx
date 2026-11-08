import { cookies } from 'next/headers'

import { AuthFrame, Notice } from '@/components/admin-auth'
import { COOKIE, decodeJson } from '@/content/admin/auth/cookies'
import { requireViewer } from '@/content/admin/auth/viewer'

export const dynamic = 'force-dynamic'

/**
 * The backup codes, once. The backend returns them only at confirmation; the
 * cookie that carried them here expires five minutes after enrolment.
 */
export default async function BackupCodesPage() {
  await requireViewer(false)
  const held = decodeJson<{ c?: unknown }>((await cookies()).get(COOKIE.backup)?.value)
  const codes = Array.isArray(held?.c) ? held.c.filter((c): c is string => typeof c === 'string') : []

  return (
    <AuthFrame title="Save your backup codes">
      {codes.length === 0 ? (
        <Notice>These codes were shown once and are no longer available here.</Notice>
      ) : (
        <>
          <p className="text-body mt-2 text-ink-soft">
            Two-factor sign-in is on. These ten codes are shown only now. Each one works once, in
            place of an authenticator code.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 font-mono text-ink">
            {codes.map((c) => (
              <li key={c} className="rounded-sm border border-rule px-2 py-1 text-center">
                {c}
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="text-body mt-5 font-semibold text-ink">If you lose your authenticator</h2>
      <ul className="text-small mt-2 list-disc space-y-1 pl-5 text-ink-soft">
        <li>Store these codes in your password manager, not in email or chat.</li>
        <li>Sign in with your email code, then use a backup code at the step-up.</li>
        <li>Then ask an admin to reset your TOTP (an audited admin action) and enrol again.</li>
        <li>If you lose access to your email too, contact an admin; recovery is checked by hand.</li>
      </ul>
      <p className="mt-5">
        <a href="/admin" className="text-small font-semibold text-accent-ink underline">
          I have saved them. Continue to the panel
        </a>
      </p>
    </AuthFrame>
  )
}
