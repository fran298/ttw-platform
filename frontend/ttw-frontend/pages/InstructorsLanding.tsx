
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getInstructorsDirectory } from '../services/dataService';
import { Star, MapPin, ShieldCheck, User, Building2, ArrowRight, Search, Filter, X, ChevronDown } from 'lucide-react';

// Helper to resolve Cloudinary/string image URLs (same as InstructorProfile)
const resolveImageUrl = (img: any): string => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (img.secure_url) return img.secure_url;
  if (img.url) return img.url;
  return '';
};

const InstructorsLanding: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FREELANCE' | 'SCHOOL'>('FREELANCE');
  const [data, setData] = useState<{ freelancers: any[], schools: any[] }>({ freelancers: [], schools: [] });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const res = await getInstructorsDirectory();
      setData(res);
      setLoading(false);
    };
    fetch();
  }, []);

  // Extract Unique Options for Filters
  const { uniqueSports, uniqueCountries, uniqueCities } = useMemo(() => {
    const allItems = [...data.freelancers, ...data.schools];
    const sports = new Set<string>();
    const countries = new Set<string>();
    const cities = new Set<string>();

    allItems.forEach(item => {
      if (item.sports) item.sports.forEach((s: string) => sports.add(s));
      if (item.country) countries.add(item.country);
      if (item.city) {
          if (!selectedCountry || item.country === selectedCountry) {
              cities.add(item.city);
          }
      }
    });

    return {
      uniqueSports: Array.from(sports).sort(),
      uniqueCountries: Array.from(countries).sort(),
      uniqueCities: Array.from(cities).sort()
    };
  }, [data, selectedCountry]);

  // Filter Logic
  const filteredItems = useMemo(() => {
    const collection = activeTab === 'FREELANCE' ? data.freelancers : data.schools;
    
    return collection.filter(item => {
      const matchSport = !selectedSport || (item.sports && item.sports.includes(selectedSport));
      const matchCountry = !selectedCountry || item.country === selectedCountry;
      const matchCity = !selectedCity || item.city === selectedCity;
      return matchSport && matchCountry && matchCity;
    });
  }, [data, activeTab, selectedSport, selectedCountry, selectedCity]);

  const clearFilters = () => {
      setSelectedSport('');
      setSelectedCountry('');
      setSelectedCity('');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* HERO SECTION - Matching Home & Destinations Style */}
      <div className="relative h-[450px] md:h-[380px] bg-gray-900 flex flex-col items-center justify-center mb-24">
        
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden">
            <img 
            src="https://res.cloudinary.com/dmvlubzor/image/upload/v1763380593/the_travel_wild/cities/gallery/jpd9sumlo1r9sjy6r8t2.png"
            alt="Instructor teaching"
            className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 w-full max-w-5xl -mt-12">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-lg leading-tight">
            Find your perfect Guide
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-md">
            Connect with certified independent pros or join established school teams.
          </p>
        </div>

        {/* FILTER BAR (Pill Style) */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full max-w-4xl px-4 z-20">
            <div className="bg-white rounded-full shadow-2xl p-2 flex flex-col md:flex-row items-center border border-gray-100">
                
                {/* Sport Filter */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 md:border-r border-gray-100 cursor-pointer hover:bg-gray-50 rounded-t-3xl md:rounded-l-full md:rounded-tr-none md:rounded-br-none transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">Sport</label>
                    <div className="flex items-center justify-between">
                        <select 
                            value={selectedSport}
                            onChange={(e) => setSelectedSport(e.target.value)}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base"
                        >
                            <option value="">All Sports</option>
                            {uniqueSports.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>
                </div>

                {/* Country Filter */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 md:border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">Country</label>
                    <div className="flex items-center justify-between">
                        <select 
                            value={selectedCountry}
                            onChange={(e) => { setSelectedCountry(e.target.value); setSelectedCity(''); }}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base"
                        >
                            <option value="">All Countries</option>
                            {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>
                </div>

                {/* City Filter */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 cursor-pointer hover:bg-gray-50 rounded-b-3xl md:rounded-r-full md:rounded-bl-none md:rounded-tl-none transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">City</label>
                    <div className="flex items-center justify-between">
                        <select 
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            disabled={!selectedCountry && uniqueCities.length > 20}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base disabled:text-gray-300"
                        >
                            <option value="">All Cities</option>
                            {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>
                </div>

                {/* Search Button - Circular */}
                <div className="p-1 w-full md:w-auto flex justify-center">
                    <button 
                        onClick={() => {}} 
                        className="w-12 h-12 bg-[#132b5b] hover:bg-[#0f234b] text-white rounded-full font-bold transition-all shadow-lg flex items-center justify-center group transform hover:scale-105 hover:shadow-brand-900/20"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        
        {/* Toggle Control */}
        <div className="flex justify-center mb-12">
            <div className="bg-white rounded-full shadow-sm border border-gray-200 p-1.5 flex w-full max-w-md">
                <button
                    onClick={() => setActiveTab('FREELANCE')}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                    activeTab === 'FREELANCE'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <User className="w-4 h-4 mr-2" /> Freelance
                </button>
                <button
                    onClick={() => setActiveTab('SCHOOL')}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                    activeTab === 'SCHOOL'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                    <Building2 className="w-4 h-4 mr-2" /> Schools
                </button>
            </div>
        </div>

        {loading ? (
           <div className="flex justify-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
           </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="text-center mb-8 text-sm text-gray-500 font-medium">
                Showing {filteredItems.length} {activeTab === 'FREELANCE' ? 'professionals' : 'schools'} 
                {selectedSport && ` for ${selectedSport}`}
                {selectedCountry && ` in ${selectedCountry}`}
            </div>

            {filteredItems.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your filters or clearing them to see more options.</p>
                    <button 
                        onClick={clearFilters}
                        className="px-6 py-2 bg-brand-600 text-white rounded-full font-bold text-sm hover:bg-brand-700 transition-colors"
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    
                    {/* FREELANCER GRID */}
                    {activeTab === 'FREELANCE' && filteredItems.map((pro: any) => (
                    <div key={pro.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 group flex flex-col">
                        <div className="p-6 flex flex-col items-center text-center flex-grow">
                        <div className="relative mb-4">
                            <img
                              src={resolveImageUrl(pro.profile_image || pro.avatar)}
                              alt={pro.name}
                              className="w-28 h-28 rounded-full object-cover border-4 border-gray-50 shadow-md group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute bottom-0 right-0 bg-orange-500 text-white p-1.5 rounded-full border-2 border-white" title="Freelancer">
                            <User className="w-4 h-4" />
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 justify-center">
                          {pro.name}
                          <ShieldCheck className="w-5 h-5 text-blue-500" />
                        </h3>
                        <p className="text-brand-600 font-bold text-xs uppercase tracking-wider mb-3">{pro.sports?.join(', ')} • {pro.city_name}, {pro.country_name}</p>
                        
                        <div className="flex items-center gap-1 text-yellow-400 mb-4">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-gray-900 font-bold">{pro.rating}</span>
                            <span className="text-gray-400 text-xs">({pro.reviewCount} reviews)</span>
                        </div>

                        <p className="text-gray-500 text-sm line-clamp-2 mb-6 px-4">
                            "{pro.bio}"
                        </p>
                        </div>

                        <div className="w-full border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-center mt-auto">
                            <Link
                                to={`/provider/${pro.id}`}
                                className="bg-gray-900 text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors uppercase tracking-wide"
                            >
                                View Profile
                            </Link>
                        </div>
                    </div>
                    ))}

                    {/* SCHOOL GRID */}
                    {activeTab === 'SCHOOL' && filteredItems.map((school: any) => (
                    <div key={school.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 flex flex-col">
                        <div className="h-32 bg-gray-100 relative">
                        {/* Cover Image or Placeholder */}
                        {school.cover_image ? (
                          <img
                            src={resolveImageUrl(school.cover_image)}
                            className="absolute inset-0 w-full h-full object-cover"
                            alt={school.company_name || school.name || 'School'}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-purple-500/20"></div>
                        )}
                        <div className="absolute -bottom-8 left-6">
                            <img 
                                src={resolveImageUrl(school.profile_image)} 
                                alt={school.company_name || school.name || 'School'}
                                className="w-20 h-20 rounded-xl border-4 border-white shadow-md bg-white"
                            />
                        </div>
                        <div className="absolute top-4 right-4 flex gap-1">
                            {school.sports?.slice(0,2).map((s:string) => (
                                <span key={s} className="bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-gray-700 uppercase border border-white/50">
                                    {s}
                                </span>
                            ))}
                            {school.sports?.length > 2 && (
                                <span className="bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-gray-700 uppercase border border-white/50">+{school.sports.length - 2}</span>
                            )}
                        </div>
                        </div>
                        
                        <div className="p-6 pt-10 flex-grow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 leading-tight">{school.company_name || school.name || 'School'}</h3>
                                <p className="text-gray-600 text-sm flex items-center mt-1 font-medium">
                                  <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                  {school.city_name}, {school.country_name}
                                </p>
                            </div>
                            <div className="flex items-center bg-gray-50 px-2 py-1 rounded text-xs font-bold">
                                <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" /> {school.rating}
                            </div>
                        </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                        <Link to={`/provider/${school.id}`} className="w-full py-2 text-brand-600 font-bold text-sm flex items-center justify-center hover:underline">
                            View School & Team <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                        </div>
                    </div>
                    ))}

                </div>
            )}
          </>
        )}

        {/* Become an Instructor CTA */}
        <div className="mt-24 bg-brand-600 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="relative z-10">
             <h2 className="text-3xl md:text-5xl font-black mb-6">Are you an Instructor?</h2>
             <p className="text-xl text-brand-100 max-w-2xl mx-auto mb-10">
               Join the world's largest marketplace for extreme sports professionals. 
               Whether you are a freelancer or run a school, we have the tools you need.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Link to="/signup/provider" className="bg-white text-brand-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors">
                 Join as Freelancer
               </Link>
               <Link to="/signup/provider" className="bg-brand-800 text-white border border-brand-500 px-8 py-3 rounded-full font-bold hover:bg-brand-700 transition-colors">
                 Register my School
               </Link>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default InstructorsLanding;
