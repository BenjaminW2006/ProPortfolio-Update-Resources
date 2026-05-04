import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useParams, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { shadcn } from "@clerk/themes";
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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Use the test key directly in dev — publishableKeyFromHost resolves to a
// live key for the Replit dev domain which requires a registered proxy URL
// that isn't configured in the dev environment.
// In production, Replit auto-swaps VITE_CLERK_PUBLISHABLE_KEY to the live key
// and sets VITE_CLERK_PROXY_URL to the correct proxy URL.
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "";

// Proxy URL only set in production by Replit; undefined in dev (test key
// connects directly to Clerk's test FAPI without a proxy).
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL || undefined;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#2563eb",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#ef4444",
    colorBackground: "#1e293b",
    colorInput: "#334155",
    colorInputForeground: "#f1f5f9",
    colorNeutral: "#475569",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-slate-800 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-slate-700",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButtonText: "text-slate-200",
    formFieldLabel: "text-slate-400",
    footerActionLink: "text-blue-400",
    footerActionText: "text-slate-400",
    dividerText: "text-slate-500",
    identityPreviewEditButton: "text-blue-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-slate-200",
    logoBox: "flex justify-center py-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border-slate-600 bg-slate-700 hover:bg-slate-600",
    formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
    formFieldInput: "bg-slate-700 border-slate-600 text-white",
    footerAction: "border-t border-slate-700",
    dividerLine: "bg-slate-700",
    alert: "border-red-900/50 bg-red-900/20",
    otpCodeFieldInput: "bg-slate-700 border-slate-600 text-white",
    formFieldRow: "",
    main: "",
  },
};

function ManagerSignInPage() {
  const { companyName, logoUrl } = useSiteSettings();
  const logoImageUrl = logoUrl ?? `${window.location.origin}${basePath}/logo.svg`;
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="flex flex-col items-center w-[440px] max-w-full">
        {companyName && (
          <div className="w-full bg-slate-800 rounded-t-2xl border border-b-0 border-slate-700 px-8 py-3 text-center">
            <p className="text-slate-300 text-sm font-medium tracking-widest uppercase">
              {companyName}
            </p>
          </div>
        )}
        <SignIn
          routing="path"
          path={`${basePath}/manager/sign-in`}
          signUpUrl={`${basePath}/manager/sign-up`}
          forceRedirectUrl={`${basePath}/manager`}
          appearance={{
            options: { logoImageUrl },
            elements: {
              cardBox: companyName
                ? "bg-slate-800 rounded-t-none rounded-b-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-slate-700"
                : undefined,
            },
          }}
        />
      </div>
    </div>
  );
}

function ManagerSignUpPage() {
  const { companyName, logoUrl } = useSiteSettings();
  const logoImageUrl = logoUrl ?? `${window.location.origin}${basePath}/logo.svg`;
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="flex flex-col items-center w-[440px] max-w-full">
        {companyName && (
          <div className="w-full bg-slate-800 rounded-t-2xl border border-b-0 border-slate-700 px-8 py-3 text-center">
            <p className="text-slate-300 text-sm font-medium tracking-widest uppercase">
              {companyName}
            </p>
          </div>
        )}
        <SignUp
          routing="path"
          path={`${basePath}/manager/sign-up`}
          signInUrl={`${basePath}/manager/sign-in`}
          forceRedirectUrl={`${basePath}/manager`}
          appearance={{
            options: { logoImageUrl },
            elements: {
              cardBox: companyName
                ? "bg-slate-800 rounded-t-none rounded-b-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-slate-700"
                : undefined,
            },
          }}
        />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/gallery/project/:id" component={ProjectDetailPage} />
      <Route path="/gallery/:key" component={GalleryRoute} />
      <Route path="/gallery" component={DefaultGallery} />
      <Route path="/manager/sign-in/*?" component={ManagerSignInPage} />
      <Route path="/manager/sign-up/*?" component={ManagerSignUpPage} />
      <Route path="/manager" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey ?? ""}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/manager/sign-in`}
      signUpUrl={`${basePath}/manager/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Company Manager",
            subtitle: "Sign in to manage your site",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <SiteSettingsProvider>
            <Router />
            <Toaster />
          </SiteSettingsProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
