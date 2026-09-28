import { Activity as ActivityIcon, ArrowUpRight, Clock3 } from 'lucide-react';
import { Link } from 'wouter';
import { useListActivity } from '@workspace/api-client-react';
import { ActivityIcon as ActivityKindIcon, EmptyState, ErrorState, formatRelative, LoadingState, PageHeader } from '@/components/foundry';

export default function ActivityPage() {
  const activityQuery = useListActivity({ limit: 100 });
  const items = activityQuery.data ?? [];
  return (
    <>
      <PageHeader eyebrow="04 / workspace activity" title="A clean record of motion." intro="Every meaningful change to the board, from a new signal to a fresh memo, in one operator-readable timeline." />
      {activityQuery.isLoading && <LoadingState rows={8} />}
      {activityQuery.isError && <ErrorState onRetry={() => activityQuery.refetch()} />}
      {!activityQuery.isLoading && !activityQuery.isError && items.length === 0 && <EmptyState icon={ActivityIcon} title="No activity yet" copy="As targets move through the workspace, the decisions and evidence will collect here." />}
      {!activityQuery.isLoading && !activityQuery.isError && items.length > 0 && <section className="sf-card sf-card-pad" data-testid="activity-feed"><div className="sf-section-head"><div><div className="sf-section-kicker">Latest events</div><div className="sf-section-title">Workspace timeline</div></div><span className="sf-pill sf-pill-blue"><Clock3 size={12} /> Live record</span></div>{items.map((item) => <div className="sf-activity-item" key={item.id} data-testid={`activity-${item.id}`}><div className="sf-activity-kind"><ActivityKindIcon kind={item.kind} /></div><div><div className="sf-activity-title">{item.title}</div><div className="sf-activity-detail">{item.detail}</div>{item.businessId && <Link href={`/targets/${item.businessId}`} className="sf-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 7 }} data-testid={`link-activity-target-${item.id}`}>Open target <ArrowUpRight size={12} /></Link>}</div><div className="sf-activity-date">{formatRelative(item.createdAt)}</div></div>)}</section>}
    </>
  );
}