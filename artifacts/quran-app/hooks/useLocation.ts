import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface LocationState {
  location: LocationData | null;
  error: string | null;
  loading: boolean;
  permissionGranted: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    loading: true,
    permissionGranted: false,
  });

  const fetchLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (Platform.OS === 'web') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        const { latitude, longitude } = position.coords;
        const cityData = await reverseGeocode(latitude, longitude);
        setState({
          location: { latitude, longitude, ...cityData },
          error: null,
          loading: false,
          permissionGranted: true,
        });
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({
          location: { latitude: 24.7136, longitude: 46.6753, city: 'الرياض', country: 'المملكة العربية السعودية' },
          error: null,
          loading: false,
          permissionGranted: false,
        });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = loc.coords;
      const cityData = await reverseGeocode(latitude, longitude);

      setState({
        location: { latitude, longitude, ...cityData },
        error: null,
        loading: false,
        permissionGranted: true,
      });
    } catch (err) {
      setState({
        location: { latitude: 24.7136, longitude: 46.6753, city: 'الرياض', country: 'المملكة العربية السعودية' },
        error: 'تعذر تحديد الموقع، تم استخدام الموقع الافتراضي',
        loading: false,
        permissionGranted: false,
      });
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { ...state, refresh: fetchLocation };
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city?: string; country?: string }> {
  try {
    if (Platform.OS !== 'web') {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (place) {
        return {
          city: place.city || place.subregion || undefined,
          country: place.country || undefined,
        };
      }
    } else {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`
      );
      const data = await response.json();
      return {
        city: data.address?.city || data.address?.town || data.address?.village,
        country: data.address?.country,
      };
    }
  } catch {}
  return {};
}
