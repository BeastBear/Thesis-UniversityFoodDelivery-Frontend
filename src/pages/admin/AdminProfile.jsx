import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../../App";
import { setUserData } from "../../redux/userSlice";
import { toast } from "react-toastify";
import { FaCamera, FaEnvelope, FaPhone, FaSave, FaUser } from "react-icons/fa";

const AdminProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userData) return;
    setFormData({
      fullName: userData.fullName || "",
      email: userData.email || "",
      mobile: userData.mobile || "",
    });
    setImagePreview(userData.profileImage || null);
  }, [userData]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const data = new FormData();
      data.append("fullName", formData.fullName);
      data.append("email", formData.email);
      data.append("mobile", formData.mobile);
      if (image) {
        data.append("image", image);
      }

      const res = await axios.put(
        `${serverUrl}/api/user/update-profile`,
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const updatedUser = { ...userData, ...res.data.user };
      dispatch(setUserData(updatedUser));
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = (userData?.fullName || "Administrator")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold text-gray-900">Profile</div>
          <div className="text-sm text-gray-500 font-semibold">
            Manage your admin account details
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="min-h-[44px] px-5 rounded-2xl text-sm font-extrabold transition-all shadow-sm bg-white border border-gray-200 text-gray-700 hover:bg-white active:scale-95">
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-purple-50 border border-purple-100 overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-lg font-extrabold text-purple-700">
                    {initials || "A"}
                  </div>
                )}
              </div>
              <label
                htmlFor="admin-profile-image"
                className="absolute -bottom-2 -right-2 bg-purple-600 text-white p-2.5 rounded-2xl cursor-pointer hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-transform hover:scale-105">
                <FaCamera size={14} />
              </label>
              <input
                type="file"
                id="admin-profile-image"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <div className="min-w-0">
              <div className="text-lg font-extrabold text-gray-900 truncate">
                {userData?.fullName || "Administrator"}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {userData?.email || ""}
              </div>
              <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-100">
                Admin
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaUser />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaPhone />
                  </div>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaEnvelope />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className={`min-h-[44px] px-6 rounded-2xl text-sm font-extrabold transition-all shadow-lg inline-flex items-center gap-2 active:scale-95 ${
                  saving
                    ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/30"
                }`}>
                <FaSave />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
