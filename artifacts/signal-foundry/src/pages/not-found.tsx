import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="sf-app">
      <main className="sf-main" style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
        <div className="sf-card sf-card-pad" style={{ maxWidth: 520, width: '100%' }} data-testid="state-not-found">
          <div className="sf-eyebrow">Signal file / 404</div>
          <div style={{ display: 'flex', gap: 15, alignItems: 'flex-start', marginTop: 18 }}>
            <div className="sf-empty-icon" style={{ margin: 0 }}><Compass size={19} /></div>
            <div><h1 className="sf-page-title" style={{ fontSize: 30 }}>Nothing on this frequency.</h1><p className="sf-page-intro">That route does not map to a workspace view. The target universe is still right where you left it.</p></div>
          </div>
          <Link href="/" className="sf-button sf-button-primary" style={{ marginTop: 24 }} data-testid="link-not-found-home"><ArrowLeft size={14} /> Return to overview</Link>
        </div>
      </main>
    </div>
  );
}
