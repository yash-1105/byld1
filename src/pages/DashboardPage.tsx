import { useAuth } from '@/contexts/AuthContext';
import ArchitectDashboard from '@/components/dashboards/ArchitectDashboard';
import ContractorDashboard from '@/components/dashboards/ContractorDashboard';
import ClientDashboard from '@/components/dashboards/ClientDashboard';
import ConsultantDashboard from '@/components/dashboards/ConsultantDashboard';
import SharedApprovalsWidget from '@/components/dashboards/SharedApprovalsWidget';
import GoogleCalendarWidget from '@/components/dashboards/GoogleCalendarWidget';
import AIInsightsPanel from '@/components/ai/AIInsightsPanel';
import AISummaryPanel from '@/components/ai/AISummaryPanel';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const roleDashboard =
    user.role === 'architect' ? <ArchitectDashboard /> :
    user.role === 'contractor' ? <ContractorDashboard /> :
    user.role === 'client' ? <ClientDashboard /> :
    user.role === 'consultant' ? <ConsultantDashboard /> : null;

  // Contractors & consultants have no Approvals page — surface approvals
  // shared with them here instead.
  const showSharedApprovals = user.role === 'contractor' || user.role === 'consultant';

  return (
    <div className="space-y-6">
      <AIInsightsPanel />
      <AISummaryPanel compact />
      <GoogleCalendarWidget />
      {showSharedApprovals && <SharedApprovalsWidget />}
      {roleDashboard}
    </div>
  );
}
