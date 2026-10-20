"use client"
import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { FiMapPin, FiLayers, FiShoppingCart, FiUsers, FiUserCheck, FiHome } from "react-icons/fi"
import { UserPlus, CalendarDays, Clock, Store, User } from "lucide-react"
import {  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import OutOfCoverageChart from "@/components/ui/OutOfCoverageChart"
import { motion } from "framer-motion"

type CityData = {
  id: number
  name: { ar: string; en: string }
  coordinates: { lat: number; lng: number }
  orders: number
  percentage: number
  color: string
  region: { ar: string; en: string }
}

const citiesData: CityData[] = [
  {
    id: 1,
    name: { ar: "القاهرة - مدينة نصر", en: "Cairo - Nasr City" },
    coordinates: { lat: 30.0444, lng: 31.2357 },
    orders: 142,
    percentage: 28.4,
    color: "#ef4444",
    region: { ar: "القاهرة", en: "Cairo" }
  },
  {
    id: 2,
    name: { ar: "الجيزة - 6 أكتوبر", en: "Giza - 6th October" },
    coordinates: { lat: 29.9792, lng: 30.7293 },
    orders: 118,
    percentage: 23.6,
    color: "#f59e0b",
    region: { ar: "الجيزة", en: "Giza" }
  },
  {
    id: 3,
    name: { ar: "الإسكندرية - سيدي جابر", en: "Alexandria - Sidi Gaber" },
    coordinates: { lat: 31.2057, lng: 29.9247 },
    orders: 89,
    percentage: 17.8,
    color: "#3b82f6",
    region: { ar: "الإسكندرية", en: "Alexandria" }
  }
]

const stats = [
  {
    label: { ar: "المناطق", en: "Areas" },
    value: 12,
    icon: <FiMapPin size={28} />,
    color: "#06b6d4", // Cyan-500
    href: "area-manager",
  },
  {
    label: { ar: "الفروع", en: "Branches" },
    value: 8,
    icon: <FiLayers size={28} />,
    color: "#facc15", // Yellow-500
    href: "branch-manager",
  },
  {
    label: { ar: "الطلبات", en: "Orders" },
    value: 34,
    icon: <FiShoppingCart size={28} />,
    color: "#a78bfa", // Purple-500
    href: "orders",
  },
  {
    label: { ar: "مسؤولي الفروع", en: "Branch Responsibles" },
    value: 5,
    icon: <FiUsers size={28} />,
    color: "#fb923c", // Orange-500
    href: "branch-responsible",
  },
  {
    label: { ar: "مستخدمو الفروع", en: "Branch Users" },
    value: 20,
    icon: <FiUserCheck size={28} />,
    color: "#f472b6", // Pink-500
    href: "branch-user",
  },
]

// Chart data
const monthlyData = [
  { name: 'يناير', ar: 'يناير', en: 'Jan', orders: 65, revenue: 12000 },
  { name: 'فبراير', ar: 'فبراير', en: 'Feb', orders: 59, revenue: 9800 },
  { name: 'مارس', ar: 'مارس', en: 'Mar', orders: 80, revenue: 15000 },
  { name: 'أبريل', ar: 'أبريل', en: 'Apr', orders: 81, revenue: 16000 },
  { name: 'مايو', ar: 'مايو', en: 'May', orders: 56, revenue: 11000 },
  { name: 'يونيو', ar: 'يونيو', en: 'Jun', orders: 55, revenue: 10500 },
]

const weeklyData = [
  { name: 'الأحد', ar: 'الأحد', en: 'Sun', orders: 12, revenue: 2400 },
  { name: 'الاثنين', ar: 'الاثنين', en: 'Mon', orders: 19, revenue: 3800 },
  { name: 'الثلاثاء', ar: 'الثلاثاء', en: 'Tue', orders: 15, revenue: 3000 },
  { name: 'الأربعاء', ar: 'الأربعاء', en: 'Wed', orders: 22, revenue: 4400 },
  { name: 'الخميس', ar: 'الخميس', en: 'Thu', orders: 18, revenue: 3600 },
  { name: 'الجمعة', ar: 'الجمعة', en: 'Fri', orders: 25, revenue: 5000 },
  { name: 'السبت', ar: 'السبت', en: 'Sat', orders: 20, revenue: 4000 },
]

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative animate-fade-in z-[999999]">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  )
}

function OrderDetailsModal({ open, onClose, order, locale }: { open: boolean; onClose: () => void; order: LatestOrder | null; locale: "ar" | "en" }) {
  if (!open || !order) return null
  const meta = statusMeta[order.status]
  const salesPerson = locale === "ar" ? "موظف المبيعات: غير محدد" : "Sales: N/A"
  const areaManager = order.manager[locale]
  return (
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative animate-fade-in font-[Cairo] flex flex-col border border-gray-100 max-h-[90vh]">
        <button onClick={onClose} className="sticky top-0 right-0 self-end z-20 mt-6 mr-6 text-gray-400 hover:text-secondary text-3xl font-bold bg-white rounded-full">×</button>
        <div className="overflow-y-auto px-8 pt-2 pb-8" style={{ maxHeight: '80vh' }}>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-1">{order.id}</h2>
          <div className={`inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs font-medium mb-6 ${meta.className}`}>
            <span className={`w-2 h-2 rounded-full ${meta.dot}`} /> {meta[locale]}
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg text-gray-600"><span className="font-semibold">{locale === 'ar' ? 'الفرع:' : 'Branch:'}</span> <span className="text-gray-900">{order.branch[locale]}</span></div>
            <div className="flex items-center gap-2 text-lg text-gray-600"><span className="font-semibold">{locale === 'ar' ? 'مدير المنطقة:' : 'Area Manager:'}</span> <span className="text-gray-900">{areaManager}</span></div>
            <div className="flex items-center gap-2 text-lg text-gray-600"><span className="font-semibold">{locale === 'ar' ? 'المبيعات:' : 'Sales:'}</span> <span className="text-gray-500">{salesPerson}</span></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-lg text-gray-600"><span className="font-semibold">{locale === 'ar' ? 'التاريخ:' : 'Date:'}</span> <span className="text-gray-900">{order.date}</span></div>
              <div className="flex items-center gap-2 text-lg text-gray-600"><span className="font-semibold">{locale === 'ar' ? 'الوقت:' : 'Time:'}</span> <span className="text-gray-900">{order.time}</span></div>
            </div>
            <div className="flex items-center gap-2 text-lg text-gray-600"><span className="font-semibold">{locale === 'ar' ? 'الإجمالي:' : 'Total:'}</span> <span className="text-blue-700 font-bold">{order.total} L.E</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ManagerView = () => {
  const params = useParams()
  const locale: "ar" | "en" =
    typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en")
      ? params.locale
      : Array.isArray(params?.locale) && (params?.locale[0] === "ar" || params?.locale[0] === "en")
        ? params?.locale[0]
        : "en"

  const [isSmallScreen, setIsSmallScreen] = useState<undefined | boolean>(undefined)
  const [progress1, setProgress1] = useState(0)
  const [progress2, setProgress2] = useState(0)
  const [progress3, setProgress3] = useState(0)
  const [open, setOpen] = useState(false)
  const fabPosition = locale === "ar" ? "left-6" : "right-6"
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<LatestOrder | null>(null)

  useEffect(() => {
    const checkScreen = () => setIsSmallScreen(window.innerWidth <= 500)
    checkScreen()
    window.addEventListener("resize", checkScreen)
    return () => window.removeEventListener("resize", checkScreen)
  }, [])

  useEffect(() => {
    setProgress1(0)
    const timeout = setTimeout(() => setProgress1(85), 200)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    setProgress2(0)
    const timeout = setTimeout(() => setProgress2(60), 200)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    setProgress3(0)
    const timeout = setTimeout(() => setProgress3(15), 200)
    return () => clearTimeout(timeout)
  }, [])

  const small = isSmallScreen === true

  return (
    <>
      <style jsx global>{`
        html {
          scrollbar-color: #66c7c7 transparent; 
          scrollbar-width: thin;
        }
        body {
          background-image: url('/background.jpg');
          background-repeat: repeat;
        }
        ::-webkit-scrollbar {
          width: 10px;
          background: url('/background.jpg') repeat;
        }
        ::-webkit-scrollbar-thumb {
          background: #66c7c7;
          border-radius: 8px;
        }
        ::-webkit-scrollbar-track {
          background: url('/background.jpg') repeat;
        }
      `}</style>
      <div className="min-h-screen  p-4 sm:p-6 md:p-8" style={{ backgroundImage: "url('/background.jpg')", backgroundRepeat: 'repeat' }}>
        <div className="max-w-[1200px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`flex items-center gap-3 font-extrabold text-gray-900 mb-${small ? "6" : "8"} text-${small ? "2xl" : "3xl"}`}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <FiHome className="inline align-middle text-blue-600" />
            </motion.div>
            {locale === "ar" ? "نظرة عامة على الداشبورد" : "Dashboard Overview"}
          </motion.h2>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`grid ${small ? "grid-cols-1 gap-4" : "sm:grid-cols-2 md:grid-cols-5 gap-6"} w-full mb-${small ? "6" : "8"}`}
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: idx * 0.1, 
                  ease: "easeOut",
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.2 }
                }}
              >
                <Link
                  href={`/${locale}/dashboard/${stat.href}`}
                  className={`flex items-center bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer w-full ${small ? "max-w-[300px] mx-auto p-5 gap-3" : "p-6 gap-4"}`}
                  style={{ textDecoration: "none" }}
                >
                <div
                  className={`flex items-center justify-center rounded-full text-white shrink-0 ${small ? "w-12 h-12 text-xl" : "w-16 h-16 text-3xl"}`}
                  style={{ background: stat.color }}
                >
                  {stat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-extrabold text-gray-900 truncate ${small ? "text-2xl" : "3xl"}`}
                  >
                    {stat.value}
                  </div>
                                <div className={`text-gray-600 truncate ${small ? "text-sm" : "base"}`}>
                  {stat.label[locale]}
                </div>
              </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Statistical Circles Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className={`grid ${small ? "grid-cols-1 gap-6" : "grid-cols-10 gap-6"} mb-8`}
          >
            {/* Progress Circles - 70% width */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className={`bg-white rounded-2xl shadow-lg ${small ? "p-5" : "p-8"} ${small ? "col-span-1" : "col-span-7"}`}
            >
            <h3 className="text-lg font-bold text-gray-900 mb-4">
                {locale === "ar" ? "الإيرادات الشهرية" : "Monthly Revenue"}
              </h3>
              <ResponsiveContainer width="100%" height={small ? 200 : 250}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey={locale === "ar" ? "ar" : "en"} 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `${value}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [`${value} L.E`, locale === "ar" ? "الإيرادات" : "Revenue"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Out of Coverage Chart - 30% width */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              className={`${small ? "col-span-1 w-full mt-4" : "col-span-3"} p-0`}
            >
              {/* Map Title */}
            <div className="bg-teal-100 h-full flex flex-col pt-2 rounded-[20px] ">
              <div className="mb-4 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {locale === "ar" ? "طلبات خارج التغطية" : "Out of Coverage Orders"}
                </h3>
                <p className="text-sm text-gray-600">
                  {locale === "ar" ? "المدن مع أعلى عدد من الطلبات خارج نطاق التغطية" : "Cities with highest out-of-coverage orders"}
                </p>
              </div>
              <OutOfCoverageChart cities={citiesData} locale={locale} />
            </div>
            </motion.div>
          </motion.div>

          {/* Charts Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className={`grid ${small ? "grid-cols-1 gap-6" : "grid-cols-2 gap-8"} mb-8`}
          >
            {/* Monthly Revenue Chart */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >

            <h3 className="text-lg font-bold text-gray-900 mb-4">
                {locale === "ar" ? "حالة الطلبات" : "Order Status"}
              </h3>
              <div className="flex flex-wrap justify-center gap-8 mt-0 sm:mt-15">
                {[
                  {
                    label: { ar: "مكتمل", en: "Completed" },
                    percent: 85,
                    color: "#22c55e", // Green-500
                    progress: progress1,
                  },
                  {
                    label: { ar: "قيد التنفيذ", en: "In Progress" },
                    percent: 60,
                    color: "#facc15", // Yellow-500
                    progress: progress2,
                  },
                  {
                    label: { ar: "ملغي", en: "Cancelled" },
                    percent: 15,
                    color: "#ef4444", // Red-500
                    progress: progress3,
                  },
                ].map((stat, idx) => {
                  const radius = small ? 35 : 45
                  const stroke = small ? 6 : 8
                  const normalizedRadius = radius - stroke / 2
                  const circumference = normalizedRadius * 2 * Math.PI
                  const offset = circumference - (stat.progress / 100) * circumference

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col items-center ${small ? "min-w-[100px] max-w-[120px] mx-auto" : "min-w-[120px] max-w-[150px]"}`}
                    >
                      <svg width={radius * 2} height={radius * 2}>
                        <circle
                          stroke="#e5e7eb" // Gray-200
                          fill="none"
                          strokeWidth={stroke}
                          cx={radius}
                          cy={radius}
                          r={normalizedRadius}
                        />
                        <circle
                          stroke={stat.color}
                          fill="none"
                          strokeWidth={stroke}
                          strokeLinecap="round"
                          cx={radius}
                          cy={radius}
                          r={normalizedRadius}
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,2,.6,1)" }}
                        />
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dy="0.3em"
                          fontSize={small ? 18 : 20}
                          fontWeight="bold"
                          fill={stat.color}
                        >
                          {stat.progress}%
                        </text>
                      </svg>
                      <span
                        className={`font-semibold mt-2 text-gray-700`}
                        style={{ color: stat.color, fontSize: small ? 14 : 16 }}
                      >
                        {stat.label[locale]}
                      </span>


                        
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Weekly Orders Chart */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {locale === "ar" ? "الطلبات الأسبوعية" : "Weekly Orders"}
              </h3>
              <ResponsiveContainer width="100%" height={small ? 200 : 250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey={locale === "ar" ? "ar" : "en"} 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any) => [value, locale === "ar" ? "الطلبات" : "Orders"]}
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>

          {/* Latest Orders Cards (vertical) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
            className={`bg-white rounded-2xl shadow-lg ${small ? "max-w-[300px] mx-auto p-5" : "p-8"}`}
          >
            <div className={`font-extrabold mb-4 text-gray-900 ${small ? "text-xl" : "2xl"}`}>
              {locale === "ar" ? "أحدث الطلبات" : "Latest Orders"}
            </div>
            <div className="flex flex-col gap-3">
              {latestOrders.map((order: LatestOrder, idx: number) => {
                const meta = statusMeta[order.status]
                return (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => { setSelectedOrder(order); setOrderModalOpen(true); }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-gray-900 font-bold text-base truncate">{order.id}</div>
                        <div className={`mt-1.5 inline-flex items-center gap-2 border rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.className}`}>
                          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                          {meta[locale]}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>{locale === 'ar' ? 'الوقت' : 'Time'}: <span className="text-gray-800 font-medium">{order.time}</span></div>
                        <div className="mt-1">{locale === 'ar' ? 'التاريخ' : 'Date'}: <span className="text-gray-800 font-medium">{order.date}</span></div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                        <Store size={14} className="text-cyan-600" />
                        <div className="text-xs text-gray-700 truncate">{order.branch[locale]}</div>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                        <User size={14} className="text-indigo-600" />
                        <div className="text-xs text-gray-700 truncate">{order.manager[locale]}</div>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                        <div className="text-xs text-gray-700 truncate font-semibold">{order.total} <span className="text-[10px] text-gray-500">L.E</span></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
          {/* زر إضافة مستخدم جديد (صغير + أيقونة) */}
          <div className="w-full flex justify-center mt-12 mb-8">
            <button
              onClick={() => setOpen(true)}
              className="w-full max-w-md bg-secondary hover:bg-primary text-white font-bold py-2 px-4 rounded-lg text-base shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <UserPlus size={20} />
              {locale === "ar" ? "إضافة مستخدم جديد" : "Add New User"}
            </button>
          </div>
          {/* زر عائم دائري */}
          <button
            onClick={() => setOpen(true)}
            className={`fixed bottom-6 ${fabPosition} z-50 bg-secondary hover:bg-primary text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center transition-all duration-200 border-4 border-white`}
            aria-label={locale === "ar" ? "إضافة مستخدم جديد" : "Add New User"}
          >
            <UserPlus size={28} />
          </button>
          <Modal open={open} onClose={() => setOpen(false)}>
            <UserManagementForms locale={locale} />
          </Modal>
          <OrderDetailsModal open={orderModalOpen} onClose={() => setOrderModalOpen(false)} order={selectedOrder} locale={locale} />
        </div>
      </div>
    </>
  )
}

export default ManagerView

// ---- User Management Forms ----
import React from "react"

type Locale = "ar" | "en"

type StoreOption = { id: string; label: Record<Locale, string> }
const availableStores: StoreOption[] = [
  { id: "first-settlement", label: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" } },
  { id: "dokki", label: { en: "Store - Dokki", ar: "المتجر - الدقى" } },
  { id: "sheraton", label: { en: "Store - Sheraton", ar: "المتجر - شيراتون" } },
]

// قائمة المناطق والمتاجر التابعة لها
const availableAreas = [
  {
    id: "cairo",
    label: { en: "Cairo Area", ar: "منطقة القاهرة" },
    stores: [
      { id: "first-settlement", label: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" } },
      { id: "dokki", label: { en: "Store - Dokki", ar: "المتجر - الدقى" } },
    ],
  },
  {
    id: "giza",
    label: { en: "Giza Area", ar: "منطقة الجيزة" },
    stores: [
      { id: "sheraton", label: { en: "Store - Sheraton", ar: "المتجر - شيراتون" } },
    ],
  },
]

type CreatePayload = {
  name: string
  email: string
  password: string
  storeId?: string
  role: "AREA_MANAGER" | "STORE_MANAGER" | "USER_STORE"
}

function UserManagementForms({ locale }: { locale: Locale }) {
  const title = locale === "ar" ? "إدارة المستخدمين" : "User Management"
  const subtitle =
    locale === "ar"
      ? "إنشاء حسابات: مدير المناطق، مدير المتجر، ومستخدم المتجر"
      : "Create Area Manager, Store Manager, and User Store accounts"

  // Tab state
  const [selectedRole, setSelectedRole] = useState<"AREA_MANAGER" | "STORE_MANAGER" | "USER_STORE">("AREA_MANAGER")

  // Tab labels
  const tabOptions = [
    {
      key: "AREA_MANAGER" as const,
      label: locale === "ar" ? "مدير المناطق" : "Area Manager",
      requireStore: false,
    },
    {
      key: "STORE_MANAGER" as const,
      label: locale === "ar" ? "مدير المتجر" : "Store Manager",
      requireStore: true,
    },
    {
      key: "USER_STORE" as const,
      label: locale === "ar" ? "مستخدم المتجر" : "User Store",
      requireStore: true,
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <div className="text-xl font-bold text-gray-900">{title}</div>
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabOptions.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedRole(tab.key)}
            className={`px-4 py-2 rounded-lg font-semibold border transition-all duration-200 focus:outline-none ${selectedRole === tab.key ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Only show the selected card */}
      <div className="max-w-md mx-auto">
        {tabOptions.filter((tab) => tab.key === selectedRole).map((tab) => (
          <CreateCard
            key={tab.key}
            heading={tab.label}
            locale={locale}
            role={tab.key}
            requireStore={tab.requireStore}
          />
        ))}
      </div>
    </div>
  )
}

function CreateCard({
  heading,
  locale,
  role,
  requireStore,
}: {
  heading: string
  locale: Locale
  role: CreatePayload["role"]
  requireStore: boolean
}) {
  // State
  const [form, setForm] = useState<CreatePayload>({ name: "", email: "", password: "", role })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedArea, setSelectedArea] = useState<string>("")
  // Toast state
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  // --- NEW: users state ---
  const [users, setUsers] = useState<CreatePayload[]>(() => {
    if (typeof window !== "undefined") {
      const key =
        role === "AREA_MANAGER"
          ? "areaManagers"
          : role === "STORE_MANAGER"
          ? "storeManagers"
          : "userStores"
      return JSON.parse(localStorage.getItem(key) || "[]")
    }
    return []
  })

  // --- NEW: sync users to localStorage ---
  useEffect(() => {
    const key =
      role === "AREA_MANAGER"
        ? "areaManagers"
        : role === "STORE_MANAGER"
        ? "storeManagers"
        : "userStores"
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(users))
    }
  }, [users, role])

  // --- NEW: update users if role changes (tab switch) ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const key =
        role === "AREA_MANAGER"
          ? "areaManagers"
          : role === "STORE_MANAGER"
          ? "storeManagers"
          : "userStores"
      setUsers(JSON.parse(localStorage.getItem(key) || "[]"))
    }
  }, [role])

  // Get stores for selected area (for AREA_MANAGER)
  const storesForArea = selectedArea
    ? availableAreas.find((a) => a.id === selectedArea)?.stores || []
    : []

  // For other roles, use all stores
  const storeOptions =
    role === "AREA_MANAGER"
      ? storesForArea
      : availableStores

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // --- NEW: add user to localStorage ---
      const newUser = { ...form, storeId: requireStore ? form.storeId : undefined }
      setUsers((prev) => [...prev, newUser])
      setToastMsg(locale === "ar" ? "تم إنشاء المستخدم بنجاح " : "User created successfully ")
      setShowToast(true)
      setForm({ name: "", email: "", password: "", role, storeId: requireStore ? form.storeId : undefined })
      setSelectedArea("")
      setTimeout(() => setShowToast(false), 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const l = {
    name: locale === "ar" ? "الاسم" : "Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    password: locale === "ar" ? "كلمة المرور" : "Password",
    area: locale === "ar" ? "المنطقة" : "Area",
    store: locale === "ar" ? "المتجر" : "Store",
    select: locale === "ar" ? "اختر" : "Select",
    create: locale === "ar" ? "إنشاء" : "Create",
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 relative">
      {/* Toast */}
      {showToast && (
        <div className="absolute left-1/2 -translate-x-1/2 top-2 z-20 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold animate-fade-in">
          {toastMsg}
        </div>
      )}
      <div className="font-semibold text-gray-900 mb-3">{heading}</div>
      <form onSubmit={onSubmit} className="space-y-3">
        {/* Area selection for AREA_MANAGER only */}
        {role === "AREA_MANAGER" && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">{l.area}</label>
            <select
              required
              value={selectedArea}
              onChange={(e) => {
                setSelectedArea(e.target.value)
                setForm((f) => ({ ...f, storeId: "" })) // Reset store when area changes
              }}
              className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>
                {l.select}
              </option>
              {availableAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.label[locale]}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Store selection for AREA_MANAGER (after area), or for other roles */}
        {requireStore && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">{l.store}</label>
            <select
              required
              value={form.storeId || ""}
              onChange={(e) => setForm((f) => ({ ...f, storeId: e.target.value }))}
              className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={role === "AREA_MANAGER" && !selectedArea}
            >
              <option value="" disabled>
                {l.select}
              </option>
              {storeOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label[locale]}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Name */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">{l.name}</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={locale === "ar" ? "اكتب الاسم" : "Enter full name"}
          />
        </div>
        {/* Email */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">{l.email}</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={locale === "ar" ? "name@example.com" : "name@example.com"}
          />
        </div>
        {/* Password */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">{l.password}</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={locale === "ar" ? "••••••••" : "••••••••"}
          />
        </div>
        <div className="pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-10 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-60"
          >
            {isSubmitting ? (locale === "ar" ? "جارٍ الإنشاء..." : "Creating...") : l.create}
          </button>
        </div>
      </form>
    </div>
  )
}

// بيانات أحدث الطلبات (مطابقة لصفحة orders)
type LatestOrder = {
  id: string
  branch: { en: string; ar: string }
  manager: { en: string; ar: string }
  time: string
  date: string
  status: "completed" | "in_progress" | "cancelled" | "pending"
  total: number
}
const latestOrders: LatestOrder[] = [
  { id: "ORD-10231", branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, manager: { en: "Ahmed Hassan", ar: "أحمد حسن" }, time: "10:24", date: "2025-08-18", status: "completed", total: 320 },
  { id: "ORD-10232", branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, manager: { en: "Youssef Ahmed", ar: "يوسف أحمد" }, time: "11:05", date: "2025-08-18", status: "in_progress", total: 210 },
  { id: "ORD-10233", branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, manager: { en: "Mohamed Youssef", ar: "محمد يوسف" }, time: "12:42", date: "2025-08-17", status: "cancelled", total: 0 },
  { id: "ORD-10234", branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, manager: { en: "Ahmed Hassan", ar: "أحمد حسن" }, time: "14:19", date: "2025-08-16", status: "pending", total: 95 },
  { id: "ORD-10235", branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, manager: { en: "Youssef Ahmed", ar: "يوسف أحمد" }, time: "09:15", date: "2025-08-16", status: "completed", total: 180 },
]
const statusMeta: Record<LatestOrder["status"], { en: string; ar: string; className: string; dot: string }> = {
  completed: { en: "Completed", ar: "مكتمل", className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  in_progress: { en: "In Progress", ar: "قيد التنفيذ", className: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  cancelled: { en: "Cancelled", ar: "ملغي", className: "bg-red-50 text-red-700 border-red-200", dot: "bg-secondary" },
  pending: { en: "Pending", ar: "قيد المراجعة", className: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
}
