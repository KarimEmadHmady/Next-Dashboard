"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useParams } from "next/navigation"
import {
  User,
  Users,
  Store,
  MapPin,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Filter,
} from "lucide-react"
import { FiX, FiUser, FiPhone, FiMail, FiMapPin, FiLayers, FiCalendar } from "react-icons/fi"
import { UserItem } from "@/types/user"
import { userService } from "@/services/userService"
import UserModal from "@/components/common/UserModal"
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal"
import { Loader2 } from "lucide-react"

export default function BranchResponsiblePage() {
  const params = useParams()
  const locale: "ar" | "en" =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    "ar"
  const isRTL = locale === "ar"

  const [managers, setManagers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserItem | null>(null)
  const [deleteUserTarget, setDeleteUserTarget] = useState<UserItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedManager, setSelectedManager] = useState<UserItem | null>(null)
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null)

  const loadManagers = async () => {
    setLoading(true)
    try {
      const res = await userService.listUsers({
        role: "STORE_MANAGER",
        search: searchTerm.trim() || undefined,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      })
      setManagers(res.data)
    } catch (err) {
      console.error("Failed to load managers:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadManagers()
  }, [statusFilter])

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadManagers()
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleToggleStatus = async (manager: UserItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setTogglingStatusId(manager.id)
    try {
      const updated = await userService.updateStatus(manager.id, !manager.isActive)
      setManagers((prev) =>
        prev.map((m) => (m.id === updated.id ? { ...m, isActive: updated.isActive } : m))
      )
      if (selectedManager?.id === manager.id) {
        setSelectedManager((prev) => (prev ? { ...prev, isActive: updated.isActive } : null))
      }
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
      setManagers((prev) => prev.filter((m) => m.id !== deleteUserTarget.id))
      setDeleteUserTarget(null)
      if (selectedManager?.id === deleteUserTarget.id) {
        setSelectedManager(null)
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete user")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleUserSaved = (saved: UserItem) => {
    setManagers((prev) => {
      const exists = prev.some((m) => m.id === saved.id)
      if (exists) {
        return prev.map((m) => (m.id === saved.id ? saved : m))
      }
      return [saved, ...prev]
    })
    if (selectedManager?.id === saved.id) {
      setSelectedManager(saved)
    }
  }

  return (
    <div className={`p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/50 ${isRTL ? "font-arabic" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {isRTL ? "مسؤولو الفروع (Store Managers)" : "Branch Responsibles"}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            {isRTL
              ? "إدارة حسابات مديري الفروع وتعيين الفروع وتعديل الصلاحيات"
              : "Manage store manager accounts, assigned branches, and access privileges"}
          </p>
        </div>

        {/* Add Manager Button */}
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#131e48] hover:bg-[#1f2e6b] text-[#73cdca] rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer text-sm"
        >
          <UserPlus className="w-5 h-5" />
          <span>{isRTL ? "إضافة مسؤول فرع جديد" : "Add Store Manager"}</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRTL ? "بحث بالاسم، الإيميل أو الهاتف..." : "Search by name, email, or phone..."}
            className="w-full h-11 pl-10 rtl:pl-3 rtl:pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400 mr-1 rtl:mr-0 rtl:ml-1" />
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {isRTL ? "الكل" : "All"} ({managers.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === "active"
                ? "bg-green-600 text-white"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {isRTL ? "نشط" : "Active"}
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === "inactive"
                ? "bg-red-600 text-white"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            {isRTL ? "غير نشط" : "Inactive"}
          </button>
        </div>
      </div>

      {/* Grid of Store Managers */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
          <p className="text-sm text-gray-500">{isRTL ? "جاري تحميل البيانات..." : "Loading store managers..."}</p>
        </div>
      ) : managers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {isRTL ? "لا يوجد مسؤولو فروع" : "No store managers found"}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
            {isRTL
              ? "لم يتم العثور على أي مسؤولين مسجلين يطابقون خيارات البحث."
              : "No store managers match your search criteria."}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
          >
            {isRTL ? "إضافة مسؤول فرع الآن" : "Add Store Manager Now"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {managers.map((manager, idx) => (
            <motion.div
              key={manager.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => setSelectedManager(manager)}
              className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative group flex flex-col justify-between"
            >
              <div>
                {/* Header Row: Avatar, Name & Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                      {manager.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                        {manager.name}
                      </h3>
                      <p className="text-xs text-gray-500">{manager.email}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      manager.isActive
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        manager.isActive ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    {manager.isActive ? (isRTL ? "نشط" : "Active") : isRTL ? "معطل" : "Inactive"}
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-2 py-3 border-y border-gray-50 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900">
                      {manager.storeName || (isRTL ? "غير محدد" : "Unassigned")}
                    </span>
                  </div>

                  {manager.areaName && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{manager.areaName}</span>
                    </div>
                  )}

                  {manager.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span dir="ltr">{manager.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 mt-2">
                {/* Active / Inactive Toggle Switch */}
                <button
                  type="button"
                  disabled={togglingStatusId === manager.id}
                  onClick={(e) => handleToggleStatus(manager, e)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    manager.isActive
                      ? "text-red-600 hover:bg-red-50"
                      : "text-green-600 hover:bg-green-50"
                  }`}
                >
                  {togglingStatusId === manager.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : manager.isActive ? (
                    isRTL ? "تعطيل الحساب" : "Deactivate"
                  ) : (
                    isRTL ? "تفعيل الحساب" : "Activate"
                  )}
                </button>

                {/* Edit & Delete Icons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditUser(manager)
                    }}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    title={isRTL ? "تعديل" : "Edit"}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteUserTarget(manager)
                    }}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title={isRTL ? "حذف" : "Delete"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Details View Modal */}
      {selectedManager && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedManager(null)}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedManager(null)}
              className="absolute top-5 right-5 rtl:right-auto rtl:left-5 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 font-bold text-2xl flex items-center justify-center">
                {selectedManager.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedManager.name}</h2>
                <span className="inline-block px-2.5 py-0.5 mt-1 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  {isRTL ? "مدير فرع (Store Manager)" : "Store Manager"}
                </span>
              </div>
            </div>

            <div className="space-y-4 py-4 border-y border-gray-100 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{isRTL ? "البريد الإلكتروني:" : "Email:"}</span>
                <span className="font-semibold text-gray-800">{selectedManager.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{isRTL ? "رقم الهاتف:" : "Phone:"}</span>
                <span className="font-semibold text-gray-800">{selectedManager.phone || (isRTL ? "غير متوفر" : "N/A")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{isRTL ? "الفرع المعين:" : "Store Branch:"}</span>
                <span className="font-semibold text-gray-800">{selectedManager.storeName || (isRTL ? "غير محدد" : "Unassigned")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{isRTL ? "المنطقة:" : "Area:"}</span>
                <span className="font-semibold text-gray-800">{selectedManager.areaName || (isRTL ? "غير محدد" : "Unassigned")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{isRTL ? "حالة الحساب:" : "Account Status:"}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedManager.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedManager.isActive ? (isRTL ? "نشط" : "Active") : isRTL ? "معطل" : "Inactive"}
                </span>
              </div>
              {selectedManager.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{isRTL ? "تاريخ الإنشاء:" : "Created At:"}</span>
                  <span className="text-gray-700">
                    {new Date(selectedManager.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US")}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-6">
              <button
                onClick={() => {
                  setEditUser(selectedManager)
                  setSelectedManager(null)
                }}
                className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl transition text-sm flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-4 h-4" />
                <span>{isRTL ? "تعديل البيانات" : "Edit Details"}</span>
              </button>
              <button
                onClick={() => setSelectedManager(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl transition text-sm"
              >
                {isRTL ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
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
        fixedRole="STORE_MANAGER"
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
