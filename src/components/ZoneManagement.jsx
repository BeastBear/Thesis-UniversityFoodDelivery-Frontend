import React, { useState, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  Marker,
  Popup,
  Polygon,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import * as turf from "@turf/turf";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../App";

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

const ZoneManagement = () => {
  const [zones, setZones] = useState([]);
  const [markers, setMarkers] = useState([]);
  const mapRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/zone`, {
        withCredentials: true,
      });

      const fetchedZones = [];
      const fetchedMarkers = [];

      res.data.forEach((item) => {
        if (item.type === "Polygon") {
          fetchedZones.push({
            id: item._id,
            name: item.name,
            type: "Polygon",
            coordinates: item.coordinates,
            geoJSON: {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: item.coordinates,
              },
            },
          });
        } else if (item.type === "Point") {
          fetchedMarkers.push({
            id: item._id,
            name: item.name,
            type: "Point",
            coordinates: item.coordinates,
            geoJSON: {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: item.coordinates,
              },
            },
          });
        }
      });

      setZones(fetchedZones);
      setMarkers(fetchedMarkers);
    } catch (error) {
      toast.error("Failed to load zones");
    }
  };

  const focusZone = (z) => {
    if (!mapRef.current || !z?.coordinates?.[0]?.length) return;
    try {
      const latlngs = z.coordinates[0].map((coord) => [coord[1], coord[0]]);
      const bounds = L.latLngBounds(latlngs);
      mapRef.current.flyToBounds(bounds, { padding: [30, 30] });
      setSelectedId(z.id);
    } catch (e) {}
  };

  const focusMarker = (m) => {
    if (!mapRef.current || !m?.coordinates?.length) return;
    try {
      const lat = m.coordinates[1];
      const lng = m.coordinates[0];
      mapRef.current.setView([lat, lng], 16, { animate: true });
      setSelectedId(m.id);
    } catch (e) {}
  };

  const saveZone = async (newZone) => {
    try {
      const res = await axios.post(
        `${serverUrl}/api/zone`,
        {
          name: newZone.name,
          type: newZone.type,
          coordinates: newZone.coordinates,
          description: "Created via Admin Dashboard",
        },
        { withCredentials: true },
      );
      toast.success(`${newZone.type} saved successfully!`);
      // Update state with the returned object (including DB _id)
      if (newZone.type === "Polygon") {
        setZones((prev) => [...prev, { ...newZone, id: res.data._id }]);
      } else {
        setMarkers((prev) => [...prev, { ...newZone, id: res.data._id }]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save zone");
    }
  };

  const handleCreated = (e) => {
    const { layerType, layer } = e;

    if (layerType === "polygon") {
      const geoJSON = layer.toGeoJSON();
      const name = window.prompt("Enter name for this zone:");

      if (!name) {
        layer.remove();
        return;
      }

      const newZone = {
        name: name,
        type: "Polygon",
        coordinates: geoJSON.geometry.coordinates,
        geoJSON: geoJSON,
      };

      // Optimistically add to map (Leaflet draw does this), but we need to save to DB
      // We don't add to state here immediately to avoid dupes if we fetch,
      // but let's just rely on fetch or manual update.
      // Actually, since we want to persist it:
      saveZone(newZone);
    } else if (layerType === "marker") {
      const geoJSON = layer.toGeoJSON();
      const name = window.prompt("Enter name for this marker:");

      if (name) {
        const newMarker = {
          name: name,
          type: "Point",
          coordinates: geoJSON.geometry.coordinates,
          geoJSON: geoJSON,
        };
        saveZone(newMarker);
      } else {
        layer.remove(); // Remove if no name provided
      }
    }
  };

  const handleDeleteZone = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      await axios.delete(`${serverUrl}/api/zone/${id}`, {
        withCredentials: true,
      });
      toast.success("Deleted successfully");
      if (type === "Polygon") {
        setZones(zones.filter((z) => z.id !== id));
      } else {
        setMarkers(markers.filter((m) => m.id !== id));
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleEdited = (e) => {
    // Logic to update state based on edits would go here
    // You would iterate through e.layers to find updated layers
  };

  const handleDeleted = (e) => {
    // Leaflet draw handles UI removal, but we need to sync with DB if we want full sync
    // For now, let's assume we rely on the custom delete buttons in the debug panel
    // or we can hook into this event.
    // However, e.layers gives us the Leaflet layers, linking them back to DB IDs is tricky
    // without custom properties on layers.
  };

  // Validation Utility (Turf.js)
  const isPointInZone = (userLat, userLng, zoneGeoJSON) => {
    // Leaflet: [lat, lng], Turf: [lng, lat]
    // User coordinates for Turf
    const pt = turf.point([userLng, userLat]);

    // Ensure polygon is valid for Turf
    if (zoneGeoJSON.geometry.type !== "Polygon") return false;

    return turf.booleanPointInPolygon(pt, zoneGeoJSON);
  };

  const testPointInZone = () => {
    const lat = parseFloat(prompt("Enter Test Latitude:"));
    const lng = parseFloat(prompt("Enter Test Longitude:"));

    if (isNaN(lat) || isNaN(lng)) return;

    let inZone = false;
    let zoneName = "";

    zones.forEach((zone) => {
      if (isPointInZone(lat, lng, zone.geoJSON)) {
        inZone = true;
        zoneName = zone.name || zone.id;
      }
    });

    if (inZone) {
      toast.success(`Point is INSIDE zone: ${zoneName}`);
    } else {
      toast.error("Point is OUTSIDE all zones");
    }
  };

  return (
    <div className="w-full h-[600px] rounded-3xl shadow-lg border-none overflow-hidden relative flex">
      <div className="w-72 border-r border-gray-200 bg-white p-4 overflow-y-auto">
        <div className="font-extrabold text-gray-900 mb-3">Zones</div>

        <div className="space-y-2">
          {zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => focusZone(z)}
              className={`w-full text-left px-3 py-2 rounded-2xl border-none text-sm font-bold transition-colors shadow-sm ${
                selectedId === z.id
                  ? "bg-primary-purple/10 text-primary-purple shadow-md"
                  : "bg-white text-gray-700 hover:bg-white"
              }`}>
              {z.name}
            </button>
          ))}
          {zones.length === 0 && (
            <div className="text-sm text-gray-400">No zones yet.</div>
          )}
        </div>

        <div className="font-extrabold text-gray-900 mt-6 mb-3">Markers</div>
        <div className="space-y-2">
          {markers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => focusMarker(m)}
              className={`w-full text-left px-3 py-2 rounded-2xl border-none text-sm font-bold transition-colors shadow-sm ${
                selectedId === m.id
                  ? "bg-primary-purple/10 text-primary-purple shadow-md"
                  : "bg-white text-gray-700 hover:bg-white"
              }`}>
              {m.name}
            </button>
          ))}
          {markers.length === 0 && (
            <div className="text-sm text-gray-400">No markers yet.</div>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={[13.7563, 100.5018]} // Default to Bangkok
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Render existing zones from DB */}
          {zones.map((zone) => (
            <Polygon
              key={zone.id}
              positions={zone.coordinates[0].map((coord) => [
                coord[1],
                coord[0],
              ])} // GeoJSON [lng,lat] -> Leaflet [lat,lng]
              pathOptions={{ color: "blue" }}>
              <Popup>
                <div className="text-center">
                  <strong className="block mb-1">{zone.name}</strong>
                  <button
                    onClick={() => handleDeleteZone(zone.id, "Polygon")}
                    className="text-red-500 text-xs underline">
                    Delete
                  </button>
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* Render existing markers from DB */}
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.coordinates[1], marker.coordinates[0]]} // GeoJSON [lng,lat] -> Leaflet [lat,lng]
            >
              <Popup>
                <div className="text-center">
                  <strong className="block mb-1">{marker.name}</strong>
                  <button
                    onClick={() => handleDeleteZone(marker.id, "Point")}
                    className="text-red-500 text-xs underline">
                    Delete
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          <FeatureGroup>
            <EditControl
              position="topright"
              onCreated={handleCreated}
              onEdited={handleEdited}
              onDeleted={handleDeleted}
              draw={{
                rectangle: false,
                circle: false,
                circlemarker: false,
                polyline: false,
                polygon: {
                  allowIntersection: false,
                  drawError: {
                    color: "#e1e100",
                    message: "<strong>Oh snap!<strong> you can't draw that!",
                  },
                  shapeOptions: {
                    color: "#FF6B00",
                  },
                },
                marker: true,
              }}
            />
          </FeatureGroup>
        </MapContainer>

        <div className="absolute bottom-4 left-4 z-1000 bg-white p-4 rounded-3xl shadow-lg border-none">
          <h3 className="font-bold mb-2">Zone Debugger</h3>
          <p className="text-sm mb-2">
            Zones: {zones.length} | Markers: {markers.length}
          </p>
          <button
            onClick={testPointInZone}
            className="bg-primary-purple text-white px-3 py-1 rounded-2xl text-sm font-bold hover:bg-primary-purple/90 transition-colors">
            Test Point in Zone
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoneManagement;
