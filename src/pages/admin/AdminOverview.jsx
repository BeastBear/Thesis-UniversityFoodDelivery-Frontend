import React, { useEffect, useState } from "react";
import {
  FaUsers,
  FaStore,
  FaChartLine,
  FaCheck,
  FaTimes,
  FaTicketAlt,
  FaUserShield,
} from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AdminOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [riderVerifications, setRiderVerifications] = useState([]);
  const [ownerVerifications, setOwnerVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchData(() => alive);
    return () => {
      alive = false;
    };
  }, []);

  const fetchData = async (isAlive = () => true) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      setLoading(true);
      const requests = [
        axios.get(`${serverUrl}/api/admin/stats`, {
          withCredentials: true,
          signal: controller.signal,
        }),
        axios.get(`${serverUrl}/api/admin/shops`, {
          withCredentials: true,
          signal: controller.signal,
        }),
        axios.get(`${serverUrl}/api/admin/orders`, {
          withCredentials: true,
          signal: controller.signal,
        }),
        axios.get(`${serverUrl}/api/tickets/all`, {
          withCredentials: true,
          signal: controller.signal,
        }),
        axios.get(`${serverUrl}/api/admin/verifications`, {
          withCredentials: true,
          signal: controller.signal,
        }),
        axios.get(`${serverUrl}/api/admin/owner-verifications`, {
          withCredentials: true,
          signal: controller.signal,
        }),
      ];

      const results = await Promise.allSettled(requests);
      if (!isAlive()) return;

      const [statsRes, shopsRes, ordersRes, ticketsRes, ridersRes, ownersRes] =
        results.map((r) => (r.status === "fulfilled" ? r.value : null));

      if (statsRes) setStats(statsRes.data);
      if (shopsRes) setShops(shopsRes.data);
      if (ordersRes)
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      if (ticketsRes)
        setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : []);
      if (ridersRes)
        setRiderVerifications(
          Array.isArray(ridersRes.data) ? ridersRes.data : [],
        );
      if (ownersRes)
        setOwnerVerifications(
          Array.isArray(ownersRes.data) ? ownersRes.data : [],
        );
    } catch (error) {
      if (isAlive()) {
        if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
          toast.error("Dashboard request timed out. Please try again.");
        } else {
          toast.error("Failed to load dashboard data");
        }
      }
    } finally {
      clearTimeout(timeoutId);
      if (isAlive()) setLoading(false);
    }
  };

  const normalizeStatus = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const getOrdersPerHourToday = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const counts = new Array(24).fill(0);
    (orders || []).forEach((o) => {
      const createdAt = o?.createdAt ? new Date(o.createdAt) : null;
      if (!createdAt) return;
      if (createdAt < start || createdAt > end) return;
      const hour = createdAt.getHours();
      if (hour >= 0 && hour <= 23) counts[hour] += 1;
    });

    return counts.map((count, hour) => ({ hour, orders: count }));
  };

  const chartData = getOrdersPerHourToday();
  const pendingVerificationsCount =
    (riderVerifications || []).length + (ownerVerifications || []).length;
  const openIssueTicketsCount = (tickets || []).filter(
    (t) => t?.type === "issue" && normalizeStatus(t?.status) === "open",
  ).length;

  const getRecentActivity = () => {
    const events = [];

    (shops || []).slice(0, 5).forEach((s) => {
      events.push({
        key: `shop-${s._id}`,
        type: "shop",
        createdAt: s?.createdAt || s?._id,
        title: `Restaurant created: ${s?.name || ""}`,
        subtitle: s?.cafeteria || "",
        icon: <FaStore className="text-purple-600" />,
        onClick: () => navigate("/admin/shops"),
      });
    });

    (orders || []).slice(0, 5).forEach((o) => {
      const orderId =
        typeof o?.orderId === "string" && o.orderId.startsWith("LMF-")
          ? o._id
          : o?.orderId || o?._id;
      events.push({
        key: `order-${o._id}`,
        type: "order",
        createdAt: o?.createdAt || o?._id,
        title: `Order created: #${String(orderId || "").slice(-4)}`,
        subtitle: o?.user?.fullName ? `Customer: ${o.user.fullName}` : "",
        icon: <FaChartLine className="text-purple-600" />,
        onClick: () => navigate("/admin/orders"),
      });
    });

    (tickets || []).slice(0, 5).forEach((t) => {
      events.push({
        key: `ticket-${t._id}`,
        type: "ticket",
        createdAt: t?.createdAt || t?._id,
        title: `Ticket: ${t?.subject || ""}`,
        subtitle: `${t?.type || ""} • ${t?.status || ""}`,
        icon: <FaTicketAlt className="text-purple-600" />,
        onClick: () => navigate("/admin/tickets"),
      });
    });

    (ownerVerifications || []).slice(0, 3).forEach((u) => {
      events.push({
        key: `verify-owner-${u._id}`,
        type: "verification",
        createdAt: u?.createdAt || u?._id,
        title: `Pending owner verification: ${u?.fullName || ""}`,
        subtitle: "Owner verification",
        icon: <FaUserShield className="text-purple-600" />,
        onClick: () => navigate("/admin/verifications"),
      });
    });

    return events
      .sort((a, b) => {
        const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      })
      .slice(0, 8);
  };

  const recentActivity = getRecentActivity();

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: <FaUsers size={24} className="text-blue-500" />,
      color: "bg-blue-100",
    },
    {
      title: "Total Restaurants",
      value: stats?.totalShops || 0,
      icon: <FaStore size={24} className="text-green-500" />,
      color: "bg-green-100",
    },
    {
      title: "Active Orders",
      value: stats?.activeOrders || 0,
      icon: <FaChartLine size={24} className="text-purple-500" />,
      color: "bg-purple-100",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                {stat.title}
              </p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">
              Orders per Hour (Today)
            </h2>
          </div>
          <div className="h-[260px] relative">
            {chartData.every((d) => d.orders === 0) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 rounded-2xl border border-dashed border-gray-200 z-10">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <FaChartLine className="text-gray-300 text-xl" />
                </div>
                <p className="text-sm font-bold text-gray-400">
                  No orders recorded today
                </p>
              </div>
            ) : null}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(h) => `${h}:00`}
                  stroke="#9ca3af"
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#9ca3af"
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(v) => [v, "Orders"]}
                  labelFormatter={(h) => `${h}:00`}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: "#7c3aed" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6">
            Urgent Tasks
          </h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate("/admin/verifications")}
              className="w-full text-left flex items-center justify-between p-4 bg-white rounded-2xl hover:bg-gray-100 transition-colors">
              <span className="font-bold text-gray-700">
                Pending Verifications
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                {pendingVerificationsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/tickets")}
              className="w-full text-left flex items-center justify-between p-4 bg-white rounded-2xl hover:bg-gray-100 transition-colors">
              <span className="font-bold text-gray-700">
                Open Issue Tickets
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                {openIssueTicketsCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {recentActivity.map((evt) => (
              <div
                key={evt.key}
                role="button"
                tabIndex={0}
                onClick={evt.onClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter") evt.onClick();
                }}
                className="flex justify-between items-center p-4 hover:bg-white rounded-2xl border border-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                    {evt.icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{evt.title}</p>
                    {evt.subtitle && (
                      <p className="text-xs text-gray-500 font-medium">
                        {evt.subtitle}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-bold">
                  {evt.createdAt
                    ? new Date(evt.createdAt).toLocaleString()
                    : ""}
                </span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-gray-400 text-center py-8 font-medium">
                No recent activity.
              </p>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6">
            System Status
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white rounded-2xl">
              <span className="font-bold text-gray-600">Server Status</span>
              <span className="text-green-600 font-bold flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white rounded-2xl">
              <span className="font-bold text-gray-600">Database</span>
              <span className="text-green-600 font-bold flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Connected
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white rounded-2xl">
              <span className="font-bold text-gray-600">
                Total Orders Processed
              </span>
              <span className="text-gray-900 font-extrabold text-lg">
                {stats?.totalOrders || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
