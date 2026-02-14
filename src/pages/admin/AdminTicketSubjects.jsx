import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { serverUrl } from "../../App";
import { toast } from "react-toastify";

const CATEGORY_OPTIONS = [
  "Technical",
  "Order Issue",
  "Finance",
  "General",
  "Account",
  "Payment",
  "Verification",
  "Other",
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];

const defaultForm = {
  subject: "",
  category: "General",
  priority: "Low",
  isActive: true,
  sortOrder: 0,
};

const AdminTicketSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${serverUrl}/api/ticket-subjects/admin`, {
        withCredentials: true,
      });
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error("Failed to load ticket subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...defaultForm, sortOrder: sortedSubjects.length });
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      subject: item?.subject || "",
      category: item?.category || "General",
      priority: item?.priority || "Low",
      isActive: Boolean(item?.isActive),
      sortOrder: Number(item?.sortOrder || 0),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(defaultForm);
  };

  const sortedSubjects = useMemo(() => {
    return [...subjects].sort((a, b) => {
      const ao = Number(a?.sortOrder ?? 0);
      const bo = Number(b?.sortOrder ?? 0);
      if (ao !== bo) return ao - bo;
      return String(a?.subject || "").localeCompare(String(b?.subject || ""));
    });
  }, [subjects]);

  const displaySubjects = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return sortedSubjects;
    return sortedSubjects.filter((x) =>
      String(x?.subject || "")
        .toLowerCase()
        .includes(s),
    );
  }, [sortedSubjects, search]);

  const persistNewOrder = async (nextOrdered) => {
    try {
      setSaving(true);
      const updates = nextOrdered.map((item, index) => {
        return axios.put(
          `${serverUrl}/api/ticket-subjects/admin/${item._id}`,
          {
            subject: item.subject,
            category: item.category,
            priority: item.priority,
            isActive: item.isActive,
            sortOrder: index,
          },
          { withCredentials: true },
        );
      });
      await Promise.all(updates);
      await fetchSubjects();
    } catch (error) {
      toast.error("Failed to update sort order");
      await fetchSubjects();
    } finally {
      setSaving(false);
    }
  };

  const moveSubject = async (subjectId, direction) => {
    const current = [...sortedSubjects];
    const index = current.findIndex((x) => x?._id === subjectId);
    if (index === -1) return;

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= current.length) return;

    const nextOrdered = [...current];
    const tmp = nextOrdered[index];
    nextOrdered[index] = nextOrdered[nextIndex];
    nextOrdered[nextIndex] = tmp;

    // Optimistic UI update
    setSubjects(
      nextOrdered.map((item, i) => ({
        ...item,
        sortOrder: i,
      })),
    );

    await persistNewOrder(nextOrdered);
  };

  const onSave = async () => {
    if (!form.subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    try {
      setSaving(true);
      if (editing?._id) {
        await axios.put(
          `${serverUrl}/api/ticket-subjects/admin/${editing._id}`,
          form,
          { withCredentials: true },
        );
        toast.success("Subject updated");
      } else {
        await axios.post(`${serverUrl}/api/ticket-subjects/admin`, form, {
          withCredentials: true,
        });
        toast.success("Subject created");
      }
      closeModal();
      fetchSubjects();
    } catch (error) {
      toast.error("Failed to save subject");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (item) => {
    const ok = window.confirm("Delete this subject?");
    if (!ok) return;

    try {
      await axios.delete(`${serverUrl}/api/ticket-subjects/admin/${item._id}`, {
        withCredentials: true,
      });
      toast.success("Subject deleted");
      fetchSubjects();
    } catch (error) {
      toast.error("Failed to delete subject");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold text-gray-900">
            Ticket Subjects
          </div>
          <div className="text-sm text-gray-500 font-medium mt-1">
            Manage the subject list users can select when creating a ticket.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject..."
            className="w-full sm:w-72 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={openCreate}
            className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors">
            Add Subject
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-6">Subject</th>
                <th className="p-6">Category</th>
                <th className="p-6">Priority</th>
                <th className="p-6">Active</th>
                <th className="p-6">Order</th>
                <th className="p-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displaySubjects.map((item) => (
                <tr key={item._id} className="hover:bg-white transition-colors">
                  <td className="p-6">
                    <div className="font-bold text-gray-900">
                      {item.subject}
                    </div>
                  </td>
                  <td className="p-6 text-sm text-gray-700 font-medium">
                    {item.category}
                  </td>
                  <td className="p-6 text-sm text-gray-700 font-medium">
                    {item.priority}
                  </td>
                  <td className="p-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        item.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={saving || sortedSubjects[0]?._id === item._id}
                        onClick={() => moveSubject(item._id, "up")}
                        className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 text-sm font-extrabold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={
                          saving ||
                          sortedSubjects[sortedSubjects.length - 1]?._id ===
                            item._id
                        }
                        onClick={() => moveSubject(item._id, "down")}
                        className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 text-sm font-extrabold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {displaySubjects.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400">
                    No subjects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <div className="text-lg font-extrabold text-gray-900">
              {editing ? "Edit Subject" : "Add Subject"}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  value={form.subject}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subject: e.target.value }))
                  }
                  className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. 💸 Withdrawal Request / Missing Payout"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value }))
                    }
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, priority: e.target.value }))
                    }
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Active
                  </label>
                  <select
                    value={form.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        isActive: e.target.value === "true",
                      }))
                    }
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onSave}
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTicketSubjects;
