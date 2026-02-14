import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCalendar } from "react-icons/fa";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import { ClipLoader } from "react-spinners";
import axios from "axios";
import { serverUrl } from "../App";
import { useSelector, useDispatch } from "react-redux";
import { setMyShopData } from "../redux/ownerSlice";
import Card from "../components/ui/Card";
import PrimaryButton from "../components/ui/PrimaryButton";
import { toast } from "react-toastify";

function SetSpecialHoliday() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { myShopData } = useSelector((state) => state.owner);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get return path from location state or default to create-edit-shop
  const returnPath = location.state?.from || "/create-edit-shop";

  const handleSave = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (!myShopData?._id) {
      toast.error("Restaurant not found");
      return;
    }

    setLoading(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (end < start) {
        toast.error("End date must be after start date");
        setLoading(false);
        return;
      }

      // Save special holiday
      await axios.post(
        `${serverUrl}/api/shop/add-special-holiday`,
        {
          shopId: myShopData._id,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
        { withCredentials: true },
      );

      // Refresh shop data
      const result = await axios.get(`${serverUrl}/api/shop/get-my`, {
        withCredentials: true,
      });
      dispatch(setMyShopData(result.data));

      // Navigate back to where we came from
      navigate(returnPath);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to set special holiday",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Date Input Card */}
        <Card className="p-6 mb-6">
          <div className="space-y-6">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Start
              </label>
              <div className="relative">
                <label className="block text-sm text-gray-600 mb-2">
                  Start Date
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <DatePicker
                      onChange={setStartDate}
                      value={startDate}
                      format="dd/MM/yyyy"
                      minDate={new Date()}
                      className="w-full"
                    />
                  </div>
                  <FaCalendar className="text-gray-400 text-xl flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                End
              </label>
              <div className="relative">
                <label className="block text-sm text-gray-600 mb-2">
                  End Date
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <DatePicker
                      onChange={setEndDate}
                      value={endDate}
                      format="dd/MM/yyyy"
                      minDate={startDate || new Date()}
                      className="w-full"
                    />
                  </div>
                  <FaCalendar className="text-gray-400 text-xl flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <PrimaryButton
          type="button"
          onClick={handleSave}
          disabled={loading || !startDate || !endDate}
          className="w-full py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-none hover:-translate-y-0 active:translate-y-0">
          {loading ? (
            <>
              <ClipLoader size={18} color="white" />
              <span>Saving...</span>
            </>
          ) : (
            "Save"
          )}
        </PrimaryButton>
      </div>
    </div>
  );
}

export default SetSpecialHoliday;
