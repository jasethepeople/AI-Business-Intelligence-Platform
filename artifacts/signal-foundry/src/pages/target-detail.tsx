import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Activity, ArrowUpRight, BarChart3, CheckCircle2, CircleDot, ExternalLink, Gauge, Globe2, MapPin, PencilLine, ShieldAlert, Sparkles, Wrench, X } from 'lucide-react';
import { Link, useParams } from 'wouter';
import {
  getGetBusinessMemoQueryKey,
  getGetBusinessQueryKey,
  getGetDashboardSummaryQueryKey,
  getListActivityQueryKey,
  getListBusinessesQueryKey,
  useGenerateBusinessMemo,
  useGetBusiness,
  useGetBusinessMemo,
  useUpdateBusiness,
  type BusinessStage,
} from '@workspace/api-client-react';
import { BackLink, ErrorState, formatDate, formatMoney, formatRelative, MemoView, PageHeader, ScoreBar, StatusPill } from '@/components/foundry';

const stages: BusinessStage[] = ['watchlist', 'qualified', 'diligence', 'contacted', 'passed'];

function SignalIcon({ type }: { type: string }) {
  if (type === 'technology') return <Wrench size={14} />;
  if (type === 'market' || type === 'growth') return <BarChart3 size={14} />;
  if (type === 'owner') return <CircleDot size={14} />;
  if (type === 'recurring_revenue') return <Gauge size={14} />;
  return <Activity size={14} />;
}

export default function TargetDetailPage() {
  const params = useParams<{ businessId?: string }>();
  const businessId = Number(params.businessId);
  const validId = Number.isFinite(businessId) && businessId > 0;
  const queryClient = useQueryClient();
  const businessQuery = useGetBusiness(validId ? businessId : 0, { query: { enabled: validId, queryKey: getGetBusinessQueryKey(validId ? businessId : 0) } });
  const memoQuery = useGetBusinessMemo(validId ? businessId : 0, { query: { enabled: validId, queryKey: getGetBusinessMemoQueryKey(validId ? businessId : 0) } });
  const updateBusiness = useUpdateBusiness();
  const generateMemo = useGenerateBusinessMemo();
  const [editingStage, setEditingStage] = useState(false);
  const business = businessQuery.data;
  const memo = memoQuery.data ?? business?.memo ?? null;

  const updateStage = (stage: BusinessStage) => {
    updateBusiness.mutate({ businessId, data: { stage } }, {
      onSuccess: () => {
        setEditingStage(false);
        queryClient.invalidateQueries({ queryKey: getGetBusinessQueryKey(businessId) });
        queryClient.invalidateQueries({ queryKey: getListBusinessesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
      },
    });
  };
  const handleGenerateMemo = () => {
    generateMemo.mutate({ businessId }, {
      onSuccess: (nextMemo) => {
        queryClient.setQueryData(getGetBusinessMemoQueryKey(businessId), nextMemo);
        queryClient.setQueryData(getGetBusinessQueryKey(businessId), (old) => old ? { ...old, memo: nextMemo } : old);
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
      },
    });
  };

  if (!validId || businessQuery.isError) {
    return <><PageHeader eyebrow="Target investigation" title="Target not found." intro="This target may have moved, or the identifier is not part of the current workspace." /><ErrorState detail="We could not locate that business in the target universe." /><div style={{ marginTop: 18 }}><BackLink /></div></>;
  }
  if (businessQuery.isLoading || !business) {
    return <><PageHeader eyebrow="Target investigation" title="Opening signal file…" intro="Pulling the latest observed evidence into view." /><div className="sf-card sf-card-pad"><div className="sf-skeleton h-8 w-3/5" /><div className="sf-skeleton mt-3 h-4 w-2/5" /><div className="sf-skeleton mt-10 h-32 w-full" /></div></>;
  }

  return (
    <>
      <div style={{ paddingTop: 27 }}><BackLink /></div>
      <div className="sf-detail-hero">
        <div>
          <div className="sf-eyebrow">Target investigation / {business.id.toString().padStart(4, '0')}</div>
          <h1 className="sf-detail-title" data-testid="text-business-name">{business.name}</h1>
          <div className="sf-detail-meta"><span><MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{business.location}</span><span>·</span><span>{business.category}</span><span>·</span><span>Observed {formatRelative(business.lastObservedAt)}</span>{business.website && <a className="sf-link" href={business.website} target="_blank" rel="noreferrer" data-testid="link-business-website"><Globe2 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Website <ExternalLink size={11} style={{ verticalAlign: 'middle' }} /></a>}</div>
        </div>
        <div className="sf-score-panel"><div className="sf-score-panel-value">{business.score}</div><div className="sf-score-panel-label">{business.scoreLabel}</div><div style={{ marginTop: 11 }}><ScoreBar score={business.score} /></div></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 15, padding: '18px 0 22px', borderBottom: '1px solid hsl(var(--border))', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span className="sf-section-kicker">Pipeline stage</span>{editingStage ? <select className="sf-select" value={business.stage} onChange={(event) => updateStage(event.target.value as BusinessStage)} disabled={updateBusiness.isPending} data-testid="select-update-stage">{stages.map((stage) => <option key={stage} value={stage}>{stage.replace('_', ' ')}</option>)}</select> : <StatusPill stage={business.stage} />} {!editingStage && <button type="button" className="sf-button sf-button-quiet" onClick={() => setEditingStage(true)} data-testid="button-edit-stage"><PencilLine size={14} /></button>}{editingStage && <button type="button" className="sf-button sf-button-quiet" onClick={() => setEditingStage(false)} data-testid="button-cancel-stage"><X size={14} /></button>}</div>
        <div className="sf-muted" style={{ fontSize: 11 }}>Added {formatDate(business.createdAt)}</div>
      </div>
      <div className="sf-stat-strip" style={{ margin: '22px 0' }}>
        <div className="sf-stat"><div className="sf-stat-label">Est. revenue</div><div className="sf-stat-value">{formatMoney(business.estimatedRevenue)}</div></div>
        <div className="sf-stat"><div className="sf-stat-label">Automation lift</div><div className="sf-stat-value" style={{ color: 'hsl(var(--primary))' }}>{business.estimatedAutomationLift}%</div></div>
        <div className="sf-stat"><div className="sf-stat-label">Signals observed</div><div className="sf-stat-value">{business.signalCount}</div></div>
      </div>
      <div className="sf-grid-detail">
        <div style={{ display: 'grid', gap: 18 }}>
          <section className="sf-card sf-card-pad">
            <div className="sf-section-head"><div><div className="sf-section-kicker">Operator context</div><div className="sf-section-title">What we know</div></div><CheckCircle2 size={17} color="hsl(var(--primary))" /></div>
            <p className="sf-memo-text" style={{ marginTop: 0 }}>{business.description}</p>
          </section>
          <section className="sf-card sf-card-pad">
            <div className="sf-section-head"><div><div className="sf-section-kicker">Observed evidence</div><div className="sf-section-title">{business.signals.length} signal{business.signals.length === 1 ? '' : 's'} behind the score</div></div><ShieldAlert size={17} color="hsl(var(--accent))" /></div>
            {business.signals.length ? business.signals.map((signal) => <div className="sf-signal" key={signal.id} data-testid={`signal-${signal.id}`}><div className="sf-signal-icon"><SignalIcon type={signal.type} /></div><div><div className="sf-signal-label">{signal.label}</div><div className="sf-signal-summary">{signal.summary}</div><div className="sf-muted" style={{ font: '10px var(--app-font-mono)', marginTop: 7 }}>{signal.type.replace('_', ' ')} · {formatDate(signal.observedAt)}</div></div><div className="sf-signal-source">{signal.source}</div></div>) : <div className="sf-muted" style={{ fontSize: 12 }}>No observed signals have been attached yet.</div>}
          </section>
        </div>
        <section className="sf-card sf-card-pad">
          {memoQuery.isError && business.memo ? <ErrorState detail="The memo could not be refreshed. You can try generating a fresh view." /> : <MemoView memo={memo} onGenerate={handleGenerateMemo} generating={generateMemo.isPending} />}
          {memo && <button type="button" className="sf-button sf-button-quiet" onClick={handleGenerateMemo} disabled={generateMemo.isPending} style={{ marginTop: 18, width: '100%' }} data-testid="button-regenerate-memo"><Sparkles size={14} /> {generateMemo.isPending ? 'Refreshing memo…' : 'Refresh memo'}</button>}
        </section>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 19 }}><Link href="/activity" className="sf-link" data-testid="link-view-activity">View workspace activity <ArrowUpRight size={13} style={{ verticalAlign: 'middle' }} /></Link></div>
    </>
  );
}