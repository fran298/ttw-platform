import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { login } from '../services/dataService';
import { ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect");
  const [activeTab, setActiveTab] = useState<'TRAVELER' | 'PARTNER'>('TRAVELER');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const user = await login(email, password);
        
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        if (accessToken) localStorage.setItem("access", accessToken);
        if (refreshToken) localStorage.setItem("refresh", refreshToken);
        
        setLoading(false);
        
        const next = redirect ? decodeURIComponent(redirect) : (activeTab === 'PARTNER' ? '/dashboard' : '/');
        navigate(next);
        
    } catch (error) {
        console.error(error);
        setLoading(false);
        alert("Login failed. Please check credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      {/* Logo */}
      <Link to="/" className="mb-8 block hover:scale-105 transition-transform duration-300">
        <img 
            src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763998121/The-Travel-Wild-_Logo-fondo-transparente_tvxme0.png" 
            alt="The Travel Wild" 
            className="h-32 w-auto object-contain"
        />
      </Link>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button 
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'TRAVELER' ? 'bg-white text-brand-600 border-b-2 border-brand-600' : 'bg-gray-50 text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('TRAVELER')}
          >
            Traveler
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'PARTNER' ? 'bg-white text-brand-600 border-b-2 border-brand-600' : 'bg-gray-50 text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('PARTNER')}
          >
            Partner
          </button>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {activeTab === 'TRAVELER' ? 'Welcome back, adventurer' : 'Manage your business'}
          </h2>
          <p className="text-gray-500 mb-6 text-sm">Login to your {activeTab.toLowerCase()} account.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border-gray-300 rounded-lg p-3 focus:ring-brand-500 focus:border-brand-500" 
                required 
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-gray-600">
                <input type="checkbox" className="mr-2 rounded text-brand-600 focus:ring-brand-500" />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="text-brand-600 hover:underline font-bold"
              >
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex justify-center items-center"
            >
              {loading ? 'Logging in...' : 'Login'} <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link
              to={`/signup${location.search}`}
              className="text-brand-600 font-bold hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;