
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCountriesByContinent, getSignatureTrips, CountryData } from '../services/dataService';
import { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import { Compass, Calendar, ArrowRight, Sun, CloudSnow, CloudRain, Wind } from 'lucide-react';

const ContinentLanding: React.FC = () => {
    const { continentId } = useParams<{ continentId: string }>();
    const formattedContinent = continentId ? continentId.charAt(0).toUpperCase() + continentId.slice(1) : 'Europe';

    const [countries, setCountries] = useState<CountryData[]>([]);
    const [trips, setTrips] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [season, setSeason] = useState<'SUMMER' | 'WINTER' | 'AUTUMN' | 'SPRING'>('SUMMER');

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const countryData = await getCountriesByContinent(formattedContinent);
            const tripData = await getSignatureTrips(formattedContinent);
            setCountries(countryData);
            setTrips(tripData);
            setLoading(false);
        };
        fetch();
    }, [continentId]);

    // Mock recommendation logic based on season
    const getSeasonalRecommendation = () => {
        switch(season) {
            case 'WINTER': return 'Chasing Powder & Northern Lights';
            case 'SUMMER': return 'Endless Surf & High Altitude Treks';
            case 'SPRING': return 'Whitewater Rafting & Climbing';
            case 'AUTUMN': return 'Epic Swells & Golden Forests';
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Wild Adventures...</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            
            {/* 1. EDITORIAL HERO */}
            <div className="relative h-[70vh] w-full overflow-hidden bg-gray-900">
                <img 
                    src={`https://source.unsplash.com/1600x900/?landscape,nature,${formattedContinent}`} 
                    alt={formattedContinent} 
                    className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-[2s]"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <div className="border border-white/30 px-4 py-1 rounded-full text-xs font-bold tracking-[0.2em] text-white uppercase mb-6 backdrop-blur-sm">
                        The Wild Compass
                    </div>
                    <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter uppercase mb-4 mix-blend-overlay opacity-90">
                        {formattedContinent}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-200 font-light max-w-3xl italic font-serif">
                        "A land of untold stories, from the highest peaks to the deepest oceans."
                    </p>
                </div>
            </div>

            {/* 2. SEASONAL COMPASS WIDGET */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 mb-24">
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-gray-100 pb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Where to go in {formattedContinent}?</h2>
                            <p className="text-gray-500">Select a season to unlock expert recommendations.</p>
                        </div>
                        <div className="flex bg-gray-100 rounded-lg p-1 mt-4 md:mt-0">
                            {[
                                { id: 'WINTER', icon: CloudSnow },
                                { id: 'SPRING', icon: CloudRain },
                                { id: 'SUMMER', icon: Sun },
                                { id: 'AUTUMN', icon: Wind }
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setSeason(s.id as any)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                        season === s.id 
                                        ? 'bg-white text-gray-900 shadow-sm' 
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    <s.icon className="w-4 h-4" />
                                    <span className="hidden md:inline">{s.id.charAt(0) + s.id.slice(1).toLowerCase()}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="bg-brand-50 p-3 rounded-full hidden md:block">
                            <Compass className="w-6 h-6 text-brand-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-brand-900 mb-2">{getSeasonalRecommendation()}</h3>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                {season === 'WINTER' && `Experience ${formattedContinent} under a blanket of snow. This is the prime time for backcountry skiing and northern expeditions.`}
                                {season === 'SPRING' && `As the snow melts, ${formattedContinent}'s rivers roar to life. Perfect for whitewater rafting and early season climbing.`}
                                {season === 'SUMMER' && `Long days and warm waters make ${formattedContinent} a paradise for surfers, hikers, and coastal explorers.`}
                                {season === 'AUTUMN' && `Crisp air and fewer crowds. Discover ${formattedContinent}'s dramatic coastlines with epic swells and vibrant forests.`}
                            </p>
                            <Link to="/explore" className="text-brand-600 font-bold text-sm hover:underline inline-flex items-center">
                                View Seasonal Calendar <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. MOSAIC GRID (Countries) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
                <div className="text-center mb-16">
                    <span className="text-brand-600 font-bold tracking-widest uppercase text-xs">Territories</span>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-2">The Mosaic of Nations</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[250px] gap-4">
                    {countries.map((country, idx) => {
                        // Create a "mosaic" pattern by making some items span 2 cols or 2 rows
                        const isLarge = idx === 0 || idx === 5; 
                        const isTall = idx === 2;
                        
                        return (
                            <Link 
                                key={country.name}
                                to={`/destination/${country.name.toLowerCase()}`}
                                className={`relative group overflow-hidden rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 ${isLarge ? 'md:col-span-2 md:row-span-2' : isTall ? 'md:row-span-2' : ''}`}
                            >
                                <img 
                                    src={country.image} 
                                    alt={country.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                                <div className="absolute bottom-6 left-6 text-white">
                                    <h3 className={`font-black uppercase tracking-tight ${isLarge ? 'text-4xl' : 'text-2xl'}`}>{country.name}</h3>
                                    <div className="h-0.5 w-0 bg-white group-hover:w-12 transition-all duration-500 mt-2 mb-2"></div>
                                    <p className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                        {country.count} Adventures
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* 4. SIGNATURE EXPEDITIONS */}
            <div className="bg-gray-900 text-white py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                             <h2 className="text-4xl font-bold mb-2">Signature Expeditions</h2>
                             <p className="text-gray-400">Multi-day journeys unique to {formattedContinent}.</p>
                        </div>
                        <button className="border border-white/30 hover:bg-white hover:text-gray-900 text-white px-6 py-2 rounded-full text-sm font-bold transition-all">
                            View All Trips
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {trips.map(trip => (
                            <div key={trip.id} className="bg-gray-800 rounded-xl overflow-hidden group">
                                <div className="relative h-64 overflow-hidden">
                                    <img src={trip.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={trip.title} />
                                    <div className="absolute top-4 left-4 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded">
                                        {trip.duration}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center text-xs text-gray-400 mb-2">
                                        <Calendar className="w-3 h-3 mr-1" /> Next Departure: {trip.startDate || 'TBA'}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 group-hover:text-brand-400 transition-colors">{trip.title}</h3>
                                    <p className="text-sm text-gray-400 line-clamp-2 mb-4">{trip.description}</p>
                                    <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                                        <span className="font-bold text-lg">{trip.currency} {trip.price}</span>
                                        <Link to={`/trip/${trip.id}`} className="text-xs font-bold uppercase tracking-wider hover:text-brand-400">View Trip</Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {trips.length === 0 && (
                             <div className="col-span-full text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-xl">
                                 No signature trips scheduled for this continent yet.
                             </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ContinentLanding;
