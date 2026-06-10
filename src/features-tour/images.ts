/* Photos for the Features tour.
   - Material slots (marble, floor tiles, laminate) use real material photos
     committed under /public/images/features (sourced via Openverse / Flickr CC).
   - Scene slots (living, kitchen, foyer, etc.) use verified Unsplash interiors.
   These are stand-ins; swap for licensed brand photography before launch. */

const U = (id: string, w = 640) => `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format&fit=crop`;

// Local material textures (subject fills the frame, so crops always look right).
const MARBLE = '/images/features/marble.jpg';
const MARBLE2 = '/images/features/marble2.jpg';
const TILE1 = '/images/features/tile1.jpg';
const TILE2 = '/images/features/tile2.jpg';
const TILE3 = '/images/features/tile3.jpg';
const LAMINATE = '/images/features/laminate.jpg';

export const IMG = {
  livingWarm: U('1586023492125-27b2c045efd7'), // warm minimal living room
  living2:    U('1600210492486-724fe5c67fb0'), // cosy living/dining
  foyer:      U('1631679706909-1844bbd07221'), // entryway with mirror niche
  wood:       U('1597072689227-8882273e8f6a'), // minimal wood console
  kitchen:    U('1600585152220-90363fe7e115'), // clean modern kitchen
  paint:      U('1562259949-e8e7689d7828'),     // paint roller + swatch
  lighting:   U('1513506003901-1e6a229e2d15'),  // designer pendant
  bath:       U('1620626011761-996317b8d101'),  // bright bathroom vanity
  bedroom:    U('1505693416388-ac5ce068fe85'),  // bedroom, tufted headboard
  construction: U('1503387762-592deb58ef4e'),   // plans / on-site
  marble: MARBLE, laminate: LAMINATE, tile1: TILE1,
};

// Explicit per-card images for the most-scrutinised sections.
export const DESIGN_IMG: Record<string, string> = {
  r1: IMG.livingWarm,  // Warm minimal living
  r2: IMG.foyer,       // Arched foyer niche
  r3: IMG.wood,        // Fluted wood TV unit
  c1: MARBLE,          // Statuario marble floor
  c2: IMG.kitchen,     // Matte modular kitchen
  x1: LAMINATE,        // Glossy laminate floor
};

export const APPROVAL_IMG: Record<string, string> = {
  marble:  MARBLE,      // Italian Marble — Statuario
  kitchen: IMG.kitchen, // Modular Kitchen — Hacker
  paint:   IMG.paint,   // Premium Paint — Asian Royale
  lights:  IMG.lighting,// Designer Lighting — Foyer
};

// Procurement request is "Floor Tiles" → every vendor shows tile options.
export const VENDOR_IMG: Record<string, string> = {
  s1: TILE1,
  s2: TILE2,
  s3: TILE3,
};

// Keyword fallback for smaller thumbnails (segment design tab, site diary).
const RULES: [RegExp, string][] = [
  [/edge detail/i, MARBLE2],
  [/marble|statuario|floor laid/i, MARBLE],
  [/laminate|quartz|deck tile|\bdeck\b/i, LAMINATE],
  [/vitrified|pallet|\btiles?\b/i, TILE1],
  [/kitchen|modular|cabinet|matte handle|countertop|backsplash/i, IMG.kitchen],
  [/wardrobe|headboard|bedroom|master/i, IMG.bedroom],
  [/vanity|bath/i, IMG.bath],
  [/arch|foyer|sconce|niche|stair/i, IMG.foyer],
  [/light|chandelier|cove/i, IMG.lighting],
  [/paint/i, IMG.paint],
  [/fluted|walnut|\bwood\b|oak|tv unit/i, IMG.wood],
  [/pipe|pressure|plumb|gauge|covered|rain|waterproof/i, IMG.construction],
  [/planter|balcony|garden/i, IMG.living2],
  [/sofa|moodboard|linen|living|catalogue|vendor/i, IMG.livingWarm],
];

export function imgFor(label: string, fallback = IMG.livingWarm): string {
  for (const [re, url] of RULES) if (re.test(label)) return url;
  return fallback;
}
