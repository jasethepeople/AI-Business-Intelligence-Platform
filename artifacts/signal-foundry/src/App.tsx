import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Shell } from '@/components/foundry';
import ActivityPage from '@/pages/activity';
import DashboardPage from '@/pages/dashboard';
import DiscoveryPage from '@/pages/discovery';
import NotFound from '@/pages/not-found';
import TargetDetailPage from '@/pages/target-detail';
import TargetsPage from '@/pages/targets';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/"><Shell><DashboardPage /></Shell></Route>
        <Route path="/targets"><Shell><TargetsPage /></Shell></Route>
        <Route path="/targets/:businessId"><Shell><TargetDetailPage /></Shell></Route>
        <Route path="/discovery"><Shell><DiscoveryPage /></Shell></Route>
        <Route path="/activity"><Shell><ActivityPage /></Shell></Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
