import { Switch, Route, Router as WouterRouter, useParams } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteSettingsProvider } from "@/context/SiteSettingsContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ContactPage from "@/pages/ContactPage";
import AdminPage from "@/pages/AdminPage";
import GalleryPage from "@/pages/GalleryPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";

const GalleryRoute = () => {
  const params = useParams<{ key: string }>();
  return <GalleryPage category={params.key} />;
};
const DefaultGallery = () => <GalleryPage />;

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/gallery/project/:id" component={ProjectDetailPage} />
      <Route path="/gallery/:key" component={GalleryRoute} />
      <Route path="/gallery" component={DefaultGallery} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SiteSettingsProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </SiteSettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
