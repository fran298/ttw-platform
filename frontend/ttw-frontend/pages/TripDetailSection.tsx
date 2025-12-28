import React from 'react';
import { Listing } from '../types';
import { 
    Mountain, Thermometer, Weight, Map, 
    ShieldAlert, Backpack, Footprints, 
    CheckCircle, XCircle, Navigation, 
    Calendar, Tent, Utensils
} from 'lucide-react';

interface Props {
    listing: Listing;
}

const TripDetailSection: React.FC<Props> = ({ listing }) => {
    const d = listing.details || {};

    // Helper for Risk Color
    const getRiskColor = (level: string) => {
        switch(level) {
            case 'HIGH': return 'bg-red-100 text-red-700 border-red-200';
            case 'MEDIUM': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-green-100 text-green-700 border-green-200';
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            
            {/* 1. MISSION STATS DASHBOARD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Risk Level */}
                <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${d.riskLevel ? getRiskColor(d.riskLevel) : 'bg-gray-50 text-gray-600'}`}>
                    <ShieldAlert className="w-6 h-6 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Risk Level</span>
                    <span className="text-lg font-black">{d.riskLevel || 'STANDARD'}</span>
                </div>

                {/* Altitude */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                    <Mountain className="w-6 h-6 text-slate-500 mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Alt</span>
                    <span className="text-lg font-black text-gray-900">{d.expectedConditions?.altitudeMax ? `${d.expectedConditions.altitudeMax}m` : 'N/A'}</span>
                </div>

                {/* Physical Daily */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                    <Footprints className="w-6 h-6 text-brand-600 mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Activity</span>
                    <span className="text-lg font-black text-gray-900">{d.physicalEffort?.hoursPerDay || '-'} h/day</span>
                </div>

                {/* Pack Weight */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                    <Weight className="w-6 h-6 text-blue-500 mb-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pack Weight</span>
                    <span className="text-lg font-black text-gray-900">{d.physicalEffort?.backpackWeight ? `${d.physicalEffort.backpackWeight}kg` : 'Light'}</span>
                </div>
            </div>

            {/* 2. ENVIRONMENT & CONDITIONS */}
            {(d.expectedConditions?.tempMin || d.expectedConditions?.tempMax) && (
                <div className="bg-gradient-to-r from-blue-50 to-orange-50 border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between">
                    <div className="flex items-center mb-4 md:mb-0">
                        <div className="p-3 bg-white rounded-full shadow-sm mr-4">
                            <Thermometer className="w-6 h-6 text-gray-700" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm uppercase">Expected Conditions</h4>
                            <p className="text-xs text-gray-500">Prepare for these extremes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        {d.expectedConditions.tempMin && (
                            <div className="text-center">
                                <span className="block text-xs font-bold text-blue-600">MIN TEMP</span>
                                <span className="text-2xl font-black text-gray-900">{d.expectedConditions.tempMin}°C</span>
                            </div>
                        )}
                        <div className="h-8 w-px bg-gray-300"></div>
                        {d.expectedConditions.tempMax && (
                            <div className="text-center">
                                <span className="block text-xs font-bold text-orange-600">MAX TEMP</span>
                                <span className="text-2xl font-black text-gray-900">{d.expectedConditions.tempMax}°C</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. TRIP LOGISTICS & ITINERARY */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: The Route */}
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                        <Map className="w-5 h-5 mr-2 text-brand-600" /> Expedition Itinerary
                    </h3>
                    
                    <div className="relative pl-6 border-l-2 border-brand-100 space-y-8 ml-2">
                        {d.itinerary && d.itinerary.map((day: any, idx: number) => (
                            <div key={idx} className="relative">
                                <span className="absolute -left-[31px] top-0 flex items-center justify-center w-8 h-8 bg-white border-2 border-brand-200 rounded-full text-xs font-bold text-brand-700">
                                    D{idx + 1}
                                </span>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-brand-200 transition-colors">
                                    <h4 className="font-bold text-gray-900 text-sm mb-1">{day.title}</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">{day.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Base & Sleep */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h4 className="text-xs font-black text-gray-400 uppercase mb-4 tracking-wide">Base Operations</h4>
                        
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <Navigation className="w-5 h-5 text-gray-700 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Route Type</p>
                                    <p className="text-sm font-bold text-gray-900">{d.tripRouteType === 'MOVING' ? 'Point-to-Point (Moving)' : 'Single Base Camp'}</p>
                                </div>
                            </div>

                            {d.tripBases && d.tripBases.length > 0 && (
                                <div className="flex items-start">
                                    <Map className="w-5 h-5 text-gray-700 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Key Locations</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {d.tripBases.map((base: string, i: number) => (
                                                <span key={i} className="text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-700 font-medium">
                                                    {base}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-100 pt-4 flex gap-4">
                                <div className="text-center flex-1">
                                    <Tent className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                                    <p className="text-[10px] font-bold text-gray-500">{d.accommodationStyle}</p>
                                </div>
                                <div className="text-center flex-1">
                                    <Utensils className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                                    <p className="text-[10px] font-bold text-gray-500">{d.foodPolicy?.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. TACTICAL KIT LIST */}
            <div className="border-t border-gray-100 pt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                    <Backpack className="w-5 h-5 mr-2 text-brand-600" /> Tactical Kit List
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Provided */}
                    <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
                        <h4 className="text-sm font-bold text-green-900 uppercase mb-3 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" /> We Provide
                        </h4>
                        <p className="text-sm text-green-800 whitespace-pre-line leading-relaxed">
                            {d.gearProvided || "Standard safety equipment included."}
                        </p>
                    </div>

                    {/* Required */}
                    <div className="bg-white rounded-2xl p-5 border-2 border-dashed border-gray-300">
                        <h4 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center">
                            <XCircle className="w-4 h-4 mr-2 text-red-500" /> You Must Bring
                        </h4>
                        <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                            {d.gearRequired || "Personal clothing and hygiene items."}
                        </p>
                        {d.mandatoryEquipment && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <span className="text-xs font-bold text-red-600 uppercase block mb-1">Mandatory Technical Items:</span>
                                <p className="text-xs text-gray-500">{d.mandatoryEquipment}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TripDetailSection;