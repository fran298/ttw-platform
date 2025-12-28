import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getListings, getCityDetails } from '../services/dataService';
import type { Listing } from '../types';
import ListingCard from '../components/ListingCard';
import { MapPin, ChevronLeft, ChevronRight, Navigation, Layers } from 'lucide-react';

const CityLanding: React.FC = () => {
  const { cityId } = useParams<{ cityId: string }>();
  const [city, setCity] = useState<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Formatting
  const formattedName = cityId ? cityId.charAt(0).toUpperCase() + cityId.slice(1) : 'City';

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      if (cityId) {
          const cityData = await getCityDetails(formattedName);
          setCity(cityData);
          
          // Fetch listings for this city
          const listingsData = await getListings({ city: formattedName });
          
          // If no specific city listings in mock, fallback to country or generic for demo
          if (listingsData.length === 0) {
              const allListings = await getListings();
              setListings(allListings.slice(0, 4)); // Just show some as fallback
          } else {
              setListings(listingsData);
          }
      }
      setLoading(false);
    };
    fetch();
  }, [cityId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-white font-sans pb-20">
      
      {/* 1. HERO SECTION */}
      <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
         <img 
            src={city?.heroImage} 
            alt={formattedName}
            className="w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
         
         <div className="absolute inset-0 flex flex-col justify-end px-4 md:px-20 py-20 max-w-7xl mx-auto">
            <span className="text-brand-300 font-bold tracking-widest uppercase text-sm mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2" /> Destination Guide
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-xl leading-none">
                {formattedName}
            </h1>
            <p className="text-gray-200 text-lg md:text-xl max-w-2xl font-medium drop-shadow-md leading-relaxed line-clamp-3 md:line-clamp-none">
                {city?.description}
            </p>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
          
          {/* 2. TOP SPOTS CAROUSEL */}
          <div className="mb-20">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 text-shadow-sm bg-white/80 backdrop-blur rounded-lg px-2 py-1 inline-block">Top Spots in {formattedName}</h2>
                  <div className="flex gap-2">
                      <button className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 text-gray-700">
                          <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 text-gray-700">
                          <ChevronRight className="w-5 h-5" />
                      </button>
                  </div>
              </div>

              <div className="flex overflow-x-auto gap-6 pb-8 snap-x scrollbar-hide">
                  {city?.spots.map((spot, idx) => (
                      <div key={idx} className="flex-shrink-0 w-72 h-80 rounded-2xl overflow-hidden relative group cursor-pointer snap-center shadow-lg">
                          <img src={spot.image} alt={spot.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                          <div className="absolute bottom-0 left-0 p-6 w-full">
                              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-1 block">{spot.type}</span>
                              <h3 className="text-xl font-bold text-white leading-tight">{spot.name}</h3>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* 3. MAP BANNER CTA */}
          <div className="mb-20 rounded-3xl overflow-hidden shadow-xl relative h-64 group cursor-pointer border border-gray-200">
                {/* Simulated Map Background */}
                <div className="absolute inset-0 bg-[#e5e7eb] flex items-center justify-center opacity-50 group-hover:opacity-40 transition-opacity">
                    <div className="grid grid-cols-6 gap-4 w-full h-full opacity-20">
                         {[...Array(24)].map((_, i) => <div key={i} className="bg-gray-400 rounded-full w-2 h-2 mx-auto my-auto"></div>)}
                    </div>
                </div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center px-4">
                     <div className="bg-white/90 backdrop-blur p-4 rounded-full shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                         <Navigation className="w-8 h-8 text-brand-600" />
                     </div>
                     <h3 className="text-2xl font-black text-gray-900 mb-2">Explore {formattedName} on Map</h3>
                     <p className="text-gray-600 font-medium mb-6">See all spots, schools and rentals near you</p>
                     <button className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-black transition-colors">
                         Open Interactive Map
                     </button>
                </div>
          </div>

          {/* 4. ADVENTURES GRID (Vertical Listings) */}
          <div className="mb-12">
             <div className="flex items-center justify-between mb-8">
                 <h2 className="text-3xl font-black text-gray-900">Book Adventures</h2>
                 <Link to="/explore" className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center">
                     View all <ChevronRight className="w-4 h-4 ml-1" />
                 </Link>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {listings.map(l => (
                     <ListingCard key={l.id} listing={l} />
                 ))}
             </div>
             
             {listings.length === 0 && (
                 <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                     <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                     <h3 className="text-lg font-bold text-gray-900">No listings yet</h3>
                     <p className="text-gray-500">Be the first to list an activity in {formattedName}!</p>
                 </div>
             )}
          </div>

      </div>
    </div>
  );
};

export default CityLanding;
