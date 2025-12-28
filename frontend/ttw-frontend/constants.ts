import { SportCategory } from "./types";
import { Activity, Mountain, Snowflake, Wind } from "lucide-react";

export const SPORTS_BY_CATEGORY: Record<SportCategory, string[]> = {
  [SportCategory.WATER]: ['Surf', 'Kitesurf', 'Rafting', 'Diving', 'Wing Foil'],
  [SportCategory.LAND]: ['Climbing', 'Trekking', 'MTB', 'Via Ferrata'],
  [SportCategory.SNOW]: ['Skiing', 'Snowboard', 'Freeride', 'Heliski'],
  [SportCategory.AIR]: ['Paragliding', 'Skydiving']
};

export const CATEGORY_ICONS: Record<SportCategory, any> = {
  [SportCategory.WATER]: Activity, // Placeholder for Water
  [SportCategory.LAND]: Mountain,
  [SportCategory.SNOW]: Snowflake,
  [SportCategory.AIR]: Wind,
};

export const DIFFICULTY_SCALES: Record<string, string[]> = {
  'Climbing': ['5.6', '5.7', '5.8', '5.9', '5.10', '5.11', '5.12+'],
  'Rafting': ['Class I', 'Class II', 'Class III', 'Class IV', 'Class V'],
  'Skiing': ['Green', 'Blue', 'Red', 'Black', 'Double Black'],
  'Diving': ['Open Water', 'Advanced', 'Rescue', 'Master'],
};

// Mock Data Constants
export const MOCK_CONTINENTS = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Oceania'];
