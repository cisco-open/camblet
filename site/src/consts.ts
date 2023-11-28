export const SITE = {
  title: 'Documentation',
  description: 'Your website description.',
} as const

export const OPEN_GRAPH = {
  image: {
    src: 'default-og-image.png',
    alt:
      'astro logo on a starry expanse of space,' +
      ' with a purple saturn-like planet floating in the right foreground'
  },
  twitter: 'astrodotbuild'
}

export const EDIT_URL = `https://github.com/cisco-open/nasp/tree/main`

// See "Algolia" section of the README for more information.
export const ALGOLIA = {
  indexName: 'XXXXXXXXXX',
  appId: 'XXXXXXXXXX',
  apiKey: 'XXXXXXXXXX'
}

export type Sidebar = Record<string, { text: string; link: string }[]>

export const SIDEBAR: Sidebar = {
    'Overview': [
      { text: 'Introduction', link: 'docs/introduction' },
      { text: 'Quickstart', link: 'docs/quickstart' },
      { text: 'Features', link: 'docs/features' }
    ],
    'Getting started': [{ text: 'How to install', link: 'docs/how-to-install' }]
}
