"use client"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { Store, Users, User, MapPin } from "lucide-react"

type Branch = {
  id: number
  name: { en: string; ar: string }
  location: { en: string; ar: string }
  manager: { en: string; ar: string }
  employees: number
  color: string
}

const branches: Branch[] = [
  { id: 1, name: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, location: { en: "First Settlement", ar: "التجمع الاول" }, manager: { en: "Ahmed Hassan", ar: "أحمد حسن" }, employees: 12, color: "#f59e0b" },
  { id: 2, name: { en: "Store - Dokki", ar: "المتجر - الدقى" }, location: { en: "Dokki", ar: "الدقى" }, manager: { en: "Youssef Ahmed", ar: "يوسف أحمد" }, employees: 9, color: "#3b82f6" },
  { id: 3, name: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, location: { en: "Sheraton", ar: "شيراتون" }, manager: { en: "Mohamed Youssef", ar: "محمد يوسف" }, employees: 7, color: "#22c55e" },
]

const BranchManagerView = () => {
  const params = useParams()
  const locale: "ar" | "en" =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    (Array.isArray(params?.locale) && (params?.locale[0] === "ar" || params?.locale[0] === "en") && params?.locale[0]) ||
    "en"

  const title = locale === "ar" ? "الفروع (مدير الفروع)" : "Stores (Branch Manager)"
  const employeesLabel = locale === "ar" ? "عدد العاملين" : "Employees"
  const managerLabel = locale === "ar" ? "مدير المتجر" : "Manager"

  return (
    <div className="min-h-screen  p-4 sm:p-6 md:p-8" style={{ backgroundImage: "url('/background.jpg')", backgroundRepeat: 'repeat' }}>
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
            className="text-gray-900 font-extrabold text-2xl sm:text-3xl rounded-xl px-4 py-2 flex items-center gap-3"
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {branches.map((b, idx) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 * idx, ease: "easeOut" }}
              whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 p-5 relative overflow-hidden"
            >
              <div
                className="absolute inset-x-0 -top-12 h-36 opacity-[0.06]"
                style={{ background: `radial-gradient(120px 60px at 50% 0%, ${b.color}, transparent)` }}
              />
              <div className="relative flex items-start gap-4">
                <div
                  className="flex items-center justify-center w-14 h-14 rounded-xl shadow-sm shrink-0"
                  style={{ background: b.color }}
                >
                  <Store className="text-white" size={26} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 font-bold text-lg truncate">{b.name[locale]}</div>
                  <div className="mt-2 flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin size={16} className="text-cyan-600" />
                    <span className="truncate">{b.location[locale]}</span>
                  </div>

                  {/* Stats row */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                      <Users size={16} className="text-emerald-600" />
                      <div className="flex flex-col leading-tight">
                        <span className="text-xs text-gray-500">{employeesLabel}</span>
                        <span className="text-sm font-semibold text-gray-900">{b.employees}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                      <User size={16} className="text-indigo-600" />
                      <div className="flex flex-col leading-tight truncate">
                        <span className="text-xs text-gray-500">{managerLabel}</span>
                        <span className="text-sm font-semibold text-gray-900 truncate">{b.manager[locale]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default BranchManagerView
