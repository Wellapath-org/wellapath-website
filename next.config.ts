import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // No next/image anywhere: every asset is either markup (the product mocks,
  // the maps, the globe) or a fixed-size pre-optimised file. Declaring this
  // keeps the image optimiser — and its `sharp` dependency — out of the
  // deployed server bundle.
  images: { unoptimized: true },
}

export default config
