-- ====================================================================
-- ROEL Home Solutions - Initial Seed Data
-- ====================================================================

-- 1. Seed Categories
insert into public.categories (id, name, order_index) values
  ('Wall Solutions', 'Wall Solutions', 1),
  ('Premium Doors', 'Premium Doors', 2),
  ('Decorative Accents', 'Decorative Accents', 3)
on conflict (id) do nothing;

-- 2. Seed Products
insert into public.products (id, sku, category_id, name, short_desc, description, price, image_url, specs, applications, is_featured, status) values
  (
    'walnut-fluted-wall-panel',
    'ROEL / WL-01',
    'Wall Solutions',
    'Walnut Fluted Wall Panel',
    'A rhythmic wall surface with natural warmth and understated depth.',
    'A considered fluted wall finish designed to add texture, warmth and a sense of architectural rhythm. Ideal for feature walls, reception spaces and contemporary living areas.',
    '₹420 / sq. ft.',
    '/images/slat.webp',
    '["Natural wood-look finish", "Vertical fluted profile", "Interior wall applications", "Finish and dimensions on request"]'::jsonb,
    'Living room feature walls, entry foyers, media backdrops and hospitality interiors.',
    true,
    'published'
  ),
  (
    'signature-oak-door',
    'ROEL / DR-02',
    'Premium Doors',
    'Signature Oak Door',
    'Clean-lined door design with a richly detailed wood finish.',
    'An elegant, minimal door concept developed for interiors that value calm detailing and enduring appeal. Finishes, frame specifications and hardware can be discussed according to the project.',
    '₹18,500 / unit',
    '/images/door.webp',
    '["Contemporary flush profile", "Oak-tone decorative finish", "Door/frame sizes on request", "Hardware selection by project"]'::jsonb,
    'Bedrooms, private offices, apartments and modern residences.',
    true,
    'published'
  ),
  (
    'botanical-cnc-screen',
    'ROEL / DC-03',
    'Decorative Accents',
    'Botanical CNC Screen',
    'An expressive partition that filters light and creates quiet separation.',
    'A decorative screen inspired by organic forms. Its layered, sculptural character adds personality to open-plan homes, studios and reception spaces without visually closing them off.',
    '₹760 / sq. ft.',
    '/images/screen.webp',
    '["Botanical pattern concept", "Custom sizing available for review", "Decorative interior partition", "Multiple finish directions"]'::jsonb,
    'Zoning living and dining spaces, dividers, statement walls and reception areas.',
    true,
    'published'
  )
on conflict (id) do nothing;

-- 3. Seed Services
insert into public.services (id, number, name, tag, summary, description, image_url, items, order_index) values
  (
    'material-consultation',
    '01',
    'Material Consultation',
    'Discover the right fit',
    'Guidance on choosing surfaces, doors and finishes that feel right for your space.',
    'A good project begins with a clear sense of what each material needs to do. We help you explore suitable product directions, visual references and finish combinations for your design intent.',
    '/images/living.webp',
    '["Understand your space, aesthetic and priorities", "Review suitable products, textures and finishes", "Discuss budget ranges and practical considerations", "Prepare a clear shortlist for your project"]'::jsonb,
    1
  ),
  (
    'custom-design-detailing',
    '02',
    'Custom Design & Detailing',
    'Every detail considered',
    'Thoughtful detailing and fabrication coordination for distinctive architectural features.',
    'From feature walls to decorative screens, custom work benefits from early decisions and careful coordination. Our sample workflow demonstrates how details, sizes and finishes may be developed for review.',
    '/images/ceiling.webp',
    '["Explore wall-panel and decorative feature concepts", "Review sizes, drawings and layout requirements", "Coordinate finish and specification decisions", "Discuss installation and execution requirements"]'::jsonb,
    2
  ),
  (
    'project-material-supply',
    '03',
    'Project Material Supply',
    'From selection to site',
    'A more organised way to source architectural finishes for residential and commercial spaces.',
    'Whether you are planning a home or managing a professional design project, we aim to make product selection and sourcing more straightforward with clear communication and planned requirements.',
    '/images/exterior.webp',
    '["Discuss material schedules and quantities", "Coordinate product selections across categories", "Review availability and quotation requirements", "Plan dispatch and project communication"]'::jsonb,
    3
  )
on conflict (id) do nothing;

-- 4. Seed Projects
insert into public.projects (id, name, location, category, year, image_url, summary, story, is_demo, order_index) values
  (
    'the-verandah-residence',
    'The Verandah Residence',
    'Aluva, Kochi',
    'Residential',
    '2026',
    '/images/living.webp',
    'A warm family living space shaped by continuous timber lines and subtle lighting.',
    'An illustrative residential concept built around warm wood, an uninterrupted media wall and a restrained natural palette. The material language is soft and contemporary, placing emphasis on how small details influence the entire room.',
    true,
    1
  ),
  (
    'courtyard-studio',
    'The Courtyard Studio',
    'Kakkanad, Kochi',
    'Commercial',
    '2026',
    '/images/divider.webp',
    'An expressive botanical partition creates a gentle sense of privacy and structure.',
    'This concept explores how a decorative screen can bring visual interest into an open workspace. The patterned division lets light move through the environment while giving each zone its own character.',
    true,
    2
  ),
  (
    'northline-house',
    'Northline House',
    'Edappally, Kochi',
    'Residential',
    '2026',
    '/images/exterior.webp',
    'Architectural screening introduces warmth and rhythm to a bold modern façade.',
    'A study in layered architecture: crisp exterior lines are softened with warm-toned slats and considered linear lighting. The illustrative design balances privacy, texture and strong visual identity.',
    true,
    3
  )
on conflict (id) do nothing;

-- 5. Seed Site Settings
insert into public.site_settings (key, value) values
  ('phone', '"918111899991"'::jsonb),
  ('display_phone', '"+91 81118 99991"'::jsonb),
  ('email', '"info@roelhome.com"'::jsonb),
  ('location', '"Kochi, Kerala"'::jsonb),
  ('announcement', '"ROEL HOME SOLUTIONS / ARCHITECTURAL MATERIALS & SPACES"'::jsonb),
  ('hero_video_url', '"/videos/video.mp4"'::jsonb)
on conflict (key) do nothing;
