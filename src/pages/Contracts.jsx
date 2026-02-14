import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";
import Card from "../components/ui/Card";

function Contracts() {
  const dispatch = useDispatch();
  const { myShopData } = useSelector((state) => state.owner);
  const { userData } = useSelector((state) => state.user);

  const ownerVerification = userData?.ownerVerification || null;

  const verificationStatus = ownerVerification?.status || "unverified";
  const verificationLabel =
    verificationStatus === "pending"
      ? "Pending"
      : verificationStatus === "verified"
        ? "Verified"
        : verificationStatus === "rejected"
          ? "Rejected"
          : "Unverified";
  const verificationClasses =
    verificationStatus === "verified"
      ? "bg-green-50 text-green-700 border-green-200"
      : verificationStatus === "pending"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : verificationStatus === "rejected"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-white text-gray-700 border-gray-200";

  const [formData, setFormData] = useState({
    accountName: "",
    bank: "",
    accountNumber: "",
  });

  useEffect(() => {
    if (myShopData?.ePaymentAccount) {
      setFormData({
        accountName: myShopData.ePaymentAccount.accountName || "",
        bank: myShopData.ePaymentAccount.bank || "",
        accountNumber: myShopData.ePaymentAccount.accountNumber || "",
      });
    } else {
      setFormData({
        accountName: "",
        bank: "",
        accountNumber: "",
      });
    }
  }, [myShopData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submittedAtLabel = ownerVerification?.submittedAt
    ? new Date(ownerVerification.submittedAt).toLocaleString()
    : "—";
  const verifiedAtLabel = ownerVerification?.verifiedAt
    ? new Date(ownerVerification.verifiedAt).toLocaleString()
    : "—";

  const submitterName =
    ownerVerification?.owner?.fullName || userData?.fullName || "—";
  const submitterEmail =
    ownerVerification?.owner?.email || userData?.email || "—";
  const submitterMobile =
    ownerVerification?.owner?.mobile || userData?.mobile || "—";

  const restaurantName =
    ownerVerification?.restaurant?.name || myShopData?.name || "—";
  const restaurantCafeteria =
    ownerVerification?.restaurant?.cafeteria || myShopData?.cafeteria || "—";
  const restaurantNumber =
    ownerVerification?.restaurant?.restaurantNumber ||
    myShopData?.shopNumber ||
    "—";
  const restaurantDescription =
    ownerVerification?.restaurant?.description || myShopData?.note || "—";

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Card className="p-6 rounded-lg border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Verification Status
            </h2>
            <div
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${verificationClasses}`}>
              {verificationLabel}
            </div>
          </div>

          {verificationStatus === "rejected" &&
          ownerVerification?.rejectionReason ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <div className="text-sm font-semibold text-red-700">Reason</div>
              <div className="text-sm text-red-700 mt-1">
                {ownerVerification.rejectionReason}
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">
                Submitted By
              </div>
              <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200">
                {submitterName}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">
                Submitted At
              </div>
              <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200">
                {submittedAtLabel}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">
                Verified At
              </div>
              <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200">
                {verifiedAtLabel}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-lg border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Owner</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">
                Owner Name
              </div>
              <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200">
                {submitterName}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">
                ID Number
              </div>
              <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200">
                {ownerVerification?.kyc?.idNumber || "—"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">Email</div>
              <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200">
                {submitterEmail}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">Mobile</div>
              <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200">
                {submitterMobile}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-lg border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Restaurant</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">
                Restaurant Name
              </div>
              <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200">
                {restaurantName}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">
                Cafeteria
              </div>
              <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200">
                {restaurantCafeteria}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">
                Restaurant Number
              </div>
              <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200">
                {restaurantNumber}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">
                Description
              </div>
              <div className="px-3 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-900 border border-gray-200">
                {restaurantDescription}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-lg border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Bank Account Details
            </h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Account Name
              </label>
              <div className="px-3 py-2.5 text-base text-gray-900 font-medium bg-white rounded-lg">
                {formData.accountName || "—"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Bank</label>
              <div className="px-3 py-2.5 text-base text-gray-900 font-medium bg-white rounded-lg">
                {formData.bank || "—"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Account Number
              </label>
              <div className="px-3 py-2.5 text-base text-gray-900 font-medium bg-white rounded-lg font-mono">
                {formData.accountNumber || "—"}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Contracts;
