import React, { useState, useEffect } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { MdReportProblem } from "react-icons/md";
import { FaTicketAlt } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../App";
import Card from "../components/ui/Card";

function HelpPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create");
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [ticketSubjects, setTicketSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Form State
  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTicketSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const res = await axios.get(`${serverUrl}/api/ticket-subjects`, {
        withCredentials: true,
      });
      setTicketSubjects(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchMyTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await axios.get(`${serverUrl}/api/tickets/my-tickets`, {
        withCredentials: true,
      });
      setMyTickets(res.data);
    } catch (error) {
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === "my") {
      fetchMyTickets();
    }
    if (activeTab === "create") {
      fetchTicketSubjects();
    }
  }, [activeTab]);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        `${serverUrl}/api/tickets/create`,
        { subjectId, description },
        { withCredentials: true },
      );
      setSubjectId("");
      setDescription("");
      // Switch to my tickets view
      setActiveTab("my");
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-lg font-extrabold text-gray-900">Help</div>
            <div className="text-xs text-gray-500 font-semibold">
              Create a ticket and track replies
            </div>
          </div>
        </div>

        <div className="p-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`flex-1 px-4 py-3 rounded-2xl text-sm font-extrabold transition-all border-none ${
              activeTab === "create"
                ? "bg-primary-orange text-white"
                : "text-gray-600 hover:bg-white"
            }`}>
            Create Ticket
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("my")}
            className={`flex-1 px-4 py-3 rounded-2xl text-sm font-extrabold transition-all border-none ${
              activeTab === "my"
                ? "bg-primary-orange text-white"
                : "text-gray-600 hover:bg-white"
            }`}>
            My Tickets
          </button>
        </div>

        {activeTab === "create" && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-primary-orange">
                <MdReportProblem size={20} />
              </div>
              <div>
                <div className="font-extrabold text-gray-900">
                  Report a problem
                </div>
                <div className="text-xs text-gray-500 font-semibold">
                  The admin team will respond in your ticket
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  required
                  className="w-full p-3 bg-white border-b border-gray-200 focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20"
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                  }}>
                  <option value="" disabled>
                    {loadingSubjects
                      ? "Loading subjects..."
                      : "Select an issue topic"}
                  </option>
                  {ticketSubjects.map((topic) => (
                    <option key={topic._id} value={topic._id}>
                      {topic.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows="5"
                  className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20"
                  placeholder="Please provide detailed information about your issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-orange text-white font-extrabold rounded-xl hover:bg-primary-orange/90 transition-colors disabled:opacity-50">
                {loading ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "my" && (
          <div className="p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <FaTicketAlt size={18} />
                </div>
                <div>
                  <div className="font-extrabold text-gray-900">My Tickets</div>
                  <div className="text-xs text-gray-500 font-semibold">
                    Latest updates from admin
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchMyTickets}
                disabled={loadingTickets}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-60">
                {loadingTickets ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loadingTickets ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-4 border-orange-300 border-t-primary-orange rounded-full animate-spin" />
              </div>
            ) : myTickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaTicketAlt size={40} className="mx-auto mb-3 text-gray-300" />
                <div className="font-bold text-gray-700">No tickets yet</div>
                <div className="text-xs text-gray-500 mt-1">
                  Create a ticket to contact support.
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("create")}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-primary-orange text-white text-sm font-extrabold hover:bg-primary-orange/90 active:scale-95 transition-all shadow-lg shadow-primary-orange/20">
                  Create Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myTickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        navigate(`/tickets/${ticket._id}`);
                      }
                    }}
                    className="bg-white border-b border-gray-100 p-4">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="font-extrabold text-gray-900 truncate">
                          {ticket.subject}
                        </div>
                        <div className="text-xs text-gray-500 font-semibold mt-0.5">
                          {ticket.category} •{" "}
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                          ticket.status === "Resolved" ||
                          ticket.status === "Closed"
                            ? "bg-green-100 text-green-700"
                            : ticket.status === "In Progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-200 text-gray-700"
                        }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700">
                      {ticket.description}
                    </div>

                    {ticket.adminResponse && (
                      <div className="mt-3 bg-white p-3 rounded-xl border border-orange-100">
                        <div className="text-xs font-extrabold text-gray-700">
                          Admin Response
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {ticket.adminResponse}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HelpPage;
