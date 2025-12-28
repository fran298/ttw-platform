
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSportsDirectory } from '../services/dataService';
import { SportDirectoryItem, SportCategory } from '../types';
import { ArrowRight, Search, ChevronDown, X, Layers } from 'lucide-react';

const SportsIndex: React.FC = () => {
  const [sports, setSports] = useState<SportDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [activeCategory, setActiveCategory] = useState<SportCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const data = await getSportsDirectory();
      setSports(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const filteredSports = sports.filter(s => {
      const matchCategory = activeCategory === 'ALL' || s.category === activeCategory;
      const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
  });

  // Suggestions logic: Filter sports that match query but aren't exact match (to avoid showing suggestion of what's already typed fully)
  const suggestions = sports.filter(s => 
    searchQuery && 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    s.name.toLowerCase() !== searchQuery.toLowerCase()
  ).slice(0, 5);

  const clearFilters = () => {
      setActiveCategory('ALL');
      setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* HERO SECTION - Standardized */}
      <div className="relative h-[450px] md:h-[380px] w-full bg-gray-900 flex items-center justify-center mb-24">
         
         {/* Background Image */}
         <div className="absolute inset-0 overflow-hidden">
            <img 
                src="https://res.cloudinary.com/dmvlubzor/image/upload/v1766222382/Carrusel---Kite-2_f9ynoy.jpg" 
                alt="Action Sports" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
         </div>

         {/* Content */}
         <div className="relative z-10 text-center px-4 -mt-12 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-xl">
                Choose Your Element
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-md leading-relaxed">
                From the peaks to the ocean depths, find where you belong.
            </p>
         </div>

         {/* FLOATING FILTER BAR (Pill Style) */}
         <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full max-w-3xl px-4 z-20">
            <div className="bg-white rounded-full shadow-2xl p-2 flex flex-col md:flex-row items-center border border-gray-100 relative">
                
                {/* Category Filter */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 md:border-r border-gray-100 cursor-pointer hover:bg-gray-50 rounded-t-3xl md:rounded-l-full md:rounded-tr-none md:rounded-br-none transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">Discipline</label>
                    <div className="flex items-center justify-between">
                        <select 
                            value={activeCategory}
                            onChange={(e) => setActiveCategory(e.target.value as any)}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none appearance-none cursor-pointer text-sm md:text-base"
                        >
                            <option value="ALL">All Disciplines</option>
                            {Object.values(SportCategory).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>
                </div>

                {/* Search Input with Dropdown */}
                <div className="relative flex-1 w-full md:w-auto px-6 py-2 cursor-pointer hover:bg-gray-50 rounded-b-3xl md:rounded-r-full md:rounded-bl-none md:rounded-tl-none transition-colors group">
                    <label className="block text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5 text-left">Search</label>
                    <div className="flex items-center justify-between">
                        <input 
                            type="text" 
                            placeholder="Find a sport..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            // Delay hiding to allow click on suggestion
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="w-full bg-transparent font-medium text-gray-500 outline-none placeholder-gray-400 text-sm md:text-base"
                        />
                        <Search className="w-4 h-4 text-gray-300 ml-2 flex-shrink-0" />
                    </div>

                    {/* Auto-Complete Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-white rounded-xl shadow-xl border border-gray-100 mt-4 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="py-1">
                                {suggestions.map(s => (
                                    <button 
                                        key={s.slug}
                                        onClick={() => {
                                            setSearchQuery(s.name);
                                            setShowSuggestions(false);
                                        }}
                                        className="w-full text-left px-6 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center transition-colors"
                                    >
                                        <Search className="w-3 h-3 mr-3 text-gray-400" />
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Search/Action Button */}
                <div className="p-1 w-full md:w-auto flex justify-center">
                    <button className="w-12 h-12 bg-[#132b5b] hover:bg-[#0f234b] text-white rounded-full font-bold transition-all shadow-lg flex items-center justify-center group transform hover:scale-105 hover:shadow-brand-900/20">
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </div>
         </div>
      </div>

      {/* CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        
        {loading ? (
            <div className="flex justify-center h-64 items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        ) : (
            <>
                {/* Redesigned Result Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-gray-200 pb-6 gap-4">
                    <div>
                        <span className="text-brand-600 font-bold tracking-widest uppercase text-xs mb-1 block flex items-center">
                            <Layers className="w-3 h-3 mr-1" /> Directory
                        </span>
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
                            {activeCategory === 'ALL' ? 'All Sports' : activeCategory}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                         {searchQuery && (
                             <span className="text-sm text-gray-500 italic">
                                Results for "{searchQuery}"
                             </span>
                         )}
                         <span className="bg-white text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                            {filteredSports.length} Results
                         </span>
                    </div>
                </div>

                {filteredSports.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No sports found</h3>
                        <p className="text-gray-500 mb-6">Try a different search term or category.</p>
                        <button 
                            onClick={clearFilters}
                            className="px-6 py-2 bg-brand-600 text-white rounded-full font-bold text-sm hover:bg-brand-700 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredSports.map((sport) => (
                            <div key={sport.slug} className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500 bg-gray-900">
                                {/* Background Image */}
                                <img 
                                    src={sport.image} 
                                    alt={sport.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity"></div>
                                
                                {/* Top Badge */}
                                <div className="absolute top-4 right-4">
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/30 uppercase tracking-wider shadow-sm">
                                        {sport.category}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 w-full p-8 text-white">
                                    <h3 className="text-4xl font-black uppercase mb-2 leading-none drop-shadow-lg">{sport.name}</h3>
                                    
                                    <div className="h-1 w-12 bg-brand-500 mb-4 rounded-full opacity-80"></div>
                                    
                                    <p className="text-gray-200 text-sm line-clamp-2 mb-6 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75">
                                        {sport.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between border-t border-white/20 pt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 transform translate-y-2 group-hover:translate-y-0">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{sport.listingCount} Experiences</span>
                                        <Link 
                                            to={`/sport/${sport.slug}`}
                                            className="flex items-center text-white font-bold text-xs uppercase tracking-wider hover:text-brand-400 transition-colors"
                                        >
                                            Explore <ArrowRight className="w-3 h-3 ml-2" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default SportsIndex;
