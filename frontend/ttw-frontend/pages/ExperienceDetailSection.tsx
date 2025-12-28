import React from 'react';
import { Listing } from '../types';
import {
  Mountain,
  Waves,
  Clock,
  Video,
  Users,
  AlertTriangle,
  Shield,
  MapPin,
  Globe,
  Wind,
  Zap,
  Hourglass,
  Camera,
  Ban,
  CheckCircle,
  Info,
  Car
} from 'lucide-react';

interface Props {
  listing: Listing;
}

const ExperienceDetailSection: React.FC<Props> = ({ listing }) => {
  const d: any = listing.details || {};

  // Helper to check if any specific section has data to avoid empty containers
  const hasStats = d.experienceAltitude || d.experienceDepth || d.actionDurationLabel || d.totalDurationLabel;
  const hasMediaOrSpectators = d.mediaPackage !== 'NONE' || d.spectatorPolicy;
  const hasSafety = d.zeroAlcoholPolicy || d.noFlyAfterDive || d.excludePregnancy || d.excludeEpilepsy || d.excludeHeartConditions || d.mustKnowSwimming;

  if (!d) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* 1. HERO STATS DASHBOARD (The "Bragging Rights") */}
      {hasStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {d.experienceAltitude && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <Mountain className="w-6 h-6 text-indigo-500 mb-2" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Altitude</span>
              <span className="text-lg font-black text-gray-900 leading-tight">{d.experienceAltitude}</span>
            </div>
          )}
          {d.experienceDepth && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <Waves className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Max Depth</span>
              <span className="text-lg font-black text-gray-900 leading-tight">{d.experienceDepth}</span>
            </div>
          )}
          {d.actionDurationLabel && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <Zap className="w-6 h-6 text-yellow-500 mb-2" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Action Time</span>
              <span className="text-lg font-black text-gray-900 leading-tight">{d.actionDurationLabel}</span>
            </div>
          )}
          {d.totalDurationLabel && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <Clock className="w-6 h-6 text-emerald-500 mb-2" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Trip</span>
              <span className="text-lg font-black text-gray-900 leading-tight">{d.totalDurationLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* 2. MISSION BRIEFING (Timeline & Logistics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left: Logistics */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-gray-900 uppercase mb-4 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" /> Logistics
              </h3>
              <div className="space-y-4">
                  {/* Timeline Visualizer */}
                  <div className="relative pl-4 border-l-2 border-indigo-100 ml-1 space-y-6">
                      <div className="relative">
                          <div className="absolute -left-[21px] top-0.5 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-white"></div>
                          <p className="text-xs font-bold text-indigo-600 uppercase">Check-In</p>
                          <p className="text-sm text-gray-700 font-medium">
                              Arrive <span className="font-bold">{d.arrivalBufferMinutes || 30} minutes</span> before your slot.
                          </p>
                      </div>
                      <div className="relative">
                          <div className="absolute -left-[21px] top-0.5 w-4 h-4 rounded-full bg-gray-200 ring-4 ring-white"></div>
                          <p className="text-xs font-bold text-gray-400 uppercase">Activity Start</p>
                          <p className="text-sm text-gray-700">Briefing & Gear Up</p>
                      </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mt-2 space-y-2">
                      {d.languages && d.languages.length > 0 && (
                          <div className="flex items-start text-sm text-gray-600">
                              <Globe className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                              <span>Languages: <span className="font-medium text-gray-900">{d.languages.join(', ')}</span></span>
                          </div>
                      )}
                      {d.accessType && (
                          <div className="flex items-start text-sm text-gray-600">
                              <Car className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                              <span>Access: <span className="font-medium text-gray-900">{d.accessType === '4x4' ? '4x4 Vehicle Required' : d.accessType.replace('_', ' ')}</span></span>
                          </div>
                      )}
                      {d.badWeatherAlternative && (
                          <div className="flex items-start text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">
                              <Wind className="w-4 h-4 mr-2 mt-0.5 text-blue-500" />
                              <span>
                                  <span className="font-bold text-blue-800 text-xs uppercase block">Bad Weather Plan</span>
                                  {d.badWeatherAlternative}
                              </span>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* Right: Media & Entourage */}
          <div className="space-y-6">
              {/* Media Card */}
              {d.mediaPackage && d.mediaPackage !== 'NONE' && (
                  <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-sm font-black text-purple-900 uppercase mb-3 flex items-center">
                          <Camera className="w-4 h-4 mr-2" /> Memories
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Video/Photo Package</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${d.mediaPackage === 'INCLUDED' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                              {d.mediaPackage === 'INCLUDED' ? 'INCLUDED' : 'EXTRA COST'}
                          </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                          {d.mediaPackage === 'HANDCAM_EXTRA' && "Instructor films via Handcam."}
                          {d.mediaPackage === 'OUTSIDE_CAM_EXTRA' && "Dedicated outside flyer/cameraman."}
                          {d.mediaPackage === 'INCLUDED' && "Footage is included in the price."}
                      </p>
                      {d.mediaDelivery && (
                          <div className="flex items-center text-xs text-purple-800 bg-purple-50 p-2 rounded-lg">
                              <Hourglass className="w-3 h-3 mr-2" />
                              Delivery: {d.mediaDelivery}
                          </div>
                      )}
                  </div>
              )}

              {/* Spectators Card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-black text-gray-900 uppercase mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" /> Entourage
                  </h3>
                  <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Spectators</span>
                      <span className="font-bold text-sm text-gray-900">
                          {d.spectatorPolicy === 'FREE' ? 'Allowed (Free)' : d.spectatorPolicy === 'PAID' ? 'Allowed (Extra Cost)' : 'Not Allowed'}
                      </span>
                  </div>
                  {d.spectatorViewAvailable && (
                      <div className="mt-3 flex items-center text-xs text-green-700 bg-green-50 p-2 rounded-lg">
                          <CheckCircle className="w-3 h-3 mr-2" />
                          Viewing area available for friends/family.
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* OPERATING WINDOW & SEASON */}
      {d.weeklySchedule && (
        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-brand-600" />
            Operating Window
          </h2>

          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-4">
            <div className="space-y-3">
              {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                const info = d.weeklySchedule?.[day];
                const isOpen = info?.open;

                return (
                  <div key={day} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-3 ${
                          isOpen ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      ></div>
                      <span className="font-bold text-gray-700 uppercase w-12">
                        {day}
                      </span>
                    </div>
                    <div className="font-mono text-gray-600">
                      {isOpen ? (
                        <span>
                          {info.start} – {info.end}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Closed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {d.seasonMonths && d.seasonMonths.length > 0 && (
            <div className="text-sm text-gray-600">
              <strong>Season:</strong>{' '}
              {d.seasonMonths
                .map((m: number) =>
                  new Date(2024, m).toLocaleString('en-US', { month: 'short' })
                )
                .join(', ')}
            </div>
          )}
        </div>
      )}

      {/* 3. SAFETY & REQUIREMENTS GRID */}
      {hasSafety && (
          <div className="border-t border-gray-100 pt-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Safety & Requirements</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {d.mustKnowSwimming && (
                      <div className="flex items-center p-3 bg-blue-50 rounded-xl text-blue-800 text-sm font-medium">
                          <Waves className="w-5 h-5 mr-3" /> Must be able to swim
                      </div>
                  )}
                  {d.zeroAlcoholPolicy && (
                      <div className="flex items-center p-3 bg-red-50 rounded-xl text-red-800 text-sm font-medium">
                          <Ban className="w-5 h-5 mr-3" /> Zero Alcohol Policy
                      </div>
                  )}
                  {d.noFlyAfterDive && (
                      <div className="flex items-center p-3 bg-orange-50 rounded-xl text-orange-800 text-sm font-medium">
                          <AlertTriangle className="w-5 h-5 mr-3" /> No flying 18h after
                      </div>
                  )}
                  {(d.excludePregnancy || d.excludeEpilepsy || d.excludeHeartConditions) && (
                      <div className="flex items-center p-3 bg-gray-50 rounded-xl text-gray-700 text-sm font-medium col-span-1 md:col-span-2">
                          <Shield className="w-5 h-5 mr-3 text-gray-400" />
                          <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-400 uppercase">Medical Exclusions</span>
                              <span>
                                  {[
                                      d.excludePregnancy && 'Pregnancy',
                                      d.excludeEpilepsy && 'Epilepsy',
                                      d.excludeHeartConditions && 'Heart Conditions'
                                  ].filter(Boolean).join(' • ')}
                              </span>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* 4. THE "FINE PRINT" (Chicken Out Policy) */}
      {d.chickenOutPolicy && (
          <div className="bg-gray-900 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-full">
                      <Info className="w-6 h-6 text-white" />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg">Cancellation at the edge</h3>
                      <p className="text-sm text-gray-300 mt-1">
                          Policy if you decide not to proceed after gearing up:
                          <strong className="text-white ml-1">
                              {d.chickenOutPolicy === 'NO_REFUND' ? 'No Refund' : d.chickenOutPolicy === 'PARTIAL_REFUND' ? 'Partial Refund' : 'Full Refund'}
                          </strong>
                      </p>
                  </div>
              </div>
              {/* Abstract decorative circle */}
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          </div>
      )}

    </div>
  );
};

export default ExperienceDetailSection;