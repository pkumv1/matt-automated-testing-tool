import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Use the simpler dashboard that doesn't require missing components
import ModernDashboardPage from "@/pages/modern-dashboard-simple";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ModernDashboardPage} />
      <Route path="/modern" component={ModernDashboardPage} />
      <Route path="/legacy" component={ModernDashboardPage} />
      <Route path="/dashboard" component={ModernDashboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
