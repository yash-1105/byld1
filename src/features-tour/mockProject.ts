/* ============================================================
   Shared project data — "Whitefield Luxury Villa".
   Ported from the design handoff (prototype/src/data.js).
   Every section reads from this so figures stay consistent
   (Kitchen is the deliberate overspend: ₹12.8L / ₹12.0L).
   ============================================================ */

export type SegmentStatus = 'in-progress' | 'over' | 'complete' | 'pending';

export interface Segment {
  id: string;
  name: string;
  progress: number;
  budget: number; // ₹ Lakhs
  spent: number;  // ₹ Lakhs
  tasks: number;
  contractor: string;
  status: SegmentStatus;
}

export interface Approval {
  id: string; title: string; meta: string; amount: string; img: string; role: string; note: string;
}

export interface BudgetCategory { name: string; alloc: number; spent: number; color: string }
export interface Milestone { label: string; amount: string; done: boolean }
export interface Budget {
  total: number; allocated: number; spent: number; remaining: number;
  categories: BudgetCategory[]; milestones: Milestone[];
}

export interface Supplier {
  id: string; name: string; rating: number; reviews: number; quote: number; unit: string;
  days: number; distance: string; impact: 'under' | 'on' | 'over'; warranty: string; tag: string;
}

export interface TimelineTask {
  id: string; name: string; status: 'complete' | 'in-progress' | 'upcoming'; start: string; end: string;
  team: string; risk: string; dep: string[];
}

export interface DiaryEntry {
  id: string; date: string; day: string; weather: 'sun' | 'cloud' | 'rain'; temp: string;
  title: string; body: string; segment: string; photos: string[]; delivery: string | null;
}

export interface DesignCard { id: string; title: string; tag: string; img: string; note: string }
export interface DesignBoard { rough: DesignCard[]; confirmed: DesignCard[]; discarded: DesignCard[] }

export const SEGMENTS: Segment[] = [
  { id: 'living',  name: 'Living Room',    progress: 72,  budget: 9.5,  spent: 7.1,  tasks: 3, contractor: 'Rajesh Stoneworks', status: 'in-progress' },
  { id: 'kitchen', name: 'Kitchen',        progress: 45,  budget: 12.0, spent: 12.8, tasks: 6, contractor: 'Modular Concepts',   status: 'over' },
  { id: 'master',  name: 'Master Bedroom', progress: 88,  budget: 8.0,  spent: 6.4,  tasks: 1, contractor: 'Interio Build Co.',  status: 'in-progress' },
  { id: 'bath',    name: 'Bathroom',       progress: 100, budget: 5.5,  spent: 5.2,  tasks: 0, contractor: 'AquaFit Plumbing',  status: 'complete' },
  { id: 'foyer',   name: 'Foyer & Stairs', progress: 30,  budget: 6.0,  spent: 1.9,  tasks: 4, contractor: 'Rajesh Stoneworks', status: 'pending' },
  { id: 'balcony', name: 'Balcony Deck',   progress: 12,  budget: 4.0,  spent: 0.5,  tasks: 2, contractor: 'Unassigned',        status: 'pending' },
];

export const APPROVALS: Approval[] = [
  { id: 'marble',  title: 'Italian Marble — Statuario',  meta: 'Living Room flooring · 1,200 sq ft', amount: '₹4.8L', img: 'Marble swatch',  role: 'Client',    note: 'Premium grade, white with grey veining' },
  { id: 'kitchen', title: 'Modular Kitchen — Hacker',     meta: 'Kitchen cabinetry · full set',       amount: '₹6.2L', img: 'Kitchen render', role: 'Designer',  note: 'German fittings, soft-close, matte finish' },
  { id: 'paint',   title: 'Premium Paint — Asian Royale', meta: 'All interior walls · 3 coats',        amount: '₹1.3L', img: 'Paint deck',     role: 'Site Lead', note: 'Low-VOC, warm neutral palette' },
  { id: 'lights',  title: 'Designer Lighting — Foyer',    meta: 'Chandelier + cove lighting',          amount: '₹2.1L', img: 'Lighting plan',  role: 'Client',    note: 'Brass finish, dimmable warm 2700K' },
];

export const BUDGET: Budget = {
  total: 50, allocated: 45, spent: 33.9, remaining: 50 - 33.9,
  categories: [
    { name: 'Civil & Structure', alloc: 14, spent: 13.2, color: '#A1896F' },
    { name: 'Kitchen',           alloc: 12, spent: 12.8, color: '#C16B57' },
    { name: 'Flooring',          alloc: 9,  spent: 6.4,  color: '#C6AC8A' },
    { name: 'Electrical',        alloc: 5,  spent: 4.1,  color: '#6E8E6A' },
    { name: 'Paint & Finish',    alloc: 5,  spent: 0.9,  color: '#6E84A3' },
  ],
  milestones: [
    { label: 'Booking advance', amount: '₹10L', done: true },
    { label: 'Foundation done', amount: '₹12L', done: true },
    { label: 'Structure done',  amount: '₹12L', done: true },
    { label: 'Finishing',       amount: '₹10L', done: false },
    { label: 'Handover',        amount: '₹6L',  done: false },
  ],
};

export const SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'Kajaria Prime',   rating: 4.7, reviews: 312, quote: 3.2, unit: '₹/sq ft 168', days: 4, distance: '12 km', impact: 'under', warranty: '10 yr', tag: 'Best value' },
  { id: 's2', name: 'Somany Elite',    rating: 4.4, reviews: 198, quote: 3.6, unit: '₹/sq ft 189', days: 2, distance: '8 km',  impact: 'on',    warranty: '8 yr',  tag: 'Fastest' },
  { id: 's3', name: 'Orientbell Luxe', rating: 4.9, reviews: 540, quote: 4.5, unit: '₹/sq ft 236', days: 9, distance: '31 km', impact: 'over',  warranty: '15 yr', tag: 'Top rated' },
];

export const TIMELINE: TimelineTask[] = [
  { id: 'foundation', name: 'Foundation', status: 'complete',    start: 'Jan 8',  end: 'Feb 2',  team: 'Rajesh Stoneworks', risk: 'none', dep: [] },
  { id: 'electrical', name: 'Electrical', status: 'complete',    start: 'Feb 3',  end: 'Feb 26', team: 'VoltEdge Pvt',      risk: 'none', dep: ['foundation'] },
  { id: 'flooring',   name: 'Flooring',   status: 'in-progress', start: 'Feb 27', end: 'Mar 22', team: 'Kajaria Prime',     risk: 'med',  dep: ['electrical'] },
  { id: 'painting',   name: 'Painting',   status: 'upcoming',    start: 'Mar 23', end: 'Apr 12', team: 'ColorCraft',        risk: 'low',  dep: ['flooring'] },
  { id: 'finishing',  name: 'Finishing',  status: 'upcoming',    start: 'Apr 13', end: 'May 5',  team: 'Interio Build Co.', risk: 'low',  dep: ['painting'] },
];

export const DIARY: DiaryEntry[] = [
  { id: 'd1', date: 'Mar 14', day: 'Today',      weather: 'sun',   temp: '32°C', title: 'Marble laying — Living Room', body: 'Statuario slabs laid across 60% of the living area. Levelling checked, grouting tomorrow.', segment: 'Living Room', photos: ['Marble floor laid', 'Edge detail'], delivery: null },
  { id: 'd2', date: 'Mar 12', day: '2 days ago', weather: 'cloud', temp: '29°C', title: 'Material delivery — Tiles',   body: 'Kajaria Prime delivered 1,250 sq ft of vitrified tiles. 4 boxes flagged for inspection.', segment: 'Flooring', photos: ['Pallet on site'], delivery: 'Kajaria Prime · 1,250 sq ft' },
  { id: 'd3', date: 'Mar 9',  day: '5 days ago', weather: 'rain',  temp: '26°C', title: 'Rain delay — Balcony',        body: 'Heavy rain stalled balcony waterproofing. Resumed half-day. Logged 4 hr delay against schedule.', segment: 'Balcony Deck', photos: ['Covered work area'], delivery: null },
  { id: 'd4', date: 'Mar 6',  day: '8 days ago', weather: 'sun',   temp: '33°C', title: 'Kitchen plumbing rough-in',   body: 'Concealed plumbing for modular kitchen completed and pressure-tested. Passed.', segment: 'Kitchen', photos: ['Pipe layout', 'Pressure gauge'], delivery: null },
];

export const DESIGN_BOARD: DesignBoard = {
  rough: [
    { id: 'r1', title: 'Warm minimal living', tag: 'Living Room', img: 'Living moodboard', note: 'Oak + travertine, soft linen sofa' },
    { id: 'r2', title: 'Arched foyer niche',  tag: 'Foyer',       img: 'Arch reference',   note: 'Curved plaster, brass sconce' },
    { id: 'r3', title: 'Fluted wood TV unit', tag: 'Living Room', img: 'TV unit ref',      note: 'Walnut flutes, hidden storage' },
  ],
  confirmed: [
    { id: 'c1', title: 'Statuario marble floor', tag: 'Living Room', img: 'Marble sample',  note: 'Approved 4.8L · vendor locked' },
    { id: 'c2', title: 'Matte modular kitchen',  tag: 'Kitchen',     img: 'Kitchen render', note: 'Hacker · soft-close · 6.2L' },
  ],
  discarded: [
    { id: 'x1', title: 'Glossy laminate floor', tag: 'Living Room', img: 'Laminate', note: 'Rejected — wanted natural stone' },
  ],
};

export const PROJECT = {
  projectName: 'Whitefield Luxury Villa',
  client: 'Mehta Residence',
  segments: SEGMENTS,
  approvals: APPROVALS,
  budget: BUDGET,
  suppliers: SUPPLIERS,
  timeline: TIMELINE,
  diary: DIARY,
  designBoard: DESIGN_BOARD,
};

export const segmentById = (id: string) => SEGMENTS.find((s) => s.id === id)!;
