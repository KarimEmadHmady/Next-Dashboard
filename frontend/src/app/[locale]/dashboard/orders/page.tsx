"use client"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import {
  ShoppingCart,
  Store,
  User,
  Clock,
  CalendarDays,
  Receipt,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Package,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  Home,
} from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { FiX, FiShoppingCart, FiUser, FiCalendar, FiClock, FiCheckCircle } from "react-icons/fi"
import { orderService } from "@/services/orderService"
import { areaService } from "@/services/areaService"
import { storeService } from "@/services/storeService"
import { OrderItem, OrderStatus } from "@/types/order"
import { AreaItem } from "@/types/area"
import { StoreItem } from "@/types/store"
import { useAppSelector } from "@/redux/hooks"
import { selectCurrentUser } from "@/redux/features/auth/authSelectors"

type Locale = "ar" | "en"

const statusMeta: Record<
  string,
  { en: string; ar: string; className: string; dot: string }
> = {
  completed: {
    en: "Completed",
    ar: "مكتمل",
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  processing: {
    en: "Processing",
    ar: "قيد التنفيذ",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-500",
  },
  pending: {
    en: "Pending",
    ar: "قيد المراجعة",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  "on-hold": {
    en: "On Hold",
    ar: "معلق",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  cancelled: {
    en: "Cancelled",
    ar: "ملغي",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  refunded: {
    en: "Refunded",
    ar: "مسترد",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  failed: {
    en: "Failed",
    ar: "فاشل",
    className: "bg-gray-100 text-gray-700 border-gray-300",
    dot: "bg-gray-500",
  },
}

function formatOrderDateTime(rawDate: string | null) {
  if (!rawDate) return { date: "-", time: "-" }
  try {
    const d = new Date(rawDate)
    if (isNaN(d.getTime())) {
      // In case date string is "YYYY-MM-DD HH:mm:ss"
      const parts = rawDate.split(" ")
      return { date: parts[0] || rawDate, time: parts[1] || "-" }
    }
    return {
      date: d.toISOString().split("T")[0],
      time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  } catch {
    return { date: rawDate, time: "-" }
  }
}

function OrderModal({
  open,
  onClose,
  order,
  locale,
}: {
  open: boolean
  onClose: () => void
  order: OrderItem | null
  locale: Locale
}) {
  if (!open || !order) return null

  const meta = statusMeta[order.status] || {
    en: order.status,
    ar: order.status,
    className: "bg-gray-50 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  }

  const { date, time } = formatOrderDateTime(order.date)
  const isRTL = locale === "ar"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative animate-fade-in font-[Cairo] flex flex-col border border-gray-100 max-h-[90vh] my-6">
        <button
          onClick={onClose}
          className="sticky top-0 right-0 self-end z-20 mt-4 mr-4 rtl:mr-auto rtl:ml-4 text-gray-400 hover:text-gray-700 text-3xl font-bold bg-white rounded-full p-1 cursor-pointer"
        >
          <FiX />
        </button>

        <div className="overflow-y-auto px-6 sm:px-10 pt-2 pb-10" style={{ maxHeight: "80vh" }}>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                <Receipt className="text-indigo-600" />
                <span>
                  {locale === "ar" ? "طلب رقم" : "Order"} #{order.orderNumber || order.id}
                </span>
              </h2>
              <div className="text-xs text-gray-400 mt-1">
                {locale === "ar" ? "التاريخ والوقت:" : "Date & Time:"} {date} • {time}
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-2 border rounded-full px-3.5 py-1 text-sm font-semibold ${meta.className}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
              {meta[locale]}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Store & Location */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Store size={17} className="text-cyan-600" />
                {locale === "ar" ? "بيانات الفرع والمنطقة" : "Branch & Area Info"}
              </div>

              <div className="text-sm text-gray-700 flex items-center gap-2">
                <span className="font-semibold text-gray-500">{locale === "ar" ? "الفرع:" : "Store:"}</span>
                <span className="font-bold text-gray-900">{order.storeName || (locale === "ar" ? "غير محدد" : "Unassigned")}</span>
              </div>

              <div className="text-sm text-gray-700 flex items-center gap-2">
                <span className="font-semibold text-gray-500">{locale === "ar" ? "المنطقة:" : "Area:"}</span>
                <span className="text-gray-900">{order.areaName || (locale === "ar" ? "غير محدد" : "-")}</span>
              </div>

              {order.externalBranchId && (
                <div className="text-xs text-gray-500 font-mono">
                  {locale === "ar" ? "كود الفرع الخارجي:" : "Branch ID:"} {order.externalBranchId}
                </div>
              )}
            </div>

            {/* Customer Details */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3">
              <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <User size={17} className="text-indigo-600" />
                {locale === "ar" ? "بيانات العميل" : "Customer Info"}
              </div>

              <div className="text-sm text-gray-700 flex items-center gap-2">
                <span className="font-semibold text-gray-500">{locale === "ar" ? "الاسم:" : "Name:"}</span>
                <span className="font-bold text-gray-900">
                  {order.customer?.name || (locale === "ar" ? "عميل مباشر" : "Direct Customer")}
                </span>
              </div>

              {order.customer?.email && (
                <div className="text-sm text-gray-700 flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span className="font-mono text-xs text-gray-800">{order.customer.email}</span>
                </div>
              )}

              {order.customer?.phone && (
                <div className="text-sm text-gray-700 flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span className="font-mono text-xs text-gray-800">{order.customer.phone}</span>
                </div>
              )}

              {order.customer?.address && (
                <div className="text-sm text-gray-700 flex items-center gap-2">
                  <Home size={14} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600 truncate">{order.customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line items (Products) */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Package size={18} className="text-purple-600" />
              {locale === "ar" ? "عناصر الطلب" : "Order Items"}
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                {order.items.length}
              </span>
            </h3>

            {order.items.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-500 text-center">
                {locale === "ar" ? "لا توجد تفاصيل عناصر مسجلة لهذا الطلب" : "No item details available"}
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                <table className="min-w-full text-sm divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-start">{locale === "ar" ? "العنصر" : "Item"}</th>
                      <th className="px-4 py-3 text-center">{locale === "ar" ? "الكمية" : "Qty"}</th>
                      <th className="px-4 py-3 text-center">{locale === "ar" ? "السعر" : "Price"}</th>
                      <th className="px-4 py-3 text-end">{locale === "ar" ? "الإجمالي" : "Total"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {order.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-center font-mono text-gray-600">
                          {item.price} {order.currency || "EGP"}
                        </td>
                        <td className="px-4 py-3 text-end font-bold font-mono text-gray-900">
                          {item.total} {order.currency || "EGP"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Total Summary */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
            <span className="text-base font-bold text-indigo-950">
              {locale === "ar" ? "المبلغ الإجمالي:" : "Total Amount:"}
            </span>
            <span className="text-2xl font-extrabold text-indigo-700 font-mono">
              {order.total} {order.currency || "EGP"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const OrdersView = () => {
  const params = useParams()
  const locale: Locale =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    (Array.isArray(params?.locale) && (params?.locale[0] === "ar" || params?.locale[0] === "en") && params?.locale[0]) ||
    "en"

  const currentUser = useAppSelector(selectCurrentUser)

  const title = locale === "ar" ? "الطلبات" : "Orders"
  const branchLabel = locale === "ar" ? "الفرع" : "Branch"
  const totalLabel = locale === "ar" ? "الإجمالي" : "Total"

  const [orders, setOrders] = useState<OrderItem[]>([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedAreaId, setSelectedAreaId] = useState("all")
  const [selectedStoreId, setSelectedStoreId] = useState("all")

  // Options
  const [areas, setAreas] = useState<AreaItem[]>([])
  const [stores, setStores] = useState<StoreItem[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)

  // Load areas & stores options if actor is Operation Manager or Area Manager
  useEffect(() => {
    let isMounted = true
    if (currentUser?.role === "OPERATION_MANAGER" || currentUser?.role === "AREA_MANAGER") {
      Promise.all([areaService.listAreas(), storeService.listStores()])
        .then(([areaList, storeList]) => {
          if (isMounted) {
            setAreas(areaList)
            setStores(storeList)
          }
        })
        .catch(() => {
          // ignore
        })
    }
    return () => {
      isMounted = false
    }
  }, [currentUser])

  // Filter stores according to selected area
  const availableStores = useMemo(() => {
    if (currentUser?.role === "AREA_MANAGER") {
      return stores.filter((s) => s.areaId === currentUser.areaId)
    }
    if (selectedAreaId !== "all") {
      return stores.filter((s) => s.areaId === selectedAreaId)
    }
    return stores
  }, [stores, selectedAreaId, currentUser])

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await orderService.listOrders({
        page,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search.trim() ? search.trim() : undefined,
        areaId: selectedAreaId === "all" ? undefined : selectedAreaId,
        storeId: selectedStoreId === "all" ? undefined : selectedStoreId,
      })

      setOrders(res.data)
      setTotalOrders(res.meta.total)
      setTotalPages(res.meta.totalPages || 1)
    } catch (e) {
      console.error("Failed to fetch orders:", e)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search, selectedAreaId, selectedStoreId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8" style={{ backgroundImage: "url('/background.jpg')", backgroundRepeat: "repeat" }}>
      <OrderModal open={modalOpen} onClose={() => setModalOpen(false)} order={selectedOrder} locale={locale} />
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
              className="flex items-center gap-3 text-gray-900 font-extrabold text-2xl sm:text-3xl rounded-xl"
            >
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" }}
              >
                <ShoppingCart className="text-white" size={22} />
              </motion.span>
              {title}
            </motion.h2>

            <div className="text-sm font-semibold text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
              {locale === "ar" ? "إجمالي الطلبات المسجلة:" : "Total Scoped Orders:"}{" "}
              <span className="font-extrabold text-indigo-600">{totalOrders}</span>
            </div>
          </div>
        </motion.div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder={locale === "ar" ? "ابحث برقم الطلب أو العميل..." : "Search order # or customer..."}
              className="w-full h-10 pl-9 rtl:pl-3 rtl:pr-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white placeholder-gray-400"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 items-center w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">{locale === "ar" ? "كل الحالات" : "All Statuses"}</option>
              <option value="processing">{locale === "ar" ? "قيد التنفيذ (Processing)" : "Processing"}</option>
              <option value="completed">{locale === "ar" ? "مكتمل (Completed)" : "Completed"}</option>
              <option value="pending">{locale === "ar" ? "قيد المراجعة (Pending)" : "Pending"}</option>
              <option value="on-hold">{locale === "ar" ? "معلق (On Hold)" : "On Hold"}</option>
              <option value="cancelled">{locale === "ar" ? "ملغي (Cancelled)" : "Cancelled"}</option>
              <option value="refunded">{locale === "ar" ? "مسترد (Refunded)" : "Refunded"}</option>
              <option value="failed">{locale === "ar" ? "فاشل (Failed)" : "Failed"}</option>
            </select>

            {/* Area Filter (for Operation Manager) */}
            {currentUser?.role === "OPERATION_MANAGER" && (
              <select
                value={selectedAreaId}
                onChange={(e) => {
                  setSelectedAreaId(e.target.value)
                  setSelectedStoreId("all")
                  setPage(1)
                }}
                className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="all">{locale === "ar" ? "كل المناطق" : "All Areas"}</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}

            {/* Store Filter (for Operation Manager or Area Manager) */}
            {(currentUser?.role === "OPERATION_MANAGER" || currentUser?.role === "AREA_MANAGER") && (
              <select
                value={selectedStoreId}
                onChange={(e) => {
                  setSelectedStoreId(e.target.value)
                  setPage(1)
                }}
                className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="all">{locale === "ar" ? "كل الفروع" : "All Branches"}</option>
                {availableStores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Orders Grid / Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl shadow-sm border border-gray-100">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <div className="text-gray-500 text-sm">{locale === "ar" ? "جارٍ جلب الطلبات..." : "Loading orders..."}</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl shadow-sm border border-gray-100 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
            <div className="text-gray-700 font-bold mb-1">{locale === "ar" ? "لا توجد طلبات مطابقة" : "No orders found"}</div>
            <div className="text-gray-400 text-xs">
              {locale === "ar" ? "تأكد من الصلاحيات أو جرب تغيير معايير الفلترة" : "Check permissions or adjust filters"}
            </div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
            >
              {orders.map((o, idx) => {
                const meta = statusMeta[o.status] || {
                  en: o.status,
                  ar: o.status,
                  className: "bg-gray-50 text-gray-700 border-gray-200",
                  dot: "bg-gray-400",
                }
                const { date, time } = formatOrderDateTime(o.date)

                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 30, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.03 * idx, ease: "easeOut" }}
                    whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 p-4 relative overflow-hidden cursor-pointer"
                    onClick={() => {
                      setSelectedOrder(o)
                      setModalOpen(true)
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
                          <Receipt size={22} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-gray-900 font-bold text-base truncate">
                            #{o.orderNumber || o.id}
                          </div>
                          <div
                            className={`mt-1.5 inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.className}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                            {meta[locale]}
                          </div>
                        </div>
                      </div>

                      <div className="text-end text-xs text-gray-500 space-y-1">
                        <div className="flex items-center gap-1 justify-end">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-gray-800 font-medium">{time}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end text-gray-400">
                          <CalendarDays size={12} />
                          <span>{date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Branch */}
                      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5 min-w-0">
                        <Store size={14} className="text-cyan-600 shrink-0" />
                        <div className="text-xs text-gray-700 truncate font-medium">
                          {o.storeName || (locale === "ar" ? "فرع عام" : "General Store")}
                        </div>
                      </div>

                      {/* Customer */}
                      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5 min-w-0">
                        <User size={14} className="text-indigo-600 shrink-0" />
                        <div className="text-xs text-gray-700 truncate font-medium">
                          {o.customer?.name || (locale === "ar" ? "عميل" : "Customer")}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5 min-w-0">
                        <CreditCard size={14} className="text-emerald-600 shrink-0" />
                        <div className="text-xs font-bold text-gray-900 truncate font-mono">
                          {o.total} <span className="text-[10px] text-gray-500 font-normal">{o.currency || "EGP"}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm max-w-sm mx-auto">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={18} className="rtl:rotate-180" />
                </button>

                <div className="text-sm font-semibold text-gray-700">
                  {locale === "ar" ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={18} className="rtl:rotate-180" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default OrdersView
