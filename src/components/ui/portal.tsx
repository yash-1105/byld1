import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/**
 * Renders its children into `document.body`, escaping the `.app-glass` tree.
 *
 * Any ancestor that establishes a containing block for fixed-position elements —
 * a `backdrop-filter` glass card/nav, or the framer-motion page-transition
 * wrapper's `transform` — silently re-scopes a `fixed inset-0` overlay to that
 * ancestor's box instead of the viewport, leaking a sliver of the page around the
 * edges. Wrapping a full-screen overlay in <Portal> moves its DOM node to a direct
 * child of <body>, so `fixed inset-0` always means the real browser viewport.
 *
 * React context still flows through the portal, so hooks/providers keep working.
 * Keep any AnimatePresence *inside* the Portal so exit animations run in the
 * portaled subtree.
 */
export default function Portal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
