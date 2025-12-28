const normalize = (value: string) =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getListings, getProvidersDirectory, getDestinations } from '../services/dataService';
import { MOCK_CONTINENTS } from '../constants';
import { MapPin, ArrowRight, Filter, Search, Sun, ChevronDown } from 'lucide-react';

const DestinationsIndex: React.FC = () => {
    const [countries, setCountries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [selectedContinent, setSelectedContinent] = useState<string>('');
    const [selectedSport, setSelectedSport] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<number | ''>('');

    // Unique Sports
    const allSports = useMemo(() => {
        const s = new Set<string>();
        countries.forEach(c => Array.isArray(c.topSports) && c.topSports.forEach((sport: string) => s.add(sport)));
        return Array.from(s).sort();
    }, [countries]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const listings = await getListings({});
                const directory = await getProvidersDirectory();
                const providers = [
                    ...(directory.schools || []),
                    ...(directory.freelancers || [])
                ];

                // Fetch official destinations from backend
                const destinationsFromApi = await getDestinations();

                // Build destinations dynamically from listings
                const map: Record<string, any> = {};

                listings.forEach((l: any) => {
                    if (!l.location?.city) return;

                    const cityName = l.location.city;

                    const officialDestination = destinationsFromApi.find(
                        (d: any) => normalize(d.name) === normalize(cityName)
                    );

                    const cityKey = officialDestination?.slug || normalize(cityName).replace(/\s+/g, '-');

                    if (!map[cityKey]) {
                        map[cityKey] = {
                            name: l.location.city,
                            country: l.location.country,
                            image: officialDestination?.hero_image
                                || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=80',
                            slug: officialDestination?.slug || cityKey,
                            topSports: new Set<string>(),
                            bestMonths: l.details?.seasonMonths || [],
                            startingPrice: Number(l.price) || 0,
                            count: 0,
                            continent: l.location.continent || '',
                        };
                    }

                    map[cityKey].topSports.add(l.sport);
                    map[cityKey].count += 1;

                    const price = Number(l.price);
                    if (!isNaN(price) && (map[cityKey].startingPrice === 0 || price < map[cityKey].startingPrice)) {
                        map[cityKey].startingPrice = price;
                    }
                });

                // Add cities from providers (schools/instructors) not already present
                providers.forEach((p: any) => {
                    const city = p.location?.city;
                    if (!city) return;

                    const officialDestination = destinationsFromApi.find(
                        (d: any) => normalize(d.name) === normalize(city)
                    );

                    const cityKey = officialDestination?.slug || normalize(city).replace(/\s+/g, '-');

                    if (!map[cityKey]) {
                        map[cityKey] = {
                            name: city,
                            country: p.location?.country || '',
                            image: officialDestination?.hero_image
                                || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2000&q=80',
                            slug: officialDestination?.slug || cityKey,
                            topSports: new Set<string>(p.sports || []),
                            bestMonths: [],
                            startingPrice: 0,
                            count: 0,
                            continent: p.location?.continent || '',
                        };
                    } else {
                        if (Array.isArray(p.sports)) {
                            p.sports.forEach((s: string) => map[cityKey].topSports.add(s));
                        }
                    }
                });

                const destinations = Object.values(map).map((c: any) => ({
                    ...c,
                    topSports: Array.from(c.topSports),
                }));

                setCountries(destinations);
            } catch (e) {
                console.error('Destination load failed', e);
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, []);

    // --- FILTERING LOGIC ---
    const filteredDestinations = useMemo(() => {
        return countries.filter(c => {
            const matchContinent = !selectedContinent || (c.continent && c.continent === selectedContinent);
            const matchSport = !selectedSport || c.topSports.some(s => s.toLowerCase() === selectedSport.toLowerCase());
            const matchMonth = selectedMonth === '' || (c.bestMonths && c.bestMonths.includes(selectedMonth as number));
            return matchContinent && matchSport && matchMonth;
        });
    }, [countries, selectedContinent, selectedSport, selectedMonth]);

    const getMonthName = (idx: number) => {
        return new Date(0, idx).toLocaleString('default', { month: 'long' });
    };

    const isPeakSeason = (months: number[]) => {
        const currentMonth = new Date().getMonth();
        return months.includes(currentMonth);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            
            {/* 1. HERO SECTION - Matching Home Page Dimensions */}
            <div className="relative h-[450px] md:h-[380px] bg-gray-900 flex flex-col items-center justify-center mb-24">
                <img 
                    src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2000&q=80" 
                    alt="World Travel" 
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30"></div>
                
                <div className="relative z-10 text-center px-4 w-full max-w-5xl -mt-12">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-lg leading-tight">
                        Find your next <span className="text-brand-400">Wild Adventure</span>
                    </h1>
                </div>
                    
                {/* Search Bar - Pill Style matching Home Page */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full max-w-4xl px-4 z-20">
                    <div className="bg-white rounded-full shadow-2xl p-2 flex flex-col md:flex-row items-center border border-gray-100">
                        
                        {/* Continent Filter */}
                        <div className="relative flex-1 w-full md:w-auto px-6 py-2 md:border-r border-gray-100 cursor-pointer hover:bg-gray-50 rounded-t-3xl md:rounded-l-full md:rounded-tr-none md:rounded-br-none transition-colors group">
                            <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">Region</label>
                            <div className="flex items-center justify-between">
                                <select 
                                    value={selectedContinent}
                                    onChange={(e) => setSelectedContinent(e.target.value)}
                                    className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base"
                                >
                                    <option value="">Anywhere</option>
                                    {MOCK_CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}
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
                                    onChange={(e) => setSelectedSport(e.target.value)}
                                    className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base"
                                >
                                    <option value="">All Sports</option>
                                    {allSports.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                            </div>
                        </div>

                        {/* Month Filter */}
                        <div className="relative flex-1 w-full md:w-auto px-6 py-2 cursor-pointer hover:bg-gray-50 rounded-b-3xl md:rounded-r-full md:rounded-bl-none md:rounded-tl-none transition-colors group">
                            <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">When</label>
                            <div className="flex items-center justify-between">
                                <select 
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base"
                                >
                                    <option value="">Any Month</option>
                                    {Array.from({length: 12}).map((_, i) => (
                                        <option key={i} value={i}>{getMonthName(i)}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                            </div>
                        </div>

                        {/* Circular Search Button */}
                        <div className="p-1 w-full md:w-auto flex justify-center">
                            <button className="w-12 h-12 bg-[#132b5b] hover:bg-[#0f234b] text-white rounded-full font-bold transition-all shadow-lg flex items-center justify-center group transform hover:scale-105 hover:shadow-brand-900/20">
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            

            {/* 3. MAIN RESULTS GRID */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-12">
                
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900">
                            {selectedContinent || 'Worldwide'} Destinations
                        </h2>
                        <p className="text-gray-500 mt-1">
                            {filteredDestinations.length} places found 
                            {selectedSport && ` for ${selectedSport}`}
                            {selectedMonth !== '' && ` in ${getMonthName(selectedMonth as number)}`}
                        </p>
                    </div>
                    
                    {/* Map Toggle Mockup */}
                    <div className="hidden md:flex bg-white border border-gray-200 rounded-lg p-1">
                        <button className="px-4 py-1.5 bg-gray-900 text-white rounded-md text-xs font-bold shadow-sm">Grid</button>
                        <button className="px-4 py-1.5 text-gray-500 hover:text-gray-900 text-xs font-bold">Map</button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredDestinations.map((country) => (
                            <Link 
                                key={country.name} 
                                to={`/destination/${country.slug}`}
                                className="group relative h-[450px] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500 bg-gray-200"
                            >
                                {/* Background */}
                                <img 
                                    src={country.image} 
                                    alt={country.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90"></div>
                                
                                {/* Top Tags */}
                                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                    {country.topSports.slice(0, 2).map(s => (
                                        <span key={s} className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/20">
                                            {s}
                                        </span>
                                    ))}
                                </div>

                                {/* Price Tag (Conversion Trigger) */}
                                <div className="absolute top-4 right-4 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                                    From ${country.startingPrice}
                                </div>

                                {/* Bottom Content */}
                                <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                                    
                                    {/* Seasonal Badge */}
                                    {isPeakSeason(country.bestMonths) && (
                                        <div className="inline-flex items-center gap-1 bg-green-500/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase mb-2">
                                            <Sun className="w-3 h-3" /> Prime Season
                                        </div>
                                    )}

                                    <div className="flex justify-between items-end mb-2">
                                        <h3 className="text-3xl font-black uppercase tracking-tight leading-none">{country.name}</h3>
                                    </div>
                                    
                                    <div className="flex items-center text-xs font-bold text-gray-300 mb-4">
                                        <MapPin className="w-3 h-3 mr-1 text-brand-500" />
                                        {country.count} Spots Available
                                    </div>

                                    <div className="border-t border-white/20 pt-3 flex justify-between items-center">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                                            Best: {getMonthName(country.bestMonths[0]).substring(0,3)} - {getMonthName(country.bestMonths[country.bestMonths.length-1]).substring(0,3)}
                                        </span>
                                        <div className="bg-white text-black rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && filteredDestinations.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <Filter className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Destinations Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            We couldn't find any destinations matching your criteria. Try changing the season or region.
                        </p>
                        <button 
                            onClick={() => { setSelectedSport(''); setSelectedContinent(''); setSelectedMonth(''); }}
                            className="bg-brand-600 text-white px-6 py-3 rounded-full font-bold hover:bg-brand-700 transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DestinationsIndex;
