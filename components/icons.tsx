'use client'

/**
 * Global icon defaults.
 *
 * Lucide ships at strokeWidth 2, which is the weight every tutorial uses and
 * is itself a recognised tell — "Heroicons or Lucide, because every tutorial
 * uses them". Dropping to 1.5 at 20px de-defaults the entire icon layer in one
 * place, and matches the optical weight of Inter at our body size.
 *
 * This is the only client component on the site: LucideProvider uses context.
 * It renders no markup of its own and adds ~1 KB.
 */
import { LucideProvider } from 'lucide-react'
import type { ReactNode } from 'react'

export function IconDefaults({ children }: { children: ReactNode }) {
  return (
    <LucideProvider strokeWidth={1.5} size={20}>
      {children}
    </LucideProvider>
  )
}
