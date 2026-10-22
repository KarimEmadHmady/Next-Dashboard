"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import {
  User,
  Users,
  Store,
  MapPin,
  UserPlus,
  Mail,
  Phone,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { UserItem, StoreOption } from "@/types/user"
import { userService } from "@/services/userService"
import UserModal from "@/components/common/UserModal"
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal"

export default function BranchUserPage() {
  const params = useParams()
  const locale: "ar" | "en" =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    "ar"
  const isRTL = locale === "ar"

  const [users, setUsers] = useState<UserItem[]>([])
  const [stores, setStores] = useState<StoreOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStoreId, setSelectedStoreId] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserItem | null>(null)
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null)

  // Load stores list for branch filter
  useEffect(() => {
    let isMounted = true
    userService.getStores().then((list) => {
      if (isMounted) setStores(list)
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Load store users from backend
  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await userService.listUsers({
        role: "STORE_USER",
        page,
        limit: 12,
        search: searchTerm.trim() || undefined,
        storeId: selectedStoreId || undefined,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      })
      setUsers(res.data)
      setTotalPages(res.meta.totalPages || 1)
      setTotalCount(res.meta.total || 0)
    } catch (err) {
      console.error("Failed to load store users:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [page, selectedStoreId, statusFilter])

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      loadUsers()
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleToggleStatus = async (userItem: UserItem) => {
    setTogglingStatusId(userItem.id)
    try {
      const updated = await userService.updateStatus(userItem.id, !userItem.isActive)
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, isActive: updated.isActive } : u))
      )
    } catch (err: any) {
      alert(err?.message || "Failed to update status")
    } finally {
      setTogglingStatusId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteUserTarget) return
    setDeleteLoading(true)
    try {
      await userService.deleteUser(deleteUserTarget.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteUserTarget.id))
      setTotalCount((c) => Math.max(0, c - 1))
      setDeleteUserTarget(null)
    } catch (err: any) {
      alert(err?.message || "Failed to delete user")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleUserSaved = (saved: UserItem) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === saved.id)
      if (exists) {
        return prev.map((u) => (u.id === saved.id ? saved : u))
      }
      return [saved, ...prev]
    })
    setTotalCount((c) => c + 1)
  }

  return (
    <div className={`p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50 ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {isRTL ? "مستخدمو الفروع (Store Users)" : "Branch Users"}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            {isRTL
              ? "إدارة حسابات موظفي الفروع ومتابعة الفروع المعينين بها وحالة تفعيل الحسابات"
              : "Manage store staff accounts, assigned branches, and access status"}
          </p>
        </div>

        {/* Add User Button */}
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#131e48] hover:bg-[#1f2e6b] text-[#73cdca] rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer text-sm"
        >
          <UserPlus className="w-5 h-5" />
          <span>{isRTL ? "إضافة مستخدم فرع جديد" : "Add Store User"}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRTL ? "بحث بالاسم، الإيميل، الهاتف..." : "Search by name, email, phone..."}
              className="w-full h-11 pl-10 rtl:pl-3 rtl:pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Branch Filter */}
          <div className="relative w-full sm:w-60">
            <Store className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={selectedStoreId}
              onChange={(e) => {
                setSelectedStoreId(e.target.value)
                setPage(1)
              }}
              className="w-full h-11 pl-9 rtl:pl-3 rtl:pr-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">{isRTL ? "جميع الفروع" : "All Branches"}</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Filter className="w-4 h-4 text-gray-400 mr-1 rtl:mr-0 rtl:ml-1" />
          <button
            onClick={() => {
              setStatusFilter("all")
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {isRTL ? "الكل" : "All"} ({totalCount})
          </button>
          <button
            onClick={() => {
              setStatusFilter("active")
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === "active"
                ? "bg-green-600 text-white"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {isRTL ? "نشط" : "Active"}
          </button>
          <button
            onClick={() => {
              setStatusFilter("inactive")
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === "inactive"
                ? "bg-red-600 text-white"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            {isRTL ? "معطل" : "Inactive"}
          </button>
        </div>
      </div>

      {/* Users Table / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
          <p className="text-sm text-gray-500">{isRTL ? "جاري تحميل مستخدمي الفروع..." : "Loading branch users..."}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {isRTL ? "لا يوجد مستخدمو فروع" : "No branch users found"}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
            {isRTL
              ? "لم يتم العثور على أي موظفين مسجلين يطابقون خيارات البحث الحالية."
              : "No users match your current filter settings."}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
          >
            {isRTL ? "إضافة مستخدم الآن" : "Add Store User Now"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right text-gray-600">
              <thead className="text-xs text-gray-500 bg-gray-50/75 border-b border-gray-100 uppercase">
                <tr>
                  <th className="px-6 py-4">{isRTL ? "المستخدم" : "User"}</th>
                  <th className="px-6 py-4">{isRTL ? "الفرع" : "Store / Branch"}</th>
                  <th className="px-6 py-4">{isRTL ? "المنطقة" : "Area"}</th>
                  <th className="px-6 py-4">{isRTL ? "الهاتف" : "Phone"}</th>
                  <th className="px-6 py-4">{isRTL ? "الحالة" : "Status"}</th>
                  <th className="px-6 py-4 text-center">{isRTL ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* User info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm">
                          {userItem.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">{userItem.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{userItem.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800">
                        {userItem.storeName || (isRTL ? "غير محدد" : "Unassigned")}
                      </span>
                    </td>

                    {/* Area */}
                    <td className="px-6 py-4">
                      <span className="text-gray-600">{userItem.areaName || (isRTL ? "-" : "-")}</span>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4">
                      <span dir="ltr" className="text-gray-600">
                        {userItem.phone || (isRTL ? "غير متوفر" : "N/A")}
                      </span>
                    </td>

                    {/* Status with Toggle */}
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={togglingStatusId === userItem.id}
                        onClick={() => handleToggleStatus(userItem)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          userItem.isActive
                            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                            : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                        }`}
                        title={isRTL ? "انقر للتبديل" : "Click to toggle"}
                      >
                        {togglingStatusId === userItem.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              userItem.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                        )}
                        <span>{userItem.isActive ? (isRTL ? "نشط" : "Active") : isRTL ? "معطل" : "Inactive"}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditUser(userItem)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                          title={isRTL ? "تعديل" : "Edit"}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteUserTarget(userItem)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                          title={isRTL ? "حذف" : "Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {isRTL
                  ? `صفحة ${page} من ${totalPages} (إجمالي: ${totalCount})`
                  : `Page ${page} of ${totalPages} (Total: ${totalCount})`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <UserModal
        open={createModalOpen || !!editUser}
        onClose={() => {
          setCreateModalOpen(false)
          setEditUser(null)
        }}
        userToEdit={editUser}
        fixedRole="STORE_USER"
        onSuccess={handleUserSaved}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={!!deleteUserTarget}
        onClose={() => setDeleteUserTarget(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deleteUserTarget?.name}
        loading={deleteLoading}
      />
    </div>
  )
}
