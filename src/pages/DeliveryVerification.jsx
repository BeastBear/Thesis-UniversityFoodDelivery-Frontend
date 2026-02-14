import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import DeliveryPageHero from "../components/Delivery/DeliveryPageHero";
import { useNavigate } from "react-router-dom";

import {
  FaIdCard,
  FaCheckCircle,
  FaExclamationCircle,
  FaClock,
} from "react-icons/fa";

function DeliveryVerification() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const [step, setStep] = useState(0);
  const [studentCard, setStudentCard] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [pageMessage, setPageMessage] = useState(null);
  const [profileForm, setProfileForm] = useState({
    idNumber: "",
  });
  const [studentForm, setStudentForm] = useState({
    studentIdNumber: "",
    faculty: "",
    major: "",
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [savingProfileImage, setSavingProfileImage] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountName: "",
    bank: "",
    accountNumber: "",
    applicationId: "",
  });

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  useEffect(() => {
    if (verificationStatus?.status === "verified") {
      navigate("/", { replace: true });
    } else if (verificationStatus?.status === "pending") {
      setStep(0);
    }
  }, [verificationStatus?.status, navigate]);

  useEffect(() => {
    const p = verificationStatus?.profile;
    const s = verificationStatus?.studentInfo;
    setProfileForm({
      idNumber: p?.idNumber || "",
    });
    setStudentForm({
      studentIdNumber: s?.studentIdNumber || "",
      faculty: s?.faculty || "",
      major: s?.major || "",
    });
  }, [
    verificationStatus?.profile?.idNumber,
    verificationStatus?.studentInfo?.studentIdNumber,
    verificationStatus?.studentInfo?.faculty,
    verificationStatus?.studentInfo?.major,
  ]);

  useEffect(() => {
    const ep = userData?.ePaymentAccount;
    setBankForm({
      accountName: ep?.accountName || "",
      bank: ep?.bank || "",
      accountNumber: ep?.accountNumber || "",
      applicationId: ep?.applicationId || "",
    });
  }, [
    userData?.ePaymentAccount?.accountName,
    userData?.ePaymentAccount?.bank,
    userData?.ePaymentAccount?.accountNumber,
    userData?.ePaymentAccount?.applicationId,
  ]);

  const fetchVerificationStatus = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/delivery/status`, {
        withCredentials: true,
      });
      setVerificationStatus(res.data);
      if (
        res.data?.status === "verified" &&
        userData?.deliveryVerificationStatus !== "verified"
      ) {
        dispatch(
          setUserData({ ...userData, deliveryVerificationStatus: "verified" }),
        );
      }
      setFetchingStatus(false);
    } catch (error) {
      setFetchingStatus(false);
    }
  };

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPageMessage({
          type: "error",
          text: "File size must be less than 5MB",
        });
        return;
      }
      setFile(file);
    }
  };

  const handleRemoveFile = (setFile) => {
    setFile(null);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentForm((prev) => ({ ...prev, [name]: value }));
  };

  const uploadProfileImage = async (file) => {
    if (!file) return;
    try {
      setSavingProfileImage(true);
      setPageMessage(null);

      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.put(
        `${serverUrl}/api/user/update-profile`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );

      dispatch(setUserData(res.data));
      setProfileImageFile(null);
      setPageMessage({ type: "success", text: "Profile picture updated" });
    } catch (error) {
      setPageMessage({
        type: "error",
        text:
          error?.response?.data?.message || "Failed to update profile picture",
      });
    } finally {
      setSavingProfileImage(false);
    }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0] || null;
    setProfileImageFile(file);
    await uploadProfileImage(file);
  };

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, {
        withCredentials: true,
      });
    } catch (error) {
      // ignore
    } finally {
      dispatch(setUserData(null));
      navigate("/signin", { replace: true });
    }
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!profileForm.idNumber.trim()) {
      setPageMessage({ type: "error", text: "ID Number is required" });
      return;
    }

    if (!studentForm.studentIdNumber.trim()) {
      setPageMessage({ type: "error", text: "Student ID Number is required" });
      return;
    }

    if (!studentForm.faculty.trim()) {
      setPageMessage({ type: "error", text: "Faculty is required" });
      return;
    }

    if (!studentForm.major.trim()) {
      setPageMessage({ type: "error", text: "Major is required" });
      return;
    }

    if (!studentCard) {
      setPageMessage({ type: "error", text: "Student ID Card is required" });
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${serverUrl}/api/user/update-bank-account`,
        {
          accountName: bankForm.accountName,
          bank: bankForm.bank,
          branch: "",
          accountNumber: bankForm.accountNumber,
          applicationId: bankForm.applicationId,
        },
        { withCredentials: true },
      );

      if (userData) {
        dispatch(
          setUserData({
            ...userData,
            ePaymentAccount:
              res.data?.ePaymentAccount || userData.ePaymentAccount,
          }),
        );
      }
    } catch (error) {
      setPageMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to update bank account",
      });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("studentCard", studentCard);
    formData.append("idNumber", profileForm.idNumber);
    formData.append("studentIdNumber", studentForm.studentIdNumber);
    formData.append("faculty", studentForm.faculty);
    formData.append("major", studentForm.major);

    try {
      await axios.post(`${serverUrl}/api/delivery/verify`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setPageMessage({
        type: "success",
        text: "Documents submitted successfully",
      });
      fetchVerificationStatus();
      setStudentCard(null);
    } catch (error) {
      setPageMessage({ type: "error", text: "Failed to upload documents" });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingStatus) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  const status = verificationStatus?.status || "unverified";
  const canUpload = status !== "verified" && status !== "pending";
  const isSubmittingDisabled = loading || !studentCard || !canUpload;

  const showStatusOnly = status === "pending" || status === "verified";

  const isStepValid = () => {
    if (step === 0) {
      return !!profileForm.idNumber.trim();
    }
    if (step === 1) {
      return (
        !!studentForm.studentIdNumber.trim() &&
        !!studentForm.faculty.trim() &&
        !!studentForm.major.trim() &&
        !!studentCard
      );
    }
    if (step === 2) {
      return (
        !!(bankForm.accountName || "").trim() &&
        !!(bankForm.bank || "").trim() &&
        !!(bankForm.accountNumber || "").trim()
      );
    }
    return true;
  };

  const isAllValid = () => {
    return (
      !!profileForm.idNumber.trim() &&
      !!studentForm.studentIdNumber.trim() &&
      !!studentForm.faculty.trim() &&
      !!studentForm.major.trim() &&
      !!studentCard &&
      !!(bankForm.accountName || "").trim() &&
      !!(bankForm.bank || "").trim() &&
      !!(bankForm.accountNumber || "").trim()
    );
  };

  const verificationLabel =
    status === "pending"
      ? "Pending"
      : status === "verified"
        ? "Verified"
        : status === "rejected"
          ? "Rejected"
          : "Unverified";

  const verificationClasses =
    status === "verified"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "pending"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : status === "rejected"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-white text-gray-700 border-gray-200";

  return (
    <div className="w-full max-w-[900px] mx-auto flex flex-col px-4 pt-3 sm:pt-6 gap-3 sm:gap-6 pb-28">
      <DeliveryPageHero
        eyebrow="VERIFICATION"
        title="Deliverer Verification"
        description="Upload your documents to unlock the delivery workflow."
        icon={<FaIdCard size={22} />}
      />

      {pageMessage ? (
        <div
          className={`rounded-3xl border p-4 text-sm font-bold shadow-sm ${
            pageMessage.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-red-50 border-red-100 text-red-700"
          }`}>
          {pageMessage.text}
        </div>
      ) : null}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black tracking-[0.14em] text-slate-500">
              VERIFICATION
            </div>
            <div className="mt-0.5 text-base sm:text-lg font-extrabold text-slate-900">
              Verification Status
            </div>
          </div>
          <div
            className={`px-3 py-1.5 rounded-2xl text-sm font-extrabold border ${verificationClasses}`}>
            {verificationLabel}
          </div>
        </div>

        {status === "rejected" && verificationStatus?.rejectionReason ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="text-xs font-black tracking-[0.14em] text-red-700">
              REASON
            </div>
            <div className="text-sm text-red-700 mt-1 font-bold">
              {verificationStatus.rejectionReason}
            </div>
          </div>
        ) : null}

        {showStatusOnly ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                SUBMITTED AT
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {verificationStatus?.submittedAt
                  ? new Date(verificationStatus.submittedAt).toLocaleString()
                  : "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                VERIFIED AT
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {verificationStatus?.verifiedAt
                  ? new Date(verificationStatus.verifiedAt).toLocaleString()
                  : "—"}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {userData?.role === "deliveryBoy" ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-red-600 text-white font-extrabold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors">
            Logout
          </button>
        </div>
      ) : null}

      {!showStatusOnly ? (
        <>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                STEP {step + 1} / 3
              </div>
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                {step === 0 ? "PROFILE" : step === 1 ? "STUDENT" : "BANK"}
              </div>
            </div>

            {step === 0 ? (
              <>
                <div className="mt-2 text-base sm:text-lg font-extrabold text-slate-900">
                  Profile Info
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                    PROFILE PICTURE
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    {userData?.profileImage ? (
                      <img
                        src={userData.profileImage}
                        alt="Profile"
                        className="w-14 h-14 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-white border border-slate-200" />
                    )}

                    <div className="flex-1 min-w-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                      FULL NAME
                    </div>
                    <div className="mt-1 text-sm font-extrabold text-slate-900">
                      {userData?.fullName || "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                      EMAIL
                    </div>
                    <div className="mt-1 text-sm font-extrabold text-slate-900">
                      {userData?.email || "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                      MOBILE
                    </div>
                    <div className="mt-1 text-sm font-extrabold text-slate-900">
                      {userData?.mobile || "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      ID Number
                    </label>
                    <input
                      type="text"
                      name="idNumber"
                      value={profileForm.idNumber}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter ID number"
                    />
                  </div>
                </div>
              </>
            ) : step === 1 ? (
              <>
                <div className="mt-2 text-base sm:text-lg font-extrabold text-slate-900">
                  Student Info
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Student ID Number
                    </label>
                    <input
                      type="text"
                      name="studentIdNumber"
                      value={studentForm.studentIdNumber}
                      onChange={handleStudentChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter student ID number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Faculty
                    </label>
                    <input
                      type="text"
                      name="faculty"
                      value={studentForm.faculty}
                      onChange={handleStudentChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter faculty"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Major
                    </label>
                    <input
                      type="text"
                      name="major"
                      value={studentForm.major}
                      onChange={handleStudentChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter major"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                    STUDENT ID CARD
                  </div>
                  <div className="mt-3">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!canUpload}
                      onChange={(e) => handleFileChange(e, setStudentCard)}
                      className="w-full"
                    />
                    {studentCard ? (
                      <div className="mt-2 text-xs text-gray-500 font-semibold">
                        Selected: {studentCard.name}
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 text-base sm:text-lg font-extrabold text-slate-900">
                  Bank Info
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Use your own bank account details for payouts.
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">
                      Account Name
                    </div>
                    <input
                      type="text"
                      name="accountName"
                      value={bankForm.accountName}
                      onChange={handleBankChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter account name"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">
                      Bank
                    </div>
                    <input
                      type="text"
                      name="bank"
                      value={bankForm.bank}
                      onChange={handleBankChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter bank"
                    />
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter account number"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium text-base hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Back
              </button>

              {step < 2 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(2, s + 1))}
                  disabled={!isStepValid()}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium text-base hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading || !canUpload || !isAllValid()}
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium text-base hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default DeliveryVerification;
