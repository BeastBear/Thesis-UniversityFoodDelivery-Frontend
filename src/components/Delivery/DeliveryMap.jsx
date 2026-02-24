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

function Routing({ from, to }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!from || !to) return;

    // Remove previous control
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    const routingServiceUrl =
      import.meta.env.VITE_ROUTING_SERVICE_URL ||
      "https://routing.openstreetmap.de/routed-car/route/v1";

    const routingControl = L.Routing.control({
      router: L.Routing.osrmv1({
        serviceUrl: routingServiceUrl,
        profile: "driving",
        useHints: false,
      }),
      waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
      lineOptions: {
        styles: [{ color: "#0066ff", weight: 6, opacity: 0.8 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null,
      show: false, // Hide text instructions
    }).addTo(map);

    routingControlRef.current = routingControl;

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
  deliveryBoyLocation,
  targetLocation,
  targetType = "customer",
}) => {
  // Default center if no location provided
  const center = deliveryBoyLocation
    ? [deliveryBoyLocation.lat, deliveryBoyLocation.lon]
    : [13.7563, 100.5018]; // Bangkok default

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
        {deliveryBoyLocation && (
          <Marker
            position={[deliveryBoyLocation.lat, deliveryBoyLocation.lon]}
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
        {deliveryBoyLocation && targetLocation && (
          <Routing
            from={[deliveryBoyLocation.lat, deliveryBoyLocation.lon]}
            to={[targetLocation.lat, targetLocation.lon]}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default DeliveryMap;
