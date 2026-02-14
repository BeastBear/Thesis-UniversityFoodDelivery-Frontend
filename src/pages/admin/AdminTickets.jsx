import React, { useEffect, useState } from "react";
import {
  FaTicketAlt,
  FaSearch,
  FaCheckDouble,
  FaExclamationCircle,
  FaFolderOpen,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../../App";
import AdminTicketSubjects from "./AdminTicketSubjects";

const AdminTickets = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tickets");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${serverUrl}/api/tickets/all`, {
        withCredentials: true,
      });
      setTickets(res.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, status) => {
    try {
      await axios.put(
        `${serverUrl}/api/tickets/${ticketId}/update`,
        { status },
        { withCredentials: true },
      );
      fetchTickets();
    } catch (error) {}
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.priority?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket._id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const priorityBadgeClass = (p) => {
    if (p === "High") return "bg-red-100 text-red-700";
    if (p === "Medium") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-600";
  };

  const statusBadgeClass = (status) => {
    if (status === "Resolved") return "bg-green-100 text-green-700";
    if (status === "Closed") return "bg-gray-100 text-gray-600";
    if (status === "In Progress") return "bg-yellow-100 text-yellow-700";
    return "bg-blue-100 text-blue-700"; // Open
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900">Support</h2>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "tickets"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "text-gray-600 hover:bg-white"
            }`}>
            Tickets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("subjects")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "subjects"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "text-gray-600 hover:bg-white"
            }`}>
            Subjects
          </button>
        </div>
      </div>

      {activeTab === "subjects" ? (
        <AdminTicketSubjects />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500 font-medium">
              Manage and resolve user support tickets.
            </div>
            <div className="relative w-full sm:w-auto">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search subject or ID..."
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                    <th className="p-6">Ticket Info</th>
                    <th className="p-6">Category</th>
                    <th className="p-6">Priority</th>
                    <th className="p-6">User</th>
                    <th className="p-6">Message</th>
                    <th className="p-6">Status</th>
                    <th className="p-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket._id}
                      className="hover:bg-white transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/tickets/${ticket._id}`)}>
                      <td className="p-6">
                        <span className="block font-bold text-gray-900">
                          {ticket.subject}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          ID: {ticket._id.slice(-6)}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                          {ticket.category || "Other"}
                        </span>
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${priorityBadgeClass(
                            ticket.priority || "Medium",
                          )}`}>
                          {ticket.priority || "Medium"}
                        </span>
                      </td>
                      <td className="p-6 text-sm text-gray-600">
                        {ticket.user?.fullName || "User"}
                      </td>
                      <td className="p-6">
                        <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                          {ticket.description}
                        </p>
                      </td>
                      <td className="p-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                 ${statusBadgeClass(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-6">
                        {ticket.status !== "Resolved" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateTicketStatus(ticket._id, "Resolved");
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-all">
                            <FaCheckDouble /> Mark Resolved
                          </button>
                        )}
                        {ticket.status === "Resolved" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateTicketStatus(ticket._id, "Open");
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all">
                            <FaExclamationCircle /> Re-open
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                            <FaFolderOpen size={22} />
                          </div>
                          <div className="font-medium">No tickets found.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTickets;
