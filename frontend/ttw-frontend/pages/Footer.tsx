import React from "react";
import { Globe, Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  const resetCookies = () => {
    try {
      localStorage.removeItem("ttw_cookie_consent");
    } finally {
      window.location.reload();
    }
  };

  return (
    <footer className="bg-[#2d3748] text-white pt-8 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Newsletter Section */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-12 mb-12">
            <div className="mb-6 md:mb-0 md:mr-8 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold italic mb-2">Get the best travel tips</h2>
                <h3 className="text-xl md:text-2xl font-light text-gray-300">& exclusive offers in your inbox</h3>
            </div>
            <div className="flex w-full md:w-auto max-w-md">
                <input 
                    type="email" 
                    placeholder="Enter your email address" 
                    className="bg-gray-700/50 text-white px-4 py-3 rounded-l-lg outline-none focus:ring-1 focus:ring-brand-500 flex-grow w-full md:w-64 placeholder-gray-400 text-sm"
                />
                <button className="bg-[#6ba5b5] hover:bg-[#5a8f9e] text-white px-6 py-3 rounded-r-lg font-bold text-sm whitespace-nowrap transition-colors">
                    Subscribe Now
                </button>
            </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start">
                <div className="flex items-center justify-center md:justify-start mb-4">
                    <img 
                        src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763998121/The-Travel-Wild-_Logo-fondo-transparente_tvxme0.png" 
                        alt="The Travel Wild Logo"
                        className="w-40 h-auto"
                    />
                </div>
                <h4 className="text-xl font-bold text-white mb-4">Wild trips,<br/>meaningful connections</h4>
                <div className="flex space-x-4">
                    <Instagram className="w-5 h-5 hover:text-brand-400 cursor-pointer" />
                    <Facebook className="w-5 h-5 hover:text-brand-400 cursor-pointer" />
                    <Youtube className="w-5 h-5 hover:text-brand-400 cursor-pointer" />
                    <Twitter className="w-5 h-5 hover:text-brand-400 cursor-pointer" />
                </div>
            </div>

            <div>
                <h4 className="font-bold text-lg mb-6">Quick link</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                    <li><Link to="/" className="hover:text-white">Home page</Link></li>
                    <li><Link to="/about" className="hover:text-white">About us</Link></li>
                    <li><Link to="/destinations" className="hover:text-white">Destination</Link></li>
                    <li><Link to="/testimonials" className="hover:text-white">Testimonials</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-lg mb-6">Contact With</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                    <li>Website</li>
                    <li>Instagram</li>
                    <li>Email address</li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-lg mb-6">Information</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                    <li>FAQ</li>
                    <li>Blog</li>
                    <li>Support</li>
                    <li><Link to="/terms" className="hover:text-white">Terms of Use</Link></li>
                    <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                    <li><Link to="/cookies" className="hover:text-white">Cookies Policy</Link></li>
                    <li>
                      <button
                        onClick={resetCookies}
                        className="hover:text-white text-left"
                        aria-label="Change cookie preferences"
                      >
                        Cookie preferences
                      </button>
                    </li>
                </ul>
            </div>
        </div>
        <div className="border-t border-gray-700 mt-12 pt-6 text-center text-gray-400 text-sm">
          © 2025 The Travel Wild. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;