import { Switch, Route, Router as WouterRouter, useParams } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteSettingsProvider, DEFAULT_SETTINGS, type SiteSettings } from "@/context/SiteSettingsContext";
import SetupWizard from "@/components/SetupWizard";
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

function AppContent() {
  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) return DEFAULT_SETTINGS;
      return res.json() as Promise<SiteSettings>;
    },
    staleTime: 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings?.setupComplete) {
    return <SetupWizard />;
  }

  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SiteSettingsProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppContent />
          </WouterRouter>
          <Toaster />
        </SiteSettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
