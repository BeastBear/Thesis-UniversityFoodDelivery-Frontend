import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../config";
import { FaFileContract } from "react-icons/fa";
import DeliveryPageHero from "../components/Delivery/DeliveryPageHero";
import { useNavigate } from "react-router-dom";

function DeliveryContract() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [deliveryVerification, setDeliveryVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  const studentIdNumber = useMemo(() => {
    if (!userData) return "—";
    return (
      userData.studentIdNumber ||
      userData.studentIDNumber ||
      userData.studentId ||
      userData.studentID ||
      userData.studentNumber ||
      userData.studentNo ||
      "—"
    );
  }, [userData]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchStatus = async () => {
      if (!userData?._id) return;
      
      setLoading(true);
      try {
        const url = `${serverUrl}/api/delivery/status`;
        const res = await axios.get(url, {
          withCredentials: true,
        });
        
        if (isMounted) {
          setDeliveryVerification(res?.data || null);
        }
      } catch (e) {
        console.error("Failed to fetch delivery status:", e);
        if (isMounted) {
          setDeliveryVerification(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStatus();
    
    return () => {
      isMounted = false;
    };
  }, [userData?._id]);

  const verificationStatus = useMemo(() => 
    deliveryVerification?.status || "unverified"
  , [deliveryVerification]);

  const verificationLabel = useMemo(() => {
    switch (verificationStatus) {
      case "pending": return "Pending";
      case "verified": return "Verified";
      case "rejected": return "Rejected";
      default: return "Unverified";
    }
  }, [verificationStatus]);

  const verificationClasses = useMemo(() => {
    switch (verificationStatus) {
      case "verified": return "bg-green-50 text-green-700 border-green-200";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-white text-gray-700 border-gray-200";
    }
  }, [verificationStatus]);

  const submittedAtLabel = useMemo(() => 
    deliveryVerification?.submittedAt
      ? new Date(deliveryVerification.submittedAt).toLocaleString()
      : "—"
  , [deliveryVerification?.submittedAt]);

  const verifiedAtLabel = useMemo(() => 
    deliveryVerification?.verifiedAt
      ? new Date(deliveryVerification.verifiedAt).toLocaleString()
      : "—"
  , [deliveryVerification?.verifiedAt]);


  return (
    <div className="w-full relative min-h-screen">
      <div className="w-full max-w-[900px] mx-auto flex flex-col px-4 pt-3 sm:pt-6 gap-3 sm:gap-6 pb-28">
        <DeliveryPageHero
          eyebrow="DELIVERER"
          title="Contract"
          description="Review your verification status and saved deliverer details."
          icon={<FaFileContract size={22} />}
          onBack={() => navigate(-1)}
        />

        <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6">
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
              {loading ? "Loading" : verificationLabel}
            </div>
          </div>

          {verificationStatus === "rejected" &&
          deliveryVerification?.rejectionReason ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="text-xs font-black tracking-[0.14em] text-red-700">
                REASON
              </div>
              <div className="text-sm text-red-700 mt-1 font-bold">
                {deliveryVerification.rejectionReason}
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                SUBMITTED AT
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {loading ? "—" : submittedAtLabel}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                VERIFIED AT
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {loading ? "—" : verifiedAtLabel}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6">
          <div className="text-xs font-black tracking-[0.14em] text-slate-500">
            DELIVERER
          </div>
          <div className="mt-0.5 text-base sm:text-lg font-extrabold text-slate-900">
            Deliverer Details
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
                ID NUMBER
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900 font-mono break-all">
                {loading ? "—" : deliveryVerification?.profile?.idNumber || "—"}
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
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6">
          <div className="text-xs font-black tracking-[0.14em] text-slate-500">
            STUDENT
          </div>
          <div className="mt-0.5 text-base sm:text-lg font-extrabold text-slate-900">
            Student Details
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                STUDENT ID NUMBER
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900 font-mono break-all">
                {loading
                  ? "—"
                  : deliveryVerification?.studentInfo?.studentIdNumber ||
                    studentIdNumber}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                FACULTY
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {loading
                  ? "—"
                  : deliveryVerification?.studentInfo?.faculty || "—"}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                MAJOR
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {loading
                  ? "—"
                  : deliveryVerification?.studentInfo?.major || "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-6">
          <div className="text-xs font-black tracking-[0.14em] text-slate-500">
            BANK
          </div>
          <div className="mt-0.5 text-base sm:text-lg font-extrabold text-slate-900">
            Bank Account Details
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                ACCOUNT NAME
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {userData?.ePaymentAccount?.accountName || "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                BANK
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {userData?.ePaymentAccount?.bank || "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 sm:col-span-2">
              <div className="text-xs font-black tracking-[0.14em] text-slate-500">
                ACCOUNT NUMBER
              </div>
              <div className="mt-1 text-sm font-extrabold text-slate-900 font-mono break-all">
                {userData?.ePaymentAccount?.accountNumber || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeliveryContract;
