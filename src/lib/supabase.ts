import { createClient } from '@supabase/supabase-js';
import { initialProducts, type Product } from '../data/products';
import { initialServices, type Service } from '../data/services';
import { initialProjects, type Project } from '../data/projects';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://phjuttpvdcotdouwcmsg.supabase.co';
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoanV0dHB2ZGNvdGRvdXdjbXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxMTQ5NzgsImV4cCI6MjEwOTY5MDk3OH0.4HReX1sXvIpv19yVXKt9ijBdTAvsTEVSYwMgsmSjaac';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch all products from Supabase, falling back to static seed if table is empty or offline
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'published');

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
      is_featured: item.is_featured
    }));
  } catch (err) {
    console.warn('Falling back to static products:', err);
    return initialProducts;
  }
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find(p => p.id === id);
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
