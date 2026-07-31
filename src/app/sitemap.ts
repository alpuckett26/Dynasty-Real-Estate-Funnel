import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import neighborhoodsData from '../../data/neighborhoods.json';

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/buy', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/sell-your-home', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/get-ready', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/down-payment-assistance', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/credit-path', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/relocate', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/affordability', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/mortgage-calculator', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/rent-vs-buy', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/book', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/register', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  const neighborhoodEntries = (neighborhoodsData as { slug: string }[]).map(({ slug }) => ({
    url: `${SITE_URL}/neighborhood/${slug}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...neighborhoodEntries];
}
