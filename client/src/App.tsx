/**
 * Roteamento principal do painel Videlis, com rotas da visão operacional
 * e do cadastro de conteúdo VOD dentro de um tema administrativo escuro.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { EpgPage, SubscriptionsPage } from "./pages/AdminPages";
import ChannelsPage from "./pages/ChannelsPage";
import CustomersPage from "./pages/CustomersPage";
import Home from "./pages/Home";
import IntegrationsPage from "./pages/IntegrationsPage";
import PlansPage from "./pages/PlansPage";
import VodEpisodesPage from "./pages/VodEpisodesPage";
import M3uPage from "./pages/M3uPage";
import PixHistoryPage from "./pages/PixHistoryPage";
import VodPage from "./pages/VodPage";
import AndroidUpdatesPage from "./pages/AndroidUpdatesPage";
import { AdminAccessGate } from "./components/PanelLayout";

function AdminRoute({ path, component: Component }: { path: string; component: React.ComponentType }) {
  return <Route path={path} component={() => <AdminAccessGate><Component /></AdminAccessGate>} />;
}

function Router() {
  return (
    <Switch>
      <AdminRoute path="/" component={Home} />
      <AdminRoute path="/clientes" component={CustomersPage} />
      <AdminRoute path="/planos" component={PlansPage} />
      <AdminRoute path="/canais" component={ChannelsPage} />
      <AdminRoute path="/vod" component={VodPage} />
      <AdminRoute path="/vod/:id/episodios" component={VodEpisodesPage} />
      <AdminRoute path="/listas-m3u" component={M3uPage} />
      <AdminRoute path="/epg" component={EpgPage} />
      <AdminRoute path="/assinaturas" component={SubscriptionsPage} />
      <AdminRoute path="/historico-pix" component={PixHistoryPage} />
      <AdminRoute path="/atualizacoes-android" component={AndroidUpdatesPage} />
      <AdminRoute path="/integracoes" component={IntegrationsPage} />
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
