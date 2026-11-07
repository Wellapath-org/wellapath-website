import { NextResponse, type NextRequest } from 'next/server'

import { adminAuthMode } from '@/content/admin/auth/mode'
import { COOKIE } from '@/content/admin/auth/cookies'

export const dynamic = 'force-dynamic'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/**
 * The refusal for an account that is not a moderator or admin, or a moderator
 * on an admin-only page. A route handler rather than a page so that it can
 * answer with a real 403 status that a script, a monitor or a test can see.
 * Deliberately plain: it shows nothing about the panel.
 */
export function GET(req: NextRequest) {
  if (adminAuthMode() !== 'individual') return new NextResponse('Not found', { status: 404 })
  const csrf = req.cookies.get(COOKIE.csrf)?.value ?? ''
  const html = `<!doctype html>
<html lang="en-NG"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Not available · WellaPath admin</title>
<style>body{font-family:system-ui,sans-serif;max-width:460px;margin:3rem auto;padding:0 1rem;color:#1d1b24;background:#fff}
h1{font-size:1.4rem}p{line-height:1.5;color:#4a4757}button{min-height:2.5rem;padding:0 1rem;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer}</style>
</head><body><main><h1>Not available to this account</h1>
<p>The admin panel is for moderator and admin accounts. This account does not have that role, or this page needs a role it does not have. Nothing was shown and nothing was changed.</p>
<form method="post" action="/admin/auth/sign-out"><input type="hidden" name="csrf" value="${esc(csrf)}"><button type="submit">Sign out</button></form>
<p><a href="/admin/sign-in">Sign in with a different account</a></p></main></body></html>`
  return new NextResponse(html, {
    status: 403,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store, max-age=0' },
  })
}
