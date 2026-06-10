import { useEffect } from 'react';
import './tokens.css';
import { BookDemoProvider } from './BookDemo';
import { SiteNav, Hero } from './Hero';
import SegmentMap from './sections/SegmentMap';
import DesignBoard from './sections/DesignBoard';
import Approvals from './sections/Approvals';
import BudgetTracking from './sections/BudgetTracking';
import Procurement from './sections/Procurement';
import Timeline from './sections/Timeline';
import SiteMonitoring from './sections/SiteMonitoring';
import AIAssistance from './sections/AIAssistance';
import Closing from './Closing';

/**
 * "See BYLD in action" — the interactive Features page.
 * Replaces the old static /features page. A single scrollable product
 * walkthrough: hero + 8 interactive feature demos + flow recap + CTA,
 * all driven by one shared mock project (Whitefield Luxury Villa).
 *
 * Section ids match the slugs used by landing-page "Explore" links
 * (/features#segment-map, #design-board, #approvals, #procurement, #timeline).
 */
export default function FeaturesTourPage() {
  // Scroll to the URL hash on load (e.g. arriving from /features#procurement).
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <BookDemoProvider>
      <div className="byld-features" style={{ minHeight: '100vh' }}>
        <SiteNav />
        <Hero />
        {/* Storytelling flow order */}
        <SegmentMap />
        <DesignBoard />
        <Approvals />
        <BudgetTracking />
        <Procurement />
        <Timeline />
        <SiteMonitoring />
        <AIAssistance />
        <Closing />
      </div>
    </BookDemoProvider>
  );
}
