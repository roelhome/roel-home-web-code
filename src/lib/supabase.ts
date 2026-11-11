import { createClient } from '@supabase/supabase-js';
import { initialProducts, type Product } from '../data/products';
import { initialServices, type Service } from '../data/services';
import { initialProjects, type Project } from '../data/projects';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://phjuttpvdcotdouwcmsg.supabase.co';
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoanV0dHB2ZGNvdGRvdXdjbXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxMTQ5NzgsImV4cCI6MjEwOTY5MDk3OH0.4HReX1sXvIpv19yVXKt9ijBdTAvsTEVSYwMgsmSjaac';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface CategoryItem {
  id: string;
  name: string;
  order_index?: number;
}

/**
 * Fetch all categories
 */
export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (error || !data || data.length === 0) {
      return [
        { id: 'Wall Solutions', name: 'Wall Solutions', order_index: 1 },
        { id: 'Premium Doors', name: 'Premium Doors', order_index: 2 },
        { id: 'Decorative Accents', name: 'Decorative Accents', order_index: 3 }
      ];
    }
    return data;
  } catch (err) {
    return [
      { id: 'Wall Solutions', name: 'Wall Solutions', order_index: 1 },
      { id: 'Premium Doors', name: 'Premium Doors', order_index: 2 },
      { id: 'Decorative Accents', name: 'Decorative Accents', order_index: 3 }
    ];
  }
}

/**
 * Fetch all published products from Supabase, falling back to static seed if table is empty or offline
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return initialProducts;
    }

    return data.map((item: any) => ({
      id: item.id,
      sku: item.sku,
      category: item.category_id || 'Architectural Material',
      name: item.name,
      short: item.short_desc || '',
      description: item.description || '',
      price: item.price || '',
      image: item.image_url || '/images/slat.webp',
      specs: Array.isArray(item.specs) ? item.specs : [],
      applications: item.applications || '',
      is_featured: !!item.is_featured,
      status: item.status || 'published',
      options: Array.isArray(item.options) ? item.options : [],
      variants: Array.isArray(item.variants)
        ? item.variants.map((v: any) => ({
            id: v.id || `var_${Math.random().toString(36).substring(2, 7)}`,
            attribute_type: v.attribute_type || 'Finish / Color',
            name: v.name || v.title || '',
            title: v.title || v.name || '',
            sku: v.sku || '',
            price: v.price || item.price || '',
            options: v.options && typeof v.options === 'object' ? v.options : (v.attribute_type ? { [v.attribute_type]: v.name } : {}),
            is_available: v.is_available !== false,
            has_color: v.has_color !== undefined ? v.has_color : !!v.color,
            color: v.color || '',
            images: Array.isArray(v.images) ? v.images : []
          }))
        : [],
      gallery: Array.isArray(item.gallery) ? item.gallery : []
    }));
  } catch (err) {
    console.warn('Falling back to static products:', err);
    return initialProducts;
  }
}

/**
 * Fetch featured products for homepage
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  const all = await getProducts();
  const featured = all.filter((p) => p.is_featured);
  return featured.length > 0 ? featured : all;
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      // Fallback to local
      const products = await getProducts();
      return products.find((p) => p.id === id);
    }

    return {
      id: data.id,
      sku: data.sku,
      category: data.category_id || 'Architectural Material',
      name: data.name,
      short: data.short_desc || '',
      description: data.description || '',
      price: data.price || '',
      image: data.image_url || '/images/slat.webp',
      specs: Array.isArray(data.specs) ? data.specs : [],
      applications: data.applications || '',
      is_featured: !!data.is_featured,
      status: data.status || 'published',
      options: Array.isArray(data.options) ? data.options : [],
      variants: Array.isArray(data.variants)
        ? data.variants.map((v: any) => ({
            id: v.id || `var_${Math.random().toString(36).substring(2, 7)}`,
            attribute_type: v.attribute_type || 'Finish / Color',
            name: v.name || v.title || '',
            title: v.title || v.name || '',
            sku: v.sku || '',
            price: v.price || data.price || '',
            options: v.options && typeof v.options === 'object' ? v.options : (v.attribute_type ? { [v.attribute_type]: v.name } : {}),
            is_available: v.is_available !== false,
            has_color: v.has_color !== undefined ? v.has_color : !!v.color,
            color: v.color || '',
            images: Array.isArray(v.images) ? v.images : []
          }))
        : [],
      gallery: Array.isArray(data.gallery) ? data.gallery : []
    };
  } catch (err) {
    const products = await getProducts();
    return products.find((p) => p.id === id);
  }
}

/**
 * Fetch all services
 */
export async function getServices(): Promise<Service[]> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('order_index', { ascending: true });

    if (error || !data || data.length === 0) {
      return initialServices;
    }

    return data.map((item: any) => ({
      id: item.id,
      number: item.number,
      name: item.name,
      tag: item.tag || '',
      summary: item.summary || '',
      description: item.description || '',
      image: item.image_url || '/images/living.webp',
      items: Array.isArray(item.items) ? item.items : []
    }));
  } catch (err) {
    console.warn('Falling back to static services:', err);
    return initialServices;
  }
}

/**
 * Fetch all projects
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('order_index', { ascending: true });

    if (error || !data || data.length === 0) {
      return initialProjects;
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      location: item.location || 'Kochi, Kerala',
      category: item.category || 'Residential',
      year: item.year || '2026',
      image: item.image_url || '/images/living.webp',
      summary: item.summary || '',
      story: item.story || '',
      isDemo: item.is_demo
    }));
  } catch (err) {
    console.warn('Falling back to static projects:', err);
    return initialProjects;
  }
}

/**
 * Fetch a single project by ID
 */
export async function getProjectById(id: string): Promise<Project | undefined> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      const projects = await getProjects();
      return projects.find((p) => p.id === id);
    }

    return {
      id: data.id,
      name: data.name,
      location: data.location || 'Kochi, Kerala',
      category: data.category || 'Residential',
      year: data.year || '2026',
      image: data.image_url || '/images/living.webp',
      summary: data.summary || '',
      story: data.story || '',
      isDemo: data.is_demo
    };
  } catch (err) {
    console.warn('Falling back to local projects for id:', id, err);
    const projects = await getProjects();
    return projects.find((p) => p.id === id);
  }
}

export interface HeroSlide {
  id: string;
  pillar: string;
  title: string;
  subtitle?: string;
  desc: string;
  image: string;
  imageMobile?: string;
  alt?: string;
  ctaText?: string;
  ctaLink?: string;
  order_index?: number;
  is_active?: boolean;
  eyebrow: Array<{ text: string; active: boolean }>;
}

export const defaultHeroSlides: HeroSlide[] = [
  {
    id: 'doors',
    pillar: 'DOORS',
    image: '/images/hero-doors.jpg',
    imageMobile: '/images/hero-doors-mobile.jpg',
    alt: 'Roel Architectural modern living interior with illuminated walnut door and wood slat panels',
    eyebrow: [
      { text: 'DOORS', active: true },
      { text: 'WALL SOLUTIONS', active: false },
      { text: 'SURFACES', active: false }
    ],
    title: 'Architectural<br />Solutions for<br />Modern Living',
    desc: 'Premium distinctive doors, engineered frames and bespoke entrance systems that bring timeless design, security and lasting craftsmanship to your space.',
    ctaText: 'EXPLORE COLLECTIONS',
    ctaLink: '/catalogue',
    order_index: 1,
    is_active: true
  },
  {
    id: 'walls',
    pillar: 'WALL SOLUTIONS',
    image: '/images/hero-walls.jpg',
    imageMobile: '/images/hero-walls-mobile.jpg',
    alt: 'Luxury architectural wall systems, walnut fluted wood slats, and warm acoustic paneling',
    eyebrow: [
      { text: 'DOORS', active: false },
      { text: 'WALL SOLUTIONS', active: true },
      { text: 'SURFACES', active: false }
    ],
    title: 'Bespoke Paneling<br />& Architectural<br />Wall Systems',
    desc: 'Acoustic fluted slats, luxury wood claddings and refined feature wall systems designed to add depth, warmth and textural drama to contemporary interiors.',
    ctaText: 'EXPLORE WALL SYSTEMS',
    ctaLink: '/catalogue',
    order_index: 2,
    is_active: true
  },
  {
    id: 'surfaces',
    pillar: 'SURFACES',
    image: '/images/hero-surfaces.jpg',
    imageMobile: '/images/hero-surfaces-mobile.jpg',
    alt: 'Distinctive bookmatched marble surfaces, fine wood veneers and luxury textures',
    eyebrow: [
      { text: 'DOORS', active: false },
      { text: 'WALL SOLUTIONS', active: false },
      { text: 'SURFACES', active: true }
    ],
    title: 'Curated Textures<br />& Distinctive<br />Surface Materials',
    desc: 'Bookmatched natural stone, fine architectural veneers and high-performance tactile surface materials curated for refined living spaces.',
    ctaText: 'EXPLORE SURFACES',
    ctaLink: '/catalogue',
    order_index: 3,
    is_active: true
  }
];

/**
 * Fetch all active hero slides from Supabase, ordered by order_index
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error || !data || data.length === 0) {
      return defaultHeroSlides;
    }

    const allPillars = Array.from(new Set(data.map((d: any) => d.pillar || 'ARCHITECTURAL').filter(Boolean)));
    const pillarList = allPillars.length > 0 ? (allPillars as string[]) : ['DOORS', 'WALL SOLUTIONS', 'SURFACES'];

    return data.map((item: any) => ({
      id: item.id,
      pillar: item.pillar || 'ARCHITECTURAL',
      title: item.title,
      subtitle: item.subtitle || '',
      desc: item.description || '',
      image: item.image_url || '/images/hero-doors.jpg',
      imageMobile: item.mobile_image_url || item.image_url || '/images/hero-doors.jpg',
      alt: item.alt_text || item.title?.replace(/<[^>]*>/g, ' ') || 'ROEL Architectural Living',
      ctaText: item.cta_text || 'EXPLORE COLLECTIONS',
      ctaLink: item.cta_link || '/catalogue',
      order_index: item.order_index ?? 1,
      is_active: item.is_active !== false,
      eyebrow: pillarList.map((p) => ({
        text: p,
        active: p === (item.pillar || 'ARCHITECTURAL')
      }))
    }));
  } catch (err) {
    console.warn('Falling back to default hero slides:', err);
    return defaultHeroSlides;
  }
}

