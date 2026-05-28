import { useQuery } from '@tanstack/react-query';
import { LocationData } from './useLocation';
import { fetchPrayerTimes, PrayerTimesResponse } from '../services/prayerApi';

export function usePrayerTimes(location: LocationData | null, method: number = 4, school: number = 0) {
  return useQuery<PrayerTimesResponse>({
    queryKey: ['prayerTimes', location?.latitude, location?.longitude, method, school],
    queryFn: () => {
      if (!location) throw new Error('No location');
      return fetchPrayerTimes(location.latitude, location.longitude, method, school);
    },
    enabled: !!location,
    staleTime: 1000 * 60 * 60,
    retry: 2,
  });
}
