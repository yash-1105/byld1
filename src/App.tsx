import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AIAssistant from "@/components/AIAssistant";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import TasksPage from "@/pages/TasksPage";
import SiteUpdatesPage from "@/pages/SiteUpdatesPage";
import BudgetPage from "@/pages/BudgetPage";
import DocumentsPage from "@/pages/DocumentsPage";
import ChatPage from "@/pages/ChatPage";
import TeamPage from "@/pages/TeamPage";
import CalendarPage from "@/pages/CalendarPage";
import SettingsPage from "@/pages/SettingsPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import ConsultationsPage from "@/pages/ConsultationsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import StaticPage from "@/pages/StaticPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

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
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/site-updates" element={<SiteUpdatesPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/consultations" element={<ConsultationsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Static/footer pages */}
        <Route path="/features" element={<StaticPage page="features" />} />
        <Route path="/pricing" element={<StaticPage page="pricing" />} />
        <Route path="/integrations" element={<StaticPage page="integrations" />} />
        <Route path="/about" element={<StaticPage page="about" />} />
        <Route path="/blog" element={<StaticPage page="blog" />} />
        <Route path="/careers" element={<StaticPage page="careers" />} />
        <Route path="/privacy" element={<StaticPage page="privacy" />} />
        <Route path="/terms" element={<StaticPage page="terms" />} />
        <Route path="/security" element={<StaticPage page="security" />} />

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
