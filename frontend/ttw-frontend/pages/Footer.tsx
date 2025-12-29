import React from "react";
import { 
  Instagram, 
  Facebook, 
  Youtube, 
  Twitter, 
  Music2, // TikTok
  AtSign  // Threads
} from "lucide-react";
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
    <footer className="bg-[#253445] text-white py-16 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Newsletter Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-6 tracking-tight leading-tight">
            Get the best travel tips <br className="hidden md:block" />
            <span className="font-semibold text-gray-200">& exclusive offers in your inbox</span>
          </h2>
          
          <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl justify-center">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="bg-transparent border border-gray-400 text-white px-8 py-4 rounded-full outline-none focus:border-[#4fd1c5] flex-grow text-sm transition-all"
            />
            <button className="bg-[#4fd1c5] hover:bg-[#3dbbb0] text-[#011c2b] px-10 py-4 rounded-full font-bold text-sm transition-colors whitespace-nowrap">
              Subscribe Now
            </button>
          </div>
        </div>

        {/* Inner Card (Recuadro Azul) */}
        <div className="bg-[#334454] rounded-[45px] p-10 md:p-16 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Left Column: Logo & Socials */}
            <div className="md:col-span-5 flex flex-col items-start">
              <img 
                src="https://res.cloudinary.com/dmvlubzor/image/upload/v1767026047/Logo-Blanco-_fondo-transparente_bppjax_10d8dd.png" 
                alt="The Travel Wild"
                className="w-60 h-auto mb-8"
              />
              <h3 className="text-3xl font-bold leading-[1.1] mb-10">
                Wild trips,<br />meaningful connections
              </h3>
              
              {/* Social Icons - Estilo Mockup */}
              <div className="flex space-x-5 text-gray-300">
                <Instagram className="w-6 h-6 cursor-pointer hover:text-[#4fd1c5] transition-colors" />
                <Facebook className="w-6 h-6 cursor-pointer hover:text-[#4fd1c5] transition-colors" />
                <Youtube className="w-6 h-6 cursor-pointer hover:text-[#4fd1c5] transition-colors" />
                <AtSign className="w-6 h-6 cursor-pointer hover:text-[#4fd1c5] transition-colors" />
              </div>
            </div>

            {/* Right Columns: Links */}
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-10">
              
              {/* Quick Links */}
              <div>
                <h4 className="font-bold text-lg mb-6 text-white">Quick link</h4>
                <ul className="space-y-4 text-[15px] text-gray-300">
                  <li><Link to="/" className="hover:text-[#4fd1c5] transition-colors">Home page</Link></li>
                  <li><Link to="/about" className="hover:text-[#4fd1c5] transition-colors">About us</Link></li>
                  <li><Link to="/destinations" className="hover:text-[#4fd1c5] transition-colors">Destination</Link></li>
                  <li><Link to="/testimonials" className="hover:text-[#4fd1c5] transition-colors">Testimonials</Link></li>
                </ul>
              </div>

              {/* Contact With */}
              <div>
                <h4 className="font-bold text-lg mb-6 text-white">Contact With</h4>
                <ul className="space-y-4 text-[15px] text-gray-300">
                  <li className="hover:text-[#4fd1c5] cursor-pointer transition-colors">Website</li>
                  <li className="hover:text-[#4fd1c5] cursor-pointer transition-colors">Instagram</li>
                  <li className="hover:text-[#4fd1c5] cursor-pointer transition-colors">Email address</li>
                </ul>
              </div>

              {/* Information - Con todos los links solicitados */}
              <div>
                <h4 className="font-bold text-lg mb-6 text-white">Information</h4>
                <ul className="space-y-4 text-[15px] text-gray-300">
                  <li><Link to="/faq" className="hover:text-[#4fd1c5] transition-colors">FAQ</Link></li>
                  <li><Link to="/blog" className="hover:text-[#4fd1c5] transition-colors">Blog</Link></li>
                  <li><Link to="/support" className="hover:text-[#4fd1c5] transition-colors">Support</Link></li>
                  <li><Link to="/terms" className="hover:text-[#4fd1c5] transition-colors">Terms of Use</Link></li>
                  <li><Link to="/privacy" className="hover:text-[#4fd1c5] transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/cookies" className="hover:text-[#4fd1c5] transition-colors">Cookies Policy</Link></li>
                  <li>
                    <button 
                      onClick={resetCookies} 
                      className="hover:text-[#4fd1c5] text-left transition-colors"
                    >
                      Cookie preferences
                    </button>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>
        
        {/* Footer Copyright */}
        <div className="mt-12 text-center text-xs text-gray-500 uppercase tracking-widest">
          © 2025 THE TRAVEL WILD. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;