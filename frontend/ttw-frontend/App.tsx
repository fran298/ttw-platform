import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Detail from './pages/Detail';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import ContinentLanding from './pages/ContinentLanding';
import DestinationsIndex from './pages/DestinationsIndex';
import CityLanding from './pages/CityLanding';
import DestinationLanding from './pages/DestinationLanding';
import ProviderProfilePage from './pages/ProviderProfile';
import SignupUser from './pages/SignupUser';
import SignupProvider from './pages/SignupProvider';
import SignupSelection from './pages/SignupSelection';
import SportsIndex from './pages/SportsIndex';
import SportLanding from './pages/SportLanding';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProviderOnboarding from './pages/ProviderOnboarding';
import UserBookingDetail from './pages/UserBookingDetail';
import Footer from "./pages/Footer";
import Contact from "./pages/Contact";
import BecomeMember from './pages/BecomeMember';
import InstructorsLanding from './pages/InstructorsLanding';
import ManageListing from './pages/ManageListing';
import PremiumSuccess from './pages/PremiumSuccess';
import CookieBanner from './pages/CookieBanner';
import CookiePolicy from './pages/CookiePolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<'USER' | 'PROVIDER' | 'ADMIN' | null>(null);

  // Auth State Listener
  useEffect(() => {
      const checkAuth = () => {
          const storedRole = localStorage.getItem('userRole');
          if (storedRole) {
              setUserRole(storedRole as any);
          } else {
              setUserRole(null);
          }
      };
      
      // Check immediately
      checkAuth();
      
      // Listen for events
      window.addEventListener('auth-change', checkAuth);
      window.addEventListener('storage', checkAuth);
      
      return () => {
          window.removeEventListener('auth-change', checkAuth);
          window.removeEventListener('storage', checkAuth);
      };
  }, []);

  useEffect(() => {
    const consent = localStorage.getItem("ttw_cookie_consent");
    if (consent !== "accepted") {
      return;
    }
    if ((window as any).gtag) {
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-H0MZ2LJK6H";
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];

    (window as any).gtag = function (...args: any[]) {
      (window as any).dataLayer.push(args);
    };

    (window as any).gtag('js', new Date());
    (window as any).gtag('config', 'G-H0MZ2LJK6H', {
      anonymize_ip: true,
    });
  }, []);

  const location = useLocation();
  const hideNavbar =
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/signup') ||
    location.pathname.startsWith('/onboarding');

  const hideFooter = hideNavbar || location.pathname === '/admin' || location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <ScrollToTop />

      {!hideNavbar && (
        <Navbar userRole={userRole as any} setUserRole={() => {}} />
      )}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/instructors" element={<InstructorsLanding />} />
          <Route path="/membership" element={<BecomeMember />} />
          <Route path="/premium/success" element={<PremiumSuccess />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />

          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<SignupSelection />} />

          <Route path="/destinations" element={<DestinationsIndex />} />
          <Route path="/continent/:continentId" element={<ContinentLanding />} />
          <Route path="/destination/:geoId" element={<DestinationLanding />} />
          <Route path="/city/:cityId" element={<CityLanding />} />

          <Route path="/activity/:id" element={<Detail />} />
          <Route path="/rent/:id" element={<Detail />} />
          <Route path="/trip/:id" element={<Detail />} />
          <Route path="/:type/:id" element={<Detail />} />

          <Route path="/provider/:providerId" element={<ProviderProfilePage />} />
          <Route path="/manage-listing/:action" element={<ManageListing />} />

          <Route path="/checkout" element={<Checkout />} />
          <Route path="/booking/:bookingId" element={<UserBookingDetail />} />

          <Route path="/signup/user" element={<SignupUser />} />
          <Route path="/signup/provider" element={<SignupProvider />} />
          <Route path="/onboarding" element={<ProviderOnboarding />} />
          
          <Route path="/sports" element={<SportsIndex />} />
          <Route path="/sport/:sportSlug" element={<SportLanding />} />


          {/* Protected Routes */}
          <Route path="/dashboard" element={userRole ? <Dashboard role={userRole || 'USER'} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={userRole === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/" />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!hideFooter && <Footer />}
      <CookieBanner />
    </div>
  );
};

const AppWrapper = () => (
  <HashRouter>
    <App />
  </HashRouter>
);

export default AppWrapper;