
import React from 'react';
import ProviderDashboard from '../components/dashboard/ProviderDashboard';
import UserDashboard from '../components/dashboard/UserDashboard';

interface Props {
  role: 'PROVIDER' | 'ADMIN' | 'USER'; 
}

const Dashboard: React.FC<Props> = ({ role }) => {
  // Render the correct dashboard based on role
  if (role === 'USER') { 
      return <UserDashboard />;
  }

  return <ProviderDashboard />;
};

export default Dashboard;
