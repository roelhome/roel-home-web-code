export interface Service {
  id: string;
  number: string;
  name: string;
  tag: string;
  summary: string;
  description: string;
  image: string;
  items: string[];
}

export const initialServices: Service[] = [
  {
    id: 'material-consultation',
    number: '01',
    name: 'Material Consultation',
    tag: 'Discover the right fit',
    image: '/images/living.webp',
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
    image: '/images/ceiling.webp',
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
    image: '/images/exterior.webp',
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
