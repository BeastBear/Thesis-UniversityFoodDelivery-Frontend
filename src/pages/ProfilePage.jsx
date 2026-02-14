import React, { useState, useEffect } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaSave,
  FaCamera,
  FaCheckCircle,
  FaInfoCircle,
  FaIdCard,
} from "react-icons/fa";
import DeliveryLayout from "../layouts/DeliveryLayout";
import DeliveryPageHero from "../components/Delivery/DeliveryPageHero";

function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const isOwner = userData?.role === "owner";
  const isDeliveryBoy = userData?.role === "deliveryBoy";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [deliveryIdNumber, setDeliveryIdNumber] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.fullName || "",
        email: userData.email || "",
        mobile: userData.mobile || "",
      });
      if (userData.profileImage) {
        setImagePreview(userData.profileImage);
      }
    }
  }, [userData]);

  useEffect(() => {
    if (!isDeliveryBoy) return;
    let cancelled = false;

    const fetchDeliveryStatus = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/delivery/status`, {
          withCredentials: true,
        });
        if (cancelled) return;
        setDeliveryIdNumber(String(res?.data?.profile?.idNumber || ""));
      } catch {
        if (cancelled) return;
        setDeliveryIdNumber("");
      }
    };

    fetchDeliveryStatus();
    return () => {
      cancelled = true;
    };
  }, [isDeliveryBoy]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

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

      // Update Redux state with the returned updated user
      const updatedUser = { ...userData, ...res.data.user };
      dispatch(setUserData(updatedUser));

      setMessage({ type: "success", text: "Profile updated successfully!" });

      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div className="w-full flex flex-col gap-6">
      {isDeliveryBoy ? (
        <DeliveryPageHero
          title="Profile"
          description={userData?.email || "Manage your account details"}
          onBack={() => navigate(-1)}
          icon={<FaUser size={20} />}
        />
      ) : null}

      <div className="bg-white overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-extrabold text-slate-400">
                    {userData?.fullName?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <label
                htmlFor="profile-image"
                className="absolute -bottom-2 -right-2 bg-primary-orange hover:bg-primary-orange/90 text-white p-2.5 rounded-2xl cursor-pointer shadow-lg transition-transform hover:scale-105">
                <FaCamera size={14} />
              </label>
              <input
                type="file"
                id="profile-image"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
                {userData?.fullName || "User"}
              </div>
              <div className="flex items-center gap-2 mt-1 min-w-0 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 capitalize">
                  {userData?.role || "user"}
                </span>
                <span className="text-slate-500 text-sm truncate min-w-0">
                  {userData?.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl">
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-bold text-gray-700 ml-1">
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
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-4 focus:ring-orange-600/20 focus:border-orange-600 outline-none transition-all font-medium"
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>

              {isOwner || isDeliveryBoy ? (
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    ID Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <FaIdCard />
                    </div>
                    <input
                      type="text"
                      value={
                        isOwner
                          ? userData?.ownerVerification?.kyc?.idNumber || ""
                          : deliveryIdNumber
                      }
                      readOnly
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border-none shadow-sm bg-white text-gray-900 outline-none transition-all font-medium font-mono"
                      placeholder="—"
                    />
                  </div>
                </div>
              ) : null}

              {/* Phone */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-bold text-gray-700 ml-1">
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
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-4 focus:ring-orange-600/20 focus:border-orange-600 outline-none transition-all font-medium"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-bold text-gray-700 ml-1">
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
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border-none shadow-sm focus:ring-4 focus:ring-orange-600/20 focus:border-orange-600 outline-none transition-all font-medium"
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Message Area */}
            {message.text && (
              <div
                className={`p-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}>
                {message.type === "success" ? (
                  <FaCheckCircle />
                ) : (
                  <FaInfoCircle />
                )}
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-white font-bold text-sm transform transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary-orange hover:bg-primary-orange/90 shadow-primary-orange/20"
                }`}>
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></span>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <FaSave size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // For delivery boys, use DeliveryLayout
  if (isDeliveryBoy) {
    return <DeliveryLayout>{content}</DeliveryLayout>;
  }

  // For regular users, return content without wrapper (ProfileLayout will handle it)
  return <>{content}</>;
}

export default ProfilePage;
