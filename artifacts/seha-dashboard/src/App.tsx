import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import LeavesList from "@/pages/leaves-list";
import LeaveDetail from "@/pages/leave-detail";
import Inquiry from "@/pages/inquiry";
import NewLeave from "@/pages/new-leave";
import Layout from "@/components/layout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/inquiry" component={Inquiry} />
      <Route path="/">
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/leaves" component={LeavesList} />
            <Route path="/leaves/new" component={NewLeave} />
            <Route path="/leaves/:id" component={LeaveDetail} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
