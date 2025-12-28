import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, ShieldAlert, LogIn, UserPlus, LogOut, User } from 'lucide-react';

interface NavbarProps {
  // We now use internal state or context, but keeping props for compatibility if parent passes them
  userRole?: string; 
  setUserRole?: (role: string) => void;
}

const Navbar: React.FC<NavbarProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Real Auth State
  const [user, setUser] = useState<{ name: string, role: string } | null>(null);

  // Check Auth on Mount & Route Change
  useEffect(() => {
      const token = localStorage.getItem('accessToken');
      const role = localStorage.getItem('userRole');
      const name = localStorage.getItem('userName');

      if (token && role) {
          setUser({ name: name || 'User', role });
      } else {
          setUser(null);
      }
      setIsOpen(false); // Close mobile menu on route change
  }, [location]);

  const handleLogout = () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      setUser(null);
      navigate('/');
  };

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <nav className={`sticky top-0 z-50 transition-colors duration-200 ${isOpen ? 'bg-white' : 'bg-white/95 backdrop-blur-sm'} shadow-sm border-b border-gray-100`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center group relative z-50">
            <img 
              src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763998121/The-Travel-Wild-_Logo-fondo-transparente_tvxme0.png"
              alt="The Travel Wild Logo"
              className="h-20 md:h-32 w-auto mr-4 object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex space-x-8 items-center">
            {['Home', 'Sports', 'Destinations', 'Instructors', 'Membership', 'Contact'].map((item) => (
                <Link 
                    key={item}
                    to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} 
                    className="text-sm font-bold text-gray-600 hover:text-[#132b5b] transition-colors uppercase tracking-wide"
                >
                    {item}
                </Link>
            ))}
          </div>

          {/* Right Side: Auth & Dashboard */}
          <div className="flex items-center space-x-4">
            
            <div className="hidden md:flex items-center space-x-3">
                {user ? (
                    <>
                        {user.role === 'ADMIN' ? (
                            <Link to="/admin" className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-full hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center">
                                <ShieldAlert className="w-4 h-4 mr-2" /> Admin
                            </Link>
                        ) : user.role === 'PROVIDER' || user.role === 'INSTRUCTOR' ? (
                            <Link to="/dashboard" className="px-5 py-2.5 text-sm font-bold text-white bg-[#132b5b] rounded-full hover:bg-[#0f234b] transition-all shadow-lg shadow-blue-900/10 flex items-center">
                                <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                            </Link>
                        ) : (
                            <Link to="/dashboard" className="px-5 py-2.5 text-sm font-bold text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition-all flex items-center">
                                <User className="w-4 h-4 mr-2" /> My Account
                            </Link>
                        )}
                        
                        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/signup" className="px-5 py-2.5 text-sm font-bold text-[#132b5b] border-2 border-[#132b5b]/10 rounded-full hover:border-[#132b5b] hover:bg-[#132b5b]/5 transition-all">
                            Sign up
                        </Link>
                        <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-white bg-[#132b5b] rounded-full hover:bg-[#0f234b] transition-all shadow-lg shadow-blue-900/10">
                            Login
                        </Link>
                    </>
                )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="lg:hidden z-50">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-gray-600 hover:text-[#132b5b] transition-colors"
                >
                    {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-40 pt-28 px-6 overflow-y-auto h-screen">
            <div className="flex flex-col space-y-6 text-center pb-10">
                {['Home', 'Sports', 'Destinations', 'Instructors', 'Membership', 'Contact'].map((item) => (
                    <Link 
                        key={item}
                        to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} 
                        className="text-xl font-black text-gray-900 hover:text-[#132b5b] transition-colors uppercase"
                        onClick={() => setIsOpen(false)}
                    >
                        {item}
                    </Link>
                ))}
                
                <div className="h-px w-full bg-gray-100 my-4"></div>

                {/* Mobile Auth Buttons */}
                <div className="flex flex-col gap-3">
                    {user ? (
                         <>
                            <Link 
                                to={user.role === 'ADMIN' ? "/admin" : "/dashboard"} 
                                onClick={() => setIsOpen(false)} 
                                className="w-full bg-[#132b5b] text-white py-3 rounded-xl font-bold flex items-center justify-center"
                            >
                                <LayoutDashboard className="w-5 h-5 mr-2" /> {user.role === 'USER' ? 'My Trips' : 'Dashboard'}
                            </Link>
                            <button onClick={handleLogout} className="w-full border-2 border-red-100 text-red-500 py-3 rounded-xl font-bold flex items-center justify-center hover:bg-red-50">
                                <LogOut className="w-5 h-5 mr-2" /> Logout
                            </button>
                         </>
                    ) : (
                        <>
                            <Link to="/login" onClick={() => setIsOpen(false)} className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center hover:bg-gray-50">
                                <LogIn className="w-5 h-5 mr-2" /> Login
                            </Link>
                            <Link to="/signup" onClick={() => setIsOpen(false)} className="w-full bg-[#132b5b] text-white py-3 rounded-xl font-bold flex items-center justify-center shadow-xl">
                                <UserPlus className="w-5 h-5 mr-2" /> Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;