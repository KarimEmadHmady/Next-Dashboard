"use client"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { User, Store, Briefcase, BadgeDollarSign, ClipboardList, Users, Search } from "lucide-react"
import { useState } from "react"

type Staff = {
  id: number
  name: { en: string; ar: string }
  branch: { en: string; ar: string }
  role: { en: string; ar: string }
  salary: number
  ordersHandled: number
  color: string
}

const staffList: Staff[] = [
  // First Settlement (approx 10)
  { id: 1, name: { en: "Omar Ali", ar: "عمر علي" }, branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, role: { en: "Sales", ar: "مبيعات" }, salary: 6500, ordersHandled: 58, color: "#3b82f6" },
  { id: 2, name: { en: "Nour Ahmed", ar: "نور أحمد" }, branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, role: { en: "Sales Lead", ar: "مسؤول مبيعات" }, salary: 7200, ordersHandled: 73, color: "#a855f7" },
  { id: 3, name: { en: "Mahmoud Farid", ar: "محمود فريد" }, branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, role: { en: "Cashier", ar: "كاشير" }, salary: 5600, ordersHandled: 65, color: "#06b6d4" },
  { id: 4, name: { en: "Yara Tarek", ar: "يارا طارق" }, branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, role: { en: "Sales", ar: "مبيعات" }, salary: 6000, ordersHandled: 49, color: "#22c55e" },
  { id: 5, name: { en: "Khaled Samir", ar: "خالد سمير" }, branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, role: { en: "Office Boy", ar: "أوفيس بوي" }, salary: 4300, ordersHandled: 0, color: "#f59e0b" },
  { id: 6, name: { en: "Mariam Adel", ar: "مريم عادل" }, branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, role: { en: "Sales", ar: "مبيعات" }, salary: 6100, ordersHandled: 34, color: "#3b82f6" },
  { id: 7, name: { en: "Ahmed Saeed", ar: "أحمد سعيد" }, branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, role: { en: "Cashier", ar: "كاشير" }, salary: 5550, ordersHandled: 53, color: "#06b6d4" },
  { id: 8, name: { en: "Laila Mostafa", ar: "ليلى مصطفى" }, branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, role: { en: "Sales", ar: "مبيعات" }, salary: 5900, ordersHandled: 28, color: "#22c55e" },
  { id: 9, name: { en: "Hany Fathy", ar: "هاني فتحي" }, branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, role: { en: "Sales", ar: "مبيعات" }, salary: 6050, ordersHandled: 44, color: "#3b82f6" },
  { id: 10, name: { en: "Dina Nabil", ar: "دينا نبيل" }, branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, role: { en: "Sales", ar: "مبيعات" }, salary: 5800, ordersHandled: 39, color: "#a855f7" },

  // Dokki (approx 10)
  { id: 11, name: { en: "Hassan Mostafa", ar: "حسن مصطفى" }, branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, role: { en: "Cashier", ar: "كاشير" }, salary: 5700, ordersHandled: 41, color: "#22c55e" },
  { id: 12, name: { en: "Salma Ahmed", ar: "سلمى أحمد" }, branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, role: { en: "Sales", ar: "مبيعات" }, salary: 5950, ordersHandled: 33, color: "#3b82f6" },
  { id: 13, name: { en: "Karim Magdy", ar: "كريم مجدي" }, branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, role: { en: "Sales Lead", ar: "مسؤول مبيعات" }, salary: 7300, ordersHandled: 80, color: "#a855f7" },
  { id: 14, name: { en: "Sherif Nader", ar: "شريف نادر" }, branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, role: { en: "Sales", ar: "مبيعات" }, salary: 6000, ordersHandled: 27, color: "#22c55e" },
  { id: 15, name: { en: "Heba Fares", ar: "هبة فارس" }, branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, role: { en: "Cashier", ar: "كاشير" }, salary: 5650, ordersHandled: 38, color: "#06b6d4" },
  { id: 16, name: { en: "Aya Hassan", ar: "آية حسن" }, branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, role: { en: "Sales", ar: "مبيعات" }, salary: 5850, ordersHandled: 26, color: "#22c55e" },
  { id: 17, name: { en: "Marwan Essam", ar: "مروان عصام" }, branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, role: { en: "Office Boy", ar: "أوفيس بوي" }, salary: 4200, ordersHandled: 0, color: "#f59e0b" },
  { id: 18, name: { en: "Rana Tamer", ar: "رنا تامر" }, branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, role: { en: "Sales", ar: "مبيعات" }, salary: 6020, ordersHandled: 31, color: "#3b82f6" },
  { id: 19, name: { en: "Ola Fathy", ar: "عُلا فتحي" }, branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, role: { en: "Sales", ar: "مبيعات" }, salary: 5900, ordersHandled: 22, color: "#22c55e" },
  { id: 20, name: { en: "Mostafa Hamed", ar: "مصطفى حامد" }, branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, role: { en: "Sales", ar: "مبيعات" }, salary: 6000, ordersHandled: 36, color: "#3b82f6" },

  // Sheraton (approx 10)
  { id: 21, name: { en: "Mostafa Adel", ar: "مصطفى عادل" }, branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, role: { en: "Office Boy", ar: "أوفيس بوي" }, salary: 4200, ordersHandled: 0, color: "#f59e0b" },
  { id: 22, name: { en: "Hadi Ramy", ar: "هادي رامي" }, branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, role: { en: "Sales", ar: "مبيعات" }, salary: 5900, ordersHandled: 24, color: "#22c55e" },
  { id: 23, name: { en: "Nadine Salah", ar: "نادين صلاح" }, branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, role: { en: "Cashier", ar: "كاشير" }, salary: 5600, ordersHandled: 40, color: "#06b6d4" },
  { id: 24, name: { en: "Said Gomaa", ar: "سعيد جمعة" }, branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, role: { en: "Sales", ar: "مبيعات" }, salary: 6050, ordersHandled: 37, color: "#3b82f6" },
  { id: 25, name: { en: "Alaa Emad", ar: "علاء عماد" }, branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, role: { en: "Sales Lead", ar: "مسؤول مبيعات" }, salary: 7400, ordersHandled: 79, color: "#a855f7" },
  { id: 26, name: { en: "Hager Taha", ar: "هاجر طه" }, branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, role: { en: "Sales", ar: "مبيعات" }, salary: 5900, ordersHandled: 29, color: "#22c55e" },
  { id: 27, name: { en: "Omar Nasr", ar: "عمر نصر" }, branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, role: { en: "Cashier", ar: "كاشير" }, salary: 5550, ordersHandled: 42, color: "#06b6d4" },
  { id: 28, name: { en: "Nermeen Atef", ar: "نيرمين عاطف" }, branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, role: { en: "Sales", ar: "مبيعات" }, salary: 6000, ordersHandled: 35, color: "#3b82f6" },
  { id: 29, name: { en: "Ramy Ahmed", ar: "رامي أحمد" }, branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, role: { en: "Sales", ar: "مبيعات" }, salary: 5850, ordersHandled: 21, color: "#22c55e" },
  { id: 30, name: { en: "Hatem Fathy", ar: "حاتم فتحي" }, branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, role: { en: "Sales", ar: "مبيعات" }, salary: 6100, ordersHandled: 34, color: "#3b82f6" },
]

const BranchUser2View = () => {
  const params = useParams()
  const locale: "ar" | "en" =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    (Array.isArray(params?.locale) && (params?.locale[0] === "ar" || params?.locale[0] === "en") && params?.locale[0]) ||
    "en"

  const title = locale === "ar" ? "مستخدمو الفروع" : "Branch Users"
  const branchLabel = locale === "ar" ? "الفرع" : "Branch"
  const roleLabel = locale === "ar" ? "الدور" : "Role"
  const salaryLabel = locale === "ar" ? "الراتب" : "Salary"
  const ordersLabel = locale === "ar" ? "الطلبات التي تمت معالجتها" : "Orders handled"

  const [search, setSearch] = useState("")
  const filteredStaff = staffList.filter((s) =>
    s.name[locale].toLowerCase().includes(search.toLowerCase())
  )

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
            <Users className="text-blue-600" size={28} />
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
                placeholder={locale === "ar" ? "ابحث عن موظف..." : "Search for a user..."}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white placeholder-gray-400"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 gap-4"
        >
          {filteredStaff.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 * idx, ease: "easeOut" }}
              whileHover={{ y: -3, scale: 1.005, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 p-4 relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-full text-white shrink-0"
                  style={{ background: s.color }}
                >
                  <User size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 font-bold text-lg truncate">{s.name[locale]}</div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                      <Store size={14} className="text-cyan-600" />
                      <div className="text-xs text-gray-700 truncate"><span className="text-gray-500">{branchLabel}:</span> {s.branch[locale]}</div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                      <Briefcase size={14} className="text-indigo-600" />
                      <div className="text-xs text-gray-700 truncate"><span className="text-gray-500">{roleLabel}:</span> {s.role[locale]}</div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                      <BadgeDollarSign size={14} className="text-emerald-600" />
                      <div className="text-xs text-gray-700 truncate"><span className="text-gray-500">{salaryLabel}:</span> {s.salary} <span className="text-[10px] text-gray-500">L.E</span></div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                      <ClipboardList size={14} className="text-rose-600" />
                      <div className="text-xs text-gray-700 truncate"><span className="text-gray-500">{ordersLabel}:</span> {s.ordersHandled}</div>
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

export default BranchUser2View
