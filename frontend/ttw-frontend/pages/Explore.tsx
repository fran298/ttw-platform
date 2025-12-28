
import React, { useState, useEffect, useMemo } from 'react';
// Helper to resolve Cloudinary / string image URLs
const resolveImageUrl = (img: any): string => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (img.secure_url) return img.secure_url;
  if (img.url) return img.url;
  return '';
};
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, ChevronRight, Star, ShieldCheck, Calendar, Filter, ChevronDown, X, Layers } from 'lucide-react';
import { Listing, ListingType, SportCategory } from '../types';
import { getListings, getInstructorsDirectory } from '../services/dataService';
import ListingCard from '../components/ListingCard';
import { SPORTS_BY_CATEGORY } from '../constants';

const Explore: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [providers, setProviders] = useState<{ schools: any[], freelancers: any[] }>({ schools: [], freelancers: [] });
  const [loading, setLoading] = useState(true);

  // Filter States - Initialize from URL params if available
  const [selectedSport, setSelectedSport] = useState<string>(searchParams.get('sport') || '');
  const [selectedLocation, setSelectedLocation] = useState<string>(searchParams.get('location') || searchParams.get('city') || searchParams.get('country') || '');
  const [selectedDate, setSelectedDate] = useState<string>(searchParams.get('date') || '');
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || 'ALL');

  // Sync state with URL params when they change (e.g. back button or navigation)
  useEffect(() => {
      const sportParam = searchParams.get('sport');
      const locationParam = searchParams.get('location') || searchParams.get('city') || searchParams.get('country');
      const dateParam = searchParams.get('date');
      const typeParam = searchParams.get('type');

      if (sportParam !== null) setSelectedSport(sportParam);
      if (locationParam !== null) setSelectedLocation(locationParam);
      if (dateParam !== null) setSelectedDate(dateParam);
      if (typeParam !== null) setSelectedType(typeParam);
  }, [searchParams]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      // Fetch all listings
      const allListings = await getListings();
      setListings(allListings);

      // Fetch providers
      const allProviders = await getInstructorsDirectory();
      setProviders(allProviders);
      
      setLoading(false);
    };
    fetch();
  }, []);

  // --- FILTER LOGIC ---
  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      // --- SPORT NORMALIZATION (ROBUST) ---
      const rawSport = (l as any)?.sport;

      const sportSlug =
        typeof rawSport === 'string'
          ? rawSport.toLowerCase()
          : typeof rawSport === 'object'
          ? (
              rawSport?.slug ||
              rawSport?.name ||
              rawSport?.title ||
              ''
            ).toString().toLowerCase()
          : '';

      const selectedSportSafe = (selectedSport || '').toLowerCase();

      const matchSport =
        !selectedSportSafe || sportSlug === selectedSportSafe;

      // --- LOCATION NORMALIZATION ---
      const cityName = ((l as any)?.location?.city || '')
        .toString()
        .toLowerCase();

      const countryName = ((l as any)?.location?.country || '')
        .toString()
        .toLowerCase();

      const selectedLocationSafe = (selectedLocation || '').toLowerCase();

      const matchLoc =
        !selectedLocationSafe ||
        cityName.includes(selectedLocationSafe) ||
        countryName.includes(selectedLocationSafe);

      // --- TYPE ---
      const matchType =
        selectedType === 'ALL' || l.type === selectedType;

      return matchSport && matchLoc && matchType;
    });
  }, [listings, selectedSport, selectedLocation, selectedType]);

  // Filter Providers (Only show in Hub view or if specific filters imply looking for pros)
  const filteredSchools = useMemo(() => {
    return providers.schools.filter(s => {
      const sportsSafe = Array.isArray(s.sports) ? s.sports : [];
      const citySafe = (typeof s.city === 'object' ? s.city?.name : s.city || '').toString();
      const countrySafe = (typeof s.country === 'object' ? s.country?.name : s.country || '').toString();

      const selectedSportSafe = (selectedSport || '').toString().toLowerCase();
      const selectedLocationSafe = (selectedLocation || '').toString().toLowerCase();

      const matchSport =
        !selectedSportSafe ||
        sportsSafe.some((sp: string) =>
          (sp || '').toString().toLowerCase() === selectedSportSafe
        );

      const matchLoc =
        !selectedLocationSafe ||
        citySafe.toLowerCase().includes(selectedLocationSafe) ||
        countrySafe.toLowerCase().includes(selectedLocationSafe);

      return matchSport && matchLoc;
    });
  }, [providers.schools, selectedSport, selectedLocation]);

  const filteredFreelancers = useMemo(() => {
    return providers.freelancers.filter(f => {
      const sportsSafe = Array.isArray(f.sports) ? f.sports : [];
      const citySafe = (typeof f.city === 'object' ? f.city?.name : f.city || '').toString();
      const countrySafe = (typeof f.country === 'object' ? f.country?.name : f.country || '').toString();

      const selectedSportSafe = (selectedSport || '').toString().toLowerCase();
      const selectedLocationSafe = (selectedLocation || '').toString().toLowerCase();

      const matchSport =
        !selectedSportSafe ||
        sportsSafe.some((sp: string) =>
          (sp || '').toString().toLowerCase() === selectedSportSafe
        );

      const matchLoc =
        !selectedLocationSafe ||
        citySafe.toLowerCase().includes(selectedLocationSafe) ||
        countrySafe.toLowerCase().includes(selectedLocationSafe);

      return matchSport && matchLoc;
    });
  }, [providers.freelancers, selectedSport, selectedLocation]);

  // Unique options for dropdowns (FORCED FROM LISTINGS)
  const allSports = useMemo(() => {
    const sports: { label: string; value: string }[] = [];

    if (Array.isArray(listings)) {
      listings.forEach((l: any) => {
        const raw = l?.sport;

        const slug =
          typeof raw === 'string'
            ? raw.toLowerCase()
            : raw?.slug
            ? raw.slug.toLowerCase()
            : raw?.name
            ? raw.name.toLowerCase()
            : null;

        const label =
          typeof raw === 'string'
            ? raw.charAt(0).toUpperCase() + raw.slice(1)
            : raw?.name
            ? raw.name
            : raw?.slug
            ? raw.slug
            : null;

        if (slug && label) {
          sports.push({ label, value: slug });
        }
      });
    }

    return Array.from(new Map(sports.map(s => [s.value, s])).values())
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [listings]);

  const allLocations = useMemo(() => {
    return Array.from(
      new Set(
        listings
          .map(l =>
            (l as any)?.city?.country ||
            (l as any)?.location?.country ||
            ''
          )
          .map(c => (c || '').toString())
          .filter(c => c.length > 0)
      )
    ).sort();
  }, [listings]);

  const clearFilters = () => {
      setSelectedSport('');
      setSelectedLocation('');
      setSelectedDate('');
      setSelectedType('ALL');
      setSearchParams({}); // Clear URL params too
  };

  // Update URL when filters change manually
  const handleFilterChange = (key: string, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (value && value !== 'ALL') {
          newParams.set(key, value);
      } else {
          newParams.delete(key);
      }
      setSearchParams(newParams);
      
      if (key === 'sport') setSelectedSport(value);
      if (key === 'location') setSelectedLocation(value);
      if (key === 'date') setSelectedDate(value);
      if (key === 'type') setSelectedType(value);
  };

  // Categorize Listings for "Hub View" (Only used when selectedType === 'ALL')
  const activities = useMemo(
    () => filteredListings.filter(l =>
      l.type === ListingType.SESSION ||
      l.type === ListingType.COURSE ||
      l.type === ListingType.EXPERIENCE
    ),
    [filteredListings]
  );

  const rentals = useMemo(
    () => filteredListings.filter(l => l.type === ListingType.RENT),
    [filteredListings]
  );

  const trips = useMemo(
    () => filteredListings.filter(l => l.type === ListingType.TRIP),
    [filteredListings]
  );

  // Determine View Mode
  const isHubView = selectedType === 'ALL';

  return (
    <div className="min-h-screen bg-white font-sans pb-20">
      
      {/* 1. HERO SECTION - Standardized 380px */}
      <div className="relative h-[450px] md:h-[380px] w-full bg-gray-900 flex items-center justify-center mb-24">
         {/* Background */}
         <div className="absolute inset-0 overflow-hidden">
            <img 
                src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1600&q=80" 
                alt="Explore Adventures" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
         </div>

         {/* Content */}
         <div className="relative z-10 text-center px-4 -mt-12 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-xl">
                Explore All Adventures
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-md">
                Book lessons, rentals, trips, and guides in over 100 countries.
            </p>
         </div>

         {/* FLOATING SEARCH PILL */}
         <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full max-w-4xl px-4 z-20">
            <div className="bg-white rounded-full shadow-2xl p-2 flex flex-col md:flex-row items-center border border-gray-100">
                
                {/* Type Filter (New!) */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 md:border-r border-gray-100 cursor-pointer hover:bg-gray-50 rounded-t-3xl md:rounded-l-full md:rounded-tr-none md:rounded-br-none transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">Type</label>
                    <div className="flex items-center justify-between">
                        <select 
                            value={selectedType}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base"
                        >
                            <option value="ALL">Everything</option>
                            <option value={ListingType.SESSION}>Sessions</option>
                            <option value={ListingType.COURSE}>Courses</option>
                            <option value={ListingType.EXPERIENCE}>Experiences</option>
                            <option value={ListingType.RENT}>Rentals</option>
                            <option value={ListingType.TRIP}>Trips</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>
                </div>

                {/* Sport Filter */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 md:border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">Sport</label>
                    <div className="flex items-center justify-between">
                        <select 
                          value={selectedSport}
                          onChange={(e) => handleFilterChange('sport', e.target.value)}
                          className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base"
                        >
                          <option value="">All Sports</option>
                          {allSports.map(s => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>
                </div>

                {/* Location Filter */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 md:border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">Location</label>
                    <div className="flex items-center justify-between">
                        <select 
                            value={selectedLocation}
                            onChange={(e) => handleFilterChange('location', e.target.value)}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base"
                        >
                            <option value="">Anywhere</option>
                            {allLocations.map(l => <option key={l} value={l}>{l}</option>)}
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
                            value={selectedDate}
                            onChange={(e) => handleFilterChange('date', e.target.value)}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none placeholder-gray-500 text-sm md:text-base"
                            onFocus={(e) => e.target.type = 'date'}
                            onBlur={(e) => { if(!e.target.value) e.target.type = 'text' }}
                        />
                        <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>
                </div>

                {/* Search/Clear Button */}
                <div className="p-1 w-full md:w-auto flex justify-center">
                    {(selectedSport || selectedLocation || selectedDate || selectedType !== 'ALL') ? (
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

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        
        {loading && (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredListings.length === 0 && filteredSchools.length === 0 && filteredFreelancers.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No matches found</h3>
                <p className="text-gray-500 mb-6">Try broadening your search criteria.</p>
                <button onClick={clearFilters} className="text-brand-600 font-bold hover:underline">Clear Filters</button>
            </div>
        )}

        {/* === VIEW MODE: LIST / GRID (Used when a TYPE is selected) === */}
        {!loading && !isHubView && filteredListings.length > 0 && (
            <div>
                <div className="flex items-end justify-between mb-8 border-b border-gray-200 pb-4">
                    <div>
                        <span className="text-brand-600 font-bold tracking-widest uppercase text-xs mb-1 block">
                            {filteredListings.length} Results
                        </span>
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
                          {selectedType === ListingType.SESSION ? 'Sessions' :
                           selectedType === ListingType.COURSE ? 'Courses' :
                           selectedType === ListingType.EXPERIENCE ? 'Experiences' :
                           selectedType === ListingType.RENT ? 'Equipment Rentals' :
                           selectedType === ListingType.TRIP ? 'Camps & Trips' : 'Results'}
                        </h2>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredListings.map(l => (
                        <ListingCard key={l.id} listing={l} />
                    ))}
                </div>
            </div>
        )}


        {/* === VIEW MODE: HUB (Used when NO specific TYPE is selected) === */}
        
        {/* SECTION 1: ACTIVITIES & COURSES */}
        {!loading && isHubView && activities.length > 0 && (
            <div>
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Activities & Courses</h2>
                        <p className="text-gray-500 mt-2">Lessons, guided tours, and daily experiences.</p>
                    </div>
                    <button 
                        onClick={() => handleFilterChange('type', ListingType.SESSION)}
                        className="hidden md:flex items-center text-sm font-bold text-brand-600 hover:text-brand-700"
                    >
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {activities.slice(0, 8).map(l => (
                        <ListingCard key={l.id} listing={l} />
                    ))}
                </div>
            </div>
        )}

        {/* SECTION 2: RENTALS (Grey Background) */}
        {!loading && isHubView && rentals.length > 0 && (
            <div className="bg-gray-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Gear Rentals</h2>
                            <p className="text-gray-500 mt-2">High-quality equipment for your independent sessions.</p>
                        </div>
                        <button 
                            onClick={() => handleFilterChange('type', ListingType.RENT)}
                            className="hidden md:flex items-center text-sm font-bold text-brand-600 hover:text-brand-700"
                        >
                            View All <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {rentals.slice(0, 4).map(l => (
                            <ListingCard key={l.id} listing={l} />
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* SECTION 3: TRIPS */}
        {!loading && isHubView && trips.length > 0 && (
            <div>
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Expeditions & Camps</h2>
                        <p className="text-gray-500 mt-2">Multi-day immersive experiences and travel packages.</p>
                    </div>
                    <button 
                        onClick={() => handleFilterChange('type', ListingType.TRIP)}
                        className="hidden md:flex items-center text-sm font-bold text-brand-600 hover:text-brand-700"
                    >
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {trips.slice(0, 3).map(trip => {
                        const typeLabelMap: Record<string, string> = {
                            [ListingType.SESSION]: 'Session',
                            [ListingType.COURSE]: 'Course',
                            [ListingType.EXPERIENCE]: 'Experience',
                            [ListingType.RENT]: 'Rental',
                            [ListingType.TRIP]: 'Trip',
                        };
                        const typeLabel = typeLabelMap[(trip as any).type] || 'Activity';
                        return (
                            <Link key={trip.id} to={`/trip/${trip.id}`} className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                                <div className="relative h-64 overflow-hidden">
                                    <img src={trip.images[0]} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-900 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1.5" />
                                        {(trip as any)?.details?.start_date && (trip as any)?.details?.end_date
                                          ? `${(trip as any).details.start_date} → ${(trip as any).details.end_date}`
                                          : 'Scheduled'}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center text-xs text-brand-600 font-bold uppercase tracking-wider mb-2">
                                        {typeof trip.sport === 'string' ? trip.sport : (trip.sport as any)?.name} • {(trip as any)?.city?.country || ''} • {typeLabel}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">{trip.title}</h3>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-6">{trip.description}</p>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div>
                                            <span className="text-xs text-gray-400 uppercase font-bold block">Starting from</span>
                                            <span className="text-lg font-bold text-gray-900">{trip.currency} {trip.price}</span>
                                        </div>
                                        <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold group-hover:bg-brand-600 transition-colors">
                                            View Details
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        )}

        {/* SECTION 4: TOP SCHOOLS & INSTRUCTORS (Only show in Hub view) */}
        {!loading && isHubView && (filteredSchools.length > 0 || filteredFreelancers.length > 0) && (
            <div className="pb-12">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Top Rated Providers</h2>
                    <p className="text-gray-500 mt-2">Learn from the best schools and instructors in the industry.</p>
                </div>
                
                <div className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    {/* Schools */}
                    {filteredSchools.slice(0, 4).map((school, idx) => (
                        <div key={`s-${idx}`} className="min-w-[280px] bg-white border border-gray-200 rounded-2xl p-6 flex flex-col hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                  src={resolveImageUrl(school.profile_image || school.logo)}
                                  className="w-14 h-14 rounded-xl object-cover border border-gray-100"
                                  alt={school.name}
                                />
                                <div>
                                    <h4 className="font-bold text-gray-900 leading-tight">{school.name}</h4>
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                        <MapPin className="w-3 h-3 mr-1" /> {school.city}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-4">
                                {school.sports.slice(0,3).map((s: string) => (
                                    <span key={s} className="bg-gray-50 text-gray-600 px-2 py-1 rounded text-[10px] font-bold uppercase">{s}</span>
                                ))}
                            </div>
                            <Link to={`/provider/${school.id}`} className="mt-auto w-full py-2 border border-gray-200 rounded-lg text-center text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">
                                View School
                            </Link>
                        </div>
                    ))}

                    {/* Freelancers */}
                    {filteredFreelancers.slice(0, 4).map((pro, idx) => (
                        <div key={`f-${idx}`} className="min-w-[280px] bg-white border border-gray-200 rounded-2xl p-6 flex flex-col hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                  src={resolveImageUrl(pro.profile_image || pro.avatar || pro.image)}
                                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                                  alt={pro.name}
                                />
                                <div>
                                    <h4 className="font-bold text-gray-900 leading-tight flex items-center">
                                        {pro.name} <ShieldCheck className="w-3 h-3 text-blue-500 ml-1" />
                                    </h4>
                                    <div className="flex items-center text-xs text-brand-600 font-bold mt-1">
                                        Instructor
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-4">"{pro.bio}"</p>
                            <Link to={`/provider/${pro.id}`} className="mt-auto w-full py-2 bg-gray-900 rounded-lg text-center text-xs font-bold text-white hover:bg-brand-600 transition-colors">
                                Contact Profile
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Explore;
