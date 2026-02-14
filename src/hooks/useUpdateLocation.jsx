import { useEffect, useRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";

import { serverUrl } from "../App";
import { updateMyLocation } from "../redux/userSlice";

// Helper function to calculate distance in meters (Haversine formula)
function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function useUpdateLocation() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const lastSentTimeRef = useRef(null);
  const lastSentLatRef = useRef(null);
  const lastSentLonRef = useRef(null);
  const isSendingRef = useRef(false);
  const permissionDeniedRef = useRef(false);

  useEffect(() => {
    if (!userData?._id) {
      return;
    }

    if (permissionDeniedRef.current) {
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      async (pos) => {
        if (permissionDeniedRef.current) {
          return;
        }

        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // Always update Redux state immediately (for UI/map display)
        dispatch(updateMyLocation({ lat, lon }));

        // Skip if already sending a request
        if (isSendingRef.current) {
          return;
        }

        // Only send to backend every 60 seconds (or if moved significantly >50m)
        const now = Date.now();
        const timeSinceLastSent =
          lastSentTimeRef.current === null
            ? Infinity
            : now - lastSentTimeRef.current;

        // Calculate distance from last sent location
        const distanceMoved =
          lastSentLatRef.current === null || lastSentLonRef.current === null
            ? Infinity
            : calculateDistanceInMeters(
                lastSentLatRef.current,
                lastSentLonRef.current,
                lat,
                lon,
              );

        // Send to backend if:
        // 1. Never sent before, OR
        // 2. It's been 60+ seconds since last send, OR
        // 3. Moved more than 50 meters
        const shouldSendToBackend =
          lastSentTimeRef.current === null ||
          timeSinceLastSent >= 60000 ||
          distanceMoved > 50;

        // Debug log (remove after testing)
        if (shouldSendToBackend) {

        }

        if (shouldSendToBackend) {
          // Set flag to prevent concurrent requests
          isSendingRef.current = true;

          try {
            const response = await axios.post(
              `${serverUrl}/api/user/update-location`,
              { lat, lng: lon },
              { withCredentials: true },
            );
            const address = response.data?.address;
            if (address) {
              dispatch(updateMyLocation({ lat, lon, address }));
            }
            // Update refs after successful send - MUST happen before clearing flag
            lastSentTimeRef.current = now;
            lastSentLatRef.current = lat;
            lastSentLonRef.current = lon;

          } catch (error) {

          } finally {
            // Always clear the flag
            isSendingRef.current = false;
          }
        }
      },
      (error) => {
        // Handle geolocation errors gracefully
        // Error code 3 = TIMEOUT (common when GPS is acquiring fix)
        // Error code 1 = PERMISSION_DENIED
        // Error code 2 = POSITION_UNAVAILABLE
        if (error.code === 3) {
          // Timeout errors are expected when GPS is acquiring fix
          // watchPosition will continue trying, so we don't need to log this
          // console.warn("Geolocation timeout - GPS acquiring fix...");
        } else if (error.code === 1) {
          permissionDeniedRef.current = true;

        } else {

        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000, // Accept cached position up to 10 seconds old
        timeout: 30000, // Increase timeout to 30 seconds for better reliability
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watcher);
    };
  }, [dispatch, userData?._id]);
}

export default useUpdateLocation;
