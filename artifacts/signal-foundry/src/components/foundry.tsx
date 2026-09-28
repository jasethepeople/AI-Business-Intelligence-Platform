import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  ChevronRight,
  Database,
  FileText,
  LayoutDashboard,
  Plus,
  Radar,
  RefreshCw,
  Settings2,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import type {
  ActivityItem,
  Business,
  BusinessStage,
  BusinessInput,
  DiscoveryRun,
  InvestmentMemo,
} from '@workspace/api-client-react';

export const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/targets', label: 'Target universe', icon: Target },
  { href: '/discovery', label: 'Discovery runs', icon: Radar },
  { href: '/activity', label: 'Activity', icon: Activity },
];

export function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function formatRelative(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function stageLabel(stage?: BusinessStage | string) {
  return stage ? stage.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Unstaged';
}

export function stageClass(stage?: BusinessStage | string) {
  if (stage === 'qualified' || stage === 'diligence') return 'sf-pill sf-pill-mint';
  if (stage === 'contacted') return 'sf-pill sf-pill-blue';
  if (stage === 'passed') return 'sf-pill sf-pill-red';
  return 'sf-pill sf-pill-amber';
}

export function scoreClass(score: number) {
  return score < 60 ? 'low' : '';
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="sf-score" data-testid={`score-${score}`}>
      <span className="sf-score-number">{score}</span>
      <span className="sf-score-track"><span className={`sf-score-fill ${scoreClass(score)}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></span>
    </div>
  );
}

export function StatusPill({ stage }: { stage?: BusinessStage | string }) {
  return <span className={stageClass(stage)} data-testid={`status-${stage ?? 'unstaged'}`}>{stageLabel(stage)}</span>;
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`sf-skeleton ${className}`} aria-hidden="true" />;
}

export function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="sf-card sf-card-pad" data-testid="state-loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
          <SkeletonBlock className="h-8 w-8" />
          <div style={{ flex: 1 }}>
            <SkeletonBlock className="h-3 w-2/5" />
            <SkeletonBlock className="mt-2 h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ onRetry, detail = 'The workspace could not retrieve this view.' }: { onRetry?: () => void; detail?: string }) {
  return (
    <div className="sf-error" data-testid="state-error">
      <AlertTriangle size={18} />
      <div style={{ flex: 1 }}>
        <div className="sf-error-title">Signal feed interrupted</div>
        <div className="sf-error-copy">{detail}</div>
      </div>
      {onRetry && <button type="button" className="sf-button" onClick={onRetry} data-testid="button-retry"><RefreshCw size={14} /> Retry</button>}
    </div>
  );
}

export function EmptyState({ icon: Icon = Database, title, copy, action }: { icon?: typeof Database; title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="sf-empty" data-testid="state-empty">
      <div className="sf-empty-icon"><Icon size={18} /></div>
      <div className="sf-empty-title">{title}</div>
      <div className="sf-empty-copy">{copy}</div>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro, action }: { eyebrow: string; title: string; intro: string; action?: ReactNode }) {
  return (
    <div className="sf-page-head">
      <div>
        <div className="sf-eyebrow">{eyebrow}</div>
        <h1 className="sf-page-title" data-testid="text-page-title">{title}</h1>
        <p className="sf-page-intro">{intro}</p>
      </div>
      {action}
    </div>
  );
}

export function BusinessTable({ businesses, compact = false }: { businesses: Business[]; compact?: boolean }) {
  return (
    <div className="sf-table-wrap">
      <table className="sf-table">
        <thead>
          <tr>
            <th>Business</th>
            <th>Score</th>
            <th>Stage</th>
            {!compact && <th>Revenue est.</th>}
            <th>Automation</th>
            {!compact && <th>Observed</th>}
            <th />
          </tr>
        </thead>
        <tbody>
          {businesses.map((business) => (
            <tr key={business.id} data-testid={`row-business-${business.id}`}>
              <td>
                <Link href={`/targets/${business.id}`} className="sf-table-name" data-testid={`link-business-${business.id}`}>{business.name}</Link>
                <div className="sf-muted" style={{ marginTop: 4, fontSize: 11 }}>{business.category} · {business.location}</div>
              </td>
              <td><ScoreBar score={business.score} /></td>
              <td><StatusPill stage={business.stage} /></td>
              {!compact && <td className="sf-mono">{formatMoney(business.estimatedRevenue)}</td>}
              <td className="sf-mono" style={{ color: 'hsl(var(--primary))' }}>{business.estimatedAutomationLift}%</td>
              {!compact && <td className="sf-muted">{formatRelative(business.lastObservedAt)}</td>}
              <td><Link href={`/targets/${business.id}`} className="sf-link" data-testid={`link-investigate-${business.id}`}><ChevronRight size={15} /></Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeHref = location === '/' ? '/' : navItems.find((item) => location.startsWith(item.href) && item.href !== '/')?.href ?? '/';
  return (
    <div className="sf-app">
      <aside className="sf-sidebar">
        <div className="sf-brand">
          <div className="sf-mark"><span>SF</span></div>
          <div><div className="sf-brand-name">Signal Foundry</div><div className="sf-brand-sub">operator workspace</div></div>
        </div>
        <div className="sf-nav-label">Workspace</div>
        <nav className="sf-nav" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`sf-nav-link ${activeHref === href ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <span className="sf-nav-icon"><Icon size={16} /></span><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sf-sidebar-bottom">
          <div className="sf-user-chip">
            <div className="sf-avatar">AR</div>
            <div><div className="sf-user-name">Alex Rivera</div><div className="sf-user-role">Principal operator</div></div>
          </div>
        </div>
      </aside>
      <main className="sf-main">
        <div className="sf-content">
          <header className="sf-topbar">
            <div className="sf-eyebrow">North America / private workspace</div>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              <span className="sf-button sf-button-quiet" title="Workspace settings" aria-label="Workspace settings" data-testid="status-settings"><Settings2 size={16} /></span>
              <div className="sf-pill sf-pill-mint"><span style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '50%' }} /> Feed live</div>
            </div>
          </header>
          {children}
        </div>
      </main>
      <nav className="sf-mobile-bar" aria-label="Mobile navigation">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`sf-mobile-link ${activeHref === href ? 'active' : ''}`} data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`}>
            <Icon size={16} /><span>{label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function BusinessModal({ onClose, onSubmit, busy = false }: { onClose: () => void; onSubmit: (data: BusinessInput) => void; busy?: boolean }) {
  const [form, setForm] = useState({ name: '', category: '', location: '', website: '', description: '', estimatedRevenue: '' });
  const [error, setError] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name || !form.category || !form.location || !form.description) {
      setError('Name, category, location, and description are required.');
      return;
    }
    onSubmit({ name: form.name, category: form.category, location: form.location, website: form.website || null, description: form.description, estimatedRevenue: form.estimatedRevenue ? Number(form.estimatedRevenue) : null });
  };
  return (
    <div className="sf-modal-backdrop" role="dialog" aria-modal="true" data-testid="dialog-add-business">
      <div className="sf-modal">
        <div className="sf-modal-head"><div><div className="sf-modal-title">Add a target</div><div className="sf-modal-copy">Put a known operator on the board for scoring and investigation.</div></div><button type="button" className="sf-button sf-button-quiet" onClick={onClose} data-testid="button-close-add"><X size={17} /></button></div>
        <form className="sf-form" onSubmit={submit}>
          <div className="sf-field"><label htmlFor="business-name">Business name</label><input id="business-name" className="sf-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Meridian Garage Doors" data-testid="input-business-name" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="sf-field"><label htmlFor="business-category">Category</label><input id="business-category" className="sf-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Home services" data-testid="input-business-category" /></div>
            <div className="sf-field"><label htmlFor="business-location">Location</label><input id="business-location" className="sf-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Columbus, OH" data-testid="input-business-location" /></div>
          </div>
          <div className="sf-field"><label htmlFor="business-website">Website <span className="sf-muted">(optional)</span></label><input id="business-website" className="sf-input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" data-testid="input-business-website" /></div>
          <div className="sf-field"><label htmlFor="business-revenue">Estimated revenue <span className="sf-muted">(optional)</span></label><input id="business-revenue" type="number" className="sf-input" value={form.estimatedRevenue} onChange={(e) => setForm({ ...form, estimatedRevenue: e.target.value })} placeholder="850000" data-testid="input-business-revenue" /></div>
          <div className="sf-field"><label htmlFor="business-description">Operator notes</label><textarea id="business-description" className="sf-textarea" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What makes this target worth a closer look?" data-testid="input-business-description" /></div>
          {error && <div className="sf-error"><AlertTriangle size={15} /><div className="sf-error-copy">{error}</div></div>}
          <div className="sf-form-actions"><button type="button" className="sf-button" onClick={onClose} data-testid="button-cancel-add">Cancel</button><button type="submit" className="sf-button sf-button-primary" disabled={busy} data-testid="button-submit-add"><Plus size={14} /> {busy ? 'Adding…' : 'Add target'}</button></div>
        </form>
      </div>
    </div>
  );
}

export function MemoView({ memo, onGenerate, generating }: { memo: InvestmentMemo | null | undefined; onGenerate: () => void; generating: boolean }) {
  if (!memo) {
    return <EmptyState icon={FileText} title="No memo yet" copy="Generate a concise investment view once the signal pattern is worth underwriting." action={<button type="button" className="sf-button sf-button-primary" onClick={onGenerate} disabled={generating} data-testid="button-generate-memo"><Sparkles size={14} /> {generating ? 'Generating…' : 'Generate memo'}</button>} />;
  }
  return (
    <div data-testid="investment-memo">
      <div className="sf-section-head"><div><div className="sf-section-kicker">Investment memo</div><div className="sf-section-title">A working case for action</div></div><span className="sf-pill sf-pill-mint">{memo.confidence}% confidence</span></div>
      <div className="sf-memo-block"><div className="sf-memo-label">Thesis</div><div className="sf-memo-text">{memo.thesis}</div></div>
      <div className="sf-memo-block"><div className="sf-memo-label">Opportunity</div><div className="sf-memo-text">{memo.opportunity}</div></div>
      <div className="sf-stat-strip"><div className="sf-stat"><div className="sf-stat-label">Purchase range</div><div className="sf-stat-value">{memo.estimatedPurchaseRange}</div></div><div className="sf-stat"><div className="sf-stat-label">Post-acq profit</div><div className="sf-stat-value">{memo.estimatedPostAcquisitionProfit}</div></div><div className="sf-stat"><div className="sf-stat-label">Generated</div><div className="sf-stat-value" style={{ fontSize: 13 }}>{formatDate(memo.generatedAt)}</div></div></div>
      <div className="sf-memo-block"><div className="sf-memo-label">Risks</div><ul className="sf-list">{memo.risks.map((risk, index) => <li key={index}>{risk}</li>)}</ul></div>
      <div className="sf-memo-block"><div className="sf-memo-label">Next steps</div><ul className="sf-list">{memo.nextSteps.map((step, index) => <li key={index}>{step}</li>)}</ul></div>
    </div>
  );
}

export function RunStatus({ run }: { run: DiscoveryRun }) {
  const label = run.status === 'running' ? 'Running' : run.status === 'completed' ? 'Completed' : 'Failed';
  const style = run.status === 'completed' ? 'sf-pill sf-pill-mint' : run.status === 'failed' ? 'sf-pill sf-pill-red' : 'sf-pill sf-pill-amber';
  return <span className={style} data-testid={`status-run-${run.id}`}>{run.status === 'running' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}{label}</span>;
}

export function ActivityIcon({ kind }: { kind: ActivityItem['kind'] }) {
  const Icon = kind.includes('memo') ? FileText : kind.includes('run') || kind.includes('discover') ? Radar : kind.includes('stage') ? Zap : Building2;
  return <Icon size={14} />;
}

export function BackLink({ href = '/targets' }: { href?: string }) {
  return <Link href={href} className="sf-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} data-testid="link-back"><ArrowLeft size={14} /> Back to {href === '/targets' ? 'targets' : 'workspace'}</Link>;
}