import { IptvCategory, IptvCountry, FeaturedPreset, IptvOrgCatalog } from './types.js';

let cachedCatalog: IptvOrgCatalog | null = null;
let lastFetchedAt = 0;
const CATALOG_TTL = 60 * 60 * 1000; // 1 hour

export const FEATURED_PRESETS: FeaturedPreset[] = [
  {
    id: 'free-tv-global',
    name: 'Free-TV Global Master',
    description: '2,000+ public worldwide channels sorted by 97 countries',
    badge: 'Popular',
    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
    icon: 'tv',
  },
  {
    id: 'iptv-org-categories',
    name: 'IPTV-Org: Category Index',
    description: '8,000+ channels grouped by genre (News, Sports, Cinema, etc.)',
    badge: 'Curated',
    url: 'https://iptv-org.github.io/iptv/index.category.m3u',
    icon: 'layout-grid',
  },
  {
    id: 'iptv-org-sports',
    name: 'IPTV-Org: Live Sports',
    description: '500+ sports broadcasts, football, racing, combat, athletics',
    badge: '500+ Ch',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    icon: 'trophy',
  },
  {
    id: 'iptv-org-movies',
    name: 'IPTV-Org: Movies & Cinema',
    description: '800+ cinema channels, classics, series, Hollywood & world movies',
    badge: '800+ Ch',
    url: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
    icon: 'film',
  },
  {
    id: 'iptv-org-news',
    name: 'IPTV-Org: 24/7 Global News',
    description: '1,000+ live news broadcasts from major networks worldwide',
    badge: '1000+ Ch',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    icon: 'newspaper',
  },
  {
    id: 'iptv-org-music',
    name: 'IPTV-Org: Music & Concerts',
    description: '700+ music TV channels, rock, pop, hip-hop, electronic, festivals',
    badge: '700+ Ch',
    url: 'https://iptv-org.github.io/iptv/categories/music.m3u',
    icon: 'music',
  },
  {
    id: 'iptv-org-india',
    name: 'IPTV-Org: India Live TV 🇮🇳',
    description: '750+ Indian channels (DD, ABP, Zee, Aaj Tak, News, Entertainment)',
    badge: '750+ Ch',
    url: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    icon: 'globe',
  },
  {
    id: 'iptv-org-usa',
    name: 'IPTV-Org: United States 🇺🇸',
    description: '350+ American public channels, news, weather, legislative, sports',
    badge: '350+ Ch',
    url: 'https://iptv-org.github.io/iptv/countries/us.m3u',
    icon: 'globe',
  },
  {
    id: 'iptv-org-uk',
    name: 'IPTV-Org: United Kingdom 🇬🇧',
    description: '180+ British channels, BBC, ITV, Sky News, factual, entertainment',
    badge: '180+ Ch',
    url: 'https://iptv-org.github.io/iptv/countries/uk.m3u',
    icon: 'globe',
  },
];

const FALLBACK_CATEGORIES: Array<{ id: string; name: string; description?: string }> = [
  { id: 'animation', name: 'Animation', description: '2D/3D cartoon & animated programming' },
  { id: 'auto', name: 'Auto', description: 'Cars, motorsports, automotive shows' },
  { id: 'business', name: 'Business', description: 'Markets, finance, and economics' },
  { id: 'classic', name: 'Classic', description: 'Vintage shows and cinema from earlier eras' },
  { id: 'comedy', name: 'Comedy', description: 'Stand-up, sitcoms, and humor' },
  { id: 'cooking', name: 'Cooking & Food', description: 'Culinary shows and recipes' },
  { id: 'culture', name: 'Culture & Arts', description: 'Art, history, and cultural documentaries' },
  { id: 'documentary', name: 'Documentary', description: 'Real-world events and nature' },
  { id: 'education', name: 'Education', description: 'Academic and instructional TV' },
  { id: 'entertainment', name: 'Entertainment', description: 'General variety and reality series' },
  { id: 'family', name: 'Family', description: 'All-ages family entertainment' },
  { id: 'general', name: 'General', description: 'Broad mix of programming' },
  { id: 'kids', name: 'Kids', description: 'Children programming and cartoons' },
  { id: 'legislative', name: 'Legislative', description: 'Parliament and government channels' },
  { id: 'lifestyle', name: 'Lifestyle', description: 'Fashion, home, and health' },
  { id: 'movies', name: 'Movies', description: 'Feature films and cinema' },
  { id: 'music', name: 'Music', description: 'Music videos, tracks, and live concerts' },
  { id: 'news', name: 'News', description: '24/7 breaking news and current affairs' },
  { id: 'outdoor', name: 'Outdoor', description: 'Nature, hunting, fishing, adventure' },
  { id: 'relax', name: 'Relax', description: 'Ambient scenery and calming audio' },
  { id: 'religious', name: 'Religious', description: 'Faith-based and spiritual programming' },
  { id: 'science', name: 'Science', description: 'Scientific discoveries and technology' },
  { id: 'shop', name: 'Shop', description: 'Home shopping networks' },
  { id: 'sports', name: 'Sports', description: 'Live matches, analysis, and sports shows' },
  { id: 'travel', name: 'Travel', description: 'Global travel and world exploration' },
  { id: 'weather', name: 'Weather', description: 'Forecasts, radar, and climate' },
];

export async function getIptvOrgCatalog(): Promise<IptvOrgCatalog> {
  const now = Date.now();
  if (cachedCatalog && now - lastFetchedAt < CATALOG_TTL) {
    return cachedCatalog;
  }

  let categories: IptvCategory[] = [];
  let countries: IptvCountry[] = [];

  try {
    // 1. Fetch categories
    const catRes = await fetch('https://iptv-org.github.io/api/categories.json', {
      headers: { 'User-Agent': 'OpenIPTV/1.0' },
    });
    if (catRes.ok) {
      const data = await catRes.json();
      categories = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        url: `https://iptv-org.github.io/iptv/categories/${c.id}.m3u`,
      }));
    }
  } catch (err) {
    console.warn('[IPTV-Org] Failed to fetch categories API, using fallback:', err);
  }

  if (categories.length === 0) {
    categories = FALLBACK_CATEGORIES.map((c) => ({
      ...c,
      url: `https://iptv-org.github.io/iptv/categories/${c.id}.m3u`,
    }));
  }

  try {
    // 2. Fetch countries
    const countryRes = await fetch('https://iptv-org.github.io/api/countries.json', {
      headers: { 'User-Agent': 'OpenIPTV/1.0' },
    });
    if (countryRes.ok) {
      const data = await countryRes.json();
      countries = data.map((c: any) => ({
        code: c.code,
        name: c.name,
        flag: c.flag || '🌐',
        languages: c.languages || [],
        url: `https://iptv-org.github.io/iptv/countries/${c.code.toLowerCase()}.m3u`,
      }));
    }
  } catch (err) {
    console.warn('[IPTV-Org] Failed to fetch countries API:', err);
  }

  cachedCatalog = {
    featured: FEATURED_PRESETS,
    categories,
    countries,
    updatedAt: now,
  };

  lastFetchedAt = now;
  return cachedCatalog;
}
