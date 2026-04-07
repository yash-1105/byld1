import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { Suspense, lazy } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AIAssistant from "@/components/AIAssistant";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";

// Lazy load heavy pages
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("@/pages/ProjectDetailPage"));
const TasksPage = lazy(() => import("@/pages/TasksPage"));
const SiteUpdatesPage = lazy(() => import("@/pages/SiteUpdatesPage"));
const BudgetPage = lazy(() => import("@/pages/BudgetPage"));
const DocumentsPage = lazy(() => import("@/pages/DocumentsPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const TeamPage = lazy(() => import("@/pages/TeamPage"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const ApprovalsPage = lazy(() => import("@/pages/ApprovalsPage"));
const ConsultationsPage = lazy(() => import("@/pages/ConsultationsPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const ProcurementPage = lazy(() => import("@/pages/ProcurementPage"));
const TimelinePage = lazy(() => import("@/pages/TimelinePage"));
const StaticPage = lazy(() => import("@/pages/StaticPage"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="/projects" element={<Suspense fallback={<PageLoader />}><ProjectsPage /></Suspense>} />
          <Route path="/projects/:id" element={<Suspense fallback={<PageLoader />}><ProjectDetailPage /></Suspense>} />
          <Route path="/tasks" element={<Suspense fallback={<PageLoader />}><TasksPage /></Suspense>} />
          <Route path="/site-updates" element={<Suspense fallback={<PageLoader />}><SiteUpdatesPage /></Suspense>} />
          <Route path="/budget" element={<Suspense fallback={<PageLoader />}><BudgetPage /></Suspense>} />
          <Route path="/documents" element={<Suspense fallback={<PageLoader />}><DocumentsPage /></Suspense>} />
          <Route path="/chat" element={<Suspense fallback={<PageLoader />}><ChatPage /></Suspense>} />
          <Route path="/team" element={<Suspense fallback={<PageLoader />}><TeamPage /></Suspense>} />
          <Route path="/calendar" element={<Suspense fallback={<PageLoader />}><CalendarPage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          <Route path="/approvals" element={<Suspense fallback={<PageLoader />}><ApprovalsPage /></Suspense>} />
          <Route path="/consultations" element={<Suspense fallback={<PageLoader />}><ConsultationsPage /></Suspense>} />
          <Route path="/notifications" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>} />
          <Route path="/procurement" element={<Suspense fallback={<PageLoader />}><ProcurementPage /></Suspense>} />
          <Route path="/timeline" element={<Suspense fallback={<PageLoader />}><TimelinePage /></Suspense>} />
        </Route>

        {/* Static/footer pages */}
        <Route path="/features" element={<Suspense fallback={<PageLoader />}><StaticPage page="features" /></Suspense>} />
        <Route path="/pricing" element={<Suspense fallback={<PageLoader />}><StaticPage page="pricing" /></Suspense>} />
        <Route path="/integrations" element={<Suspense fallback={<PageLoader />}><StaticPage page="integrations" /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<PageLoader />}><StaticPage page="about" /></Suspense>} />
        <Route path="/blog" element={<Suspense fallback={<PageLoader />}><StaticPage page="blog" /></Suspense>} />
        <Route path="/careers" element={<Suspense fallback={<PageLoader />}><StaticPage page="careers" /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><StaticPage page="privacy" /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<PageLoader />}><StaticPage page="terms" /></Suspense>} />
        <Route path="/security" element={<Suspense fallback={<PageLoader />}><StaticPage page="security" /></Suspense>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      {isAuthenticated && <AIAssistant />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
