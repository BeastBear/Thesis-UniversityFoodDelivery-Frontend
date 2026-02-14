import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaUtensils, FaCamera } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../../App";
import { toast } from "react-toastify";

const AdminCafeterias = () => {
  const [settings, setSettings] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newCafeteriaName, setNewCafeteriaName] = useState("");
  const [newCafeteriaFile, setNewCafeteriaFile] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchZones();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/admin/settings`, {
        withCredentials: true,
      });
      setSettings(res.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load settings");
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/zone`, {
        withCredentials: true,
      });
      setZones(Array.isArray(res.data) ? res.data : []);
    } catch (error) {}
  };

  const handleAddCafeteria = async () => {
    if (!newCafeteriaName.trim()) return;
    if (!settings) return;
    if (creating) return;

    try {
      setCreating(true);
      const imageUrl = newCafeteriaFile
        ? await handleImageUpload(newCafeteriaFile)
        : "";
      const updatedCafeterias = [
        ...(settings.cafeteriaSettings || []),
        {
          name: newCafeteriaName,
          isOpen: true,
          closeReason: "",
          zoneId: null,
          image: imageUrl || "",
        },
      ];

      const res = await axios.put(
        `${serverUrl}/api/admin/settings`,
        { cafeteriaSettings: updatedCafeterias },
        { withCredentials: true },
      );
      setSettings(res.data);
      setNewCafeteriaName("");
      setNewCafeteriaFile(null);
      setAddOpen(false);
      toast.success("Cafeteria added successfully");
    } catch (error) {
      toast.error("Failed to add cafeteria");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCafeteria = async (indexToDelete) => {
    if (!window.confirm("Are you sure you want to delete this cafeteria?"))
      return;
    try {
      const updatedCafeterias = settings.cafeteriaSettings.filter(
        (_, index) => index !== indexToDelete,
      );

      const res = await axios.put(
        `${serverUrl}/api/admin/settings`,
        { cafeteriaSettings: updatedCafeterias },
        { withCredentials: true },
      );
      setSettings(res.data);
      toast.success("Cafeteria deleted");
    } catch (error) {
      toast.error("Failed to delete cafeteria");
    }
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await axios.post(
        `${serverUrl}/api/admin/upload-image`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return res.data.imageUrl;
    } catch (error) {
      toast.error("Image upload failed");
      return null;
    }
  };

  const handleCafeteriaImageChange = async (index, file) => {
    if (!file) return;
    const imageUrl = await handleImageUpload(file);
    if (!imageUrl) return;

    const updatedCafeterias = [...settings.cafeteriaSettings];
    updatedCafeterias[index] = { ...updatedCafeterias[index], image: imageUrl };

    try {
      const res = await axios.put(
        `${serverUrl}/api/admin/settings`,
        { cafeteriaSettings: updatedCafeterias },
        { withCredentials: true },
      );
      setSettings(res.data);
      toast.success("Cafeteria image updated");
    } catch (error) {
      toast.error("Failed to save image");
    }
  };

  const handleCafeteriaZoneChange = async (index, zoneId) => {
    const updatedCafeterias = [...(settings?.cafeteriaSettings || [])];
    updatedCafeterias[index] = {
      ...updatedCafeterias[index],
      zoneId: zoneId || null,
    };

    try {
      const res = await axios.put(
        `${serverUrl}/api/admin/settings`,
        { cafeteriaSettings: updatedCafeterias },
        { withCredentials: true },
      );
      setSettings(res.data);
      toast.success("Cafeteria zone updated");
    } catch (error) {
      toast.error("Failed to save cafeteria zone");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true">
          <button
            type="button"
            onClick={() => {
              if (creating) return;
              setAddOpen(false);
              setNewCafeteriaName("");
              setNewCafeteriaFile(null);
            }}
            className="absolute inset-0 bg-black/40"
            aria-label="Close add cafeteria"
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Create Cafeteria
                </div>
                <div className="text-xl font-extrabold text-gray-900 mt-1">
                  New Cafeteria
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Add a cafeteria name and cover image.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (creating) return;
                  setAddOpen(false);
                  setNewCafeteriaName("");
                  setNewCafeteriaFile(null);
                }}
                className="shrink-0 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-colors">
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cafeteria Name
                </label>
                <input
                  type="text"
                  placeholder="Cafeteria Name (e.g. Science Cafeteria)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  value={newCafeteriaName}
                  onChange={(e) => setNewCafeteriaName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm"
                  onChange={(e) =>
                    setNewCafeteriaFile(e.target.files?.[0] || null)
                  }
                />
                <p className="text-xs text-gray-400 mt-2">
                  Optional. You can change it later.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={creating}
                onClick={() => {
                  if (creating) return;
                  setAddOpen(false);
                  setNewCafeteriaName("");
                  setNewCafeteriaFile(null);
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-60">
                Cancel
              </button>
              <button
                type="button"
                disabled={creating || !newCafeteriaName.trim()}
                onClick={handleAddCafeteria}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-60 disabled:active:scale-100">
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900">
          Cafeteria Management
        </h2>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2">
          <FaPlus /> Add Cafeteria
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {settings?.cafeteriaSettings?.map((cafeteria, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative group hover:shadow-md transition-all">
            <div className="h-28 bg-gray-100 rounded-xl overflow-hidden relative">
              {cafeteria.image ? (
                <img
                  src={cafeteria.image}
                  alt={cafeteria.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                  <FaUtensils size={32} />
                  <span className="text-xs font-bold mt-2">No Image</span>
                </div>
              )}

              <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold gap-2">
                <FaCamera /> Change Photo
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) =>
                    handleCafeteriaImageChange(index, e.target.files[0])
                  }
                />
              </label>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-base text-gray-900">
                  {cafeteria.name}
                </h4>
                <span
                  className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    cafeteria.isOpen
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}>
                  {cafeteria.isOpen ? "Open" : "Closed"}
                </span>
              </div>
              <button
                onClick={() => handleDeleteCafeteria(index)}
                className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                title="Delete Cafeteria">
                <FaTrash size={12} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Zone
              </div>
              <select
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={
                  typeof cafeteria.zoneId === "object" && cafeteria.zoneId
                    ? cafeteria.zoneId._id || ""
                    : cafeteria.zoneId || ""
                }
                onChange={(e) =>
                  handleCafeteriaZoneChange(index, e.target.value)
                }>
                <option value="">No Zone</option>
                {zones.map((z) => (
                  <option key={z._id} value={z._id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {(!settings?.cafeteriaSettings ||
          settings.cafeteriaSettings.length === 0) && (
          <div className="col-span-full text-center text-gray-400 py-12">
            No cafeterias configured. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCafeterias;
