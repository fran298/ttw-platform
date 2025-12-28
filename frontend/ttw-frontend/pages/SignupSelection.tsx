import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Briefcase, ChevronRight } from 'lucide-react';

const SignupSelection: React.FC = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-brand-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-100 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
        
        <Link to="/" className="mb-12 block hover:scale-105 transition-transform duration-300">
            <img 
                src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763998121/The-Travel-Wild-_Logo-fondo-transparente_tvxme0.png" 
                alt="The Travel Wild" 
                className="h-40 w-auto object-contain"
            />
        </Link>

        <div className="text-center max-w-2xl mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-none">
                Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#132b5b] to-brand-500">Adventure</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium">
                Select your role to get started. Are you looking to book an experience, or do you want to host one?
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            
            {/* User Card */}
            <Link to={`/signup/user${location.search}`} className="group relative bg-white rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-brand-400 transition-all duration-500 p-10 flex flex-col items-center text-center overflow-hidden hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
                <div className="w-24 h-24 bg-blue-100 text-[#132b5b] rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:rotate-6 transition-transform duration-500 shadow-inner">
                    <User className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-3 uppercase tracking-tight">Traveler</h2>
                <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                    I want to discover spots, book lessons, rent gear, and join trips worldwide.
                </p>
                <span className="w-full py-4 rounded-xl bg-gray-100 text-[#132b5b] font-black text-sm uppercase tracking-wider group-hover:bg-[#132b5b] group-hover:text-white transition-all flex items-center justify-center">
                    Create User Account <ChevronRight className="w-4 h-4 ml-2" />
                </span>
            </div>
            </Link>

            {/* Provider Card */}
            <Link to={`/signup/provider${location.search}`} className="group relative bg-[#132b5b] rounded-[2.5rem] shadow-2xl shadow-blue-900/20 border-2 border-transparent hover:border-orange-400 transition-all duration-500 p-10 flex flex-col items-center text-center overflow-hidden hover:-translate-y-2">
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-2xl">PARTNER</div>
            <div className="relative z-10">
                <div className="w-24 h-24 bg-white/10 text-orange-400 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:-rotate-6 transition-transform duration-500 border border-white/10">
                    <Briefcase className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">Provider</h2>
                <p className="text-blue-200 mb-8 text-lg leading-relaxed">
                    I am an Instructor, School, or Guide looking to list activities and manage bookings.
                </p>
                <span className="w-full py-4 rounded-xl bg-orange-500 text-white font-black text-sm uppercase tracking-wider hover:bg-orange-600 transition-all flex items-center justify-center shadow-lg shadow-orange-500/30">
                    Become a Partner <ChevronRight className="w-4 h-4 ml-2" />
                </span>
            </div>
            </Link>

        </div>

        <p className="mt-12 text-gray-400 font-medium">
            Already have an account? <Link to={`/login${location.search}`} className="text-[#132b5b] font-black hover:underline">
  Log in here
</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupSelection;
