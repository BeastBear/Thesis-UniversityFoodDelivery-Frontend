import React, { useEffect, useState } from "react";
import {
  FaUserShield,
  FaCheck,
  FaTimes,
  FaIdCard,
  FaExternalLinkAlt,
  FaFolderOpen,
} from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../../App";
import { toast } from "react-toastify";

const AdminVerifications = () => {
  const [delivererVerifications, setDelivererVerifications] = useState([]);
  const [ownerVerifications, setOwnerVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("owner");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const [deliverersRes, ownersRes] = await Promise.all([
        axios.get(`${serverUrl}/api/admin/verifications`, {
          withCredentials: true,
        }),
        axios.get(`${serverUrl}/api/admin/owner-verifications`, {
          withCredentials: true,
        }),
      ]);
      setDelivererVerifications(deliverersRes.data);
      setOwnerVerifications(ownersRes.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load verifications");
      setLoading(false);
    }
  };

  const openDetails = (user) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  const closeDetails = () => {
    setDetailOpen(false);
    setSelectedUser(null);
    setRejectOpen(false);
    setRejectReason("");
  };

  const openRejectDialog = () => {
    setRejectReason("");
    setRejectOpen(true);
  };

  const closeRejectDialog = () => {
    if (rejectSubmitting) return;
    setRejectOpen(false);
    setRejectReason("");
  };

  const isProbablyImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    const cleaned = url.split("?")[0].toLowerCase();
    return (
      cleaned.endsWith(".png") ||
      cleaned.endsWith(".jpg") ||
      cleaned.endsWith(".jpeg") ||
      cleaned.endsWith(".webp") ||
      cleaned.endsWith(".gif")
    );
  };

  const getDocItems = (user, activeTab) => {
    if (!user) return [];
    if (activeTab === "deliverer") {
      const docs = user.deliveryVerification?.documents || {};
      return [{ label: "Student Card", url: docs.studentCard || "" }].filter(
        (d) => d.url,
      );
    }

    const ov = user.ownerVerification || {};
    const kyc = ov.kyc || {};
    const kyb = ov.kyb || {};
    const financial = ov.financial || {};
    const restaurant = ov.restaurant || {};
    return [
      { label: "Restaurant Photo", url: restaurant.photo || "" },
      { label: "ID Front", url: kyc.idFrontImage || "" },
      { label: "ID Back", url: kyc.idBackImage || "" },
      {
        label: "Commercial Registration",
        url: kyb.commercialRegistration || "",
      },
      { label: "Storefront Photo", url: kyb.storefrontPhoto || "" },
      { label: "Kitchen Photo", url: kyb.kitchenPhoto || "" },
      { label: "Bookbank Header", url: financial.bookbankHeaderPhoto || "" },
    ].filter((d) => d.url);
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const getStatusBadgeClasses = (status) => {
    if (status === "verified") {
      return "bg-green-100 text-green-700";
    }
    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }
    if (status === "pending") {
      return "bg-yellow-100 text-yellow-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  const handleVerifyDeliverer = async (
    userId,
    status,
    rejectionReason = "",
  ) => {
    try {
      await axios.put(
        `${serverUrl}/api/admin/verify-delivery-boy/${userId}`,
        { status, rejectionReason },
        { withCredentials: true },
      );
      toast.success(`User ${status} successfully`);
      fetchVerifications();
      closeRejectDialog();
      closeDetails();
    } catch (error) {
      toast.error("Failed to verify user");
    }
  };

  const handleVerifyOwner = async (userId, status, rejectionReason = "") => {
    try {
      await axios.put(
        `${serverUrl}/api/admin/verify-owner/${userId}`,
        { status, rejectionReason },
        { withCredentials: true },
      );
      toast.success(`Owner ${status} successfully`);
      fetchVerifications();
      closeRejectDialog();
      closeDetails();
    } catch (error) {
      toast.error("Failed to verify owner");
    }
  };

  const submitRejection = async () => {
    const reason = rejectReason.trim();
    if (!selectedUser?._id) {
      toast.error("No user selected");
      return;
    }
    if (!reason) {
      toast.error("Rejection reason is required");
      return;
    }

    setRejectSubmitting(true);
    try {
      if (tab === "deliverer") {
        await handleVerifyDeliverer(selectedUser._id, "rejected", reason);
      } else {
        await handleVerifyOwner(selectedUser._id, "rejected", reason);
      }
    } finally {
      setRejectSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900">Verifications</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("owner")}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
              tab === "owner"
                ? "bg-orange-50 text-orange-700 border-orange-200"
                : "bg-white text-gray-600 border-gray-200 hover:bg-white"
            }`}>
            Owner ({ownerVerifications.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("deliverer")}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
              tab === "deliverer"
                ? "bg-orange-50 text-orange-700 border-orange-200"
                : "bg-white text-gray-600 border-gray-200 hover:bg-white"
            }`}>
            Deliverer ({delivererVerifications.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            {(tab === "deliverer"
              ? delivererVerifications
              : ownerVerifications
            ).map((user) => {
              const status =
                tab === "deliverer"
                  ? user.deliveryVerification?.status || "pending"
                  : user.ownerVerification?.status || "pending";

              return (
                <div
                  key={user._id}
                  className="rounded-2xl border border-gray-100 bg-white hover:bg-white transition-colors">
                  <div className="p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
                          <FaUserShield />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-extrabold text-gray-900 truncate">
                              {user.fullName}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusBadgeClasses(
                                status,
                              )}`}>
                              {status}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600 truncate">
                            {user.email || "—"}
                            <span className="mx-2 text-gray-300">|</span>
                            {user.mobile || "—"}
                          </div>
                          <div className="mt-1 text-xs text-gray-400 font-mono">
                            ID: {user._id}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      {tab === "owner" ? (
                        <div className="rounded-xl border border-gray-100 bg-white p-4 lg:col-span-2">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Restaurant
                          </div>
                          <div className="mt-3 flex items-start gap-4">
                            {user.ownerVerification?.restaurant?.photo ? (
                              <img
                                src={user.ownerVerification.restaurant.photo}
                                alt="Restaurant"
                                className="w-16 h-16 rounded-xl object-cover border border-gray-100"
                              />
                            ) : null}
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-gray-900 truncate">
                                {user.ownerVerification?.restaurant?.name ||
                                  "—"}
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                {user.ownerVerification?.restaurant
                                  ?.cafeteria || "—"}
                                <span className="mx-2 text-gray-300">|</span>
                                {user.ownerVerification?.restaurant
                                  ?.restaurantNumber || "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-gray-100 bg-white p-4 lg:col-span-2">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Deliverer Verification
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Submitted:{" "}
                            {formatDateTime(
                              user.deliveryVerification?.submittedAt,
                            )}
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-gray-100 bg-white p-4">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Review
                        </div>
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          <div>
                            Submitted:{" "}
                            {formatDateTime(
                              tab === "deliverer"
                                ? user.deliveryVerification?.submittedAt
                                : user.ownerVerification?.submittedAt,
                            )}
                          </div>
                          <div>Open details to approve or reject.</div>
                        </div>
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => openDetails(user)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-all">
                            <FaIdCard /> Review & Decide
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {(tab === "deliverer" ? delivererVerifications : ownerVerifications)
              .length === 0 ? (
              <div className="p-10 text-center">
                <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <FaFolderOpen size={22} />
                  </div>
                  <div className="font-medium">No pending verifications.</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {detailOpen && selectedUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true">
          <button
            type="button"
            onClick={closeDetails}
            className="absolute inset-0 bg-black/40"
            aria-label="Close verification details"
          />
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-extrabold text-gray-900">
                  Verification Details
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {tab === "owner" ? "Owner (Restaurant)" : "Deliverer"}
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200">
                Close
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-100 p-4 lg:col-span-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Applicant
                  </div>
                  <div className="mt-2">
                    <div className="text-base font-extrabold text-gray-900">
                      {selectedUser.fullName || "—"}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {selectedUser.email || "—"}
                      <span className="mx-2 text-gray-300">|</span>
                      {selectedUser.mobile || "—"}
                    </div>
                    <div className="mt-2 text-xs text-gray-400 font-mono">
                      User ID: {selectedUser._id}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 p-4">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </div>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-yellow-100 text-yellow-700">
                      {tab === "deliverer"
                        ? selectedUser.deliveryVerification?.status ||
                          "unverified"
                        : selectedUser.ownerVerification?.status ||
                          "unverified"}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    <div>
                      Submitted:{" "}
                      {formatDateTime(
                        tab === "deliverer"
                          ? selectedUser.deliveryVerification?.submittedAt
                          : selectedUser.ownerVerification?.submittedAt,
                      )}
                    </div>
                    <div>
                      Verified:{" "}
                      {formatDateTime(
                        tab === "deliverer"
                          ? selectedUser.deliveryVerification?.verifiedAt
                          : selectedUser.ownerVerification?.verifiedAt,
                      )}
                    </div>
                    {(
                      tab === "deliverer"
                        ? selectedUser.deliveryVerification?.rejectionReason
                        : selectedUser.ownerVerification?.rejectionReason
                    ) ? (
                      <div className="pt-2 text-red-600">
                        Rejection:{" "}
                        {tab === "deliverer"
                          ? selectedUser.deliveryVerification?.rejectionReason
                          : selectedUser.ownerVerification?.rejectionReason}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {tab === "deliverer" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-gray-100 p-4 lg:col-span-2">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Deliverer Verification
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          ID Number
                        </div>
                        <div className="mt-1 font-extrabold text-gray-900">
                          {selectedUser.deliveryVerification?.profile
                            ?.idNumber || "—"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Student ID Number
                        </div>
                        <div className="mt-1 font-extrabold text-gray-900">
                          {selectedUser.deliveryVerification?.studentInfo
                            ?.studentIdNumber || "—"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Faculty
                        </div>
                        <div className="mt-1 font-extrabold text-gray-900">
                          {selectedUser.deliveryVerification?.studentInfo
                            ?.faculty || "—"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-white p-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Major
                        </div>
                        <div className="mt-1 font-extrabold text-gray-900">
                          {selectedUser.deliveryVerification?.studentInfo
                            ?.major || "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Payout / Bank (Deliverer)
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Used to pay out earnings to the deliverer.
                    </div>
                    <div className="mt-3 text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-semibold text-gray-900">
                          Bank:
                        </span>{" "}
                        {selectedUser.ePaymentAccount?.bank || "—"}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">
                          Account Name:
                        </span>{" "}
                        {selectedUser.ePaymentAccount?.accountName || "—"}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">
                          Account No:
                        </span>{" "}
                        {selectedUser.ePaymentAccount?.accountNumber || "—"}
                      </div>
                      {selectedUser.ePaymentAccount?.branch ? (
                        <div>
                          <span className="font-semibold text-gray-900">
                            Branch:
                          </span>{" "}
                          {selectedUser.ePaymentAccount.branch}
                        </div>
                      ) : null}
                      {selectedUser.ePaymentAccount?.applicationId ? (
                        <div>
                          <span className="font-semibold text-gray-900">
                            Application ID:
                          </span>{" "}
                          {selectedUser.ePaymentAccount.applicationId}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === "owner" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-gray-100 p-4 lg:col-span-2">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </div>
                    <div className="mt-4 flex items-start gap-5">
                      {selectedUser.ownerVerification?.restaurant?.photo ? (
                        <div className="w-36">
                          <img
                            src={
                              selectedUser.ownerVerification.restaurant.photo
                            }
                            alt="Restaurant"
                            className="w-36 h-28 rounded-2xl object-cover border border-gray-100"
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-extrabold text-gray-900">
                          {selectedUser.ownerVerification?.restaurant?.name ||
                            "—"}
                        </div>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="font-semibold text-gray-900">
                              Cafeteria:
                            </span>{" "}
                            {selectedUser.ownerVerification?.restaurant
                              ?.cafeteria || "—"}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">
                              Number:
                            </span>{" "}
                            {selectedUser.ownerVerification?.restaurant
                              ?.restaurantNumber || "—"}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">
                              Description:
                            </span>{" "}
                            {selectedUser.ownerVerification?.restaurant
                              ?.description || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedUser.ownerVerification?.bank?.bank ||
                  selectedUser.ownerVerification?.bank?.accountName ||
                  selectedUser.ownerVerification?.bank?.accountNumber ? (
                    <div className="rounded-2xl border border-gray-100 p-4">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Payout / Bank (Owner)
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Used to pay out earnings to the owner.
                      </div>
                      <div className="mt-3 text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-semibold text-gray-900">
                            Bank:
                          </span>{" "}
                          {selectedUser.ownerVerification?.bank?.bank || "—"}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">
                            Account Name:
                          </span>{" "}
                          {selectedUser.ownerVerification?.bank?.accountName ||
                            "—"}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">
                            Account No:
                          </span>{" "}
                          {selectedUser.ownerVerification?.bank
                            ?.accountNumber || "—"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gray-100 p-4">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Payout / Bank (Owner)
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        No bank details provided.
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              <div>
                <div className="text-sm font-extrabold text-gray-900">
                  Documents
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getDocItems(selectedUser, tab).length ? (
                    getDocItems(selectedUser, tab).map((doc) => (
                      <div
                        key={doc.label}
                        className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-bold text-gray-900">
                            {doc.label}
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-2">
                            Open <FaExternalLinkAlt />
                          </a>
                        </div>
                        {isProbablyImageUrl(doc.url) ? (
                          <img
                            src={doc.url}
                            alt={doc.label}
                            className="mt-3 w-full h-48 object-cover rounded-xl border border-gray-100"
                          />
                        ) : (
                          <div className="mt-3 text-xs text-gray-500">
                            Preview not available. Use Open to view.
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      No documents found.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    tab === "deliverer"
                      ? handleVerifyDeliverer(selectedUser._id, "verified")
                      : handleVerifyOwner(selectedUser._id, "verified")
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-all">
                  <FaCheck /> Approve
                </button>
                <button
                  type="button"
                  onClick={openRejectDialog}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all">
                  <FaTimes /> Reject
                </button>
              </div>
            </div>

            {rejectOpen ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                <button
                  type="button"
                  onClick={closeRejectDialog}
                  className="absolute inset-0 bg-black/40"
                  aria-label="Close rejection dialog"
                />
                <div className="relative w-full max-w-lg rounded-3xl bg-white border border-gray-100 shadow-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-extrabold text-gray-900">
                        Rejection Reason
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Provide a clear reason so the user can fix and resubmit.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closeRejectDialog}
                      className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200">
                      Close
                    </button>
                  </div>

                  <div className="p-6">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Reason
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={4}
                      placeholder="e.g. Restaurant photo is unclear. Please upload a clear front photo."
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />

                    <div className="mt-5 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeRejectDialog}
                        disabled={rejectSubmitting}
                        className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 disabled:opacity-60">
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={submitRejection}
                        disabled={rejectSubmitting}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-60">
                        <FaTimes />{" "}
                        {rejectSubmitting ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminVerifications;
