import React, { useState, useEffect } from "react";
import { FaTimes, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import DeliveryLayout from "../layouts/DeliveryLayout";
import DeliveryPageHero from "../components/Delivery/DeliveryPageHero";
import { toast } from "react-toastify";

function DeliveryBoyBankAccount() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    accountName: "",
    bank: "",
    branch: "",
    accountNumber: "",
    applicationId: "",
  });

  // Initialize form data from user data
  useEffect(() => {
    if (userData?.ePaymentAccount) {
      setFormData({
        accountName: userData.ePaymentAccount.accountName || "",
        bank: userData.ePaymentAccount.bank || "",
        branch: userData.ePaymentAccount.branch || "",
        accountNumber: userData.ePaymentAccount.accountNumber || "",
        applicationId: userData.ePaymentAccount.applicationId || "",
      });
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${serverUrl}/api/user/update-bank-account`,
        formData,
        { withCredentials: true },
      );

      dispatch(setUserData(response.data.user));
      toast.success("Bank account updated successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update bank account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (userData?.ePaymentAccount) {
      setFormData({
        accountName: userData.ePaymentAccount.accountName || "",
        bank: userData.ePaymentAccount.bank || "",
        branch: userData.ePaymentAccount.branch || "",
        accountNumber: userData.ePaymentAccount.accountNumber || "",
        applicationId: userData.ePaymentAccount.applicationId || "",
      });
    }
  };

  if (!userData || userData.role !== "deliveryBoy") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">
          This page is only available for deliverers.
        </p>
      </div>
    );
  }

  return (
    <DeliveryLayout>
      <div className="w-full max-w-[900px] mx-auto flex flex-col px-4 pt-3 sm:pt-6 gap-3 sm:gap-6 pb-28">
        <DeliveryPageHero
          eyebrow="DELIVERER FINANCE"
          title="Bank Account"
          description="Add your bank account details for withdrawals."
          icon={<FaCheck size={20} />}
          onBack={() => navigate(-1)}
        />

        <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                BANK DETAILS
              </div>
              <h2 className="mt-1 text-base sm:text-lg font-extrabold text-slate-900">
                Bank Account Details
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {/* Account Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Account Name
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter account name"
              />
            </div>

            {/* Bank */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Bank</label>
              <input
                type="text"
                name="bank"
                value={formData.bank}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter bank name"
              />
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Branch
              </label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter branch name"
              />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter account number"
              />
            </div>

            {/* Application ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Application ID
              </label>
              <input
                type="text"
                name="applicationId"
                value={formData.applicationId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter application ID"
              />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 text-slate-900 font-extrabold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <FaTimes size={16} />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-white font-extrabold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FaCheck size={16} />
                )}
                <span>{loading ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DeliveryLayout>
  );
}

export default DeliveryBoyBankAccount;
