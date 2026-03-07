import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MotherDashboard from './pages/MotherDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import HealthCheckinPage from './pages/HealthCheckinPage';
import EducationPage from './pages/EducationPage';
import AlertsPage from './pages/AlertsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import PatientDetailPage from './pages/PatientDetailPage';
import NotFound from './pages/NotFound';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <HomePage />
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    visible: false
  },
  {
    name: 'Register',
    path: '/register',
    element: <RegisterPage />,
    visible: false
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <MotherDashboard />
  },
  {
    name: 'Provider Dashboard',
    path: '/provider-dashboard',
    element: <ProviderDashboard />
  },
  {
    name: 'Health Check-in',
    path: '/health-checkin',
    element: <HealthCheckinPage />
  },
  {
    name: 'Education',
    path: '/education',
    element: <EducationPage />
  },
  {
    name: 'Alerts',
    path: '/alerts',
    element: <AlertsPage />
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <ProfilePage />
  },
  {
    name: 'Admin',
    path: '/admin',
    element: <AdminPage />
  },
  {
    name: 'Patients',
    path: '/patients',
    element: <ProviderDashboard />
  },
  {
    name: 'Patient Detail',
    path: '/patients/:id',
    element: <PatientDetailPage />,
    visible: false
  },
  {
    name: 'Emergency',
    path: '/emergency',
    element: <MotherDashboard />,
    visible: false
  },
  {
    name: 'Not Found',
    path: '*',
    element: <NotFound />,
    visible: false
  }
];

export default routes;
