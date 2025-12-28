
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSportLandingDetails, SportLandingData, getListings, getInstructorsDirectory } from '../services/dataService';
import { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import { MapPin, ArrowRight, ShieldCheck, Star, Search, ChevronDown, User, Building2, Filter, X } from 'lucide-react';

// Helper to resolve Cloudinary / string image URLs
const resolveImageUrl = (img: any): string => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (img.secure_url) return img.secure_url;
  if (img.url) return img.url;
  return '';
};

const SportLanding: React.FC = () => {
  const { sportSlug } = useParams<{ sportSlug: string }>();
  const [data, setData] = useState<SportLandingData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [providers, setProviders] = useState<{ schools: any[], freelancers: any[] }>({ schools: [], freelancers: [] });
  const [loading, setLoading] = useState(true);
  const [providerTab, setProviderTab] = useState<'SCHOOLS' | 'INSTRUCTORS'>('SCHOOLS');

  // Filter State
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    const fetch = async () => {
      if (sportSlug) {
        setLoading(true);
        const sportData = await getSportLandingDetails(sportSlug);
        setData(sportData);
        
        // 1. Fetch Providers (Schools & Instructors)
        const directory = await getInstructorsDirectory();
        // Filter globally by this Sport (tolerant: slug OR name OR object)
        const sportSchools = directory.schools.filter(s =>
          Array.isArray(s.sports) && s.sports.some((sp: any) => {
            const slug = typeof sp === 'string' ? sp.toLowerCase() : sp?.slug?.toLowerCase();
            const name = typeof sp === 'string' ? sp.toLowerCase() : sp?.name?.toLowerCase();
            return slug === sportSlug.toLowerCase() || name === sportSlug.toLowerCase();
          })
        );

        const sportFreelancers = directory.freelancers.filter(f =>
          Array.isArray(f.sports) && f.sports.some((sp: any) => {
            const slug = typeof sp === 'string' ? sp.toLowerCase() : sp?.slug?.toLowerCase();
            const name = typeof sp === 'string' ? sp.toLowerCase() : sp?.name?.toLowerCase();
            return slug === sportSlug.toLowerCase() || name === sportSlug.toLowerCase();
          })
        );
        
        setProviders({ schools: sportSchools, freelancers: sportFreelancers });

        // 2. Fetch specific listings for this sport
        const sportListings = await getListings({ sport: sportSlug });

        // Defensive: backend/DTO can vary, but in our FE model Listing.sport is a string slug
        const currentSport = sportSlug.toLowerCase();

        const strictlyFilteredListings = sportListings.filter(l => {
          const listingSportSlug = l.sport?.toLowerCase?.() ?? '';
          const listingSportName = (l as any).sportName?.toLowerCase?.() ?? ''; // sportName exists in our mapped DTO
          return listingSportSlug === currentSport || listingSportName === currentSport;
        });

        // Deduplicate by id (avoids duplicate renders/refetches)
        const uniqueListings = Array.from(
          new Map(strictlyFilteredListings.map(l => [l.id, l])).values()
        );

        setListings(uniqueListings);

        setLoading(false);
      }
    };
    fetch();
  }, [sportSlug]);

  // --- FILTER LOGIC ---

  // 1. Extract unique locations based on the Sport's data
  const { uniqueCountries, uniqueCities } = useMemo(() => {
      // Only listings should drive the listing-location filters (avoid polluting with provider locations)
      const allItems = [...listings];
      const countries = new Set<string>();
      const cities = new Set<string>();

      allItems.forEach(item => {
          // Handle Listing Location object structure vs Provider flat structure
          const ctry = (item as Listing).location?.country || (item as any).country;
          const cty = (item as Listing).location?.city || (item as any).city;

          if(ctry) countries.add(ctry);
          if(cty) {
              if(!countryFilter || ctry === countryFilter) {
                  cities.add(cty);
              }
          }
      });

      return {
          uniqueCountries: Array.from(countries).sort(),
          uniqueCities: Array.from(cities).sort()
      };
  }, [listings, providers, countryFilter]);

  // 2. Filter Providers by Location
  const filteredSchools = providers.schools.filter(s => {
      const matchCountry = !countryFilter || s.country === countryFilter;
      const matchCity = !cityFilter || s.city === cityFilter;
      return matchCountry && matchCity;
  });

  const filteredFreelancers = providers.freelancers.filter(f => {
      const matchCountry = !countryFilter || f.country === countryFilter;
      const matchCity = !cityFilter || f.city === cityFilter;
      return matchCountry && matchCity;
  });

  // 3. Filter Listings by Location
  const filteredListings = listings.filter(l => {
      const matchCountry = !countryFilter || l.location?.country === countryFilter;
      const matchCity = !cityFilter || l.location?.city === cityFilter;
      return matchCountry && matchCity;
  });

  const clearFilters = () => {
      setCountryFilter('');
      setCityFilter('');
      setDateFilter('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Sport Data...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center">Sport not found.</div>;

  return (
    <div className="min-h-screen bg-white font-sans">
      
      {/* 1. STANDARD HERO STYLE */}
      <div className="relative h-[450px] md:h-[380px] w-full bg-gray-900 flex items-center justify-center mb-24">
        
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden">
            <img 
                src={data.heroImage} 
                alt={data.name} 
                className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-black/30"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 -mt-12 max-w-4xl">
            <span className="text-brand-400 font-bold tracking-widest uppercase text-xs md:text-sm mb-2 border border-brand-400/30 px-3 py-1 rounded-full w-fit mx-auto backdrop-blur-sm block">
                {data.category} Discipline
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-3 uppercase tracking-tighter drop-shadow-xl">
                {data.name}
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                {data.description}
            </p>
        </div>

        {/* FLOATING FILTER BAR */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full max-w-4xl px-4 z-20">
            <div className="bg-white rounded-full shadow-2xl p-2 flex flex-col md:flex-row items-center border border-gray-100">
                
                {/* Country Filter */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 md:border-r border-gray-100 cursor-pointer hover:bg-gray-50 rounded-t-3xl md:rounded-l-full md:rounded-tr-none md:rounded-br-none transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">Where?</label>
                    <div className="flex items-center justify-between">
                        <select 
                            value={countryFilter}
                            onChange={(e) => { setCountryFilter(e.target.value); setCityFilter(''); }}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base"
                        >
                            <option value="">Any Country</option>
                            {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>
                </div>

                {/* City Filter */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 md:border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">City</label>
                    <div className="flex items-center justify-between">
                        <select 
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            disabled={!countryFilter && uniqueCities.length > 20}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base disabled:text-gray-300"
                        >
                            <option value="">Any City</option>
                            {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>
                </div>

                {/* Date Filter */}
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
                    {(countryFilter || cityFilter || dateFilter) ? (
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        

        {/* 3. CONNECT WITH PROS (Replaces generic schools list with filtered logic) */}
        <div className="mb-20">
            <div className="text-center max-w-3xl mx-auto mb-10">
                <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">Connect with {data.name} Pros</h2>
                <p className="text-gray-500 mb-6">
                    Find certified instructors and top-rated schools specializing in {data.name}
                    {countryFilter && ` in ${countryFilter}`}{cityFilter && `, ${cityFilter}`}.
                </p>
                
                {/* Tabs */}
                <div className="bg-gray-100 p-1 rounded-full inline-flex">
                    <button 
                        onClick={() => setProviderTab('SCHOOLS')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center ${
                            providerTab === 'SCHOOLS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Building2 className="w-4 h-4 mr-2" /> Schools
                    </button>
                    <button 
                        onClick={() => setProviderTab('INSTRUCTORS')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center ${
                            providerTab === 'INSTRUCTORS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <User className="w-4 h-4 mr-2" /> Instructors
                    </button>
                </div>
            </div>

            {/* Provider Carousel */}
            <div className="relative">
                <div className="flex overflow-x-auto pb-8 gap-6 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    
                    {providerTab === 'SCHOOLS' && filteredSchools.length > 0 && filteredSchools.map((school, idx) => (
                      <div
                        key={idx}
                        className="min-w-[280px] md:min-w-[320px] bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 flex flex-col"
                      >
                        {/* Cover */}
                        <div className="h-32 bg-gray-100 relative">
                          {school.cover_image ? (
                            <img
                              src={resolveImageUrl(school.cover_image)}
                              className="absolute inset-0 w-full h-full object-cover"
                              alt={school.company_name || school.name || 'School'}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-purple-500/20" />
                          )}

                          {/* Sports badges */}
                          <div className="absolute top-4 right-4 flex gap-1">
                            {school.sports?.slice(0, 2).map((s: string) => (
                              <span
                                key={s}
                                className="bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-gray-700 uppercase border border-white/50"
                              >
                                {s}
                              </span>
                            ))}
                            {school.sports?.length > 2 && (
                              <span className="bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-gray-700 uppercase border border-white/50">
                                +{school.sports.length - 2}
                              </span>
                            )}
                          </div>

                          {/* Profile image */}
                          <div className="absolute -bottom-8 left-6">
                            <img
                              src={resolveImageUrl(
                                school.profile_image ||
                                school.logo ||
                                school.avatar
                              )}
                              alt={school.company_name || school.name || 'School'}
                              className="w-20 h-20 rounded-xl border-4 border-white shadow-md bg-white object-cover"
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 pt-10 flex-grow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                {school.company_name || school.name || 'School'}
                              </h3>
                              <p className="text-gray-600 text-sm flex items-center mt-1 font-medium">
                                <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                                {school.city}, {school.country}
                              </p>
                            </div>

                            {school.rating && (
                              <div className="flex items-center bg-gray-50 px-2 py-1 rounded text-xs font-bold">
                                <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                                {school.rating}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                          <Link
                            to={`/provider/${school.id}`}
                            className="w-full py-2 text-brand-600 font-bold text-sm flex items-center justify-center hover:underline"
                          >
                            View School & Team <ArrowRight className="w-4 h-4 ml-1" />
                          </Link>
                        </div>
                      </div>
                    ))}

                    {providerTab === 'INSTRUCTORS' && filteredFreelancers.length > 0 && filteredFreelancers.map((freelancer, idx) => (
                      <div key={idx} className="min-w-[280px] md:min-w-[320px] bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 group flex flex-col">
                        <div className="p-6 flex flex-col items-center text-center flex-grow">
                          <div className="relative mb-4">
                            <img
                              src={resolveImageUrl(
                                freelancer.image ||
                                freelancer.profile_image ||
                                freelancer.avatar ||
                                freelancer.user?.avatar
                              )}
                              alt={freelancer.name}
                              className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-md group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute bottom-0 right-0 bg-orange-500 text-white p-1.5 rounded-full border-2 border-white">
                              <User className="w-4 h-4" />
                            </div>
                          </div>

                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1 justify-center">
                            {freelancer.name}
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                          </h3>

                          <p className="text-brand-600 font-bold text-xs uppercase tracking-wider mb-3">
                            {freelancer.city}, {freelancer.country}
                          </p>

                          {freelancer.rating && (
                            <div className="flex items-center gap-1 text-yellow-400 mb-4">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-gray-900 font-bold">{freelancer.rating}</span>
                              {freelancer.reviewCount && (
                                <span className="text-gray-400 text-xs">({freelancer.reviewCount})</span>
                              )}
                            </div>
                          )}

                          {freelancer.bio && (
                            <p className="text-gray-500 text-sm line-clamp-2 mb-6 px-2">
                              "{freelancer.bio}"
                            </p>
                          )}
                        </div>

                        <div className="w-full border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-center mt-auto">
                          <Link
                            to={`/provider/${freelancer.id}`}
                            className="bg-gray-900 text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors uppercase tracking-wide"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    ))}

                    {((providerTab === 'SCHOOLS' && filteredSchools.length === 0) || (providerTab === 'INSTRUCTORS' && filteredFreelancers.length === 0)) && (
                        <div className="w-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                            <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            No {providerTab.toLowerCase()} found in this location. <button onClick={clearFilters} className="text-brand-600 underline ml-1">Clear filters</button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* 4. ACTIVE LISTINGS */}
        <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-gray-900">Book {data.name} Experiences</h2>
                <Link to={`/explore?sport=${sportSlug}`} className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors flex items-center">
                    View All Listings <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredListings.slice(0, 4).map(l => (
                    <ListingCard key={l.id} listing={l} />
                ))}
            </div>
            
            {filteredListings.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">No {data.name} listings found</h3>
                    <p className="text-gray-500">Try changing your location filters.</p>
                    <button onClick={clearFilters} className="mt-4 text-brand-600 font-bold hover:underline">Clear Filters</button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default SportLanding;
