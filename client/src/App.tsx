import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import Dashboard from "@/pages/dashboard";
import ModernDashboardPage from "@/pages/modern-dashboard-page";
import NotFound from "@/pages/not-found";

function Router() {
  const { toast } = useToast();
  
  // Listen for custom toast events
  useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      toast(event.detail);
    };
    
    window.addEventListener('show-toast', handleToast as EventListener);
    
    return () => {
      window.removeEventListener('show-toast', handleToast as EventListener);
    };
  }, [toast]);
  
  return (
    <Switch>
      <Route path="/" component={ModernDashboardPage} />
      <Route path="/modern" component={ModernDashboardPage} />
      <Route path="/legacy" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
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