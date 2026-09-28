import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Crosshair, Database, Radar, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import {
  getGetDashboardSummaryQueryKey,
  getListBusinessesQueryKey,
  getListActivityQueryKey,
  useGetDashboardSummary,
  useCreateBusiness,
  type BusinessInput,
} from '@workspace/api-client-react';
import { BusinessModal, BusinessTable, EmptyState, ErrorState, formatMoney, formatRelative, LoadingState, PageHeader, RunStatus } from '@/components/foundry';
import { useState } from 'react';

export default function DashboardPage() {
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();
  const summaryQuery = useGetDashboardSummary();
  const createBusiness = useCreateBusiness();
  const summary = summaryQuery.data;

  const submitBusiness = (data: BusinessInput) => {
    createBusiness.mutate({ data }, {
      onSuccess: () => {
        setShowAdd(false);
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListBusinessesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
      },
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="01 / intelligence overview"
        title="Find the edge in the ordinary."
        intro="A live read on the local operators most likely to reward a sharper system, a better process, or a new owner."
        action={<button type="button" className="sf-button sf-button-primary" onClick={() => setShowAdd(true)} data-testid="button-add-target"><Crosshair size={15} /> Add target</button>}
      />
      {summaryQuery.isLoading && <LoadingState rows={4} />}
      {summaryQuery.isError && <ErrorState onRetry={() => summaryQuery.refetch()} />}
      {summary && (
        <div style={{ display: 'grid', gap: 22 }} data-testid="dashboard-content">
          <section className="sf-metric-grid">
            <div className="sf-metric"><div className="sf-metric-label">Targets tracked</div><div className="sf-metric-value">{summary.targetCount}</div><div className="sf-metric-note">Across current universe</div></div>
            <div className="sf-metric"><div className="sf-metric-label">Qualified</div><div className="sf-metric-value" style={{ color: 'hsl(var(--primary))' }}>{summary.qualifiedCount}</div><div className="sf-metric-note">Ready for diligence</div></div>
            <div className="sf-metric"><div className="sf-metric-label">Average score</div><div className="sf-metric-value">{summary.averageScore}</div><div className="sf-metric-note">Signal-weighted view</div></div>
            <div className="sf-metric"><div className="sf-metric-label">Automation lift</div><div className="sf-metric-value">{summary.automationOpportunity}%</div><div className="sf-metric-note">Average operating upside</div></div>
          </section>
          <section className="sf-grid-2">
            <div className="sf-card sf-card-pad">
              <div className="sf-section-head"><div><div className="sf-section-kicker">Ranked universe</div><div className="sf-section-title">Targets earning attention</div></div><Link href="/targets" className="sf-link" data-testid="link-view-all-targets">View all <ArrowUpRight size={13} style={{ verticalAlign: 'middle' }} /></Link></div>
              {summary.topTargets.length > 0 ? <BusinessTable businesses={summary.topTargets} compact /> : <EmptyState icon={Database} title="No targets ranked yet" copy="Add a known operator or run a discovery pass to build your first signal set." />}
            </div>
            <div className="sf-card sf-card-pad">
              <div className="sf-section-head"><div><div className="sf-section-kicker">Last scan</div><div className="sf-section-title">Discovery pulse</div></div><Radar size={17} color="hsl(var(--primary))" /></div>
              {summary.latestRun ? (
                <div data-testid="latest-run">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><div style={{ fontSize: 18, fontWeight: 800 }}>{summary.latestRun.location}</div><RunStatus run={summary.latestRun} /></div>
                  <div className="sf-muted" style={{ fontSize: 12, marginTop: 7 }}>{summary.latestRun.categories.join(' · ')}</div>
                  <div className="sf-stat-strip" style={{ marginTop: 22 }}><div className="sf-stat"><div className="sf-stat-label">Found</div><div className="sf-stat-value">{summary.latestRun.targetsFound}</div></div><div className="sf-stat"><div className="sf-stat-label">Avg score</div><div className="sf-stat-value">{summary.latestRun.averageScore}</div></div></div>
                  <div className="sf-muted" style={{ fontSize: 11, marginTop: 15 }}>Started {formatRelative(summary.latestRun.startedAt)}</div>
                </div>
              ) : <EmptyState icon={Radar} title="No discovery runs" copy="Start with a local scan to uncover operators beyond your current network." action={<Link href="/discovery" className="sf-button sf-button-primary" data-testid="link-start-discovery"><TrendingUp size={14} /> Start a run</Link>} />}
            </div>
          </section>
          <section className="sf-card sf-card-pad">
            <div className="sf-section-head"><div><div className="sf-section-kicker">Capital map</div><div className="sf-section-title">Revenue concentration</div></div><span className="sf-pill sf-pill-amber">Est. pool {formatMoney(summary.estimatedRevenuePool)}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 6 }}><div style={{ flex: 1, height: 10, background: 'hsl(var(--muted))' }}><div style={{ height: '100%', width: `${Math.min(100, Math.max(8, summary.averageScore))}%`, background: 'hsl(var(--primary))' }} /></div><span className="sf-mono" style={{ fontSize: 12 }}>{summary.averageScore}% signal quality</span></div>
          </section>
        </div>
      )}
      {showAdd && <BusinessModal onClose={() => setShowAdd(false)} onSubmit={submitBusiness} busy={createBusiness.isPending} />}
    </>
  );
}