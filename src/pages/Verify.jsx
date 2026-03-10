import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { setMyShopData } from "../redux/ownerSlice";
import Card from "../components/ui/Card";
import useCafeterias from "../hooks/useCafeterias";

function Verify() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myShopData } = useSelector((state) => state.owner);
  const { userData } = useSelector((state) => state.user);

  const { cafeterias, loading: cafeteriasLoading } = useCafeterias();

  const [step, setStep] = useState(0);

  const [verificationLoading, setVerificationLoading] = useState(false);
  const [submitVerificationLoading, setSubmitVerificationLoading] =
    useState(false);
  const [ownerVerification, setOwnerVerification] = useState(null);

  const [verificationForm, setVerificationForm] = useState(() => {
    const saved = localStorage.getItem("verificationForm");
    if (saved) return JSON.parse(saved);
    return {
      idNumber: "",
      restaurantName: "",
      cafeteria: "",
      restaurantLotNumber: "",
      restaurantDescription: "",
    };
  });

  const [verificationFiles, setVerificationFiles] = useState({
    restaurantPhoto: null,
  });

  const [bankForm, setBankForm] = useState(() => {
    const saved = localStorage.getItem("bankForm");
    if (saved) return JSON.parse(saved);
    return {
      bank: "",
      accountNumber: "",
    };
  });

  useEffect(() => {
    localStorage.setItem("verificationForm", JSON.stringify(verificationForm));
  }, [verificationForm]);

  useEffect(() => {
    localStorage.setItem("bankForm", JSON.stringify(bankForm));
  }, [bankForm]);

  useEffect(() => {
    if (!localStorage.getItem("bankForm")) {
      const verificationBank = ownerVerification?.bank;
      const shopBank = myShopData?.ePaymentAccount;
      setBankForm({
        bank: verificationBank?.bank || shopBank?.bank || "",
        accountNumber:
          verificationBank?.accountNumber || shopBank?.accountNumber || "",
      });
    }
  }, [
    ownerVerification?.bank?.bank,
    ownerVerification?.bank?.accountNumber,
    myShopData?.ePaymentAccount?.bank,
    myShopData?.ePaymentAccount?.accountNumber,
  ]);

  useEffect(() => {
    const fetchOwnerVerification = async () => {
      setVerificationLoading(true);
      try {
        const res = await axios.get(
          `${serverUrl}/api/user/owner-verification`,
          {
            withCredentials: true,
          },
        );
        const ov = res.data?.ownerVerification || null;
        setOwnerVerification(ov);

        if (ov && userData) {
          dispatch(
            setUserData({
              ...userData,
              ownerVerification: ov,
              shopVerificationStatus: ov.status,
            }),
          );
        }

        if (ov) {
          if (!localStorage.getItem("verificationForm")) {
            setVerificationForm({
              idNumber: ov.kyc?.idNumber || "",
              restaurantName: ov.restaurant?.name || "",
              cafeteria: ov.restaurant?.cafeteria || "",
              restaurantLotNumber: ov.restaurant?.restaurantLotNumber || "",
              restaurantDescription: ov.restaurant?.description || "",
            });
          }

          if (ov.status === "verified" && !myShopData) {
            try {
              const shopRes = await axios.get(`${serverUrl}/api/shop/get-my`, {
                withCredentials: true,
              });
              dispatch(setMyShopData(shopRes.data));
            } catch (shopErr) {}
          }
        }
      } catch (e) {
      } finally {
        setVerificationLoading(false);
      }
    };

    fetchOwnerVerification();
  }, [dispatch]);

  useEffect(() => {
    if (ownerVerification?.status === "verified") {
      navigate("/", { replace: true });
    }
  }, [ownerVerification?.status, navigate]);

  const handleGoToDashboard = async () => {
    if (status === "verified" && !myShopData) {
      try {
        const shopRes = await axios.get(`${serverUrl}/api/shop/get-my`, {
          withCredentials: true,
        });
        dispatch(setMyShopData(shopRes.data));
      } catch (shopErr) {}
    }
    navigate("/", { replace: true });
  };

  useEffect(() => {
    if (ownerVerification || localStorage.getItem("verificationForm")) {
      return;
    }

    setVerificationForm((prev) => ({
      ...prev,
      restaurantName: prev.restaurantName || myShopData?.name || "",
      cafeteria: prev.cafeteria || myShopData?.cafeteria || "",
      restaurantLotNumber:
        prev.restaurantLotNumber || myShopData?.shopNumber || "",
      restaurantDescription:
        prev.restaurantDescription || myShopData?.note || "",
    }));
  }, [myShopData, ownerVerification]);

  const handleVerificationChange = (e) => {
    const { name, value } = e.target;
    setVerificationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVerificationFileChange = (e) => {
    const { name, files } = e.target;
    const file = files && files[0] ? files[0] : null;
    setVerificationFiles((prev) => ({
      ...prev,
      [name]: file,
    }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, {
        withCredentials: true,
      });
    } catch (error) {
    } finally {
      dispatch(setUserData(null));
      navigate("/signin", { replace: true });
    }
  };

  const handleSubmitVerification = async () => {
    const bankAccountName = userData?.fullName || "";
    const bankName = bankForm.bank || "";

    if (!bankName || !bankForm.accountNumber) {
      toast.error("Please complete Bank Account Details first.");
      return;
    }

    const fd = new FormData();
    fd.append("fullName", userData?.fullName || "");
    fd.append("idNumber", verificationForm.idNumber);
    fd.append("restaurantName", verificationForm.restaurantName);
    fd.append("cafeteria", verificationForm.cafeteria);
    fd.append("restaurantLotNumber", verificationForm.restaurantLotNumber);
    fd.append("restaurantDescription", verificationForm.restaurantDescription);

    fd.append("bankName", bankForm.bank);
    fd.append("bankAccountNumber", bankForm.accountNumber);

    Object.entries(verificationFiles).forEach(([key, file]) => {
      if (file) {
        fd.append(key, file);
      }
    });

    setSubmitVerificationLoading(true);
    try {
      const res = await axios.post(
        `${serverUrl}/api/user/owner-verification`,
        fd,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setOwnerVerification(res.data?.ownerVerification || null);
      if (res.data?.ownerVerification && userData) {
        dispatch(
          setUserData({
            ...userData,
            ownerVerification: res.data.ownerVerification,
          }),
        );
      }
      localStorage.removeItem("verificationForm");
      localStorage.removeItem("bankForm");
      toast.success(res.data?.message || "Verification submitted successfully");
    } catch (e) {
      toast.error(
        e.response?.data?.message ||
          "Failed to submit verification. Please try again.",
      );
    } finally {
      setSubmitVerificationLoading(false);
    }
  };

  const status = ownerVerification?.status || "unverified";
  const statusLabel =
    status === "pending"
      ? "Pending"
      : status === "verified"
        ? "Verified"
        : status === "rejected"
          ? "Rejected"
          : "Unverified";
  const statusClasses =
    status === "verified"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "pending"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : status === "rejected"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-white text-gray-700 border-gray-200";

  const showStatusOnly = status === "pending" || status === "verified";

  const bankName = bankForm.bank || "";
  const bankAccountNumber = bankForm.accountNumber || "";
  const hasBankInfo = !!bankName && !!bankAccountNumber;

  const hasRestaurantPhoto =
    !!verificationFiles.restaurantPhoto ||
    !!ownerVerification?.restaurant?.photo;

  const isStepValid = () => {
    if (step === 0) {
      return (
        !!(userData?.fullName || "").trim() &&
        !!(userData?.email || "").trim() &&
        !!(userData?.mobile || "").trim() &&
        !!verificationForm.idNumber.trim()
      );
    }

    if (step === 1) {
      return (
        !!verificationForm.restaurantName.trim() &&
        !!verificationForm.cafeteria.trim() &&
        !!verificationForm.restaurantLotNumber.trim() &&
        !!verificationForm.restaurantDescription.trim() &&
        hasRestaurantPhoto
      );
    }

    if (step === 2) {
      return hasBankInfo;
    }

    return true;
  };

  const handleContinue = () => {
    if (!isStepValid()) {
      toast.error("Please complete all required fields in this section.");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-extrabold text-gray-900">
            Restaurant Verification
          </div>
          <button
            type="button"
            onClick={handleLogOut}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700">
            Logout
          </button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Card className="p-6 rounded-lg border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold text-gray-700">
              {showStatusOnly
                ? "Verification Status"
                : step === 3
                  ? "Summary"
                  : `Step ${step + 1} / 3`}
            </div>
          </div>

          <div className="mt-4">
            {status === "rejected" && ownerVerification?.rejectionReason ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div className="text-sm font-semibold text-red-700">
                  Rejected
                </div>
                <div className="text-sm text-red-700 mt-1">
                  {ownerVerification.rejectionReason}
                </div>
              </div>
            ) : null}

            {showStatusOnly ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center gap-3 py-2">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center border ${
                      status === "verified"
                        ? "bg-green-50 text-green-600 border-green-200"
                        : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}>
                    {status === "verified" ? (
                      <FaCheckCircle size={40} />
                    ) : (
                      <FaClock size={40} />
                    )}
                  </div>

                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    {status === "pending" ? "Pending" : "Verified"}
                  </div>

                  <div className="text-sm sm:text-base text-gray-600 max-w-xl">
                    {status === "pending"
                      ? "Your verification is under review."
                      : "Your verification is approved."}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">
                      Submitted At
                    </div>
                    <div className="px-3 py-2.5 rounded-lg text-sm font-semibold bg-white text-gray-900 border border-gray-200">
                      {ownerVerification?.submittedAt
                        ? new Date(
                            ownerVerification.submittedAt,
                          ).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">
                      Verified At
                    </div>
                    <div className="px-3 py-2.5 rounded-lg text-sm font-semibold bg-white text-gray-900 border border-gray-200">
                      {ownerVerification?.verifiedAt
                        ? new Date(
                            ownerVerification.verifiedAt,
                          ).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">
                    What’s next?
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {status === "pending"
                      ? "Please wait for admin review. You will be able to access owner features once approved."
                      : "You can now proceed to create and manage your restaurant."}
                  </div>
                </div>

                <div className="flex gap-3">
                  {status === "verified" ? (
                    <button
                      type="button"
                      onClick={handleGoToDashboard}
                      className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium text-base hover:bg-orange-600 transition-colors">
                      Go to Dashboard
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium text-base hover:bg-gray-300 transition-colors">
                      Refresh Status
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {!showStatusOnly ? (
              <>
                {step === 0 ? (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Owner Info
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          Full Name
                        </div>
                        <div className="px-3 py-2.5 rounded-lg text-base text-gray-900 font-semibold bg-white border border-gray-200">
                          {userData?.fullName || "—"}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          Email
                        </div>
                        <div className="px-3 py-2.5 rounded-lg text-base text-gray-900 font-semibold bg-white border border-gray-200">
                          {userData?.email || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          Phone Number
                        </div>
                        <div className="px-3 py-2.5 rounded-lg text-base text-gray-900 font-semibold bg-white border border-gray-200">
                          {userData?.mobile || "—"}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          ID Card / Passport Number
                        </label>
                        <input
                          type="text"
                          name="idNumber"
                          value={verificationForm.idNumber}
                          onChange={handleVerificationChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter ID/Passport number"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Restaurant Info
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Restaurant Name
                        </label>
                        <input
                          type="text"
                          name="restaurantName"
                          value={verificationForm.restaurantName}
                          onChange={handleVerificationChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter restaurant name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Restaurant Photo
                        </label>
                        <input
                          type="file"
                          name="restaurantPhoto"
                          accept="image/*"
                          onChange={handleVerificationFileChange}
                          className="w-full"
                        />
                        {ownerVerification?.restaurant?.photo ? (
                          <a
                            href={ownerVerification.restaurant.photo}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-orange-600 font-semibold">
                            View uploaded
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Cafeteria
                        </label>
                        <select
                          name="cafeteria"
                          value={verificationForm.cafeteria}
                          onChange={handleVerificationChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500">
                          <option value="">
                            {cafeteriasLoading
                              ? "Loading cafeterias..."
                              : "Select cafeteria"}
                          </option>
                          {cafeterias.map((cafe) => (
                            <option key={cafe} value={cafe}>
                              {cafe}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Restaurant Lot. number
                        </label>
                        <input
                          type="text"
                          name="restaurantLotNumber"
                          value={verificationForm.restaurantLotNumber}
                          onChange={handleVerificationChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter restaurant lot number"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Restaurant Description
                      </label>
                      <textarea
                        name="restaurantDescription"
                        value={verificationForm.restaurantDescription}
                        onChange={handleVerificationChange}
                        rows="4"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Describe your restaurant"
                      />
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Bank Info
                        </h2>
                        <div className="text-sm text-gray-500 mt-1">
                          Your bank account name must match your owner full name
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          Bank
                        </div>
                        <select
                          name="bank"
                          value={bankForm.bank}
                          onChange={handleBankChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500">
                          <option value="">Select bank</option>
                          <option value="KBANK">Kasikornbank (KBANK)</option>
                          <option value="SCB">
                            Siam Commercial Bank (SCB)
                          </option>
                          <option value="BBL">Bangkok Bank (BBL)</option>
                          <option value="KTB">Krungthai Bank (KTB)</option>
                          <option value="BAY">
                            Bank of Ayudhya (Krungsri/BAY)
                          </option>
                          <option value="TTB">TMBThanachart Bank (TTB)</option>
                          <option value="GSB">
                            Government Savings Bank (GSB)
                          </option>
                          <option value="KKP">
                            Kiatnakin Phatra Bank (KKP)
                          </option>
                          <option value="CIMBT">CIMB Thai Bank (CIMBT)</option>
                          <option value="UOBBT">
                            United Overseas Bank (UOB/UOBBT)
                          </option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          Account Number
                        </div>
                        <input
                          type="text"
                          name="accountNumber"
                          value={bankForm.accountNumber}
                          onChange={handleBankChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Enter account number"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Summary
                    </h2>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            Full Name
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {userData?.fullName || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            Email
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {userData?.email || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            Phone
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {userData?.mobile || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            ID / Passport
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {verificationForm.idNumber}
                          </p>
                        </div>
                      </div>

                      <hr className="border-gray-200" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            Restaurant Name
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {verificationForm.restaurantName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            Cafeteria
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {verificationForm.cafeteria}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            Restaurant Lot. number
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {verificationForm.restaurantLotNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            Restaurant Photo
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {verificationFiles.restaurantPhoto
                              ? "File Selected"
                              : ownerVerification?.restaurant?.photo
                                ? "Uploaded"
                                : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="w-full">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                          Description
                        </p>
                        <p className="text-sm font-medium text-gray-900 break-all">
                          {verificationForm.restaurantDescription}
                        </p>
                      </div>

                      <hr className="border-gray-200" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            Bank Name
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {bankForm.bank}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            Bank Account Number
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {bankForm.accountNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={showStatusOnly || step === 0}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium text-base hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Back
            </button>

            {showStatusOnly ? null : step < 3 ? (
              <button
                type="button"
                onClick={handleContinue}
                disabled={!isStepValid()}
                className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium text-base hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={submitVerificationLoading || verificationLoading}
                className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium text-base hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {submitVerificationLoading
                  ? "Submitting..."
                  : status === "pending"
                    ? "Resubmit Verification"
                    : "Submit for Verification"}
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Verify;
