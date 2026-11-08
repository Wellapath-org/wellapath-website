// ESLint flat config, in the form create-next-app generates for Next 15:
// `next/core-web-vitals` plus `next/typescript`, through FlatCompat because
// eslint-config-next 15 still ships the legacy format.
//
// `next lint` is deprecated (it goes in Next 16) and, with no config present,
// stops at an interactive setup prompt. `npm run lint` calls the ESLint CLI
// directly instead, so it never prompts.
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const config = [
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'dist/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // A leading underscore marks a parameter that has to exist to satisfy a
    // shared signature (the MOD_OPS `path` builders, for one) but is unused.
    rules: { '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
  {
    // Pre-existing findings in pages this config arrived after. They are
    // switched off for these files only, so the rules still hold for every
    // other file and for new code. Clear an entry when its file is next
    // edited for its own reasons, rather than rewriting the page here.
    //
    // no-html-link-for-pages: both are plain <a href="/conditions"> links in
    // running copy. A full page load is harmless there, and whether these
    // links should become client-side transitions is a separate decision.
    files: ['app/notify/thanks/page.tsx', 'app/privacy/page.tsx'],
    rules: { '@next/next/no-html-link-for-pages': 'off' },
  },
  {
    // prefer-const: a style rule. The array is mutated with pop() and never
    // reassigned, so `let` is only a style issue there, not a bug.
    files: ['app/conditions/[[]slug]/page.tsx'],
    rules: { 'prefer-const': 'off' },
  },
]

export default config
