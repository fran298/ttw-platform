import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, ShieldCheck, Calendar, Layers } from 'lucide-react';
import { Listing, ListingType } from '../types';

interface Props {
  listing: Listing;
}

const ListingCard: React.FC<Props> = ({ listing }) => {
  // Safely build a human‑readable location label
  const getLocationLabel = () => {
    // ✅ Fuente de verdad: relación city del backend
    if (listing.city && typeof listing.city === 'object') {
      const cityName = listing.city.name;
      const countryName =
        typeof listing.city.country === 'object'
          ? listing.city.country.name
          : listing.city.country;

      if (cityName && countryName) {
        return `${cityName}, ${countryName}`;
      }

      if (cityName) {
        return cityName;
      }
    }

    // Fallbacks legacy (por seguridad)
    if (listing.city_name && typeof listing.city_name === 'string') {
      return listing.city_name;
    }

    const loc: any = listing.location;
    if (typeof loc === 'string') return loc;
    if (loc?.city && loc?.country) return `${loc.city}, ${loc.country}`;

    return 'Unknown';
  };

  return (
    <Link to={`/listing/${listing.id}`} className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={listing.images?.[0] || '/placeholder.jpg'} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-800">
          {listing.type === ListingType.SESSION ? 'Session'
            : listing.type === ListingType.COURSE ? 'Course'
            : listing.type === ListingType.EXPERIENCE ? 'Experience'
            : listing.type === ListingType.RENT ? 'Rental'
            : listing.type === ListingType.TRIP ? 'Trip'
            : listing.type}
        </div>
        {listing.is_verified && (
          <div className="absolute top-3 right-3 bg-brand-500/90 backdrop-blur-sm p-1 rounded-full" title="Verified Provider">
            <ShieldCheck className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-brand-600 transition-colors">{listing.title}</h3>
            <div className="flex items-center text-gray-500 text-xs mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {getLocationLabel()}
            </div>
          </div>
          <div className="flex items-center space-x-1 bg-gray-50 px-1.5 py-0.5 rounded">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-bold text-gray-800">{listing.rating}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs font-medium bg-brand-50 text-brand-700 px-2 py-1 rounded-md">
                {typeof listing.sport === 'object' ? listing.sport.name : listing.sport}
            </span>
            {listing.difficulty && (
                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                    {listing.difficulty}
                </span>
            )}
            {listing.type === ListingType.TRIP && listing.duration && (
                <span className="text-xs font-medium bg-orange-50 text-orange-700 px-2 py-1 rounded-md flex items-center">
                    <Calendar className="w-3 h-3 mr-1" /> {listing.duration}
                </span>
            )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">From <span className="font-bold text-gray-900 text-lg">{listing.currency} {listing.price}</span> {listing.type === ListingType.RENT ? '/ day' : ''}</p>
          <span className="text-xs text-gray-400">{listing.review_count} reviews</span>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;