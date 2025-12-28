import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProviderProfile, getListings } from '../services/dataService';
import { ProviderProfile, Listing } from '../types';
import SchoolProfile from '../components/provider/SchoolProfile';
import InstructorProfile from '../components/provider/InstructorProfile';

const ProviderProfilePage: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      if (!providerId) {
        setLoading(false);
        return;
      }

      const data = await getProviderProfile(providerId);
      setProfile(data);

      let fetchedListings: Listing[] = [];

      console.log('FETCH LISTINGS', {
        profileType: data.type,
        instructorId: data.id,
        merchantId: (data as any)?.merchant?.id,
      });
      if (data.type === 'FREELANCER') {
        // Instructor profile → fetch ONLY instructor listings
        fetchedListings = await getListings({ instructorId: data.id });
      } else {
        // School profile → fetch ONLY school listings by ProviderProfile id (UUID)
        // Backend expects `?provider=<provider_profile_id>` and resolves owner from that profile.
        fetchedListings = await getListings({ providerId: data.id });
      }

      setListings(fetchedListings);
      
      setLoading(false);
    };
    fetch();
  }, [providerId]);

  if (loading) return <div className="min-h-screen flex justify-center items-center">Loading...</div>;
  if (!profile) return <div className="min-h-screen flex justify-center items-center">Provider not found</div>;

  // Render based on type
  if (profile.type === 'FREELANCER' || (profile as any).type === 'FREELANCER') { 
      return <InstructorProfile profile={profile} listings={listings} />;
  }

  return <SchoolProfile profile={profile} listings={listings} />;
};

export default ProviderProfilePage;