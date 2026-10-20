"use client"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { ShoppingCart, Store, User, Clock, CalendarDays, Receipt, BadgeCheck, Search } from "lucide-react"
import { useState } from "react"
import { FiX, FiShoppingCart, FiUser, FiCalendar, FiClock } from "react-icons/fi"

type Order = {
  id: string
  branch: { en: string; ar: string }
  manager: { en: string; ar: string }
  time: string // HH:MM
  date: string // YYYY-MM-DD
  status: "completed" | "in_progress" | "cancelled" | "pending"
  total: number
}

const orders: Order[] = [
  { id: "ORD-10231", branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, manager: { en: "Ahmed Hassan", ar: "أحمد حسن" }, time: "10:24", date: "2025-08-18", status: "completed", total: 320 },
  { id: "ORD-10232", branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, manager: { en: "Youssef Ahmed", ar: "يوسف أحمد" }, time: "11:05", date: "2025-08-18", status: "in_progress", total: 210 },
  { id: "ORD-10233", branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, manager: { en: "Mohamed Youssef", ar: "محمد يوسف" }, time: "12:42", date: "2025-08-17", status: "cancelled", total: 0 },
  { id: "ORD-10234", branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, manager: { en: "Ahmed Hassan", ar: "أحمد حسن" }, time: "14:19", date: "2025-08-16", status: "pending", total: 95 },
  { id: "ORD-10235", branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, manager: { en: "Youssef Ahmed", ar: "يوسف أحمد" }, time: "09:15", date: "2025-08-16", status: "completed", total: 180 },
  { id: "ORD-10236", branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, manager: { en: "Mohamed Youssef", ar: "محمد يوسف" }, time: "16:50", date: "2025-08-16", status: "in_progress", total: 250 },
  { id: "ORD-10237", branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, manager: { en: "Ahmed Hassan", ar: "أحمد حسن" }, time: "18:32", date: "2025-08-15", status: "pending", total: 120 },
  { id: "ORD-10238", branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, manager: { en: "Youssef Ahmed", ar: "يوسف أحمد" }, time: "19:05", date: "2025-08-15", status: "completed", total: 410 },
  { id: "ORD-10239", branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, manager: { en: "Mohamed Youssef", ar: "محمد يوسف" }, time: "20:11", date: "2025-08-15", status: "cancelled", total: 0 },
  { id: "ORD-10240", branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, manager: { en: "Ahmed Hassan", ar: "أحمد حسن" }, time: "08:44", date: "2025-08-14", status: "completed", total: 275 },
]

const statusMeta: Record<Order["status"], { en: string; ar: string; className: string; dot: string }> = {
  completed: { en: "Completed", ar: "مكتمل", className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ", className: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  cancelled: { en: "Cancelled", ar: "ملغي", className: "bg-red-50 text-red-700 border-red-200", dot: "bg-secondary" },
  pending: { en: "Pending", ar: "قيد المراجعة", className: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
}

function OrderModal({ open, onClose, order, locale }: { open: boolean; onClose: () => void; order: Order | null; locale: 'ar' | 'en' }) {
  if (!open || !order) return null;
  const meta = statusMeta[order.status];
  // بيانات إضافية وهمية
  const fakeNotes = locale === 'ar' ? 'لا توجد ملاحظات على هذا الطلب.' : 'No notes for this order.';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl p-12 w-full max-w-3xl relative animate-fade-in font-[Cairo] flex flex-col items-center border border-gray-100">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-secondary text-3xl font-bold"><FiX /></button>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-2 mt-2">{locale === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</h2>
        <div className={`inline-flex items-center gap-2 border rounded-full px-4 py-1 text-base font-medium mt-2 mb-8 ${meta.className}`}> <span className={`w-2 h-2 rounded-full ${meta.dot}`} /> {meta[locale]}</div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
          <div>
            <div className="mb-4 flex items-center gap-2 text-lg"><span className="font-semibold text-gray-700">{locale === 'ar' ? 'رقم الطلب:' : 'Order ID:'}</span> <span className="text-gray-900">{order.id}</span></div>
            <div className="mb-4 flex items-center gap-2 text-lg"><span className="font-semibold text-gray-700">{locale === 'ar' ? 'الفرع:' : 'Branch:'}</span> <span className="text-gray-900">{order.branch[locale]}</span></div>
            <div className="mb-4 flex items-center gap-2 text-lg"><span className="font-semibold text-gray-700">{locale === 'ar' ? 'مدير الفرع:' : 'Manager:'}</span> <span className="text-gray-900">{order.manager[locale]}</span></div>
            <div className="mb-4 flex items-center gap-2 text-lg"><span className="font-semibold text-gray-700">{locale === 'ar' ? 'الحالة:' : 'Status:'}</span> <span className={`font-bold ${meta.className}`}>{meta[locale]}</span></div>
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2 text-lg"><span className="font-semibold text-gray-700">{locale === 'ar' ? 'التاريخ:' : 'Date:'}</span> <span className="text-gray-900">{order.date}</span></div>
            <div className="mb-4 flex items-center gap-2 text-lg"><span className="font-semibold text-gray-700">{locale === 'ar' ? 'الوقت:' : 'Time:'}</span> <span className="text-gray-900">{order.time}</span></div>
            <div className="mb-4 flex items-center gap-2 text-lg"><span className="font-semibold text-gray-700">{locale === 'ar' ? 'الإجمالي:' : 'Total:'}</span> <span className="text-blue-700 font-bold">{order.total} L.E</span></div>
            <div className="mb-4 flex items-center gap-2 text-lg"><span className="font-semibold text-gray-700">{locale === 'ar' ? 'ملاحظات:' : 'Notes:'}</span> <span className="text-gray-500">{fakeNotes}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const OrdersView = () => {
  const params = useParams()
  const locale: "ar" | "en" =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    (Array.isArray(params?.locale) && (params?.locale[0] === "ar" || params?.locale[0] === "en") && params?.locale[0]) ||
    "en"

  const title = locale === "ar" ? "الطلبات" : "Orders"
  const branchLabel = locale === "ar" ? "الفرع" : "Branch"
  const managerLabel = locale === "ar" ? "مدير الفرع" : "Manager"
  const timeLabel = locale === "ar" ? "الوقت" : "Time"
  const dateLabel = locale === "ar" ? "التاريخ" : "Date"
  const totalLabel = locale === "ar" ? "الإجمالي" : "Total"

  const [search, setSearch] = useState("")
  const filteredOrders = orders.filter((o) =>
    o.id.toLowerCase().includes(search.toLowerCase())
  )

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <div className="min-h-screen  p-4 sm:p-6 md:p-8" style={{ backgroundImage: "url('/background.jpg')", backgroundRepeat: 'repeat' }}>
      <OrderModal open={modalOpen} onClose={() => setModalOpen(false)} order={selectedOrder} locale={locale} />
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-6 sm:mb-8"
        >
          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="flex items-center gap-3 text-gray-900 font-extrabold text-2xl sm:text-3xl rounded-xl px-4 py-2"
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
          {/* Search Input */}
          <div className="mt-4 flex justify-center">
            <div className="relative w-full max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={locale === "ar" ? "ابحث برقم الطلب..." : "Search by Order ID..."}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white placeholder-gray-400"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {filteredOrders.map((o, idx) => {
            const meta = statusMeta[o.status]
            const statusText = meta[locale]
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * idx, ease: "easeOut" }}
                whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 p-4 relative overflow-hidden cursor-pointer"
                onClick={() => { setSelectedOrder(o); setModalOpen(true); }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500 text-white shrink-0">
                      <Receipt size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-gray-900 font-bold text-base truncate">{o.id}</div>
                      <div className={`mt-1.5 inline-flex items-center gap-2 border rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.className}`}>
                        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        {statusText}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                      <Clock size={12} className="text-gray-400" /> {timeLabel}: <span className="text-gray-800 font-medium">{o.time}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-1">
                      <CalendarDays size={12} className="text-gray-400" /> {dateLabel}: <span className="text-gray-800 font-medium">{o.date}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                    <Store size={14} className="text-cyan-600" />
                    <div className="text-xs text-gray-700 truncate"><span className="text-gray-500">{branchLabel}:</span> {o.branch[locale]}</div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                    <User size={14} className="text-indigo-600" />
                    <div className="text-xs text-gray-700 truncate"><span className="text-gray-500">{managerLabel}:</span> {o.manager[locale]}</div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                    <BadgeCheck size={14} className="text-emerald-600" />
                    <div className="text-xs text-gray-700 truncate"><span className="text-gray-500">{totalLabel}:</span> {o.total} <span className="text-[10px] text-gray-500">L.E</span></div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

export default OrdersView
