import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUtensils,
  FaPlus,
  FaCloudSun,
  FaTrash,
  FaCalendar,
} from "react-icons/fa";
import { IoLocationSharp, IoSearchOutline } from "react-icons/io5";
import { TbCurrentLocation } from "react-icons/tb";
import { RxCross2 } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import { setMyShopData } from "../redux/ownerSlice";
import { ClipLoader } from "react-spinners";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { TimePicker } from "antd";
import dayjs from "dayjs";
import useCafeterias from "../hooks/useCafeterias";
import Card from "../components/ui/Card";
import PrimaryButton from "../components/ui/PrimaryButton";

// Fix for default marker icon
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
  if (location.lat && location.lon) {
    const map = useMap();
    map.setView([location.lat, location.lon], 16, { animate: true });
  }
  return null;
}

function CreateEditRestaurant() {
  const navigate = useNavigate();
  const { myShopData } = useSelector((state) => state.owner);
  const { userData } = useSelector((state) => state.user);
  const ownerVerification = userData?.ownerVerification || null;
  const { cafeterias, cafeteriaLocations } = useCafeterias();
  const [name, setName] = useState(
    myShopData?.name || ownerVerification?.restaurant?.name || "",
  );
  const [cafeteria, setCafeteria] = useState(
    myShopData?.cafeteria || ownerVerification?.restaurant?.cafeteria || "",
  );
  const [frontendImage, setFrontendImage] = useState(myShopData?.image || null);
  const [backendImage, setBackendImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({
    lat: myShopData?.location?.latitude || 13.7563,
    lon: myShopData?.location?.longitude || 100.5018,
  });
  const [addressInput, setAddressInput] = useState(myShopData?.address || "");
  const [note, setNote] = useState(
    myShopData?.note || ownerVerification?.restaurant?.description || "",
  );
  const [shopNumber, setShopNumber] = useState(
    myShopData?.shopNumber ||
      ownerVerification?.restaurant?.restaurantNumber ||
      "",
  );
  const [category, setCategory] = useState(
    myShopData?.category?._id || myShopData?.category || "",
  );
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const defaultBusinessHours = [
    {
      day: "Monday",
      timeSlots: [{ openTime: "09:00", closeTime: "17:00", is24Hours: false }],
      isClosed: false,
    },
    {
      day: "Tuesday",
      timeSlots: [{ openTime: "09:00", closeTime: "17:00", is24Hours: false }],
      isClosed: false,
    },
    {
      day: "Wednesday",
      timeSlots: [{ openTime: "09:00", closeTime: "17:00", is24Hours: false }],
      isClosed: false,
    },
    {
      day: "Thursday",
      timeSlots: [{ openTime: "09:00", closeTime: "17:00", is24Hours: false }],
      isClosed: false,
    },
    {
      day: "Friday",
      timeSlots: [{ openTime: "09:00", closeTime: "17:00", is24Hours: false }],
      isClosed: false,
    },
    {
      day: "Saturday",
      timeSlots: [{ openTime: "09:00", closeTime: "17:00", is24Hours: false }],
      isClosed: false,
    },
    {
      day: "Sunday",
      timeSlots: [{ openTime: "09:00", closeTime: "17:00", is24Hours: false }],
      isClosed: false,
    },
  ];

  const [businessHours, setBusinessHours] = useState(defaultBusinessHours);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const dispatch = useDispatch();
  const apikey = import.meta.env.VITE_GEOAPIKEY;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Handle remove special holiday
  const handleRemoveHoliday = async (holidayId) => {
    if (!myShopData?._id) return;
    if (
      !window.confirm("Are you sure you want to remove this special holiday?")
    )
      return;

    try {
      await axios.post(
        `${serverUrl}/api/shop/remove-special-holiday`,
        { shopId: myShopData._id, holidayId },
        { withCredentials: true },
      );

      // Refresh shop data
      const result = await axios.get(`${serverUrl}/api/shop/get-my`, {
        withCredentials: true,
      });
      dispatch(setMyShopData(result.data));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to remove special holiday",
      );
    }
  };

  const getAddressByLatLng = async (lat, lng) => {
    try {
      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apikey}`,
      );
      const address =
        result?.data?.results[0]?.address_line2 ||
        result?.data?.results[0]?.address_line1 ||
        result?.data?.results[0]?.formatted;
      setAddressInput(address || "");
    } catch (error) {}
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  };

  const onDragEnd = async (e) => {
    const { lat, lng } = e.target._latlng;
    setLocation({ lat, lon: lng });
    await getAddressByLatLng(lat, lng);
  };

  const getLatLngByAddress = async () => {
    if (!addressInput.trim()) return;
    try {
      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
          addressInput,
        )}&apiKey=${apikey}`,
      );
      if (result.data.features && result.data.features.length > 0) {
        const { lat, lon } = result.data.features[0].properties;
        setLocation({ lat, lon });
      }
    } catch (error) {}
  };

  const getCurrentLocation = async () => {
    if (userData?.location?.coordinates) {
      const latitude = userData.location.coordinates[1];
      const longitude = userData.location.coordinates[0];
      setLocation({ lat: latitude, lon: longitude });
      await getAddressByLatLng(latitude, longitude);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLocation({ lat, lon });
          await getAddressByLatLng(lat, lon);
        },
        (error) => {},
      );
    }
  };

  // Load existing shop data on initial load
  useEffect(() => {
    if (myShopData) {
      // Set category
      if (myShopData.category) {
        setCategory(
          typeof myShopData.category === "object"
            ? myShopData.category._id
            : myShopData.category,
        );
      }
      // Set business hours
      if (myShopData.businessHours && myShopData.businessHours.length > 0) {
        // Ensure all 7 days are present
        const daysOfWeek = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        const existingHours = myShopData.businessHours;
        const completeHours = daysOfWeek.map((day) => {
          const existing = existingHours.find((h) => h.day === day);
          if (existing) {
            // Migrate old format to new format if needed
            if (
              existing.openTime &&
              existing.closeTime &&
              !existing.timeSlots
            ) {
              return {
                day: existing.day,
                timeSlots: [
                  {
                    openTime: existing.openTime,
                    closeTime: existing.closeTime,
                    is24Hours: false,
                  },
                ],
                isClosed: existing.isClosed || false,
              };
            }
            // Ensure timeSlots array exists
            if (!existing.timeSlots || existing.timeSlots.length === 0) {
              return {
                day: existing.day,
                timeSlots: [
                  { openTime: "09:00", closeTime: "17:00", is24Hours: false },
                ],
                isClosed: existing.isClosed || false,
              };
            }
            return existing;
          }
          return {
            day,
            timeSlots: [
              { openTime: "09:00", closeTime: "17:00", is24Hours: false },
            ],
            isClosed: false,
          };
        });
        setBusinessHours(completeHours);
      } else {
        setBusinessHours(defaultBusinessHours);
      }

      // Set location
      if (myShopData.location?.latitude && myShopData.location?.longitude) {
        setLocation({
          lat: myShopData.location.latitude,
          lon: myShopData.location.longitude,
        });
        // Get address for existing location
        if (!myShopData.address) {
          getAddressByLatLng(
            myShopData.location.latitude,
            myShopData.location.longitude,
          );
        } else {
          setAddressInput(myShopData.address);
        }
      } else if (myShopData.address) {
        setAddressInput(myShopData.address);
      }
    }
    setIsInitialLoad(false);
  }, [myShopData]);

  useEffect(() => {
    if (myShopData) {
      return;
    }

    if (ownerVerification?.restaurant) {
      setName((prev) => prev || ownerVerification.restaurant?.name || "");
      setCafeteria(
        (prev) => prev || ownerVerification.restaurant?.cafeteria || "",
      );
      setShopNumber(
        (prev) => prev || ownerVerification.restaurant?.restaurantNumber || "",
      );
      setNote(
        (prev) => prev || ownerVerification.restaurant?.description || "",
      );
    }
  }, [myShopData, ownerVerification?.restaurant]);

  // Update location when cafeteria is selected
  useEffect(() => {
    if (cafeteria && cafeteriaLocations[cafeteria]) {
      const cafeteriaLocation = cafeteriaLocations[cafeteria];
      setLocation({
        lat: cafeteriaLocation.lat,
        lon: cafeteriaLocation.lon,
      });
      getAddressByLatLng(cafeteriaLocation.lat, cafeteriaLocation.lon);
    }
  }, [cafeteria, cafeteriaLocations]);

  // Fetch global categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await axios.get(`${serverUrl}/api/global-categories`);
        setCategories(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error("Failed to load categories");
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("cafeteria", cafeteria);
      if (category) {
        formData.append("category", category);
      }
      formData.append("latitude", location.lat);
      formData.append("longitude", location.lon);
      formData.append("address", addressInput);
      formData.append("note", note);
      formData.append("shopNumber", shopNumber);
      formData.append("businessHours", JSON.stringify(businessHours));
      if (backendImage) {
        formData.append("image", backendImage);
      }
      const result = await axios.post(
        `${serverUrl}/api/shop/create-edit`,
        formData,
        { withCredentials: true },
      );
      dispatch(setMyShopData(result.data));
      setLoading(false);
      navigate("/");
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <Card className="p-5">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter restaurant name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-orange/20 focus:border-primary-orange transition-all"
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cafeteria <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-orange/20 focus:border-primary-orange transition-all bg-white"
                    onChange={(e) => setCafeteria(e.target.value)}
                    value={cafeteria || ""}
                    required>
                    <option value="">Select Cafeteria</option>
                    {cafeterias.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-orange/20 focus:border-primary-orange transition-all"
                    onChange={(e) => setShopNumber(e.target.value)}
                    value={shopNumber}
                    pattern="[+]?[0-9]{10,15}"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    10-15 digits, optional country code
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Category
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-orange/20 focus:border-primary-orange transition-all bg-white"
                  onChange={(e) => setCategory(e.target.value)}
                  value={category || ""}
                  disabled={categoriesLoading}>
                  <option value="">Select Category (Optional)</option>
                  {categories
                    .filter((cat) => cat.isActive !== false)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose a category to help customers find your restaurant
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Image
                </label>
                {frontendImage ? (
                  <div className="relative">
                    <img
                      src={frontendImage}
                      alt="Restaurant preview"
                      className="w-full h-64 object-cover rounded-2xl border-2 border-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFrontendImage(null);
                        setBackendImage(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg">
                      <RxCross2 size={18} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-white hover:bg-orange-50 hover:border-orange-300 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FaUtensils className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImage}
                    />
                  </label>
                )}
              </div>
            </div>
          </Card>
          {/* Business Hours Section */}
          <Card className="p-5">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Business Hours
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Set your restaurant's operating hours for each day. You can add
              multiple time slots per day.
            </p>
            <div className="space-y-3 border border-gray-100 rounded-2xl p-4 bg-white">
              {businessHours.map((hour, dayIndex) => (
                <div key={hour.day} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!hour.isClosed}
                      onChange={(e) => {
                        const updated = businessHours.map((h, i) =>
                          i === dayIndex
                            ? { ...h, isClosed: !e.target.checked }
                            : h,
                        );
                        setBusinessHours(updated);
                      }}
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                    />
                    <label className="text-sm font-medium text-gray-700 min-w-[100px]">
                      {hour.day}
                    </label>
                  </div>
                  {!hour.isClosed && (
                    <div className="ml-8 space-y-2">
                      {hour.timeSlots?.map((slot, slotIndex) => (
                        <div
                          key={slotIndex}
                          className="flex items-center gap-2">
                          {slot.is24Hours ? (
                            <div className="flex-1 px-4 py-2 border-2 border-green-500 rounded-2xl bg-green-50 text-green-700 font-bold">
                              Open 24 Hours
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-2xl bg-white">
                              <TimePicker
                                value={
                                  slot.openTime
                                    ? dayjs(slot.openTime, "HH:mm")
                                    : dayjs("09:00", "HH:mm")
                                }
                                onChange={(time) => {
                                  const updated = businessHours.map((h, i) =>
                                    i === dayIndex
                                      ? {
                                          ...h,
                                          timeSlots: h.timeSlots.map((s, si) =>
                                            si === slotIndex
                                              ? {
                                                  ...s,
                                                  openTime:
                                                    time && dayjs.isDayjs(time)
                                                      ? time.format("HH:mm")
                                                      : s.openTime,
                                                }
                                              : s,
                                          ),
                                        }
                                      : h,
                                  );
                                  setBusinessHours(updated);
                                }}
                                onOk={(time) => {
                                  const updated = businessHours.map((h, i) =>
                                    i === dayIndex
                                      ? {
                                          ...h,
                                          timeSlots: h.timeSlots.map((s, si) =>
                                            si === slotIndex
                                              ? {
                                                  ...s,
                                                  openTime:
                                                    time && dayjs.isDayjs(time)
                                                      ? time.format("HH:mm")
                                                      : s.openTime,
                                                }
                                              : s,
                                          ),
                                        }
                                      : h,
                                  );
                                  setBusinessHours(updated);
                                }}
                                format="HH:mm"
                                className="flex-1"
                                size="small"
                                disabled={slot.is24Hours}
                              />
                              <span className="text-gray-500">-</span>
                              <TimePicker
                                value={
                                  slot.closeTime
                                    ? dayjs(slot.closeTime, "HH:mm")
                                    : dayjs("17:00", "HH:mm")
                                }
                                onChange={(time) => {
                                  const updated = businessHours.map((h, i) =>
                                    i === dayIndex
                                      ? {
                                          ...h,
                                          timeSlots: h.timeSlots.map((s, si) =>
                                            si === slotIndex
                                              ? {
                                                  ...s,
                                                  closeTime:
                                                    time && dayjs.isDayjs(time)
                                                      ? time.format("HH:mm")
                                                      : s.closeTime,
                                                }
                                              : s,
                                          ),
                                        }
                                      : h,
                                  );
                                  setBusinessHours(updated);
                                }}
                                onOk={(time) => {
                                  const updated = businessHours.map((h, i) =>
                                    i === dayIndex
                                      ? {
                                          ...h,
                                          timeSlots: h.timeSlots.map((s, si) =>
                                            si === slotIndex
                                              ? {
                                                  ...s,
                                                  closeTime:
                                                    time && dayjs.isDayjs(time)
                                                      ? time.format("HH:mm")
                                                      : s.closeTime,
                                                }
                                              : s,
                                          ),
                                        }
                                      : h,
                                  );
                                  setBusinessHours(updated);
                                }}
                                format="HH:mm"
                                className="flex-1"
                                size="small"
                                disabled={slot.is24Hours}
                              />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = businessHours.map((h, i) =>
                                i === dayIndex
                                  ? {
                                      ...h,
                                      timeSlots: h.timeSlots.map((s, si) =>
                                        si === slotIndex
                                          ? { ...s, is24Hours: !s.is24Hours }
                                          : s,
                                      ),
                                    }
                                  : h,
                              );
                              setBusinessHours(updated);
                            }}
                            className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap"
                            title={
                              slot.is24Hours
                                ? "Remove 24 Hours"
                                : "Set 24 Hours"
                            }>
                            {slot.is24Hours ? "24h" : "24h"}
                          </button>
                          {hour.timeSlots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = businessHours.map((h, i) =>
                                  i === dayIndex
                                    ? {
                                        ...h,
                                        timeSlots: h.timeSlots.filter(
                                          (_, si) => si !== slotIndex,
                                        ),
                                      }
                                    : h,
                                );
                                setBusinessHours(updated);
                              }}
                              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                              title="Remove time slot">
                              <RxCross2 size={18} />
                            </button>
                          )}
                          {slotIndex === hour.timeSlots.length - 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = businessHours.map((h, i) =>
                                  i === dayIndex
                                    ? {
                                        ...h,
                                        timeSlots: [
                                          ...h.timeSlots,
                                          {
                                            openTime: "09:00",
                                            closeTime: "17:00",
                                            is24Hours: false,
                                          },
                                        ],
                                      }
                                    : h,
                                );
                                setBusinessHours(updated);
                              }}
                              className="p-2 text-gray-500 hover:text-orange-500 transition-colors rounded-full border border-gray-300 hover:border-orange-500"
                              title="Add time slot">
                              <FaPlus size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      {hour.timeSlots?.length === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = businessHours.map((h, i) =>
                              i === dayIndex
                                ? {
                                    ...h,
                                    timeSlots: [
                                      {
                                        openTime: "09:00",
                                        closeTime: "17:00",
                                        is24Hours: false,
                                      },
                                    ],
                                  }
                                : h,
                            );
                            setBusinessHours(updated);
                          }}
                          className="px-4 py-2 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-orange-500 hover:text-orange-500 transition-colors font-bold">
                          Select Time
                        </button>
                      )}
                    </div>
                  )}
                  {hour.isClosed && (
                    <div className="ml-8 text-sm text-gray-500 italic">
                      Closed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Special Holiday Section */}
          <Card className="p-5">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Special Holiday
            </h2>
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
                <FaCloudSun className="text-orange-500 text-2xl" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-4">
                  Set holidays outside normal restaurant hours, such as festival
                  holidays.
                </p>
                <PrimaryButton
                  type="button"
                  onClick={() => navigate("/set-special-holiday")}
                  className="w-full sm:w-auto">
                  Set Special Holiday
                </PrimaryButton>
              </div>
            </div>

            {/* Display Saved Holidays */}
            {myShopData?.specialHolidays &&
              myShopData.specialHolidays.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Saved Holidays
                  </h3>
                  <div className="space-y-2">
                    {myShopData.specialHolidays.map((holiday) => (
                      <div
                        key={holiday._id}
                        className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <FaCalendar className="text-gray-400" />
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(holiday.startDate)} -{" "}
                              {formatDate(holiday.endDate)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveHoliday(holiday._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
                          title="Remove holiday">
                          <FaTrash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </Card>
          {/* Location Section */}
          {/*
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
              <IoLocationSharp className="text-primary-orange" />
              Shop Location
            </h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Enter shop address..."
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      getLatLngByAddress();
                    }
                  }}
                />
                <button
                  type="button"
                  className="bg-primary-orange hover:bg-primary-orange/90 text-white px-4 py-3 rounded-2xl font-extrabold flex items-center justify-center transition-colors shadow-lg shadow-primary-orange/20"
                  onClick={getLatLngByAddress}
                  title="Search address">
                  <IoSearchOutline size={20} />
                </button>
                <button
                  type="button"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center transition-colors"
                  onClick={getCurrentLocation}
                  title="Use current location">
                  <TbCurrentLocation size={20} />
                </button>
              </div>
              <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
                <div className="h-80 w-full">
                  <MapContainer
                    className="w-full h-full"
                    center={[location.lat, location.lon]}
                    zoom={16}
                    scrollWheelZoom={true}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RecenterMap location={location} />
                    <Marker
                      position={[location.lat, location.lon]}
                      draggable
                      eventHandlers={{ dragend: onDragEnd }}
                    />
                  </MapContainer>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Enter address and search, or drag the marker to set your shop
                location
              </p>
            </div>
          </div>
          */}

          {/* Additional Notes Section */}
          <Card className="p-5">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 pb-3 border-b border-gray-100">
              Additional Information
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                placeholder="Add any additional notes about your shop..."
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-orange/20 focus:border-primary-orange resize-none transition-all"
                rows="4"
                onChange={(e) => setNote(e.target.value)}
                value={note}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Add any additional information about your shop
              </p>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-3 border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-white transition-colors">
              Cancel
            </button>
            <PrimaryButton type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <ClipLoader size={20} color="#fff" className="mr-2" />
                  <span>Saving...</span>
                </>
              ) : (
                "Save Restaurant"
              )}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEditRestaurant;
