import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaSearch,
  FaBan,
  FaCheckCircle,
  FaEllipsisV,
} from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../../App";
import { toast } from "react-toastify";

import Pagination from "../../components/ui/Pagination";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // New status filter
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const itemsPerPage = 8;
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleEditOpen, setRoleEditOpen] = useState(false);
  const [roleEditUser, setRoleEditUser] = useState(null);
  const [roleEditValue, setRoleEditValue] = useState("user");
  const [roleSaving, setRoleSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${serverUrl}/api/admin/users`, {
        withCredentials: true,
      });
      setUsers(res.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load users");
      setLoading(false);
    }
  };

  const openRoleEditor = (user) => {
    setRoleEditUser(user);
    setRoleEditValue(user?.role || "user");
    setRoleEditOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleEditUser?._id) return;

    try {
      setRoleSaving(true);
      await axios.put(
        `${serverUrl}/api/admin/user/${roleEditUser._id}/role`,
        { role: roleEditValue },
        { withCredentials: true },
      );
      toast.success("User role updated");
      setRoleEditOpen(false);
      setRoleEditUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update role");
    } finally {
      setRoleSaving(false);
    }
  };

  const handleToggleSuspension = async (userId, currentStatus) => {
    if (
      !window.confirm(
        `Are you sure you want to ${currentStatus ? "unban" : "ban"} this user?`,
      )
    )
      return;

    try {
      await axios.put(
        `${serverUrl}/api/admin/user/${userId}/suspend`,
        { isSuspended: !currentStatus },
        { withCredentials: true },
      );
      toast.success(
        `User ${!currentStatus ? "banned" : "unbanned"} successfully`,
      );
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const filteredUsers = users.filter((user) => {
    // Role Filter
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    // Status Filter
    if (statusFilter === "active" && user.isSuspended) return false;
    if (statusFilter === "suspended" && !user.isSuspended) return false;

    // Search Filter
    const searchLower = searchTerm.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.mobile?.includes(searchLower)
    );
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {detailOpen && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true">
          <button
            type="button"
            onClick={() => setDetailOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Close user details"
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  User Details
                </div>
                <div className="text-xl font-extrabold text-gray-900 mt-1 truncate">
                  {selectedUser.fullName || "User"}
                </div>
                <div className="text-sm text-gray-500 mt-1 break-all">
                  {selectedUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="shrink-0 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-colors">
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-xl shrink-0">
                  {String(selectedUser.fullName || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                    UserId
                  </div>
                  <div className="text-sm text-gray-700 font-mono break-all">
                    {selectedUser._id}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Role
                  </div>
                  <div className="mt-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold capitalize tracking-wide bg-purple-100 text-purple-700">
                      {selectedUser.role || "user"}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Status
                  </div>
                  <div className="mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        selectedUser.isSuspended
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                      {selectedUser.isSuspended ? "Suspended" : "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {selectedUser.mobile && (
                <div className="bg-white rounded-2xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Mobile
                  </div>
                  <div className="mt-2 text-sm font-bold text-gray-900">
                    {selectedUser.mobile}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {roleEditOpen && roleEditUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true">
          <button
            type="button"
            onClick={() => {
              if (roleSaving) return;
              setRoleEditOpen(false);
              setRoleEditUser(null);
            }}
            className="absolute inset-0 bg-black/40"
            aria-label="Close edit role"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Edit Role
                </div>
                <div className="text-lg font-extrabold text-gray-900 mt-1 truncate">
                  {roleEditUser.fullName || "User"}
                </div>
                <div className="text-sm text-gray-500 mt-1 break-all">
                  {roleEditUser.email}
                </div>
              </div>
              <button
                type="button"
                disabled={roleSaving}
                onClick={() => {
                  if (roleSaving) return;
                  setRoleEditOpen(false);
                  setRoleEditUser(null);
                }}
                className="shrink-0 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-colors disabled:opacity-60">
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Role
                </div>
                <select
                  value={roleEditValue}
                  onChange={(e) => setRoleEditValue(e.target.value)}
                  disabled={roleSaving}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-bold text-sm text-gray-900 disabled:opacity-60">
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                  <option value="deliveryBoy">DeliveryBoy</option>
                  <option value="user">User</option>
                </select>
                <div className="mt-2 text-xs text-gray-400">
                  Choose one of the allowed roles.
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={roleSaving}
                onClick={() => {
                  if (roleSaving) return;
                  setRoleEditOpen(false);
                  setRoleEditUser(null);
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-60">
                Cancel
              </button>
              <button
                type="button"
                disabled={roleSaving || !roleEditValue}
                onClick={handleSaveRole}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-60 disabled:active:scale-100">
                {roleSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
            {[
              { key: "all", label: "All Roles" },
              { key: "admin", label: "Admin" },
              { key: "owner", label: "Owner" },
              { key: "deliveryBoy", label: "Rider" },
              { key: "user", label: "User" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setRoleFilter(t.key);
                  setCurrentPage(1); // Reset to page 1 on filter change
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  roleFilter === t.key
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-white"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
            {[
              { key: "all", label: "All Status" },
              { key: "active", label: "Active" },
              { key: "suspended", label: "Banned" },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  setStatusFilter(s.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === s.key
                    ? "bg-gray-800 text-white shadow-sm"
                    : "text-gray-500 hover:bg-white"
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-auto">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64 text-sm font-medium"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/50 text-gray-400 text-[11px] font-black uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 pl-6">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentUsers.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-white/80 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xs">
                        {user.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {user.fullName}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold tracking-wide">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 font-medium">
                    {user.email}
                    {user.mobile && (
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {user.mobile}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide 
                                 ${
                                   user.role === "admin"
                                     ? "bg-purple-100 text-purple-700"
                                     : user.role === "owner"
                                       ? "bg-emerald-100 text-emerald-700"
                                       : user.role === "deliveryBoy"
                                         ? "bg-blue-100 text-blue-700"
                                         : "bg-orange-100 text-orange-700"
                                 }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.isSuspended ? (
                      <span className="flex items-center gap-1 text-red-600 text-[10px] font-black uppercase tracking-wide">
                        <FaBan size={10} /> Suspended
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 text-[10px] font-black uppercase tracking-wide">
                        <FaCheckCircle size={10} /> Active
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuUserId((prev) =>
                            prev === user._id ? null : user._id,
                          )
                        }
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
                        aria-label="Open user actions">
                        <FaEllipsisV size={12} />
                      </button>

                      {openMenuUserId === user._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-20">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setDetailOpen(true);
                              setOpenMenuUserId(null);
                            }}
                            className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-white flex items-center gap-2">
                            <FaUser className="text-gray-400" /> View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuUserId(null);
                              openRoleEditor(user);
                            }}
                            className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-white flex items-center gap-2">
                            <FaCheckCircle className="text-gray-400" /> Edit
                            Role
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuUserId(null);
                              handleToggleSuspension(
                                user._id,
                                user.isSuspended,
                              );
                            }}
                            className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-red-50 flex items-center gap-2 ${
                              user.isSuspended
                                ? "text-green-600"
                                : "text-red-600"
                            }`}>
                            <FaBan
                              className={
                                user.isSuspended
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            />
                            {user.isSuspended ? "Unban User" : "Ban User"}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-12 text-center text-gray-400 font-medium">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                        <FaSearch className="text-gray-300 text-xl" />
                      </div>
                      <p>No users found matching your search.</p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setRoleFilter("all");
                          setStatusFilter("all");
                        }}
                        className="mt-2 text-purple-600 font-bold hover:underline">
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white/30">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredUsers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
