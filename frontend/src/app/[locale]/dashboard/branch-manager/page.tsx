"use client"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { Store, Users, User, MapPin, Search, Filter, Loader2, Navigation, AlertCircle } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { FiX, FiUser, FiUsers, FiMapPin, FiList, FiCheckCircle } from "react-icons/fi"
import { storeService } from "@/services/storeService"
import { areaService } from "@/services/areaService"
import { userService } from "@/services/userService"
import { StoreItem } from "@/types/store"
import { AreaItem } from "@/types/area"
import { UserItem } from "@/types/user"

const storeColors = [
  "#f59e0b",
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#14b8a6",
]

function StoreModal({
  open,
  onClose,
  store,
  locale,
}: {
  open: boolean
  onClose: () => void
  store: StoreItem | null
  locale: "ar" | "en"
}) {
  const [staff, setStaff] = useState<UserItem[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)

  useEffect(() => {
    if (!open || !store) return
    let isMounted = true
    setLoadingStaff(true)

    userService
      .listUsers({ storeId: store.id })
      .then((res) => {
        if (isMounted) setStaff(res.data)
      })
      .catch(() => {
        if (isMounted) setStaff([])
      })
      .finally(() => {
        if (isMounted) setLoadingStaff(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, store])

  if (!open || !store) return null

  const lat = store.lat ? Number(store.lat) : 30.0444
  const lng = store.lng ? Number(store.lng) : 31.2357
  const hasCoordinates = store.lat !== null && store.lng !== null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl relative animate-fade-in font-[Cairo] flex flex-col border border-gray-100 max-h-[90vh] my-6">
        <button
          onClick={onClose}
          className="sticky top-0 right-0 self-end z-20 mt-4 mr-4 rtl:mr-auto rtl:ml-4 text-gray-400 hover:text-gray-700 text-3xl font-bold bg-white rounded-full p-1"
        >
          <FiX />
        </button>

        <div className="overflow-y-auto px-6 sm:px-10 pt-2 pb-10" style={{ maxHeight: "80vh" }}>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 flex items-center gap-2">
              <Store className="text-orange-500" />
              {store.name}
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  store.isActive
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${store.isActive ? "bg-green-500" : "bg-red-500"}`}
                />
                {store.isActive
                  ? locale === "ar"
                    ? "نشط"
                    : "Active"
                  : locale === "ar"
                  ? "غير نشط"
                  : "Inactive"}
              </span>
            </div>
          </div>

          {/* Manager */}
          <div className="mb-6 text-base sm:text-lg text-gray-600 flex items-center gap-2">
            <FiUser className="text-blue-500" />
            {locale === "ar" ? "مدير الفرع:" : "Branch Manager:"}{" "}
            <span className="font-bold text-gray-900">
              {store.managerName || (locale === "ar" ? "غير محدد" : "Unassigned")}
            </span>
          </div>

          {/* Info & Map */}
          <div className="mb-8 flex flex-col md:flex-row gap-6 w-full">
            {/* Store Data */}
            <div className="flex-1 space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 text-base text-gray-700">
                <FiMapPin className="text-cyan-600" />
                <span className="font-semibold">{locale === "ar" ? "المنطقة:" : "Area:"}</span>
                <span className="font-bold text-gray-900">{store.areaName}</span>
              </div>

              <div className="flex items-center gap-2 text-base text-gray-700">
                <FiUsers className="text-emerald-500" />
                <span className="font-semibold">{locale === "ar" ? "عدد الموظفين:" : "Employees:"}</span>
                <span className="font-bold text-gray-900">{store.userCount}</span>
              </div>

              <div className="flex items-center gap-2 text-base text-gray-700">
                <Navigation className="text-indigo-500 w-4 h-4" />
                <span className="font-semibold">{locale === "ar" ? "الإحداثيات الجغرافية:" : "Coordinates:"}</span>
                <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-800">
                  {hasCoordinates ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : (locale === "ar" ? "غير مسجلة" : "N/A")}
                </span>
              </div>

              <div className="flex items-center gap-2 text-base text-gray-700">
                <FiList className="text-indigo-500" />
                <span className="font-semibold">{locale === "ar" ? "كود الفرع (ID):" : "Branch ID:"}</span>
                <span className="text-xs font-mono text-gray-500 truncate">{store.id}</span>
              </div>
            </div>

            {/* Google Map Embed */}
            <div className="flex-1 min-w-[280px]">
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm w-full h-56 relative bg-gray-100">
                <iframe
                  title={`Map of ${store.name}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                  allowFullScreen
                />
              </div>
              <div className="text-right rtl:text-left text-[11px] text-gray-400 mt-1">
                {locale === "ar" ? "إحداثيات من قاعدة البيانات الحقيقية" : "Live DB Coordinates"}
              </div>
            </div>
          </div>

          {/* Staff List */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiUsers className="text-emerald-500" />
              {locale === "ar" ? "موظفو الفرع المسجلون" : "Assigned Branch Staff"}
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-normal">
                {staff.length}
              </span>
            </h3>

            {loadingStaff ? (
              <div className="flex items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-100">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" />
                <span className="text-sm text-gray-500">{locale === "ar" ? "جارٍ تحميل الموظفين..." : "Loading staff..."}</span>
              </div>
            ) : staff.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 text-sm">
                {locale === "ar" ? "لا يوجد موظفون مسجلون بهذا الفرع بعد" : "No staff members assigned to this branch yet"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {staff.map((u) => (
                  <div
                    key={u.id}
                    className="bg-gray-50 rounded-xl p-3.5 flex items-center gap-3 border border-gray-100 hover:shadow-sm transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <FiUser size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-gray-900 truncate">{u.name}</div>
                      <div className="text-xs text-gray-500 truncate">{u.email}</div>
                      <div className="text-[11px] font-medium text-teal-700 mt-0.5">
                        {u.role === "STORE_MANAGER" ? (locale === "ar" ? "مدير فرع" : "Store Manager") : (locale === "ar" ? "مستخدم فرع" : "Store User")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const BranchManagerView = () => {
  const params = useParams()
  const locale: "ar" | "en" =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    (Array.isArray(params?.locale) && (params?.locale[0] === "ar" || params?.locale[0] === "en") && params?.locale[0]) ||
    "en"

  const title = locale === "ar" ? "الفروع والمتاجر" : "Stores & Branches"
  const employeesLabel = locale === "ar" ? "عدد العاملين" : "Employees"
  const managerLabel = locale === "ar" ? "مدير المتجر" : "Manager"

  const [stores, setStores] = useState<StoreItem[]>([])
  const [areas, setAreas] = useState<AreaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedAreaId, setSelectedAreaId] = useState<string>("ALL")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    Promise.all([storeService.listStores(), areaService.listAreas()])
      .then(([storeList, areaList]) => {
        if (isMounted) {
          setStores(storeList)
          setAreas(areaList)
        }
      })
      .catch((err) => {
        console.error("Failed to fetch stores or areas:", err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchSearch =
        search.trim() === "" ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.areaName.toLowerCase().includes(search.toLowerCase()) ||
        (s.managerName && s.managerName.toLowerCase().includes(search.toLowerCase()))

      const matchArea = selectedAreaId === "ALL" || s.areaId === selectedAreaId

      return matchSearch && matchArea
    })
  }, [stores, search, selectedAreaId])

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8" style={{ backgroundImage: "url('/background.jpg')", backgroundRepeat: "repeat" }}>
      <StoreModal open={modalOpen} onClose={() => setModalOpen(false)} store={selectedStore} locale={locale} />
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="text-gray-900 font-extrabold text-2xl sm:text-3xl rounded-xl flex items-center gap-3"
            >
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)" }}
              >
                <Store className="text-white" size={22} />
              </motion.span>
              {title}
            </motion.h2>

            <div className="text-sm text-gray-500 font-medium">
              {locale === "ar" ? "إجمالي الفروع:" : "Total Branches:"}{" "}
              <span className="font-bold text-gray-900">{stores.length}</span>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={locale === "ar" ? "ابحث باسم الفرع أو المنطقة..." : "Search by branch or area..."}
              className="w-full h-10 pl-9 rtl:pl-3 rtl:pr-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Area Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="text-gray-400 w-4 h-4 shrink-0" />
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-48"
            >
              <option value="ALL">{locale === "ar" ? "كل المناطق" : "All Areas"}</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.storeCount})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Store Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
            <div className="text-gray-500 text-sm">{locale === "ar" ? "جارٍ تحميل الفروع من الخادم..." : "Loading stores from server..."}</div>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
            <div className="text-gray-700 font-bold mb-1">{locale === "ar" ? "لم يتم العثور على أية فروع" : "No stores found"}</div>
            <div className="text-gray-400 text-xs">{locale === "ar" ? "جرب تغيير معايير البحث أو اختيار منطقة أخرى" : "Try adjusting your search criteria"}</div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredStores.map((b, idx) => {
              const cardColor = storeColors[idx % storeColors.length]
              const hasCoords = b.lat !== null && b.lng !== null

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 30, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.05 * idx, ease: "easeOut" }}
                  whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 p-5 relative overflow-hidden cursor-pointer"
                  onClick={() => {
                    setSelectedStore(b)
                    setModalOpen(true)
                  }}
                >
                  <div
                    className="absolute inset-x-0 -top-12 h-36 opacity-[0.06]"
                    style={{ background: `radial-gradient(120px 60px at 50% 0%, ${cardColor}, transparent)` }}
                  />
                  <div className="relative flex items-start gap-4">
                    <div
                      className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm shrink-0"
                      style={{ background: cardColor }}
                    >
                      <Store className="text-white" size={26} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-gray-900 font-bold text-lg truncate">{b.name}</div>
                        {hasCoords && (
                          <span
                            title={locale === "ar" ? "إحداثيات مسجلة" : "Coordinates Available"}
                            className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5"
                          >
                            <Navigation size={10} />
                            GPS
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-gray-600 text-sm">
                        <MapPin size={15} className="text-cyan-600 shrink-0" />
                        <span className="truncate">{b.areaName}</span>
                      </div>

                      {/* Stats row */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                          <Users size={15} className="text-emerald-600 shrink-0" />
                          <div className="flex flex-col leading-tight min-w-0">
                            <span className="text-[11px] text-gray-500">{employeesLabel}</span>
                            <span className="text-sm font-semibold text-gray-900">{b.userCount}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                          <User size={15} className="text-indigo-600 shrink-0" />
                          <div className="flex flex-col leading-tight truncate">
                            <span className="text-[11px] text-gray-500">{managerLabel}</span>
                            <span className="text-xs font-semibold text-gray-900 truncate">
                              {b.managerName || (locale === "ar" ? "غير محدد" : "-")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default BranchManagerView
