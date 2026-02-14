import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { IoIosArrowRoundBack, IoMdClose } from "react-icons/io";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { TbCurrentLocation } from "react-icons/tb";
import { useSelector, useDispatch } from "react-redux";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { setLocation, setAddress } from "../redux/mapSlice";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import PrimaryButton from "../components/ui/PrimaryButton";

// Fix leaflet marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function RecenterMap({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location.lat && location.lon) {
      map.setView([location.lat, location.lon], 16, { animate: true });
    }
  }, [location, map]);
  return null;
}

function SavedAddresses() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const locationState = useLocation();
  const apikey = import.meta.env.VITE_GEOAPIKEY;

  // Use Redux state instead of local mock data
  const addresses = userData?.savedAddresses || [];

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Check for pre-filled edit ID from navigation state
  useEffect(() => {
    if (locationState.state?.editId) {
      const addr = addresses.find((a) => a._id === locationState.state.editId);
      if (addr) {
        handleEdit(addr);
      }
      // Clear state to prevent reopening on reload?
      // Ideally we should, but navigating back usually clears it or we can just let it be.
    }
  }, [locationState.state, addresses]); // Dependency on addresses ensures it runs after data loads if needed

  const [formData, setFormData] = useState({
    label: "",
    address: "",
    lat: 13.7563,
    lon: 100.5018,
    isDefault: false,
    contactName: "",
    contactNumber: "",
    note: "",
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        const res = await axios.delete(
          `${serverUrl}/api/user/delete-address/${id}`,
          { withCredentials: true },
        );
        // Update Redux state with the returned updated address list
        const updatedUser = { ...userData, savedAddresses: res.data };
        dispatch(setUserData(updatedUser));
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to delete address";
        toast.error(msg);
      }
    }
  };

  const applyAddressToApp = (addr) => {
    const lat = addr?.location?.lat ?? addr?.lat;
    const lon = addr?.location?.lon ?? addr?.lon;
    if (typeof lat === "number" && typeof lon === "number") {
      dispatch(setLocation({ lat, lon }));
    }
    if (addr?.address) {
      dispatch(setAddress(addr.address));
    }
    toast.success("Default location updated");
  };

  const handleSetDefault = async (addr) => {
    try {
      const payload = {
        label: addr.label,
        address: addr.address,
        location: {
          lat: addr?.location?.lat ?? addr?.lat,
          lon: addr?.location?.lon ?? addr?.lon,
        },
        contactName: addr.contactName,
        contactNumber: addr.contactNumber,
        note: addr.note,
        isDefault: true,
      };

      const res = await axios.put(
        `${serverUrl}/api/user/update-address/${addr._id}`,
        payload,
        { withCredentials: true },
      );

      const updatedUser = { ...userData, savedAddresses: res.data };
      dispatch(setUserData(updatedUser));
      applyAddressToApp(addr);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to set default address";
      toast.error(msg);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      label: "",
      address: "",
      lat: 13.7563, // Default Bangkok
      lon: 100.5018,
      isDefault: false,
      contactName: userData?.fullName || "",
      contactNumber: userData?.mobile || "",
      note: "",
    });
    // Try to get current location for new add
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }));
        getAddressByLatLng(pos.coords.latitude, pos.coords.longitude);
      });
    }
    setIsModalOpen(true);
  };

  const handleEdit = (addr) => {
    setEditingId(addr._id);
    setFormData({
      label: addr.label,
      address: addr.address,
      lat: addr.location?.lat || addr.lat || 13.7563,
      lon: addr.location?.lon || addr.lon || 100.5018,
      isDefault: addr.isDefault,
      contactName: addr.contactName || userData?.fullName || "",
      contactNumber: addr.contactNumber || userData?.mobile || "",
      note: addr.note || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.label || !formData.address) {
      toast.error("Please fill in Label and Address");
      return;
    }

    try {
      let res;
      const payload = {
        label: formData.label,
        address: formData.address,
        location: { lat: formData.lat, lon: formData.lon },
        isDefault: formData.isDefault,
        contactName: formData.contactName,
        contactNumber: formData.contactNumber,
        note: formData.note,
      };

      if (editingId) {
        // Update
        res = await axios.put(
          `${serverUrl}/api/user/update-address/${editingId}`,
          payload,
          { withCredentials: true },
        );
      } else {
        // Add
        res = await axios.post(`${serverUrl}/api/user/add-address`, payload, {
          withCredentials: true,
        });
      }

      // Update Redux
      const updatedUser = { ...userData, savedAddresses: res.data };
      dispatch(setUserData(updatedUser));
      setIsModalOpen(false);
      toast.success(editingId ? "Location updated" : "Location saved");
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error?.message ||
        "Failed to save address";
      toast.error(msg);
    }
  };

  // Map Logic
  const onDragEnd = (e) => {
    const { lat, lng } = e.target._latlng;
    setFormData((prev) => ({ ...prev, lat, lon: lng }));
    getAddressByLatLng(lat, lng);
  };

  const getAddressByLatLng = async (lat, lng) => {
    try {
      const res = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apikey}`,
      );
      const addr = res?.data?.results[0]?.formatted;
      if (addr) {
        setFormData((prev) => ({ ...prev, address: addr }));
      }
    } catch (err) {}
  };

  const getLatLngByAddress = async () => {
    if (!formData.address.trim()) return;
    try {
      const res = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
          formData.address,
        )}&apiKey=${apikey}`,
      );
      if (res.data.features?.length > 0) {
        const { lat, lon } = res.data.features[0].properties;
        setFormData((prev) => ({
          ...prev,
          lat,
          lon,
          address: res.data.features[0].properties.formatted,
        }));
      }
    } catch (err) {}
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((prev) => ({ ...prev, lat: latitude, lon: longitude }));
        getAddressByLatLng(latitude, longitude);
      });
    }
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Mobile Header */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        <div className="lg:hidden pt-4 pb-2 flex justify-end">
          <PrimaryButton
            onClick={handleAddNew}
            className="px-5 py-2.5 flex items-center gap-2">
            <FaPlus size={14} /> Add New Location
          </PrimaryButton>
        </div>

        {/* Address List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <Card
              key={addr._id}
              className="p-5 rounded-2xl flex gap-4 justify-between items-start group hover:bg-white transition-all border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div
                  className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    addr.isDefault
                      ? "bg-orange-100 text-primary-orange"
                      : "bg-gray-100 text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-400 transition-colors"
                  }`}>
                  <FaMapMarkerAlt size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg truncate">
                      {addr.label}
                    </h3>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-primary-orange text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide whitespace-nowrap">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-2 line-clamp-2">
                    {addr.address}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="font-medium bg-white px-2 py-1 rounded-lg">
                      {addr.contactName}
                    </span>
                    <span>•</span>
                    <span className="font-medium bg-white px-2 py-1 rounded-lg">
                      {addr.contactNumber}
                    </span>
                  </div>
                  {addr.note && (
                    <div className="mt-2 text-xs bg-yellow-50 text-yellow-700 px-2 py-1.5 rounded-lg border border-yellow-100 inline-block">
                      <span className="font-bold">Note:</span> {addr.note}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 shrink-0">
                <div className="flex gap-2">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(addr);
                    }}
                    title="Edit">
                    <FaEdit size={14} />
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(addr._id);
                    }}
                    title="Delete">
                    <FaTrash size={14} />
                  </button>
                </div>

                {!addr.isDefault && (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-bold text-primary-orange bg-orange-50 hover:bg-orange-100 border border-orange-100 px-3 py-1.5 rounded-full transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleSetDefault(addr);
                    }}>
                    <FaMapMarkerAlt size={12} />
                    Set Default
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {addresses.length === 0 && (
          <Card className="py-20 border-dashed">
            <EmptyState
              icon={<FaMapMarkerAlt size={32} className="text-gray-300" />}
              title="No locations saved"
              description="Save your favorite locations for faster checkout."
              className="pt-0"
            />
            <div className="flex justify-center mt-6">
              <PrimaryButton onClick={handleAddNew} className="px-6 py-3">
                Add First Location
              </PrimaryButton>
            </div>
          </Card>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 w-screen h-screen z-9999 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsModalOpen(false)}></div>
            <div className="rounded-3xl border border-gray-100 overflow-hidden relative z-10 animate-scaleIn bg-white shadow-2xl max-h-[90vh] w-full max-w-3xl flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h2 className="font-bold text-lg text-gray-900">
                  {editingId ? "Edit Location" : "Add New Location"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-orange/30">
                  <IoMdClose size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5 bg-white overflow-y-auto flex-1 pb-[100px]">
                {/* Label Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Label
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange focus:outline-none font-medium transition-all"
                    placeholder="e.g. Home, Work, Gym"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange focus:outline-none font-medium transition-all"
                      placeholder="Name"
                      value={formData.contactName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Phone
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange focus:outline-none font-medium transition-all"
                      placeholder="0812345678"
                      value={formData.contactNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Address Search */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange focus:outline-none transition-all"
                      placeholder="Search address..."
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                    <button
                      className="bg-primary-orange text-white w-12 rounded-xl hover:bg-primary-orange/90 shadow-md shadow-primary-orange/20 flex items-center justify-center transition-colors"
                      onClick={getLatLngByAddress}>
                      <FaSearch />
                    </button>
                    <button
                      className="bg-blue-500 text-white w-12 rounded-xl hover:bg-blue-600 shadow-md shadow-blue-500/20 flex items-center justify-center transition-colors"
                      onClick={getCurrentLocation}>
                      <TbCurrentLocation size={20} />
                    </button>
                  </div>
                </div>

                {/* Map */}
                <div className="h-[200px] rounded-xl overflow-hidden border border-gray-200 relative z-0 shadow-inner">
                  <MapContainer
                    center={[formData.lat, formData.lon]}
                    zoom={15}
                    className="w-full h-full"
                    dragging
                    scrollWheelZoom={false}
                    touchZoom={false}
                    doubleClickZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <RecenterMap
                      location={{ lat: formData.lat, lon: formData.lon }}
                    />
                    <Marker
                      position={[formData.lat, formData.lon]}
                      draggable
                      eventHandlers={{ dragend: onDragEnd }}
                    />
                  </MapContainer>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Note to Driver (Optional)
                  </label>
                  <textarea
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange focus:outline-none text-sm transition-all"
                    placeholder="e.g. Leave at front desk, Gate code 1234"
                    rows="2"
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                  />
                </div>

                {/* Default Toggle */}
                <div className="flex items-center gap-3 bg-white p-4 rounded-xl">
                  <input
                    type="checkbox"
                    id="isDefault"
                    className="w-5 h-5 accent-primary-orange rounded"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                  />
                  <label
                    htmlFor="isDefault"
                    className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                    Set as primary delivery address
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white sticky bottom-0">
                <button
                  className="px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors text-sm"
                  onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button
                  className="px-8 py-3 rounded-xl bg-primary-orange text-white font-bold hover:bg-primary-orange/90 shadow-lg shadow-primary-orange/20 transition-all text-sm"
                  onClick={handleSave}>
                  {editingId ? "Update Location" : "Save Location"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default SavedAddresses;
