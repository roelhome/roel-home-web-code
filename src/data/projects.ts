export interface Project {
  id: string;
  name: string;
  location: string;
  category: string;
  year: string;
  image: string;
  summary: string;
  story: string;
  isDemo?: boolean;
}

export const initialProjects: Project[] = [
  {
    id: 'the-verandah-residence',
    name: 'The Verandah Residence',
    location: 'Aluva, Kochi',
    category: 'Residential',
    year: '2026',
    image: '/images/living.webp',
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
    image: '/images/divider.webp',
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
    image: '/images/exterior.webp',
    summary: 'Architectural screening introduces warmth and rhythm to a bold modern façade.',
    story: 'A study in layered architecture: crisp exterior lines are softened with warm-toned slats and considered linear lighting. The illustrative design balances privacy, texture and strong visual identity.',
    isDemo: true
  }
];
