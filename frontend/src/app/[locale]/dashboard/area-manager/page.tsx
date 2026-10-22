"use client"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { Store, MapPin, User, UserPlus, Globe, Users, TrendingUp, Navigation, Loader2, AlertCircle } from "lucide-react"
import { useState, useEffect, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import UserModal from "@/components/common/UserModal"
import { areaService } from "@/services/areaService"
import { storeService } from "@/services/storeService"
import { userService } from "@/services/userService"
import { AreaItem } from "@/types/area"
import { StoreItem } from "@/types/store"
import { UserItem } from "@/types/user"
import { MapArea } from "./MapComponent"

// Dynamic import for Leaflet map to avoid SSR errors
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
        <span>جاري تحميل الخريطة...</span>
      </div>
    </div>
  ),
})

type Locale = "ar" | "en"

const areaPalette = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6"]

// Area Details Modal with live stores & assigned manager info
function AreaDetailsModal({
  open,
  onClose,
  area,
  manager,
  locale,
}: {
  open: boolean
  onClose: () => void
  area: AreaItem | null
  manager?: UserItem | null
  locale: Locale
}) {
  const [stores, setStores] = useState<StoreItem[]>([])
  const [loadingStores, setLoadingStores] = useState(false)

  useEffect(() => {
    if (!open || !area) return
    let isMounted = true
    setLoadingStores(true)

    areaService
      .getStoresInArea(area.id)
      .then((res) => {
        if (isMounted) setStores(res)
      })
      .catch(() => {
        if (isMounted) setStores([])
      })
      .finally(() => {
        if (isMounted) setLoadingStores(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, area])

  if (!open || !area) return null

  const lat = area.lat ? Number(area.lat) : 30.0444
  const lng = area.lng ? Number(area.lng) : 31.2357
  const hasCoords = area.lat !== null && area.lng !== null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl relative animate-fade-in font-[Cairo] flex flex-col border border-gray-100 max-h-[90vh] my-6">
        <button
          onClick={onClose}
          className="sticky top-0 right-0 self-end z-20 m-4 rtl:mr-auto rtl:ml-4 text-gray-400 hover:text-gray-700 text-3xl font-bold bg-white rounded-full p-1"
        >
          ×
        </button>

        <div className="overflow-y-auto px-6 sm:px-10 pt-2 pb-10" style={{ maxHeight: "80vh" }}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <MapPin className="text-teal-600" />
              {area.name}
            </h2>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                area.isActive
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {area.isActive ? (locale === "ar" ? "منطقة نشطة" : "Active Area") : (locale === "ar" ? "غير نشطة" : "Inactive")}
            </span>
          </div>

          <div className="text-xs font-mono text-gray-400 mb-6">Slug: {area.slug} • ID: {area.id}</div>

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Area Manager Info */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              <div className="text-base font-bold text-gray-900 flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                {locale === "ar" ? "بيانات مدير المنطقة" : "Area Manager Info"}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-semibold text-gray-500">{locale === "ar" ? "الاسم:" : "Name:"}</span>
                <span className="font-bold text-gray-900">{manager?.name || (locale === "ar" ? "غير معين" : "Unassigned")}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-semibold text-gray-500">{locale === "ar" ? "البريد الإلكتروني:" : "Email:"}</span>
                <span className="text-gray-800">{manager?.email || (locale === "ar" ? "غير متوفر" : "N/A")}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-semibold text-gray-500">{locale === "ar" ? "الهاتف:" : "Phone:"}</span>
                <span className="text-gray-800">{manager?.phone || (locale === "ar" ? "غير متوفر" : "N/A")}</span>
              </div>
            </div>

            {/* Geographical Info */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              <div className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Navigation size={18} className="text-emerald-600" />
                {locale === "ar" ? "الموقع الجغرافي والإحصاءات" : "Geographical Info"}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-semibold text-gray-500">{locale === "ar" ? "إجمالي الفروع:" : "Stores Count:"}</span>
                <span className="font-bold text-teal-700 text-base">{area.storeCount}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="font-semibold text-gray-500">{locale === "ar" ? "الإحداثيات الجغرافية:" : "Coordinates:"}</span>
                <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                  {hasCoords ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : (locale === "ar" ? "غير مسجلة" : "N/A")}
                </span>
              </div>
            </div>
          </div>

          {/* Live Google Map */}
          <div className="mb-6">
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm w-full h-64 bg-gray-100 relative">
              <iframe
                title={`Map of ${area.name}`}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${lat},${lng}&z=13&output=embed`}
                allowFullScreen
              />
            </div>
          </div>

          {/* Stores in Area */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Store size={18} className="text-orange-500" />
              {locale === "ar" ? "الفروع التابعة للمنطقة" : "Stores in this Area"}
              <span className="text-xs bg-orange-50 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
                {stores.length}
              </span>
            </h3>

            {loadingStores ? (
              <div className="flex items-center justify-center p-6 bg-gray-50 rounded-2xl">
                <Loader2 className="w-5 h-5 animate-spin text-teal-600 mr-2" />
                <span className="text-xs text-gray-500">{locale === "ar" ? "جارٍ جلب الفروع..." : "Loading stores..."}</span>
              </div>
            ) : stores.length === 0 ? (
              <div className="p-4 text-center bg-gray-50 rounded-2xl text-xs text-gray-500">
                {locale === "ar" ? "لا توجد فروع مسجلة لهذه المنطقة حالياً" : "No stores registered in this area"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {stores.map((s) => (
                  <div key={s.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="font-bold text-sm text-gray-900 truncate">{s.name}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                      <span>{s.userCount} {locale === "ar" ? "موظف" : "staff"}</span>
                      {s.lat && s.lng && (
                        <span className="text-[10px] text-teal-700 font-mono">GPS ✓</span>
                      )}
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

const AreaManagerView = () => {
  const params = useParams()
  const locale: Locale =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    (Array.isArray(params?.locale) && (params?.locale[0] === "ar" || params?.locale[0] === "en") && params?.locale[0]) ||
    "en"

  const title = locale === "ar" ? "إدارة المناطق" : "Area Management"
  const [open, setOpen] = useState(false)
  const fabPosition = locale === "ar" ? "left-6" : "right-6"

  const [areas, setAreas] = useState<AreaItem[]>([])
  const [areaManagers, setAreaManagers] = useState<UserItem[]>([])
  const [stores, setStores] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedArea, setSelectedArea] = useState<AreaItem | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [areasRes, managersRes, storesRes] = await Promise.allSettled([
        areaService.listAreas(),
        userService.listUsers({ role: "AREA_MANAGER" }),
        storeService.listStores(),
      ])

      if (areasRes.status === "fulfilled") setAreas(areasRes.value)
      if (managersRes.status === "fulfilled") setAreaManagers(managersRes.value.data)
      if (storesRes.status === "fulfilled") setStores(storesRes.value)
    } catch (e) {
      console.error("Failed to load areas data:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Map areas for Leaflet MapComponent
  const mapAreas: MapArea[] = useMemo(() => {
    return areas
      .filter((a) => a.lat !== null && a.lng !== null)
      .map((a, idx) => {
        const mgr = areaManagers.find((m) => m.areaId === a.id)
        return {
          id: a.id,
          name: a.name,
          lat: Number(a.lat),
          lng: Number(a.lng),
          managerName: mgr ? mgr.name : null,
          color: areaPalette[idx % areaPalette.length],
          storesCount: a.storeCount,
        }
      })
  }, [areas, areaManagers])

  const totalStores = useMemo(() => {
    return stores.length || areas.reduce((acc, a) => acc + (a.storeCount || 0), 0)
  }, [stores, areas])

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8" style={{ backgroundImage: "url('/background.jpg')", backgroundRepeat: "repeat" }}>
      <div className="max-w-[1400px] mx-auto">
        {/* Details Modal */}
        <AreaDetailsModal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          area={selectedArea}
          manager={areaManagers.find((m) => m.areaId === selectedArea?.id)}
          locale={locale}
        />

        {/* User Creation Modal */}
        <UserModal
          open={open}
          onClose={() => setOpen(false)}
          defaultRole="AREA_MANAGER"
          fixedRole="AREA_MANAGER"
          onSuccess={() => {
            loadAllData()
          }}
        />

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            {locale === "ar" ? "إدارة وتتبع المناطق الجغرافية ومطابقة الفروع بالخدمات الحية" : "Manage and track geographical areas and live store assignments"}
          </p>
        </motion.div>

        {/* Quick Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {/* Stores */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Store size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-gray-900">{totalStores}</div>
              <div className="text-xs text-gray-500 font-medium">{locale === "ar" ? "إجمالي الفروع" : "Total Stores"}</div>
            </div>
          </div>

          {/* Area Managers */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-gray-900">{areaManagers.length}</div>
              <div className="text-xs text-gray-500 font-medium">{locale === "ar" ? "مديرو المناطق" : "Area Managers"}</div>
            </div>
          </div>

          {/* Total Areas */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <MapPin size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-gray-900">{areas.length}</div>
              <div className="text-xs text-gray-500 font-medium">{locale === "ar" ? "المناطق المسجلة" : "Total Areas"}</div>
            </div>
          </div>

          {/* Active Areas */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-gray-900">{areas.filter((a) => a.isActive).length}</div>
              <div className="text-xs text-gray-500 font-medium">{locale === "ar" ? "مناطق نشطة" : "Active Areas"}</div>
            </div>
          </div>
        </motion.div>

        {/* Areas Interactive Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <MapComponent areas={mapAreas} locale={locale} />
        </motion.div>

        {/* Areas Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl shadow-sm border border-gray-100">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
            <div className="text-gray-500 text-sm">{locale === "ar" ? "جارٍ تحميل المناطق..." : "Loading areas..."}</div>
          </div>
        ) : areas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl shadow-sm border border-gray-100 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
            <div className="text-gray-700 font-bold mb-1">{locale === "ar" ? "لا توجد مناطق مسجلة" : "No areas found"}</div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            {areas.map((area, idx) => {
              const cardColor = areaPalette[idx % areaPalette.length]
              const manager = areaManagers.find((m) => m.areaId === area.id)
              const hasCoords = area.lat !== null && area.lng !== null

              return (
                <motion.div
                  key={area.id}
                  initial={{ opacity: 0, y: 30, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 * idx, ease: "easeOut" }}
                  whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
                  className="bg-white rounded-3xl shadow-md hover:shadow-xl border border-gray-100 p-6 relative overflow-hidden cursor-pointer"
                  onClick={() => {
                    setSelectedArea(area)
                    setDetailsOpen(true)
                  }}
                >
                  {/* Top color bar */}
                  <div
                    className="absolute inset-x-0 top-0 h-2"
                    style={{ backgroundColor: cardColor }}
                  />

                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-sm shrink-0"
                      style={{ backgroundColor: cardColor }}
                    >
                      <MapPin className="text-white" size={26} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 font-extrabold text-xl truncate">{area.name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{area.slug}</div>
                    </div>
                  </div>

                  {/* Area Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-700 text-sm bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <User size={16} className="text-indigo-600 shrink-0" />
                      <span className="text-gray-500">{locale === "ar" ? "المدير:" : "Manager:"}</span>
                      <span className="font-bold text-gray-900 truncate">
                        {manager?.name || (locale === "ar" ? "غير معين" : "Unassigned")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-xl font-extrabold text-gray-900">{area.storeCount}</div>
                        <div className="text-xs text-gray-500 font-medium">{locale === "ar" ? "فروع" : "Stores"}</div>
                      </div>

                      <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-xs font-mono font-bold text-teal-700">
                          {hasCoords ? `${Number(area.lat).toFixed(3)}, ${Number(area.lng).toFixed(3)}` : "GPS N/A"}
                        </div>
                        <div className="text-xs text-gray-500 font-medium mt-1">{locale === "ar" ? "الإحداثيات" : "Coordinates"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Active Status Badge */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                    <span className="text-gray-400 font-mono">ID: {area.id.slice(0, 8)}...</span>
                    <span
                      className={`font-semibold px-2.5 py-0.5 rounded-full ${
                        area.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {area.isActive ? (locale === "ar" ? "نشط" : "Active") : (locale === "ar" ? "معطل" : "Inactive")}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Add User Button */}
        <div className="w-full flex justify-center mt-12 mb-8">
          <button
            onClick={() => setOpen(true)}
            className="w-full max-w-md bg-secondary hover:bg-primary text-white font-bold py-3 px-6 rounded-xl text-base shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus size={20} />
            {locale === "ar" ? "إضافة مدير منطقة جديد" : "Add Area Manager"}
          </button>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-6 ${fabPosition} z-40 bg-secondary hover:bg-primary text-white rounded-full shadow-2xl w-14 h-14 flex items-center justify-center transition-all duration-200 border-4 border-white cursor-pointer`}
          aria-label={locale === "ar" ? "إضافة مدير منطقة جديد" : "Add Area Manager"}
        >
          <UserPlus size={26} />
        </button>
      </div>
    </div>
  )
}

export default AreaManagerView
