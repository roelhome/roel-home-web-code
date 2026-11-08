export const products = [
  {
    id: 'walnut-fluted-wall-panel',
    sku: 'ROEL / WL-01',
    category: 'Wall Solutions',
    name: 'Walnut Fluted Wall Panel',
    short: 'A rhythmic wall surface with natural warmth and understated depth.',
    description: 'A considered fluted wall finish designed to add texture, warmth and a sense of architectural rhythm. Ideal for feature walls, reception spaces and contemporary living areas.',
    price: '₹420 / sq. ft.',
    image: 'slat',
    specs: [
      'Natural wood-look finish',
      'Vertical fluted profile',
      'Interior wall applications',
      'Finish and dimensions on request'
    ],
    applications: 'Living room feature walls, entry foyers, media backdrops and hospitality interiors.'
  },
  {
    id: 'signature-oak-door',
    sku: 'ROEL / DR-02',
    category: 'Premium Doors',
    name: 'Signature Oak Door',
    short: 'Clean-lined door design with a richly detailed wood finish.',
    description: 'An elegant, minimal door concept developed for interiors that value calm detailing and enduring appeal. Finishes, frame specifications and hardware can be discussed according to the project.',
    price: '₹18,500 / unit',
    image: 'door',
    specs: [
      'Contemporary flush profile',
      'Oak-tone decorative finish',
      'Door/frame sizes on request',
      'Hardware selection by project'
    ],
    applications: 'Bedrooms, private offices, apartments and modern residences.'
  },
  {
    id: 'botanical-cnc-screen',
    sku: 'ROEL / DC-03',
    category: 'Decorative Accents',
    name: 'Botanical CNC Screen',
    short: 'An expressive partition that filters light and creates quiet separation.',
    description: 'A decorative screen inspired by organic forms. Its layered, sculptural character adds personality to open-plan homes, studios and reception spaces without visually closing them off.',
    price: '₹760 / sq. ft.',
    image: 'screen',
    specs: [
      'Botanical pattern concept',
      'Custom sizing available for review',
      'Decorative interior partition',
      'Multiple finish directions'
    ],
    applications: 'Zoning living and dining spaces, dividers, statement walls and reception areas.'
  }
];

export const services = [
  {
    id: 'material-consultation',
    number: '01',
    name: 'Material Consultation',
    tag: 'Discover the right fit',
    image: 'living',
    summary: 'Guidance on choosing surfaces, doors and finishes that feel right for your space.',
    description: 'A good project begins with a clear sense of what each material needs to do. We help you explore suitable product directions, visual references and finish combinations for your design intent.',
    items: [
      'Understand your space, aesthetic and priorities',
      'Review suitable products, textures and finishes',
      'Discuss budget ranges and practical considerations',
      'Prepare a clear shortlist for your project'
    ]
  },
  {
    id: 'custom-design-detailing',
    number: '02',
    name: 'Custom Design & Detailing',
    tag: 'Every detail considered',
    image: 'ceiling',
    summary: 'Thoughtful detailing and fabrication coordination for distinctive architectural features.',
    description: 'From feature walls to decorative screens, custom work benefits from early decisions and careful coordination. Our sample workflow demonstrates how details, sizes and finishes may be developed for review.',
    items: [
      'Explore wall-panel and decorative feature concepts',
      'Review sizes, drawings and layout requirements',
      'Coordinate finish and specification decisions',
      'Discuss installation and execution requirements'
    ]
  },
  {
    id: 'project-material-supply',
    number: '03',
    name: 'Project Material Supply',
    tag: 'From selection to site',
    image: 'exterior',
    summary: 'A more organised way to source architectural finishes for residential and commercial spaces.',
    description: 'Whether you are planning a home or managing a professional design project, we aim to make product selection and sourcing more straightforward with clear communication and planned requirements.',
    items: [
      'Discuss material schedules and quantities',
      'Coordinate product selections across categories',
      'Review availability and quotation requirements',
      'Plan dispatch and project communication'
    ]
  }
];

export const projects = [
  {
    id: 'the-verandah-residence',
    name: 'The Verandah Residence',
    location: 'Aluva, Kochi',
    category: 'Residential',
    year: '2026',
    image: 'living',
    summary: 'A warm family living space shaped by continuous timber lines and subtle lighting.',
    story: 'An illustrative residential concept built around warm wood, an uninterrupted media wall and a restrained natural palette. The material language is soft and contemporary, placing emphasis on how small details influence the entire room.',
    isDemo: true
  },
  {
    id: 'courtyard-studio',
    name: 'The Courtyard Studio',
    location: 'Kakkanad, Kochi',
    category: 'Commercial',
    year: '2026',
    image: 'divider',
    summary: 'An expressive botanical partition creates a gentle sense of privacy and structure.',
    story: 'This concept explores how a decorative screen can bring visual interest into an open workspace. The patterned division lets light move through the environment while giving each zone its own character.',
    isDemo: true
  },
  {
    id: 'northline-house',
    name: 'Northline House',
    location: 'Edappally, Kochi',
    category: 'Residential',
    year: '2026',
    image: 'exterior',
    summary: 'Architectural screening introduces warmth and rhythm to a bold modern façade.',
    story: 'A study in layered architecture: crisp exterior lines are softened with warm-toned slats and considered linear lighting. The illustrative design balances privacy, texture and strong visual identity.',
    isDemo: true
  }
];

export function imgSrc(key) {
  if (!key) return '/images/hero.webp';
  if (key.startsWith('/') || key.startsWith('http') || key.startsWith('data:')) return key;
  return `/images/${key}.webp`;
}

export function waUrl(text) {
  return `https://wa.me/918111899991?text=${encodeURIComponent(text)}`;
}
