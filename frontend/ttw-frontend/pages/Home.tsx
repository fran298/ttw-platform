import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, ChevronLeft } from 'lucide-react';

import { getSportsDirectory } from '../services/dataService';

const Home: React.FC = () => {
  const [sports, setSports] = useState<any[]>([]);
  
  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 8;

  useEffect(() => {
    const loadSports = async () => {
      try {
        const data = await getSportsDirectory();
        setSports(data);
      } catch (err) {
        console.error("Error loading sports", err);
      }
    };
    loadSports();
  }, []);

  // LOGIC: Calculate visible sports for DESKTOP (Grid)
  const totalPages = Math.ceil(sports.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const visibleSports = sports.slice(startIndex, startIndex + itemsPerPage);

  // HANDLERS: Next and Previous
  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="flex flex-col w-full font-sans">
      
      {/* HERO SECTION */}
      <section className="relative w-full h-[420px] sm:h-[460px] md:h-[520px] flex items-center justify-center mb-24"> 
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
                src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763502872/Foto-principal_pevang.jpg"
                alt="The Travel Wild Hero"
                className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-black/30"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 -mt-12">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-3 drop-shadow-lg tracking-tight leading-tight">
                Find your next Wild Adventure
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl drop-shadow-md">
                Discover extreme sports and destinations around the world
            </p>
        </div>

        {/* Search Bar */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full max-w-3xl px-4 z-20">
          <div className="bg-white rounded-full shadow-2xl p-1 md:p-2 flex flex-row items-center border border-gray-100">
            
            {/* WHERE */}
            <div className="relative flex-1 px-4 md:px-6 py-1.5 md:py-2 border-r border-gray-100 cursor-pointer hover:bg-gray-50 rounded-l-full transition-colors">
              <label className="block text-[9px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5">
                Where?
              </label>
              <input
                type="text"
                placeholder="Anywhere"
                className="w-full bg-transparent border-none p-0 text-gray-500 font-medium focus:ring-0 placeholder-gray-400 text-xs md:text-base"
              />
            </div>

            {/* WHEN */}
            <div className="relative flex-1 px-4 md:px-6 py-1.5 md:py-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <label className="block text-[9px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5">
                When?
              </label>
              <input
                type="text"
                placeholder="Whenever"
                className="w-full bg-transparent border-none p-0 text-gray-500 font-medium focus:ring-0 placeholder-gray-400 text-xs md:text-base"
              />
            </div>

            {/* SEARCH BUTTON */}
            <div className="pl-1 pr-1 md:pr-2 flex items-center">
              <button className="w-9 h-9 md:w-12 md:h-12 bg-[#5B98A7] hover:bg-[#0f234b] text-white rounded-full transition-all shadow-lg flex items-center justify-center transform hover:scale-105">
                <Search className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* SPORTS GRID SECTION */}
      <section className="py-10 pt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">What extreme sport are you looking for?</h2>
        </div>

        <div className="relative max-w-5xl mx-auto">
          
          {/* 
            MOBILE & TABLET SLIDER (Swipeable) 
            CHANGED: Now uses `xl:hidden`. 
            This means the slider stays visible on everything smaller than 1280px (including big tablets).
          */}
          <div className="flex overflow-x-auto snap-x gap-4 xl:hidden pb-2 scrollbar-hide">
              {sports.map((sport, idx) => (
                  <Link
                      to={`/explore?sport=${sport.slug}`}
                      key={idx}
                      className="
                          group relative 
                          min-w-[45%]       /* Mobile Width */
                          md:min-w-[25%]    /* Tablet Width */
                          h-40 md:h-48 
                          rounded-xl overflow-hidden snap-center
                      "
                  >
                      <img src={sport.image} alt={sport.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <h3 className="absolute bottom-4 left-4 text-white font-bold text-lg drop-shadow-md">{sport.name}</h3>
                  </Link>
              ))}
          </div>

          {/* 
            DESKTOP GRID (8 items + Arrows)
            CHANGED: Now uses `xl:grid` (1280px+ only).
          */}
          <div className="hidden xl:grid grid-cols-4 gap-4 min-h-[440px]">
              {visibleSports.map((sport, idx) => (
                  <Link
                      to={`/explore?sport=${sport.slug}`}
                      key={`${currentPage}-${idx}`} 
                      className="group relative h-40 md:h-52 rounded-xl overflow-hidden cursor-pointer animate-fadeIn"
                  >
                      <img src={sport.image} alt={sport.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <h3 className="absolute bottom-4 left-4 text-white font-bold text-xl drop-shadow-md">{sport.name}</h3>
                  </Link>
              ))}
          </div>

          {/* LEFT ARROW (Desktop Only - xl:flex) */}
          {totalPages > 1 && (
            <button 
                onClick={handlePrevPage}
                className="hidden xl:flex absolute top-1/2 left-[-60px] transform -translate-y-1/2 w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors shadow bg-white items-center justify-center z-20"
            >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* RIGHT ARROW (Desktop Only - xl:flex) */}
          {totalPages > 1 && (
            <button 
                onClick={handleNextPage}
                className="hidden xl:flex absolute top-1/2 right-[-60px] transform -translate-y-1/2 w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors shadow bg-white items-center justify-center z-20"
            >
                <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}
          
        </div>
      </section>

      {/* DESTINATIONS SECTION */}
      <section className="py-20 max-w-[100%] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-12">Top Wild Destinations</h2>
        
        <div className="relative w-full overflow-hidden">
          <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(0%)` }}>
            <div className="min-w-full flex flex-col lg:flex-row gap-8 h-auto lg:h-[520px] w-full">
              {/* BIG ITEM */}
              <div className="relative rounded-3xl overflow-hidden group w-full md:w-[500px] h-[480px] flex-shrink-0">
                <img src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763409238/hiking_iguiku.jpg" alt="Chamonix" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <h3 className="absolute bottom-6 left-6 right-6 text-white font-bold text-xl leading-tight">Ski and Snowboard in Chamonix, France</h3>
              </div>

              {/* RIGHT GRID */}
              <div className="flex flex-col gap-4 w-full lg:w-[360px] lg:gap-6 lg:items-start">
                <div className="flex gap-6 w-full">
                  <div className="relative rounded-3xl overflow-hidden group w-full h-[200px] lg:w-[200px] lg:ml-[-1rem]">
                    <img src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763409238/hiking_iguiku.jpg" alt="Kite" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <h3 className="absolute bottom-3 left-3 text-white font-bold text-sm leading-tight">Kite in Cumbuco,<br/>Brazil</h3>
                  </div>
                  <div className="relative rounded-3xl overflow-hidden group w-full h-[270px] lg:w-[200px] lg:ml-[-0.5rem]">
                    <img src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763409238/hiking_iguiku.jpg" alt="Surf" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <h3 className="absolute bottom-3 left-3 text-white font-bold text-sm leading-tight">Surf in Peniche,<br/>Portugal</h3>
                  </div>
                </div>

                <div className="flex gap-6 w-full">
                  <div className="relative rounded-3xl overflow-hidden group w-full h-[270px] mt-[-4.3rem] lg:mt-[-5rem] lg:w-[200px] lg:ml-[-1rem]">
                    <img src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763409238/hiking_iguiku.jpg" alt="Zermatt" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <h3 className="absolute bottom-3 left-3 text-white font-bold text-sm leading-tight">Ski in Zermatt,<br/>Switzerland</h3>
                  </div>
                  <div className="relative rounded-3xl overflow-hidden group w-full h-[200px] lg:mt-[-0.5rem] lg:w-[200px] lg:ml-[-0.5rem]">
                    <img src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763409238/hiking_iguiku.jpg" alt="Dolomites" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <h3 className="absolute bottom-3 left-3 text-white font-bold text-sm leading-tight">Via Ferrata in<br/>Dolomites, Italy</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Destination Section Arrow */}
          <button className="hidden md:flex absolute top-1/2 right-[-50px] transform -translate-y-1/2 w-12 h-12 rounded-full shadow-md bg-white items-center justify-center hover:bg-gray-100 transition">
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className="relative w-auto">
        <div className="hidden md:flex absolute inset-0 w-full h-[400px] lg:h-[450px] items-center justify-center bg-gray-100">
          {/* Image wrapper */}
          <div className="relative w-full max-w-[1400px] h-full">
            <img
              src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763801588/WhoWeAre_o1uijj.jpg"
              alt="Who We Are Background"
              className="w-full h-full object-cover"
            />
            {/* Fade ONLY on the empty left side */}
            <div className="absolute top-0 left-0 h-full w-[50px] bg-gradient-to-r from-gray-100 to-transparent pointer-events-none"></div>
            {/* Optional soft fade on right for text integration */}
            <div className="absolute top-0 right-0 h-full w-[220px] bg-gradient-to-l from-gray-100 via-gray-100/70 to-transparent pointer-events-none"></div>
          </div>
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-0 flex md:h-[400px] lg:h-[450px] items-center">
          <div className="flex flex-col items-center md:items-end justify-center md:justify-center bg-white/0 md:pr-8 w-full md:w-1/2 ml-auto">
            <h2 className="whitespace-nowrap md:text-3xl lg:text-4xl text-2xl lg:mr-[5rem] font-black text-gray-900 mb-6 text-center md:text-center md:mr-[3rem]">WHO WE ARE?</h2>
            <p className="md:text-lg lg:text-2xl font-semibold text-gray-800 leading-relaxed text-center md:text-center max-w-xl">
              We are the first platform Worldwide to bring together the extreme sports community with the objective to create transformative bridges between businesses, schools, instructors and people who share the same passion and love for nature and extreme sports.
            </p>
          </div>
        </div>
      </section>

      {/* BECOME A MEMBER */}
      <section className="py-20 md:py-10 bg-white">
        <div className="max-w-4xl mx-auto text-center mb-16 px-4">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4 mt-12">Become a member</h2>
            <p className="text-lg text-gray-600">Our goal is to help people connect with the communities within each discipline, and we have a plan to make that happen.</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { title: 'Global visibility and new customers', desc: 'Showcase your school on TTW and position your profile as a leading authority in your field and city.', img: 'https://res.cloudinary.com/dmvlubzor/image/upload/v1764089053/Global-Visibility_fier6m.jpg' },
                { title: 'Build Reputation', desc: "Build trust with your clients by showcasing your organization's and your team's certifications.", img: 'https://res.cloudinary.com/dmvlubzor/image/upload/v1764089053/Build-Community_kylmdb.jpg' },
                { title: 'Become a reference in your community', desc: 'Get reviews from your students and improve your ranking to appear in the top positions for your disciplines and city.', img: 'https://res.cloudinary.com/dmvlubzor/image/upload/v1764089053/Became-Reference_m6ysni.jpg' },
            ].map((item, idx) => (
                <div key={idx} className="group relative h-96 rounded-2xl overflow-hidden cursor-pointer">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col justify-between p-8 text-center text-white">
                        <h3 className="font-bold text-xl mb-3 leading-tight mt-4">{item.title}</h3>
                        <p className="text-sm text-gray-200 opacity-100 transition-opacity duration-300 mb-6">{item.desc}</p>
                        <span className="text-xs font-bold tracking-widest uppercase border-b border-white/50 pb-1 inline-block mx-auto mt-auto">See More</span>
                    </div>
                </div>
            ))}
        </div>
      </section>

    </div>
  );
};

export default Home;