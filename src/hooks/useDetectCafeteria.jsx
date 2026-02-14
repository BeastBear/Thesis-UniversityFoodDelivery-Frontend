import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrentCafeteria } from "../redux/userSlice";

// Cafeteria locations mapping (same as in CreateEditShop)
const CAFETERIA_LOCATIONS = {
  "Cafeteria 1": { lat: 13.8210901380911, lon: 100.51474385844706 },
  "Cafeteria 2": { lat: 13.819953296303654, lon: 100.51459958202035 },
  "Cafeteria 3": { lat: 13.8210901380911, lon: 100.51474385844706 },
  "Cafeteria 4": { lat: 13.8210901380911, lon: 100.51474385844706 },
  "Cafeteria 5": { lat: 13.8210901380911, lon: 100.51474385844706 },
};

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function useDetectCafeteria() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Disable auto-detection - user must manually select cafeteria
    // This ensures users always choose their cafeteria on login
    // Commented out to require manual selection:
    
    // Get user's location and find nearest cafeteria
    // if (navigator.geolocation) {
    //   navigator.geolocation.getCurrentPosition(
    //     (position) => {
    //       const userLat = position.coords.latitude;
    //       const userLon = position.coords.longitude;

    //       // Find the nearest cafeteria
    //       let nearestCafeteria = null;
    //       let minDistance = Infinity;

    //       Object.entries(CAFETERIA_LOCATIONS).forEach(([cafeteria, location]) => {
    //         const distance = calculateDistance(
    //           userLat,
    //           userLon,
    //           location.lat,
    //           location.lon
    //         );
    //         if (distance < minDistance) {
    //           minDistance = distance;
    //           nearestCafeteria = cafeteria;
    //         }
    //       });

    //       // Set the nearest cafeteria if within reasonable distance (e.g., 5km)
    //       if (nearestCafeteria && minDistance < 5) {
    //         dispatch(setCurrentCafeteria(nearestCafeteria));
    //       }
    //     },
    //     (error) => {
    //       console.error("Error getting location:", error);
    //       // Optionally set a default cafeteria
    //       // dispatch(setCurrentCafeteria("Cafeteria 1"));
    //     }
    //   );
    // }
  }, [dispatch]);
}

export default useDetectCafeteria;

