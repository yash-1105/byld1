/* ============================================================
   BYLD — Feature showcase data
   Mirrors reference/assets/features.js (design handoff).
   ============================================================ */

import type { MotionValue } from 'framer-motion';

export type FeatureKey = 'segment' | 'board' | 'approvals' | 'procurement' | 'timeline';

/** Shared easing from the handoff (ease-out-expo). */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Props every feature visual receives — the section's scroll progress (0→1). */
export interface VisualProps {
  progress: MotionValue<number>;
}

export interface FeatureMeta {
  key: FeatureKey;
  /** index label, e.g. "Segment Map" */
  label: string;
  /** heading; supports a hard line break rendered as two lines */
  title: [string, string];
  lead: string;
  list: [string, string, string];
  /** when true, copy is on the right (visual left) */
  flip: boolean;
  /** target for the "Explore …" link — a section anchor on the /features page */
  href: string;
}

export const FEATURES: FeatureMeta[] = [
  {
    key: 'segment',
    label: 'Segment Map',
    title: ['Navigate projects', 'room by room.'],
    lead: 'Replace sprawling spreadsheets with an interactive floor plan. Click any room to access its tasks, budget, and outstanding approvals — organized the way your project actually lives.',
    list: [
      'Clickable rooms with live progress',
      'Per-segment budget & task overview',
      'Status indicators at a glance',
    ],
    flip: false,
    href: '/features#segment-map',
  },
  {
    key: 'board',
    label: 'Design Board',
    title: ['From inspiration', 'to execution.'],
    lead: 'A visual moodboard that doubles as a decision log. Move materials from rough concepts through confirmed — so your team always builds from the right spec, never a stale idea.',
    list: [
      'Pinterest-style material curation',
      'Full design history & audit trail',
      'One-tap material confirmation',
    ],
    flip: true,
    href: '/features#design-board',
  },
  {
    key: 'approvals',
    label: 'Approvals',
    title: ['Every decision', 'documented.'],
    lead: 'No more chasing sign-offs over email. A structured approval queue means clients and stakeholders review, approve, or reject with one tap — every decision captured with a timestamp and reason.',
    list: [
      'Approve, hold, and reject actions',
      'Mandatory reason capture',
      'Full audit trail for every item',
    ],
    flip: false,
    href: '/features#approvals',
  },
  {
    key: 'procurement',
    label: 'Procurement',
    title: ['Choose suppliers', 'with full clarity.'],
    lead: 'Compare quotes side by side with cost, lead time, and risk scoring built in. Generate purchase orders in one click and track deliveries in real time — so nothing arrives late or over budget.',
    list: [
      'Multi-vendor quote comparison',
      'Automated risk scoring',
      'One-click PO generation',
    ],
    flip: true,
    href: '/features#procurement',
  },
  {
    key: 'timeline',
    label: 'Timeline',
    title: ['See delays', 'before they hit.'],
    lead: 'A premium Gantt interface built for architectural complexity. Visualize task dependencies, flag risks early, and keep every team member aligned across the full project lifecycle.',
    list: [
      'Dependency-aware Gantt chart',
      'Predictive delay detection',
      'Team assignment & milestones',
    ],
    flip: false,
    href: '/features#timeline',
  },
];

/* ---------- 01 Segment Map ---------- */
export interface Room {
  name: string;
  status: string;
  s: 'ok' | 'warn';
  /** pin position, % of photo */
  x: number;
  y: number;
  budget: string;
  tasks: string;
  prog: string;
}

export const ROOMS: Room[] = [
  { name: 'Living Room', status: 'On Track', s: 'ok', x: 30, y: 40, budget: '$24.5k', tasks: '8 / 11', prog: '82%' },
  { name: 'Kitchen', status: 'In Progress', s: 'warn', x: 62, y: 30, budget: '$41.2k', tasks: '5 / 14', prog: '46%' },
  { name: 'Master Suite', status: 'Complete', s: 'ok', x: 78, y: 58, budget: '$33.0k', tasks: '12 / 12', prog: '100%' },
  { name: 'Office', status: 'Delayed', s: 'warn', x: 44, y: 66, budget: '$9.8k', tasks: '2 / 9', prog: '21%' },
];

/* ---------- 02 Design Board ---------- */
export interface Material {
  n: string;
  t: string;
  c: string;
  chip: 'concept' | 'review' | 'confirmed';
  lbl: string;
}

export const BOARD: { title: string; items: Material[] }[] = [
  {
    title: 'Concept',
    items: [
      { n: 'Engineered Oak', t: 'Flooring', c: '#c9a36b', chip: 'concept', lbl: 'Concept' },
      { n: 'Brushed Brass', t: 'Hardware', c: '#b59b6e', chip: 'concept', lbl: 'Concept' },
    ],
  },
  {
    title: 'Under Review',
    items: [
      { n: 'Matte Black Fixtures', t: 'Plumbing', c: '#1d1d1d', chip: 'review', lbl: 'Under Review' },
      { n: 'Linen Plaster', t: 'Walls', c: '#e6e0d4', chip: 'review', lbl: 'Under Review' },
    ],
  },
  {
    title: 'Confirmed',
    items: [
      { n: 'Calacatta Marble', t: 'Countertops', c: '#f3f1ee', chip: 'confirmed', lbl: 'Confirmed' },
      { n: 'Smoked Glass', t: 'Partitions', c: '#3a4a52', chip: 'confirmed', lbl: 'Confirmed' },
    ],
  },
];

/* ---------- 04 Procurement ---------- */
export interface Vendor {
  n: string;
  stars: string;
  orders: string;
  price: string;
  days: string;
  risk: number;
  riskL: string;
  riskC: string;
  rec: boolean;
}

export const VENDORS: Vendor[] = [
  { n: 'BuildSupply Co.', stars: '★★★★★', orders: '42 orders', price: '$11,800', days: '3–5 days', risk: 18, riskL: 'Low risk', riskC: '#25c75c', rec: true },
  { n: 'Metro Materials', stars: '★★★★☆', orders: '18 orders', price: '$12,400', days: '7–10 days', risk: 52, riskL: 'Medium risk', riskC: '#ea7c3c', rec: false },
  { n: 'Apex Trade Group', stars: '★★★☆☆', orders: '7 orders', price: '$10,950', days: '12–16 days', risk: 78, riskL: 'High risk', riskC: '#d8584b', rec: false },
];

/* ---------- 05 Timeline ---------- */
export interface TimelineTask {
  n: string;
  cls: 'done' | 'prog' | 'pend' | 'risk';
  lbl: string;
  /** start week (0-based) and span, out of 4 weeks */
  start: number;
  span: number;
}

export const TIMELINE_TASKS: TimelineTask[] = [
  { n: 'Foundation', cls: 'done', lbl: 'Done', start: 0, span: 1 },
  { n: 'Framing', cls: 'prog', lbl: 'In Progress', start: 1, span: 1.4 },
  { n: 'Electrical', cls: 'pend', lbl: 'Pending', start: 2.2, span: 1.1 },
  { n: 'Plumbing', cls: 'risk', lbl: 'At Risk', start: 2.6, span: 1.4 },
  { n: 'Finishing', cls: 'pend', lbl: 'Pending', start: 3.4, span: 0.6 },
];

/* Unsplash placeholder photos (swap for licensed/brand imagery later) */
export const PHOTO_HOUSE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop';
export const PHOTO_BATHROOM = 'https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=1200&auto=format&fit=crop';
