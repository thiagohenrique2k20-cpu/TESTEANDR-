import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";

// Pages
import CheckIn from "@/pages/check-in";
import Instructors from "@/pages/instructors";
import Sectors from "@/pages/sectors";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CheckIn} />
      <Route path="/instructors" component={Instructors} />
      <Route path="/sectors" component={Sectors} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style}>
          <div className="flex min-h-screen w-full bg-muted/20">
            <AppSidebar />
            <main className="flex-1 w-full overflow-y-auto">
              <Router />
            </main>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
