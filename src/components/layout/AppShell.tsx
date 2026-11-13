import type { ReactNode } from 'react';
import { Copy, Globe2 } from 'lucide-react';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="header">
        <a className="brand" href="/" aria-label="Pasteclip home">
          <span className="brand-icon">
            <Copy size={21} />
          </span>
          pasteclip<span className="beta">BETA</span>
        </a>
        <span className="header-note">
          <Globe2 size={15} /> A shared space, one link away.
        </span>
      </header>
      <main>{children}</main>
      <footer>
        <span>Less friction. More flow.</span>
        <span>Made for the in-between.</span>
      </footer>
    </div>
  );
}
