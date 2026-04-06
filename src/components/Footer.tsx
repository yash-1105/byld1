import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

const footerLinks = [
  { section: 'Product', links: [
    { label: 'Features', path: '/features' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Integrations', path: '/integrations' },
  ]},
  { section: 'Company', links: [
    { label: 'About', path: '/about' },
    { label: 'Blog', path: '/blog' },
    { label: 'Careers', path: '/careers' },
  ]},
  { section: 'Legal', links: [
    { label: 'Privacy', path: '/privacy' },
    { label: 'Terms', path: '/terms' },
    { label: 'Security', path: '/security' },
  ]},
];

export default function Footer() {
  return (
    <footer className="bg-card/50 border-t border-border/50 mt-auto backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center shadow-sm shadow-primary/15">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">BYLD</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">Construction project management, simplified.</p>
          </div>
          {footerLinks.map(section => (
            <div key={section.section}>
              <h4 className="font-semibold text-foreground text-sm mb-4">{section.section}</h4>
              <div className="space-y-2.5">
                {section.links.map(link => (
                  <Link key={link.path} to={link.path} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border/50 mt-10 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} BYLD. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
