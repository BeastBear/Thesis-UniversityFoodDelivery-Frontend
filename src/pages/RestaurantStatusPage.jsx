import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaStore,
  FaTimes,
  FaCalendar,
  FaCloudSun,
  FaClock,
} from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";
import { toast } from "react-toastify";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import { checkBusinessHours } from "../utils/checkBusinessHours";
import Card from "../components/ui/Card";
import PrimaryButton from "../components/ui/PrimaryButton";

function RestaurantStatusPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { myShopData } = useSelector((state) => state.owner);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function to refresh shop data
  const refreshShopData = useCallback(async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/shop/get-my`, {
        withCredentials: true,
      });
      dispatch(setMyShopData(result.data));
    } catch (error) {}
  }, [dispatch]);

  // Calculate next business hours
  const getNextBusinessHours = () => {
    if (!myShopData?.businessHours) return null;

    const now = new Date();
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const currentDayIndex = now.getDay();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < 8; i++) {
      const checkDayIndex = (currentDayIndex + i) % 7;
      const checkDay = dayNames[checkDayIndex];
      const dayHours = myShopData.businessHours.find((h) => h.day === checkDay);

      if (dayHours && !dayHours.isClosed) {
        let openTime = null;

        if (dayHours.timeSlots && dayHours.timeSlots.length > 0) {
          for (const slot of dayHours.timeSlots) {
            if (slot.is24Hours) {
              if (i > 0) {
                openTime = "00:00";
                break;
              }
              continue;
            }
            if (slot.openTime) {
              const [openHour, openMin] = slot.openTime.split(":").map(Number);
              const openTimeInMinutes = openHour * 60 + openMin;

              if (i === 0 && currentTimeInMinutes < openTimeInMinutes) {
                openTime = slot.openTime;
                break;
              }
              if (i > 0) {
                openTime = slot.openTime;
                break;
              }
            }
          }
        } else if (dayHours.openTime) {
          const [openHour, openMin] = dayHours.openTime.split(":").map(Number);
          const openTimeInMinutes = openHour * 60 + openMin;

          if (i === 0 && currentTimeInMinutes < openTimeInMinutes) {
            openTime = dayHours.openTime;
          } else if (i > 0) {
            openTime = dayHours.openTime;
          }
        }

        if (openTime) {
          const targetDate = new Date(now);
          targetDate.setDate(targetDate.getDate() + i);
          return {
            date: targetDate,
            time: openTime,
          };
        }
      }
    }
    return null;
  };

  const formatDate = (date) => {
    if (!date) return "";
    if (typeof date === "string") date = new Date(date);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const handleClose1Hour = async () => {
    if (!myShopData?._id) return;
    setLoading(true);
    try {
      const now = new Date();
      const reopenTimeDate = new Date(now.getTime() + 60 * 60 * 1000);
      const reopenTime = `${String(reopenTimeDate.getHours()).padStart(2, "0")}:${String(reopenTimeDate.getMinutes()).padStart(2, "0")}`;

      await axios.post(
        `${serverUrl}/api/shop/temporary-close`,
        { shopId: myShopData._id, reopenTime },
        { withCredentials: true },
      );

      await refreshShopData();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCloseUntilNextBusinessHours = async () => {
    if (!myShopData?._id) return;
    setLoading(true);
    try {
      const nextHours = getNextBusinessHours();
      if (!nextHours) {
        toast.error("No business hours found");
        return;
      }

      const reopenTime = nextHours.time;
      await axios.post(
        `${serverUrl}/api/shop/temporary-close`,
        { shopId: myShopData._id, reopenTime },
        { withCredentials: true },
      );

      await refreshShopData();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCloseUntilDate = async () => {
    if (!myShopData?._id || !selectedDate) return;
    setLoading(true);
    try {
      const selectedDateTime = new Date(selectedDate);
      selectedDateTime.setHours(23, 59, 59, 999);
      const now = new Date();
      const days = Math.ceil((selectedDateTime - now) / (1000 * 60 * 60 * 24));

      if (days < 1) {
        toast.error("Please select a future date");
        return;
      }

      await axios.post(
        `${serverUrl}/api/shop/close-multiple-days`,
        { shopId: myShopData._id, days },
        { withCredentials: true },
      );

      await refreshShopData();
      setSelectedDate(null);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleReopenStore = async () => {
    if (!myShopData?._id) return;
    setLoading(true);
    try {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String((now.getMinutes() + 1) % 60).padStart(2, "0")}`;

      await axios.post(
        `${serverUrl}/api/shop/temporary-close`,
        { shopId: myShopData._id, reopenTime: currentTime },
        { withCredentials: true },
      );

      setTimeout(async () => {
        await refreshShopData();
        setLoading(false);
      }, 1000);
    } catch (error) {
      setLoading(false);
    }
  };

  // Determine shop status
  const storeStatus = useMemo(() => {
    if (!myShopData)
      return {
        isOpen: false,
        isTemporaryClosure: false,
        isSpecialHoliday: false,
      };

    const businessHoursOnlyStatus = myShopData.businessHours
      ? checkBusinessHours(myShopData.businessHours, null, null)
      : { isOpen: true };

    const statusWithClosure = myShopData.businessHours
      ? checkBusinessHours(
          myShopData.businessHours,
          myShopData.temporaryClosure,
          myShopData.specialHolidays,
        )
      : { isOpen: true };

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isInSpecialHoliday =
      myShopData.specialHolidays &&
      myShopData.specialHolidays.some((holiday) => {
        const startDate = new Date(holiday.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(holiday.endDate);
        endDate.setHours(23, 59, 59, 999);
        return now >= startDate && now <= endDate;
      });

    const isTemporaryClosure =
      businessHoursOnlyStatus.isOpen === true &&
      statusWithClosure.isOpen === false &&
      myShopData.temporaryClosure?.isClosed === true &&
      !isInSpecialHoliday;

    return {
      ...statusWithClosure,
      isTemporaryClosure,
      isSpecialHoliday: isInSpecialHoliday,
    };
  }, [myShopData]);

  const isStoreOpen = storeStatus.isOpen;
  const isTemporaryClosure = storeStatus.isTemporaryClosure;

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Card className="overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-full ${isStoreOpen ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                <FaStore size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isStoreOpen ? "Restaurant is Open" : "Restaurant is Closed"}
                </h2>
                <p className="text-sm text-gray-500">
                  {isStoreOpen
                    ? "Customers can currently place orders."
                    : isTemporaryClosure
                      ? "Restaurant is temporarily closed."
                      : "Restaurant is closed based on business hours."}
                </p>
              </div>
            </div>

            {!isStoreOpen && isTemporaryClosure && (
              <PrimaryButton
                type="button"
                onClick={handleReopenStore}
                disabled={loading}
                className="disabled:opacity-60">
                {loading ? "Processing..." : "Open Restaurant Now"}
              </PrimaryButton>
            )}
          </div>

          {isStoreOpen && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">
                Temporary Closure Options
              </h3>

              <button
                type="button"
                onClick={handleClose1Hour}
                disabled={loading}
                className="w-full text-left p-4 border border-gray-200 rounded-2xl hover:bg-white transition-colors flex justify-between items-center disabled:opacity-60">
                <div>
                  <div className="font-semibold text-gray-900">
                    Close for 1 Hour
                  </div>
                  <div className="text-sm text-gray-500">
                    Will reopen automatically at{" "}
                    {(() => {
                      const now = new Date();
                      const reopenTime = new Date(
                        now.getTime() + 60 * 60 * 1000,
                      );
                      return reopenTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });
                    })()}
                  </div>
                </div>
                <FaClock className="text-gray-400" />
              </button>

              {getNextBusinessHours() && (
                <button
                  type="button"
                  onClick={handleCloseUntilNextBusinessHours}
                  disabled={loading}
                  className="w-full text-left p-4 border border-gray-200 rounded-2xl hover:bg-white transition-colors flex justify-between items-center disabled:opacity-60">
                  <div>
                    <div className="font-semibold text-gray-900">
                      Close until next business hours
                    </div>
                    <div className="text-sm text-gray-500">
                      Until {formatDate(getNextBusinessHours().date)}{" "}
                      {getNextBusinessHours().time}
                    </div>
                  </div>
                  <FaClock className="text-gray-400" />
                </button>
              )}

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="font-semibold text-gray-900 mb-2">
                  Close until a specified date
                </div>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <DatePicker
                      onChange={setSelectedDate}
                      value={selectedDate}
                      format="dd/MM/yyyy"
                      minDate={new Date()}
                      className="w-full h-10"
                    />
                  </div>
                  <PrimaryButton
                    type="button"
                    onClick={handleCloseUntilDate}
                    disabled={!selectedDate || loading}
                    className="disabled:opacity-50">
                    Confirm
                  </PrimaryButton>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/set-special-holiday")}
                className="w-full text-left p-4 border border-gray-200 rounded-2xl hover:bg-white transition-colors flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-900">
                    Set Special Holiday
                  </div>
                  <div className="text-sm text-gray-500">
                    Plan closure for festivals or events
                  </div>
                </div>
                <FaCloudSun className="text-orange-500" />
              </button>
            </div>
          )}

          {!isStoreOpen && myShopData?.temporaryClosure?.isClosed && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-4">
              <h4 className="font-semibold text-red-800 mb-2">
                Closure Details
              </h4>
              {myShopData.temporaryClosure.reopenTime && (
                <p className="text-sm text-red-700">
                  Reopening at: {myShopData.temporaryClosure.reopenTime}
                </p>
              )}
              {myShopData.temporaryClosure.closedUntil && (
                <p className="text-sm text-red-700">
                  Closed until:{" "}
                  {new Date(
                    myShopData.temporaryClosure.closedUntil,
                  ).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default RestaurantStatusPage;
