-- 1. EXTENSIONS
-- Enable UUID generation for unique, secure IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES (Standardizing values)
CREATE TYPE user_role AS ENUM ('USER', 'PROVIDER', 'ADMIN');
CREATE TYPE provider_type AS ENUM ('SCHOOL', 'FREELANCER');
CREATE TYPE listing_type AS ENUM ('ACTIVITY', 'RENT', 'TRIP');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE sport_category AS ENUM ('WATER', 'LAND', 'SNOW', 'AIR');

-- 3. USERS TABLE (Core Identity)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Store bcrypt/argon2 hash, NOT plain text
    role user_role NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PROFILES (Polymorphic Association)
-- Using separate tables allows Schools and Freelancers to have very different data requirements

-- School Profile
CREATE TABLE profiles_school (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    vat_number VARCHAR(50),
    bio TEXT,
    logo_url TEXT,
    website_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    location_text VARCHAR(255), -- e.g. "Tarifa, Spain"
    social_instagram VARCHAR(100),
    
    -- JSONB allows flexible additions like 'parking', 'wifi', 'showers' without schema changes
    amenities JSONB DEFAULT '[]'::jsonb 
);

-- Instructor/Freelancer Profile
CREATE TABLE profiles_instructor (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    years_experience INT,
    is_verified BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    location_text VARCHAR(255),
    
    -- Array of strings for their specific skills
    sports TEXT[], -- e.g. ['Kitesurf', 'Wingfoil']
    certifications JSONB DEFAULT '[]'::jsonb -- e.g. [{"name": "IKO Level 3", "year": 2020}]
);

-- Traveler Profile
CREATE TABLE profiles_traveler (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone_number VARCHAR(50),
    
    -- Preferences for personalization
    skill_levels JSONB DEFAULT '{}'::jsonb -- e.g. {"kitesurf": "advanced", "surf": "beginner"}
);

-- 5. LISTINGS (Inventory)
-- The "Parent" table containing common fields for all products
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES users(id),
    
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE, -- SEO friendly URL
    description TEXT,
    
    type listing_type NOT NULL,
    sport_category sport_category NOT NULL,
    sport_name VARCHAR(50) NOT NULL, -- e.g. "Kitesurf"
    
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    images TEXT[], -- Array of image URLs
    
    -- Location Data
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, DRAFT, ARCHIVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. LISTING DETAILS (Child Tables)
-- Specific data for each product type

CREATE TABLE listing_activities (
    listing_id UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
    duration_minutes INT,
    difficulty_level VARCHAR(50), -- Beginner, Advanced
    group_size_max INT,
    meeting_point_text TEXT,
    included_equipment TEXT[]
);

CREATE TABLE listing_rentals (
    listing_id UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
    stock_quantity INT,
    deposit_amount DECIMAL(10, 2),
    available_sizes TEXT[], -- ["S", "M", "L", "7m", "9m"]
    brand_name VARCHAR(100)
);

CREATE TABLE listing_trips (
    listing_id UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    accommodation_details TEXT,
    itinerary JSONB -- Complex JSON structure for day-by-day schedule
);

-- 7. BOOKINGS & COMMERCE
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id),
    user_id UUID NOT NULL REFERENCES users(id), -- The Traveler
    provider_id UUID NOT NULL REFERENCES users(id), -- The School/Instructor (Denormalized for performance)
    
    status booking_status DEFAULT 'PENDING',
    
    -- Scheduling
    start_date DATE NOT NULL,
    end_date DATE, -- Only for trips/multi-day rentals
    start_time TIME, -- For specific lesson slots
    
    -- Pricing
    guests_count INT DEFAULT 1,
    base_price DECIMAL(10, 2) NOT NULL,
    service_fee DECIMAL(10, 2) NOT NULL, -- Platform revenue
    total_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    
    -- Payment Info (Stripe)
    payment_intent_id VARCHAR(255),
    payout_status VARCHAR(50) DEFAULT 'PENDING',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. REVIEWS
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE REFERENCES bookings(id), -- Verified review must have a booking
    listing_id UUID NOT NULL REFERENCES listings(id),
    provider_id UUID NOT NULL REFERENCES users(id), -- Allow querying reviews by provider
    user_id UUID NOT NULL REFERENCES users(id), -- Reviewer
    
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. INDEXES (Performance Optimization)
-- Search listings by location
CREATE INDEX idx_listings_location ON listings(country, city);
-- Search listings by sport
CREATE INDEX idx_listings_sport ON listings(sport_name);
-- Filter bookings by provider (for the Dashboard)
CREATE INDEX idx_bookings_provider ON bookings(provider_id);
-- Filter bookings by user (for My Trips)
CREATE INDEX idx_bookings_user ON bookings(user_id);
-- Quick lookups for profiles
CREATE INDEX idx_profiles_school_user ON profiles_school(user_id);
CREATE INDEX idx_profiles_instructor_user ON profiles_instructor(user_id);