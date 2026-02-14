import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaCamera,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { serverUrl } from "../../App";

const AdminCategories = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const [name, setName] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const sortedCategories = useMemo(() => {
    return [...(categories || [])].sort((a, b) => {
      const ao = typeof a?.order === "number" ? a.order : 0;
      const bo = typeof b?.order === "number" ? b.order : 0;
      if (ao !== bo) return ao - bo;
      return (
        new Date(a?.createdAt || 0).getTime() -
        new Date(b?.createdAt || 0).getTime()
      );
    });
  }, [categories]);

  const nextOrder = sortedCategories.length;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${serverUrl}/api/admin/global-categories`, {
        withCredentials: true,
      });
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const moveCategory = async (categoryId, direction) => {
    const list = sortedCategories;
    const idx = list.findIndex((c) => c?._id === categoryId);
    if (idx === -1) return;
    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= list.length) return;

    const current = list[idx];
    const target = list[nextIdx];

    try {
      const currentOrder =
        typeof current?.order === "number" ? current.order : idx;
      const targetOrder =
        typeof target?.order === "number" ? target.order : nextIdx;

      await Promise.all([
        axios.put(
          `${serverUrl}/api/admin/global-categories/${current._id}`,
          { order: targetOrder },
          { withCredentials: true },
        ),
        axios.put(
          `${serverUrl}/api/admin/global-categories/${target._id}`,
          { order: currentOrder },
          { withCredentials: true },
        ),
      ]);

      fetchCategories();
    } catch (error) {
      toast.error("Failed to reorder categories");
    }
  };

  const resetForm = () => {
    setEditing(null);
    setName("");
    setOrder(0);
    setIsActive(true);
    setFile(null);
    setImageUrl("");
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setName(cat?.name || "");
    setOrder(typeof cat?.order === "number" ? cat.order : 0);
    setIsActive(cat?.isActive !== false);
    setFile(null);
    setImageUrl(cat?.image || "");
    setModalOpen(true);
  };

  const handleImageUpload = async (uploadFile) => {
    const formData = new FormData();
    formData.append("image", uploadFile);
    const res = await axios.post(
      `${serverUrl}/api/admin/upload-image`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data.imageUrl;
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (saving) return;

    try {
      setSaving(true);
      const uploaded = file ? await handleImageUpload(file) : "";
      const payload = {
        name: name.trim(),
        order: editing?._id
          ? Number.isFinite(Number(order))
            ? Number(order)
            : 0
          : nextOrder,
        isActive: !!isActive,
        image: uploaded || imageUrl || "",
      };

      if (editing?._id) {
        await axios.put(
          `${serverUrl}/api/admin/global-categories/${editing._id}`,
          payload,
          { withCredentials: true },
        );
        toast.success("Category updated");
      } else {
        await axios.post(`${serverUrl}/api/admin/global-categories`, payload, {
          withCredentials: true,
        });
        toast.success("Category created");
      }

      setModalOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (cat) => {
    setPendingDelete(cat);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete?._id) return;

    try {
      setConfirmLoading(true);
      await axios.delete(
        `${serverUrl}/api/admin/global-categories/${pendingDelete._id}`,
        { withCredentials: true },
      );
      toast.success("Category deleted");
      setConfirmOpen(false);
      setPendingDelete(null);
      fetchCategories();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to delete category",
      );
    } finally {
      setConfirmLoading(false);
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
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true">
          <button
            type="button"
            onClick={() => {
              if (confirmLoading) return;
              setConfirmOpen(false);
              setPendingDelete(null);
            }}
            className="fixed inset-0 bg-black/40"
            aria-label="Close confirmation"
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Confirm Delete
              </div>
              <div className="text-lg font-extrabold text-gray-900 mt-1">
                Delete Category
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Are you sure you want to delete
                <span className="font-extrabold text-gray-900">
                  {" "}
                  {pendingDelete?.name}
                </span>
                ?
              </div>
            </div>
            <div className="p-6 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={confirmLoading}
                onClick={() => {
                  if (confirmLoading) return;
                  setConfirmOpen(false);
                  setPendingDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-60">
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmLoading}
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-500/20 disabled:opacity-60 disabled:active:scale-100">
                {confirmLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true">
          <button
            type="button"
            onClick={() => {
              if (saving) return;
              setModalOpen(false);
              resetForm();
            }}
            className="fixed inset-0 bg-black/40"
            aria-label="Close category modal"
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {editing ? "Edit Category" : "Add Category"}
                </div>
                <div className="text-xl font-extrabold text-gray-900 mt-1">
                  {editing ? editing.name : "New Category"}
                </div>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (saving) return;
                  setModalOpen(false);
                  resetForm();
                }}
                className="shrink-0 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-colors disabled:opacity-60">
                Close
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Name
                  </div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={saving}
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-bold text-sm text-gray-900 disabled:opacity-60"
                    placeholder="e.g. Snacks"
                  />
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Order
                    </div>
                    <div className="text-sm text-gray-700 mt-1 font-semibold">
                      {editing
                        ? "Use Edit Order to reorder"
                        : "New categories go to bottom"}
                    </div>
                  </div>
                  <div className="text-sm font-extrabold text-gray-900">
                    {editing
                      ? typeof editing?.order === "number"
                        ? editing.order
                        : "-"
                      : nextOrder}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Active
                  </div>
                  <div className="text-sm text-gray-700 mt-1 font-semibold">
                    {isActive ? "Visible to customers" : "Hidden"}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsActive((v) => !v)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60 ${
                    isActive
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-white"
                  }`}>
                  {isActive ? "Active" : "Inactive"}
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Image
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Upload an icon/image for this category
                    </div>
                  </div>
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-white text-gray-700 text-sm font-bold transition-colors inline-flex items-center gap-2">
                    <FaCamera /> Choose
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={saving}
                    />
                  </label>
                </div>

                {(file || imageUrl) && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 overflow-hidden">
                      <img
                        src={file ? URL.createObjectURL(file) : imageUrl}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-gray-500 font-mono break-all">
                      {file ? file.name : imageUrl}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (saving) return;
                  setModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-60">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !name.trim()}
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-60 disabled:active:scale-100">
                {saving ? "Saving..." : editing ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900">Categories</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReorderMode((v) => !v)}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 border shadow-sm ${
              reorderMode
                ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                : "bg-white text-gray-700 border-gray-200 hover:bg-white"
            }`}>
            {reorderMode ? "Done" : "Edit Order"}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2">
            <FaPlus /> Add Category
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-6">Category</th>
                <th className="p-6">Order</th>
                <th className="p-6">Status</th>
                <th className="p-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedCategories.map((cat, index) => (
                <tr key={cat._id} className="hover:bg-white transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-gray-900 truncate">
                          {cat.name}
                        </div>
                        <div className="text-xs text-gray-400 font-mono break-all">
                          {cat._id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-sm font-bold text-gray-700">
                    <div className="flex items-center gap-2">
                      <span>
                        {typeof cat.order === "number" ? cat.order : 0}
                      </span>
                      {reorderMode && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveCategory(cat._id, "up")}
                            className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 transition-colors disabled:opacity-40 disabled:hover:bg-white"
                            aria-label="Move up">
                            <FaArrowUp />
                          </button>
                          <button
                            type="button"
                            disabled={index === sortedCategories.length - 1}
                            onClick={() => moveCategory(cat._id, "down")}
                            className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 transition-colors disabled:opacity-40 disabled:hover:bg-white"
                            aria-label="Move down">
                            <FaArrowDown />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        cat.isActive !== false
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                      {cat.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-colors inline-flex items-center gap-2">
                        <FaEdit /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(cat)}
                        className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold transition-colors inline-flex items-center gap-2">
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {sortedCategories.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="p-12 text-center text-gray-400 font-medium">
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
