import { Listing } from "../types";

// IA desactivada temporalmente
const ai = null;

export const generateSafetyBriefing = async (_activity?: string, _level?: string, _location?: string): Promise<string> => {
  return "AI disabled (no safety briefing available).";
};

export const generateTripItinerary = async (_tripTitle?: string, _days?: number, _location?: string): Promise<string> => {
  return "[]";
};

export const askAIAboutListing = async (_listing?: Listing, _userQuestion?: string): Promise<string> => {
  return "AI disabled.";
};