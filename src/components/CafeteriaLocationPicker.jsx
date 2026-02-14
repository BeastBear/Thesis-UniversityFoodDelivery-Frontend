import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Polygon,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const LocationMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position ? <Marker position={position} /> : null;
};

const CafeteriaLocationPicker = ({
  initialLat,
  initialLng,
  onLocationSelect,
  selectedZone,
}) => {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition({ lat: initialLat, lng: initialLng });
    } else {
      // Default to Bangkok center if no initial position
      setPosition({ lat: 13.7563, lng: 100.5018 });
    }
  }, [initialLat, initialLng]);

  useEffect(() => {
    if (
      selectedZone &&
      selectedZone.coordinates &&
      selectedZone.coordinates.length > 0
    ) {
      // Calculate centroid of the polygon
      // Assuming Polygon type with structure [[[lng, lat], ...]]
      const ring = selectedZone.coordinates[0];
      if (ring && ring.length > 0) {
        let sumLat = 0;
        let sumLng = 0;
        ring.forEach((coord) => {
          sumLng += coord[0];
          sumLat += coord[1];
        });
        const avgLat = sumLat / ring.length;
        const avgLng = sumLng / ring.length;

        const newPos = { lat: avgLat, lng: avgLng };
        setPosition(newPos);
        onLocationSelect(avgLat, avgLng);
      }
    }
  }, [selectedZone]);

  const handleSetPosition = (latlng) => {
    setPosition(latlng);
    onLocationSelect(latlng.lat, latlng.lng);
  };

  // Determine center of map
  const center =
    initialLat && initialLng ? [initialLat, initialLng] : [13.7563, 100.5018];

  return (
    <div className="w-full h-[300px] rounded-3xl overflow-hidden border-none shadow-lg">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render Selected Zone */}
        {selectedZone && selectedZone.type === "Polygon" && (
          <Polygon
            positions={selectedZone.coordinates[0].map((coord) => [
              coord[1],
              coord[0],
            ])}
            pathOptions={{ color: "#3B82F6", fillOpacity: 0.1 }}>
            <Popup>{selectedZone.name}</Popup>
          </Polygon>
        )}

        <LocationMarker position={position} setPosition={handleSetPosition} />
      </MapContainer>
    </div>
  );
};

export default CafeteriaLocationPicker;
