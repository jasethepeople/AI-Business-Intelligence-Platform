import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Filter, Plus, Search, SlidersHorizontal } from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey,
  getListActivityQueryKey,
  getListBusinessesQueryKey,
  useCreateBusiness,
  useListBusinesses,
  type BusinessInput,
  type BusinessStage,
  type ListBusinessesParams,
} from '@workspace/api-client-react';
import { BusinessModal, BusinessTable, EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/foundry';

const categories = ['All categories', 'HVAC', 'Roofing', 'Dental', 'Commercial cleaning', 'Plumbing', 'Landscaping'];
const stages = ['All stages', 'watchlist', 'qualified', 'diligence', 'contacted', 'passed'];

export default function TargetsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [stage, setStage] = useState('');
  const [minScore, setMinScore] = useState('');
  const queryClient = useQueryClient();
  const params: ListBusinessesParams = {
    ...(search ? { search } : {}),
    ...(location ? { location } : {}),
    ...(category ? { category } : {}),
    ...(stage ? { stage: stage as BusinessStage } : {}),
    ...(minScore ? { minScore: Number(minScore) } : {}),
    limit: 100,
  };
  const businessQuery = useListBusinesses(params);
  const createBusiness = useCreateBusiness();
  const businesses = businessQuery.data ?? [];

  const submitBusiness = (data: BusinessInput) => {
    createBusiness.mutate({ data }, {
      onSuccess: () => {
        setShowAdd(false);
        queryClient.invalidateQueries({ queryKey: getListBusinessesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() });
      },
    });
  };

  return (
    <>
      <PageHeader eyebrow="02 / target universe" title="The board, without the noise." intro="Search every operator in the workspace. Sort your attention by score, stage, and where the work actually happens." action={<button type="button" className="sf-button sf-button-primary" onClick={() => setShowAdd(true)} data-testid="button-add-target"><Plus size={15} /> Add target</button>} />
      <section className="sf-filterbar" data-testid="target-filters">
        <div className="sf-search"><Search size={15} /><input className="sf-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search business, category, or operator…" data-testid="input-search-targets" /></div>
        <input className="sf-input" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Location" data-testid="input-filter-location" />
        <select className="sf-select" value={category} onChange={(event) => setCategory(event.target.value)} data-testid="select-filter-category"><option value="">All categories</option>{categories.slice(1).map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select className="sf-select" value={stage} onChange={(event) => setStage(event.target.value)} data-testid="select-filter-stage">{stages.map((item) => <option key={item} value={item === 'All stages' ? '' : item}>{item}</option>)}</select>
        <select className="sf-select" value={minScore} onChange={(event) => setMinScore(event.target.value)} data-testid="select-filter-score"><option value="">Any score</option><option value="60">60+ score</option><option value="70">70+ score</option><option value="80">80+ score</option></select>
        {(search || location || category || stage || minScore) && <button type="button" className="sf-button sf-button-quiet" onClick={() => { setSearch(''); setLocation(''); setCategory(''); setStage(''); setMinScore(''); }} data-testid="button-clear-filters"><Filter size={14} /> Clear</button>}
        <div className="sf-muted" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginLeft: 'auto' }}><SlidersHorizontal size={14} /> {businesses.length} shown</div>
      </section>
      {businessQuery.isLoading && <LoadingState rows={7} />}
      {businessQuery.isError && <ErrorState onRetry={() => businessQuery.refetch()} detail="The target universe could not be loaded. Your filters are preserved." />}
      {!businessQuery.isLoading && !businessQuery.isError && businesses.length === 0 && <EmptyState icon={Search} title="No matching targets" copy="Try widening the filters, or add this operator directly to the board." action={<button type="button" className="sf-button sf-button-primary" onClick={() => setShowAdd(true)} data-testid="button-empty-add"><Plus size={14} /> Add a target</button>} />}
      {!businessQuery.isLoading && !businessQuery.isError && businesses.length > 0 && <div className="sf-card" data-testid="targets-table"><BusinessTable businesses={businesses} /></div>}
      {showAdd && <BusinessModal onClose={() => setShowAdd(false)} onSubmit={submitBusiness} busy={createBusiness.isPending} />}
    </>
  );
}