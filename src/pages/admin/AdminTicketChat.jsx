import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../../App";

const AdminTicketChat = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);

  const messages = useMemo(() => {
    if (!ticket) return [];
    if (Array.isArray(ticket.messages) && ticket.messages.length > 0) {
      return ticket.messages;
    }
    if (ticket.description) {
      return [
        {
          senderRole: "PARTNER",
          message: ticket.description,
          createdAt: ticket.createdAt,
        },
      ];
    }
    return [];
  }, [ticket]);

  const isLocked = ticket?.status === "Resolved" || ticket?.status === "Closed";

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${serverUrl}/api/tickets/${ticketId}`, {
        withCredentials: true,
      });
      setTicket(res.data);
    } catch (e) {
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!ticketId) return;
    try {
      await axios.put(
        `${serverUrl}/api/tickets/${ticketId}/update`,
        { status },
        { withCredentials: true },
      );
      await fetchTicket();
    } catch (e) {}
  };

  useEffect(() => {
    if (!ticketId) return;
    fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg || sending || isLocked) return;

    setSending(true);
    try {
      await axios.post(
        `${serverUrl}/api/tickets/${ticketId}/messages`,
        { message: msg },
        { withCredentials: true },
      );
      setText("");
      await fetchTicket();
    } catch (e) {
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 text-center">
          <div className="text-lg font-extrabold text-gray-900">
            Ticket not found
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors">
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">
            Ticket
          </div>
          <div className="text-lg font-extrabold text-gray-900 truncate">
            {ticket.subject}
          </div>
          <div className="text-xs text-gray-500 font-semibold mt-1">
            {ticket.category || "Other"} • {ticket.priority || "Medium"} •{" "}
            {ticket.status}
          </div>
          <div className="text-xs text-gray-400 font-semibold mt-1">
            User: {ticket.user?.fullName || "User"} • {ticket.user?.email || ""}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {ticket.status !== "Resolved" ? (
            <button
              type="button"
              onClick={() => handleUpdateStatus("Resolved")}
              className="px-4 py-2 rounded-xl bg-green-50 text-green-600 text-sm font-extrabold hover:bg-green-100 transition-colors">
              Mark Resolved
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleUpdateStatus("Open")}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-extrabold hover:bg-gray-200 transition-colors">
              Re-open
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors">
            Back
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-[60vh] overflow-y-auto p-4 space-y-3 bg-white">
          {messages.map((m, idx) => {
            const role = m.senderRole;
            const isMe = role === "ADMIN";
            return (
              <div
                key={`${m.createdAt || idx}-${idx}`}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 border text-sm leading-relaxed shadow-sm ${
                    isMe
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-800 border-gray-200"
                  }`}>
                  <div className="whitespace-pre-wrap break-words">
                    {m.message}
                  </div>
                  <div
                    className={`mt-2 text-[11px] font-bold ${
                      isMe ? "text-white/80" : "text-gray-400"
                    }`}>
                    {new Date(m.createdAt || Date.now()).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-100 p-4 bg-white">
          <div className="flex items-end gap-3">
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Reply to partner..."
              disabled={isLocked}
              className="flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600 text-sm"
            />
            <button
              type="button"
              disabled={sending || !text.trim() || isLocked}
              onClick={handleSend}
              className="shrink-0 px-5 py-3 rounded-2xl bg-purple-600 text-white text-sm font-extrabold hover:bg-purple-700 transition-colors disabled:opacity-50">
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
          {isLocked ? (
            <div className="mt-2 text-xs text-gray-400 font-semibold">
              This ticket is resolved. Re-open it to send a new message.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AdminTicketChat;
