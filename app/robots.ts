import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/auth/', '/verify'],
      },
    ],
    sitemap: 'https://driveimpact.io/sitemap.xml',
  }
}
