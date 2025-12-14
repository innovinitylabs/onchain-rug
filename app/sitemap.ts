import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://onchainrugs.xyz'

  // Static pages with their priorities and change frequencies
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/generator`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rug-market`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/explorer`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/market`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    },
  ]

  // Dynamic NFT pages - we'll generate these based on the collection
  // For now, we'll create placeholder entries for the expected range
  // In production, this should fetch from your database/API
  const nftPages: MetadataRoute.Sitemap = []

  // Generate entries for NFTs 1-1000 (adjust based on your actual collection)
  // This should be replaced with actual NFT data fetching
  for (let i = 1; i <= 1000; i++) {
    nftPages.push({
      url: `${baseUrl}/rug-market/${i}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })
  }

  return [...staticPages, ...nftPages]
}
