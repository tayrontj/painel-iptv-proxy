/**
 * Roteamento principal do painel Nexus Stream, com rotas da visão operacional
 * e do cadastro de conteúdo VOD dentro de um tema administrativo escuro.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChannelsPage, CustomersPage, EpgPage, SubscriptionsPage } from "./pages/AdminPages";
import Home from "./pages/Home";
import IntegrationsPage from "./pages/IntegrationsPage";
import PlansPage from "./pages/PlansPage";
import VodEpisodesPage from "./pages/VodEpisodesPage";
import VodPage from "./pages/VodPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/clientes" component={CustomersPage} />
      <Route path="/planos" component={PlansPage} />
      <Route path="/canais" component={ChannelsPage} />
      <Route path="/vod" component={VodPage} />
      <Route path="/vod/:id/episodios" component={VodEpisodesPage} />
      <Route path="/epg" component={EpgPage} />
      <Route path="/assinaturas" component={SubscriptionsPage} />
      <Route path="/integracoes" component={IntegrationsPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
