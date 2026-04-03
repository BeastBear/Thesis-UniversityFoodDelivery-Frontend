import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icons
const scooterIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/713/713311.png", // Example scooter icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const homeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/619/619034.png", // Example home icon
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const shopIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1076/1076323.png", // Example shop icon
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// Ensure L is globally available for leaflet-routing-machine
window.L = L;

function Routing({ from, to }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!from || !to) return;
    if (isNaN(from[0]) || isNaN(from[1]) || isNaN(to[0]) || isNaN(to[1])) {
      console.warn("Invalid coordinates for routing:", { from, to });
      return;
    }

    console.log("Routing from", from, "to", to);

    // Remove previous control
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {
        console.error("Error removing routing control:", e);
      }
    }

    const routingServiceUrl =
      import.meta.env.VITE_ROUTING_SERVICE_URL ||
      "https://router.project-osrm.org/route/v1";

    try {
      const routingControl = L.Routing.control({
        router: L.Routing.osrmv1({
          serviceUrl: routingServiceUrl,
          profile: "driving",
          useHints: false,
        }),
        waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
        lineOptions: {
          styles: [
            { color: "#3B82F6", weight: 6, opacity: 0.8 }, // Tailwind Blue-500
            { color: "white", weight: 2, opacity: 0.5 },
          ],
        },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        createMarker: () => null,
        show: false, // Hide text instructions
      }).addTo(map);

      routingControlRef.current = routingControl;
    } catch (err) {
      console.error("Leaflet Routing Machine error:", err);
    }

    return () => {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {}
      }
    };
  }, [map, from, to]);

  // Handle fit bounds
  useEffect(() => {
    if (from && to) {
      const bounds = L.latLngBounds([from, to]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, from, to]);

  return null;
}

const DeliveryMap = ({
  delivererLocation,
  targetLocation,
  targetType = "customer",
}) => {
  // Default center if no location provided
  const center = delivererLocation
    ? [delivererLocation.lat, delivererLocation.lon]
    : [13.7563, 100.5018]; // Bangkok default

  const delivererMarkerRef = useRef(null);

  // Update marker position dynamically
  useEffect(() => {
    if (delivererLocation && delivererMarkerRef.current) {
      delivererMarkerRef.current.setLatLng([
        delivererLocation.lat,
        delivererLocation.lon,
      ]);
    }
  }, [delivererLocation]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Delivery Boy Marker */}
        {delivererLocation && (
          <Marker
            ref={delivererMarkerRef}
            position={[delivererLocation.lat, delivererLocation.lon]}
            icon={scooterIcon}>
            <Popup>You</Popup>
          </Marker>
        )}

        {/* Target Marker (Shop or Customer) */}
        {targetLocation && (
          <Marker
            position={[targetLocation.lat, targetLocation.lon]}
            icon={targetType === "shop" ? shopIcon : homeIcon}>
            <Popup>
              {targetType === "shop" ? "Pick up here" : "Deliver here"}
            </Popup>
          </Marker>
        )}

        {/* Routing */}
        {delivererLocation && targetLocation && (
          <Routing
            from={[delivererLocation.lat, delivererLocation.lon]}
            to={[targetLocation.lat, targetLocation.lon]}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default DeliveryMap;
