import { useState, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { DELIVERY_CONFIG } from "../config/constants";

// Default fallbacks for backward compatibility and initial load
const DEFAULT_CAFETERIAS = [
  "Cafeteria 1",
  "Cafeteria 2",
  "Cafeteria 3",
  "Cafeteria 4",
  "Cafeteria 5",
];

const DEFAULT_LOCATIONS = {
  "Cafeteria 1": { lat: 13.8210901380911, lon: 100.51474385844706 },
  "Cafeteria 2": { lat: 13.819953296303654, lon: 100.51459958202035 },
  "Cafeteria 3": { lat: 13.8210901380911, lon: 100.51474385844706 },
  "Cafeteria 4": { lat: 13.8210901380911, lon: 100.51474385844706 },
  "Cafeteria 5": { lat: 13.8210901380911, lon: 100.51474385844706 },
};

const useCafeterias = () => {
  const [cafeterias, setCafeterias] = useState(DEFAULT_CAFETERIAS);
  const [cafeteriaLocations, setCafeteriaLocations] =
    useState(DEFAULT_LOCATIONS);
  const [cafeteriaImages, setCafeteriaImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(0);
  const [pricePerKm, setPricePerKm] = useState(
    DELIVERY_CONFIG.NORMAL_HOUR_RATE,
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/settings?t=${new Date().getTime()}`,
        );
        const settings = res.data;

        if (
          settings &&
          settings.cafeteriaSettings &&
          settings.cafeteriaSettings.length > 0
        ) {
          // Extract names
          const names = settings.cafeteriaSettings
            .filter((c) => c.isOpen !== false) // Optional: filter closed ones? Maybe show all but indicate status?
            .map((c) => c.name);

          // Build location map and image map
          const locationMap = { ...DEFAULT_LOCATIONS }; // Keep defaults for backward compat
          const imageMap = {};

          settings.cafeteriaSettings.forEach((c) => {
            if (c.location && c.location.lat && c.location.lng) {
              locationMap[c.name] = {
                lat: c.location.lat,
                lon: c.location.lng, // Note: frontend uses 'lon' in some places, backend 'lng'
              };
            }
            if (c.image) {
              if (c.image.startsWith("/")) {
                imageMap[c.name] = `${serverUrl}${c.image}`;
              } else {
                imageMap[c.name] = c.image;
              }
            }
          });

          // If we have dynamic cafeterias, prefer them.
          // But we might want to ensure the default "Cafeteria 1-5" are available if not explicitly deleted?
          // The admin dashboard allows adding/deleting. So if the user deleted them, they should be gone.
          // So we use the API response as the source of truth.
          setCafeterias(names);
          setCafeteriaLocations(locationMap);
          setCafeteriaImages(imageMap);
          setCafeteriaImages(imageMap);
        }

        // Extract fee settings if available
        if (settings) {
          setBaseDeliveryFee(settings.baseDeliveryFee || 0);
          setPricePerKm(
            settings.pricePerKm !== undefined && settings.pricePerKm !== null
              ? settings.pricePerKm
              : DELIVERY_CONFIG.NORMAL_HOUR_RATE,
          );
        }
      } catch (error) {
        // Fallback to defaults is already set
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return {
    cafeterias,
    cafeteriaLocations,
    cafeteriaImages,
    loading,
    baseDeliveryFee,
    pricePerKm,
  };
};

export default useCafeterias;
