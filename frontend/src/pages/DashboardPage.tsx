import { useAuth } from '@/contexts/AuthContext';
import ArchitectDashboard from '@/components/dashboards/ArchitectDashboard';
import ContractorDashboard from '@/components/dashboards/ContractorDashboard';
import ClientDashboard from '@/components/dashboards/ClientDashboard';
import ConsultantDashboard from '@/components/dashboards/ConsultantDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  switch (user.role) {
    case 'architect': return <ArchitectDashboard />;
    case 'contractor': return <ContractorDashboard />;
    case 'client': return <ClientDashboard />;
    case 'consultant': return <ConsultantDashboard />;
  }
}
