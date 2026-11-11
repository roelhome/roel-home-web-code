export interface ProductOptionValue {
  name: string;        // e.g. "Wooden", "Steel", "Red", "Yellow"
  color?: string;      // HEX code if swatch (e.g. "#e11d48")
}

export interface ProductOption {
  id: string;          // e.g. "opt_material"
  name: string;        // e.g. "Material", "Color", "Size"
  values: ProductOptionValue[];
}

export interface ProductVariant {
  id: string;
  name: string;        // Combination title, e.g. "Wooden / Red"
  title?: string;
  sku: string;         // e.g. "ROEL-WD-RED"
  price: string;       // Dedicated price for this exact combination, e.g. "₹12,000"
  images: string[];    // Cloudflare R2 photos for this exact combination
  options?: Record<string, string>; // e.g. { "Material": "Wooden", "Color": "Red" }
  is_available?: boolean; // Can be toggled false if this pair is not produced
  
  // Backward compatibility fields
  attribute_type?: string;
  has_color?: boolean;
  color?: string;
}

export interface Product {
  id: string;
  sku: string;
  category: string;
  name: string;
  short: string;
  description: string;
  price: string;
  image: string;
  specs: string[];
  applications: string;
  is_featured?: boolean;
  status?: string;
  options?: ProductOption[];
  variants?: ProductVariant[];
  gallery?: string[];
  created_at?: string;
}

export const initialProducts: Product[] = [
  {
    id: 'walnut-fluted-wall-panel',
    sku: 'ROEL / WL-01',
    category: 'Wall Solutions',
    name: 'Walnut Fluted Wall Panel',
    short: 'A rhythmic wall surface with natural warmth and understated depth.',
    description: 'A considered fluted wall finish designed to add texture, warmth and a sense of architectural rhythm. Ideal for feature walls, reception spaces and contemporary living areas.',
    price: '₹420 / sq. ft.',
    image: '/images/slat.webp',
    specs: [
      'Natural wood-look finish',
      'Vertical fluted profile',
      'Interior wall applications',
      'Finish and dimensions on request'
    ],
    applications: 'Living room feature walls, entry foyers, media backdrops and hospitality interiors.',
    is_featured: true,
    status: 'published',
    variants: [
      {
        id: 'var_wl01_walnut',
        attribute_type: 'Finish / Color',
        name: 'Natural Walnut',
        sku: 'ROEL/WL-01-NW',
        price: '₹420 / sq. ft.',
        has_color: true,
        color: '#5c4033',
        images: ['/images/slat.webp']
      },
      {
        id: 'var_wl01_oak',
        attribute_type: 'Finish / Color',
        name: 'Smoked Oak',
        sku: 'ROEL/WL-01-SO',
        price: '₹450 / sq. ft.',
        has_color: true,
        color: '#8b6c42',
        images: ['/images/living.webp']
      }
    ],
    gallery: ['/images/slat.webp', '/images/living.webp']
  },
  {
    id: 'signature-oak-door',
    sku: 'ROEL / DR-02',
    category: 'Premium Doors',
    name: 'Signature Oak Door',
    short: 'Clean-lined door design with a richly detailed wood finish.',
    description: 'An elegant, minimal door concept developed for interiors that value calm detailing and enduring appeal. Finishes, frame specifications and hardware can be discussed according to the project.',
    price: '₹18,500 / unit',
    image: '/images/door.webp',
    specs: [
      'Contemporary flush profile',
      'Oak-tone decorative finish',
      'Door/frame sizes on request',
      'Hardware selection by project'
    ],
    applications: 'Bedrooms, private offices, apartments and modern residences.',
    is_featured: true,
    status: 'published',
    variants: [
      {
        id: 'var_dr02_7x3',
        attribute_type: 'Size / Dimensions',
        name: '7 ft × 3 ft (Standard)',
        sku: 'ROEL/DR-02-7X3',
        price: '₹18,500 / unit',
        has_color: false,
        images: ['/images/door.webp']
      },
      {
        id: 'var_dr02_8x4',
        attribute_type: 'Size / Dimensions',
        name: '8 ft × 4 ft (Grand Entrance)',
        sku: 'ROEL/DR-02-8X4',
        price: '₹24,500 / unit',
        has_color: false,
        images: ['/images/door.webp']
      }
    ],
    gallery: ['/images/door.webp']
  },
  {
    id: 'botanical-cnc-screen',
    sku: 'ROEL / DC-03',
    category: 'Decorative Accents',
    name: 'Botanical CNC Screen',
    short: 'An expressive partition that filters light and creates quiet separation.',
    description: 'A decorative screen inspired by organic forms. Its layered, sculptural character adds personality to open-plan homes, studios and reception spaces without visually closing them off.',
    price: '₹760 / sq. ft.',
    image: '/images/screen.webp',
    specs: [
      'Botanical pattern concept',
      'Custom sizing available for review',
      'Decorative interior partition',
      'Multiple finish directions'
    ],
    applications: 'Zoning living and dining spaces, dividers, statement walls and reception areas.',
    is_featured: true,
    status: 'published',
    variants: [
      {
        id: 'var_dc03_champagne',
        attribute_type: 'Finish / Color',
        name: 'Champagne Gold Anodized',
        sku: 'ROEL/DC-03-CG',
        price: '₹760 / sq. ft.',
        has_color: true,
        color: '#e5bf8c',
        images: ['/images/screen.webp']
      },
      {
        id: 'var_dc03_matte_black',
        attribute_type: 'Finish / Color',
        name: 'Matte Architectural Black',
        sku: 'ROEL/DC-03-MAB',
        price: '₹720 / sq. ft.',
        has_color: true,
        color: '#19120c',
        images: ['/images/divider.webp']
      }
    ],
    gallery: ['/images/screen.webp', '/images/divider.webp']
  }
];
