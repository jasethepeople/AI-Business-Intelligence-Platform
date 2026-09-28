import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Crosshair, MapPin, Radar, Search, TimerReset } from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey,
  getListActivityQueryKey,
  getListBusinessesQueryKey,
  getListDiscoveryRunsQueryKey,
  useCreateDiscoveryRun,
  useListDiscoveryRuns,
  type DiscoveryRunInput,
} from '@workspace/api-client-react';
import { EmptyState, ErrorState, formatDate, LoadingState, PageHeader, RunStatus } from '@/components/foundry';

const suggestedCategories = ['HVAC', 'Roofing', 'Dental', 'Commercial cleaning', 'Plumbing'];

export default function DiscoveryPage() {
  const [location, setLocation] = useState('');
  const [categories, setCategories] = useState<string[]>(['HVAC', 'Commercial cleaning']);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const runsQuery = useListDiscoveryRuns();
  const createRun = useCreateDiscoveryRun();

  const toggleCategory = (category: string) => setCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : current.length < 5 ? [...current, category] : current);
  const startRun = () => {
    if (!location.trim() || categories.length === 0) {
      setError('Choose a location and at least one category to start a run.');
      return;
    }
    setError('');
    const data: DiscoveryRunInput = { location: location.trim(), categories };
    createRun.mutate({ data }, {
      onSuccess: () => {
        setLocation('');
        setCategories([]);
        queryClient.invalidateQueries({ queryKey: getListDiscoveryRunsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListBusinessesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
      },
      onError: () => setError('This run could not be started. Check the location and try again.'),
    });
  };
  const runs = runsQuery.data ?? [];

  return (
    <>
      <PageHeader eyebrow="03 / discovery engine" title="Search where the signal lives." intro="Point the engine at a local market. We will surface service operators with enough operational texture to investigate." />
      <div className="sf-grid-detail">
        <section className="sf-card sf-card-pad">
          <div className="sf-section-head"><div><div className="sf-section-kicker">New discovery run</div><div className="sf-section-title">Choose your hunting ground</div></div><Crosshair size={18} color="hsl(var(--primary))" /></div>
          <div className="sf-form" style={{ padding: '10px 0 0' }}>
            <div className="sf-field"><label htmlFor="run-location">Market or metro</label><div style={{ position: 'relative' }}><MapPin size={15} style={{ position: 'absolute', left: 11, top: 11, color: 'hsl(var(--muted-foreground))' }} /><input id="run-location" className="sf-input" style={{ width: '100%', paddingLeft: 34 }} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Raleigh-Durham, NC" data-testid="input-discovery-location" /></div></div>
            <div className="sf-field"><label>Categories <span className="sf-muted">(up to 5)</span></label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{suggestedCategories.map((category) => <button type="button" key={category} className={`sf-pill ${categories.includes(category) ? 'sf-pill-mint' : ''}`} onClick={() => toggleCategory(category)} data-testid={`button-category-${category.toLowerCase().replaceAll(' ', '-')}`}>{categories.includes(category) ? 'Selected · ' : ''}{category}</button>)}</div></div>
            {error && <div className="sf-error"><Search size={15} /><div className="sf-error-copy">{error}</div></div>}
            <button type="button" className="sf-button sf-button-primary" onClick={startRun} disabled={createRun.isPending} style={{ width: '100%', marginTop: 3 }} data-testid="button-start-discovery"><Radar size={15} /> {createRun.isPending ? 'Scanning local operators…' : 'Start discovery run'}<ArrowRight size={14} /></button>
          </div>
          <div style={{ borderTop: '1px solid hsl(var(--border))', marginTop: 22, paddingTop: 17, display: 'flex', gap: 10, alignItems: 'flex-start' }}><TimerReset size={15} color="hsl(var(--muted-foreground))" /><div className="sf-muted" style={{ fontSize: 11, lineHeight: 1.5 }}>Runs are built for a focused first pass. Keep the geography specific enough that results can turn into conversations.</div></div>
        </section>
        <section>
          <div className="sf-section-head"><div><div className="sf-section-kicker">Run history</div><div className="sf-section-title">Recent scans</div></div><span className="sf-muted" style={{ font: '10px var(--app-font-mono)' }}>{runs.length} total</span></div>
          {runsQuery.isLoading && <LoadingState rows={4} />}
          {runsQuery.isError && <ErrorState onRetry={() => runsQuery.refetch()} />}
          {!runsQuery.isLoading && !runsQuery.isError && runs.length === 0 && <EmptyState icon={Radar} title="The engine is idle" copy="Your completed and active discovery runs will show up here." />}
          {!runsQuery.isLoading && !runsQuery.isError && runs.length > 0 && <div className="sf-card sf-card-pad">{runs.map((run) => <div className="sf-run" key={run.id} data-testid={`row-run-${run.id}`}><div><div className="sf-run-location">{run.location}</div><div className="sf-run-categories">{run.categories.map((category) => <span className="sf-category" key={category}>{category}</span>)}</div></div><div className="sf-run-metrics"><div className="sf-run-metric"><strong>{run.targetsFound}</strong><span>targets found</span></div><div className="sf-run-metric"><strong>{run.averageScore}</strong><span>average score</span></div></div><div style={{ display: 'grid', justifyItems: 'end', gap: 8 }}><RunStatus run={run} /><span className="sf-muted" style={{ font: '10px var(--app-font-mono)' }}>{formatDate(run.completedAt ?? run.startedAt)}</span></div></div>)}</div>}
        </section>
      </div>
    </>
  );
}