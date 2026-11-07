import type { Metadata } from 'next'
import type { ReactNode } from 'react'

/**
 * Sign-in, TOTP and the 403 page: individual mode only, and outside the panel
 * shell, because none of them may assume a signed-in, stepped-up viewer. Each
 * page asserts the mode itself and 404s in basic mode.
 */
export const metadata: Metadata = {
  title: 'Admin sign-in',
  robots: { index: false, follow: false, nocache: true },
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
