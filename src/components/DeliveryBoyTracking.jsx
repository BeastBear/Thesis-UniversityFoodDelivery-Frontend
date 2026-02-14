import React, { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";


const delivererIcon = new L.Icon({
  iconUrl: "/scooter.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const customerIcon = new L.Icon({
  iconUrl: "/house.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function Routing({ from, to }) {
  const map = useMap();

  useEffect(() => {
    if (!from || !to) return undefined;

    // Configure routing service - can be overridden via environment variable
    // For production, set up your own OSRM server or use a paid routing service
    const routingServiceUrl =
      import.meta.env.VITE_ROUTING_SERVICE_URL ||
      "https://router.project-osrm.org/route/v1";

    const routingControl = L.Routing.control({
      router: L.Routing.osrmv1({
        serviceUrl: routingServiceUrl,
        profile: "driving",
      }),
      waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
      lineOptions: { styles: [{ color: "green", weight: 4 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null,
    }).addTo(map);

    const container = routingControl.getContainer();
    if (container) container.style.display = "none";

    return () => {
      if (routingControl && map) {
        try {
          map.removeControl(routingControl);
        } catch (err) {}
      }
    };
  }, [map, from, to]);

  return null;
}

function DeliveryBoyTracking({ data }) {
  const delivererLat = data?.delivererLocation?.lat;
  const delivererLon = data?.delivererLocation?.lon;
  const customerLat = data?.customerLocation?.lat;
  const customerLon = data?.customerLocation?.lon;

  if (
    delivererLat == null ||
    delivererLon == null ||
    customerLat == null ||
    customerLon == null
  ) {
    return (
      <div className="w-full h-[400px] mt-3 rounded-3xl overflow-hidden shadow-lg border-none flex items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">
          Location data unavailable for this order.
        </p>
      </div>
    );
  }

  const center = [delivererLat, delivererLon];

  return (
    <div className="w-full h-[400px] mt-3 rounded-3xl overflow-hidden shadow-lg border-none">
      <MapContainer className="w-full h-full" center={center} zoom={16}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[delivererLat, delivererLon]} icon={delivererIcon}>
          <Popup>Deliverer</Popup>
        </Marker>
        <Marker position={[customerLat, customerLon]} icon={customerIcon}>
          <Popup>Customer</Popup>
        </Marker>

        <Routing
          from={[delivererLat, delivererLon]}
          to={[customerLat, customerLon]}
        />
      </MapContainer>
    </div>
  );
}

export default DeliveryBoyTracking;
