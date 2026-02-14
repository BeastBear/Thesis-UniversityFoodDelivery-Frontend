import React from "react";
import ZoneManagement from "../../components/ZoneManagement";

const AdminZones = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900">
          Delivery Zones & Locations
        </h2>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <p className="text-gray-500 mb-6 text-sm">
          Define delivery zones (Polygons) and key locations/markers (Points).
          Use the toolbar on the map to draw new shapes.
        </p>
        <ZoneManagement />
      </div>
    </div>
  );
};

export default AdminZones;
