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
    is_featured: true
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
    is_featured: true
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
    is_featured: true
  }
];
