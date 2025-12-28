
import React, { useEffect, useState, useMemo } from 'react';
// Utility to normalize city names for robust comparison
const normalizeCity = (city: string) => {
  return city
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};
import { useParams, Link } from 'react-router-dom';
import { getListings, getProvidersDirectory } from '../services/dataService';
import { getDestinationBySlug } from '../services/dataService';
import { Destination } from '../services/dataService';
import { Listing, ListingType } from '../types';
import ListingCard from '../components/ListingCard';
import { MapPin, ShieldCheck, User, Star, CheckCircle, Building2, ArrowRight, Search, Calendar, Filter, X, Layers, ChevronDown } from 'lucide-react';

const DestinationLanding: React.FC = () => {
  const { geoId } = useParams<{ geoId: string }>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [providers, setProviders] = useState<{ schools: any[], freelancers: any[] }>({ schools: [], freelancers: [] });
  const [loading, setLoading] = useState(true);
  const [providerTab, setProviderTab] = useState<'SCHOOLS' | 'INSTRUCTORS'>('SCHOOLS');

  // Filter State
  const [sportFilter, setSportFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<ListingType | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Destination State
  const [destination, setDestination] = useState<Destination | null>(null);

  // Formatting Name
  const slug = geoId || '';
  const formattedName = destination?.name || slug.replace(/-/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());

  useEffect(() => {
    const fetch = async () => {
      // Load destination from backend if slug
      if (slug) {
        const dest = await getDestinationBySlug(slug);
        setDestination(dest);
      }
      setLoading(true);
      
      // 1. Fetch ALL Listings and filter by city (safer)
      let allListings = await getListings();
      const localListings = allListings.filter((l: any) => {
        const c = normalizeCity(l.location?.city || '');
        return c === normalizeCity(destination?.name || slug.replace(/-/g, ' '));
      });
      setListings(localListings);

      // 2. Fetch Providers (Schools & Instructors)
      const directory = await getProvidersDirectory();

      // Filter for this destination using location structure
      const filteredSchools = directory.schools.filter((s: any) => {
        const city = normalizeCity(s.location?.city || '');
        return city === normalizeCity(destination?.name || slug.replace(/-/g, ' '));
      });

      const filteredFreelancers = directory.freelancers.filter((f: any) => {
        const city = normalizeCity(f.location?.city || '');
        return city === normalizeCity(destination?.name || slug.replace(/-/g, ' '));
      });

      setProviders({ schools: filteredSchools, freelancers: filteredFreelancers });
      setLoading(false);
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoId]);

  // --- FILTER LOGIC ---

  // 1. Extract unique sports available in this destination for the dropdown
  const availableSports = useMemo(() => {
      const sportsSet = new Set<string>();
      listings.forEach(l => {
        if (typeof l.sport === 'string') sportsSet.add(l.sport);
      });

      providers.schools.forEach(s =>
        Array.isArray(s.sports) && s.sports.forEach((sp: any) => {
          const slug = typeof sp === 'string' ? sp : sp?.slug;
          if (slug) sportsSet.add(slug);
        })
      );

      providers.freelancers.forEach(f =>
        Array.isArray(f.sports) && f.sports.forEach((sp: any) => {
          const slug = typeof sp === 'string' ? sp : sp?.slug;
          if (slug) sportsSet.add(slug);
        })
      );
      return Array.from(sportsSet).sort();
  }, [listings, providers]);

  // 2. Filter Providers (Schools & Freelancers) - Mainly by Sport
  const filteredSchools = providers.schools.filter(s => 
      !sportFilter || Array.isArray(s.sports) && s.sports.some((sp: any) => {
        const slug = typeof sp === 'string' ? sp : sp?.slug;
        return slug === sportFilter;
      })
  );
  const filteredFreelancers = providers.freelancers.filter(f => 
      !sportFilter || Array.isArray(f.sports) && f.sports.some((sp: any) => {
        const slug = typeof sp === 'string' ? sp : sp?.slug;
        return slug === sportFilter;
      })
  );

  // 3. Filter Listings - By Sport and Type
  const filteredListings = listings.filter(l => {
      const matchSport = !sportFilter || l.sport === sportFilter;
      const matchType = typeFilter === 'ALL' || l.type === typeFilter;
      return matchSport && matchType;
  });

  const clearFilters = () => {
      setSportFilter('');
      setTypeFilter('ALL');
      setDateFilter('');
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-20">
      
      {/* 1. HERO SECTION - Standardized Style */}
      <div className="relative h-[450px] md:h-[380px] w-full bg-gray-900 flex items-center justify-center mb-24">
         
         {/* Background */}
         <div className="absolute inset-0 overflow-hidden">
            <img 
                src={destination?.hero_image || `https://source.unsplash.com/1600x900/?coast,mountain,${slug}`} 
                alt={formattedName}
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
         </div>

         {/* Content */}
         <div className="relative z-10 text-center px-4 -mt-12 max-w-4xl">
            <span className="text-brand-400 font-bold tracking-widest uppercase text-xs md:text-sm mb-2 block">
                Destination Hub
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-3 drop-shadow-xl uppercase tracking-tight">
                {formattedName}
            </h1>
            <p className="text-white/90 text-lg font-medium drop-shadow-md max-w-2xl mx-auto">
                Your gateway to the local extreme sports community.
            </p>
         </div>

         {/* FLOATING FILTER BAR - Matches Home/Instructors Style */}
         <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full max-w-4xl px-4 z-30">
            <div className="bg-white rounded-full shadow-2xl p-2 flex flex-col md:flex-row items-center border border-gray-100">
                
                {/* Sport Filter */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 md:border-r border-gray-100 cursor-pointer hover:bg-gray-50 rounded-t-3xl md:rounded-l-full md:rounded-tr-none md:rounded-br-none transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">Sport</label>
                    <div className="flex items-center justify-between">
                        <select 
                            value={sportFilter}
                            onChange={(e) => setSportFilter(e.target.value)}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base"
                        >
                            <option value="">All Sports</option>
                            {availableSports.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>
                </div>

                {/* Type Filter */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 md:border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">Experience Type</label>
                    <div className="flex items-center justify-between">
                        <select 
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as ListingType | 'ALL')}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base"
                        >
                            <option value="ALL">Everything</option>
                            <option value={ListingType.SESSION}>Sessions</option>
                            <option value={ListingType.COURSE}>Courses</option>
                            <option value={ListingType.TRIP}>Trips</option>
                            <option value={ListingType.RENT}>Rentals</option>
                            <option value={ListingType.EXPERIENCE}>Experiences</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>
                </div>

                {/* Date Filter (Visual) */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 cursor-pointer hover:bg-gray-50 rounded-b-3xl md:rounded-r-full md:rounded-bl-none md:rounded-tl-none transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">When</label>
                    <div className="flex items-center justify-between">
                        <input 
                            type="text" 
                            placeholder="Any Dates"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none placeholder-gray-500 text-sm md:text-base"
                            onFocus={(e) => e.target.type = 'date'}
                            onBlur={(e) => { if(!e.target.value) e.target.type = 'text' }}
                        />
                        <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>
                </div>

                {/* Search/Clear Button */}
                <div className="p-1 w-full md:w-auto flex justify-center">
                    {/* If filters active, show clear, else show search icon for consistency */}
                    {(sportFilter || typeFilter !== 'ALL' || dateFilter) ? (
                        <button 
                            onClick={clearFilters}
                            className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full font-bold transition-all shadow-lg flex items-center justify-center group"
                            title="Clear Filters"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    ) : (
                        <button 
                            className="w-12 h-12 bg-[#132b5b] hover:bg-[#0f234b] text-white rounded-full font-bold transition-all shadow-lg flex items-center justify-center group transform hover:scale-105"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
         
         {/* 2. LOCAL TALENT SECTION (Schools & Instructors) */}
         {/* Only show if not filtering specifically for Rentals/Trips which might not map 1:1 to generic school profiles */}
         <div className={typeFilter !== 'ALL' && typeFilter !== ListingType.SESSION && typeFilter !== ListingType.EXPERIENCE ? 'opacity-50 grayscale transition-all' : ''}>
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">Meet the Locals</h2>
                <p className="text-gray-500">
                    Connect with the best local schools and certified freelance instructors in {formattedName}.
                </p>
                
                {/* Tabs */}
                <div className="flex justify-center mt-8">
                    <div className="bg-gray-100 p-1 rounded-full inline-flex">
                        <button 
                            onClick={() => setProviderTab('SCHOOLS')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                providerTab === 'SCHOOLS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Schools
                        </button>
                        <button 
                            onClick={() => setProviderTab('INSTRUCTORS')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                providerTab === 'INSTRUCTORS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Instructors
                        </button>
                    </div>
                </div>
            </div>

            {/* Provider Carousel */}
            <div className="relative">
                {loading ? (
                    <div className="flex justify-center h-40 items-center"><div className="animate-spin w-8 h-8 border-2 border-brand-600 rounded-full border-b-transparent"></div></div>
                ) : (
                    <div className="flex overflow-x-auto pb-8 gap-6 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        
                        {providerTab === 'SCHOOLS' && filteredSchools.length > 0 && filteredSchools.map((school, idx) => (
                            <div key={idx} className="min-w-[280px] md:min-w-[320px] bg-white border border-gray-200 rounded-2xl p-6 snap-center hover:shadow-lg transition-all group">
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={school.logo} alt={school.name} className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                                    <div>
                                        <h3 className="font-bold text-gray-900 leading-tight group-hover:text-brand-600 transition-colors">{school.name}</h3>
                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                            <MapPin className="w-3 h-3 mr-1" /> {school.location?.city}, {school.location?.country}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {school.sports.map((s: string) => (
                                        <span key={s} className="px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold uppercase rounded">{s}</span>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                                    <div className="flex items-center text-yellow-500">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="ml-1 text-gray-900 font-bold text-sm">{school.rating}</span>
                                    </div>
                                    <Link to={`/provider/${school.id}`} className="text-brand-600 font-bold text-xs uppercase tracking-wide hover:underline">
                                        View Profile
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {providerTab === 'INSTRUCTORS' && filteredFreelancers.length > 0 && filteredFreelancers.map((freelancer, idx) => (
                            <div key={idx} className="min-w-[280px] md:min-w-[320px] bg-white border border-gray-200 rounded-2xl p-6 snap-center hover:shadow-lg transition-all group">
                                <div className="flex flex-col items-center text-center mb-4">
                                    <img src={freelancer.image || freelancer.logo || 'https://via.placeholder.com/150'} alt={freelancer.name} className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 mb-3" />
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-1">
                                        {freelancer.name}
                                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                                    </h3>
                                    <p className="text-brand-600 text-xs font-bold uppercase tracking-wider">{freelancer.sports[0]} Pro</p>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                                    <div>
                                        <span className="block text-[10px] text-gray-400 uppercase font-bold">From</span>
                                        <span className="text-gray-900 font-bold">{freelancer.currency}{freelancer.price}<span className="text-xs font-normal text-gray-500">/hr</span></span>
                                    </div>
                                    <Link to={`/provider/${freelancer.id}`} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors">
                                        Contact
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {((providerTab === 'SCHOOLS' && filteredSchools.length === 0) || (providerTab === 'INSTRUCTORS' && filteredFreelancers.length === 0)) && (
                            <div className="w-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                No {providerTab.toLowerCase()} found for {sportFilter}.
                            </div>
                        )}
                    </div>
                )}
            </div>
         </div>

         {/* 3. ALL ACTIVITIES SECTION */}
         <div id="activities">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
                        Experiences in {formattedName}
                    </h2>
                    <p className="text-gray-500 mt-2">
                        {filteredListings.length} adventures matching your criteria.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredListings.length > 0 ? (
                        filteredListings.map(l => (
                            <ListingCard key={l.id} listing={l} />
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No listings found matching these filters.</p>
                            <button 
                                onClick={clearFilters}
                                className="text-brand-600 font-bold text-sm mt-2 hover:underline"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {/* Pagination / View More */}
            {filteredListings.length > 0 && (
                <div className="mt-12 text-center">
                    <Link to="/explore" className="inline-flex items-center text-gray-900 font-bold border-b-2 border-gray-900 pb-1 hover:text-brand-600 hover:border-brand-600 transition-colors">
                        View all results in Explore <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>
            )}
         </div>

      </div>
    </div>
  );
};

export default DestinationLanding;
