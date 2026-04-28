"use client"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { Store, Users, User, MapPin } from "lucide-react"
import { useState } from "react"
import { FiX, FiUser, FiUsers, FiMapPin, FiList, FiShoppingCart } from "react-icons/fi"

type Branch = {
  id: number
  name: { en: string; ar: string }
  location: { en: string; ar: string }
  manager: { en: string; ar: string }
  employees: number
  color: string
}

const branches: Branch[] = [
  {
    id: 1,
    name: { en: "Store - Cairo", ar: "المتجر - القاهرة" },
    location: { en: "Cairo", ar: "القاهرة" },
    manager: { en: "Ahmed Hassan", ar: "أحمد حسن" },
    employees: 20,
    color: "#f59e0b"
  },
  {
    id: 2,
    name: { en: "Store - Dokki", ar: "المتجر - الدقي" },
    location: { en: "Dokki", ar: "الدقي" },
    manager: { en: "Youssef Ahmed", ar: "يوسف أحمد" },
    employees: 12,
    color: "#3b82f6"
  },
  {
    id: 3,
    name: { en: "Store - Mokattam", ar: "المتجر - المقطم" },
    location: { en: "Mokattam", ar: "المقطم" },
    manager: { en: "Mohamed Ali", ar: "محمد علي" },
    employees: 10,
    color: "#22c55e"
  },
  {
    id: 4,
    name: { en: "Store - Nasr City", ar: "المتجر - مدينة نصر" },
    location: { en: "Nasr City", ar: "مدينة نصر" },
    manager: { en: "Omar Khaled", ar: "عمر خالد" },
    employees: 18,
    color: "#ef4444"
  },
  {
    id: 5,
    name: { en: "Store - New Cairo", ar: "المتجر - القاهرة الجديدة" },
    location: { en: "New Cairo", ar: "القاهرة الجديدة" },
    manager: { en: "Karim Adel", ar: "كريم عادل" },
    employees: 22,
    color: "#8b5cf6"
  },
  {
    id: 6,
    name: { en: "Store - Shorouk & Obour", ar: "المتجر - الشروق والعبور" },
    location: { en: "Shorouk & Obour", ar: "الشروق والعبور" },
    manager: { en: "Hassan Tarek", ar: "حسن طارق" },
    employees: 11,
    color: "#06b6d4"
  },
  {
    id: 7,
    name: { en: "Store - Sheikh Zayed", ar: "المتجر - الشيخ زايد" },
    location: { en: "Sheikh Zayed", ar: "الشيخ زايد" },
    manager: { en: "Mahmoud Essam", ar: "محمود عصام" },
    employees: 14,
    color: "#84cc16"
  },
  {
    id: 8,
    name: { en: "Store - 6th of October", ar: "المتجر - 6 أكتوبر" },
    location: { en: "6th of October", ar: "6 أكتوبر" },
    manager: { en: "Mostafa Samir", ar: "مصطفى سمير" },
    employees: 16,
    color: "#f97316"
  }
];

// بيانات وهمية للموظفين والأوردرات
const fakeStaff = [
  { id: 1, name: { en: "Omar Ali", ar: "عمر علي" }, role: { en: "Sales", ar: "مبيعات" } },
  { id: 2, name: { en: "Nour Ahmed", ar: "نور أحمد" }, role: { en: "Cashier", ar: "كاشير" } },
  { id: 3, name: { en: "Mahmoud Farid", ar: "محمود فريد" }, role: { en: "Sales Lead", ar: "مسؤول مبيعات" } },
  { id: 4, name: { en: "Sara Mohamed", ar: "سارة محمد" }, role: { en: "Customer Support", ar: "خدمة عملاء" } },
  { id: 5, name: { en: "Ali Hassan", ar: "علي حسن" }, role: { en: "Warehouse", ar: "مخزن" } },
];
const fakeOrders = [
  { id: "ORD-10231", date: "2025-08-18", total: 320, status: "completed" },
  { id: "ORD-10232", date: "2025-08-17", total: 210, status: "pending" },
  { id: "ORD-10233", date: "2025-08-16", total: 540, status: "completed" },
  { id: "ORD-10234", date: "2025-08-15", total: 150, status: "cancelled" },
  { id: "ORD-10235", date: "2025-08-14", total: 400, status: "completed" },
];
const fakeLocation = { lat: 30.0275, lng: 31.4913, address: { en: "First Settlement, Cairo", ar: "التجمع الأول، القاهرة" } };

function StoreModal({ open, onClose, store, locale }: { open: boolean; onClose: () => void; store: Branch | null; locale: 'ar' | 'en' }) {
  if (!open || !store) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl relative animate-fade-in font-[Cairo] flex flex-col border border-gray-100 max-h-[90vh]">
        <button onClick={onClose} className="sticky top-0 right-0 self-end z-20 mt-6 mr-6 text-gray-400 hover:text-secondary text-3xl font-bold bg-white rounded-full"><FiX /></button>
        <div className="overflow-y-auto px-10 pt-2 pb-10" style={{ maxHeight: '80vh' }}>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-2 mt-2"><Store className="text-orange-400" />{store.name[locale]}</h2>
          <div className="mb-6 text-lg text-gray-600 flex items-center gap-2"><FiUser className="text-blue-400" />{locale === 'ar' ? 'مدير الفرع:' : 'Manager:'} <span className="font-bold text-gray-900">{store.manager[locale]}</span></div>
          <div className="mb-8 flex flex-col md:flex-row gap-8 w-full">
            {/* بيانات الفرع */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-lg text-gray-600"><FiUsers className="text-emerald-500" /> <span className="font-semibold">{locale === 'ar' ? 'عدد الموظفين:' : 'Employees:'}</span> <span>{store.employees}</span></div>
              <div className="flex items-center gap-2 text-lg text-gray-600"><FiMapPin className="text-secondary" /> <span className="font-semibold">{locale === 'ar' ? 'العنوان:' : 'Address:'}</span> <span>{fakeLocation.address[locale]}</span></div>
              <div className="flex items-center gap-2 text-lg text-gray-600"><FiList className="text-indigo-500" /> <span className="font-semibold">{locale === 'ar' ? 'كود الفرع:' : 'Branch ID:'}</span> <span>{store.id}</span></div>
            </div>
            {/* خريطة الموقع */}
            <div className="flex-1 min-w-[250px]">
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm w-full h-56">
                <iframe
                  title="map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${fakeLocation.lat},${fakeLocation.lng}&z=15&output=embed`}
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
          {/* الموظفين */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2"><FiUsers className="text-emerald-500" />{locale === 'ar' ? 'الموظفون' : 'Staff'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fakeStaff.map((s) => (
                <div key={s.id} className="bg-gray-50 rounded-xl p-4 flex items-center gap-4 border border-gray-100">
                  <FiUser className="text-blue-400" size={28} />
                  <div>
                    <div className="font-bold text-lg text-gray-900">{s.name[locale]}</div>
                    <div className="text-gray-600 text-base">{s.role[locale]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* الأوردرات */}
          <div className="mb-2">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2"><FiShoppingCart className="text-indigo-500" />{locale === 'ar' ? 'الطلبات' : 'Orders'}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-base border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-gray-700 font-semibold">{locale === 'ar' ? 'رقم الطلب' : 'Order ID'}</th>
                    <th className="px-4 py-2 text-gray-700 font-semibold">{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th className="px-4 py-2 text-gray-700 font-semibold">{locale === 'ar' ? 'الإجمالي' : 'Total'}</th>
                    <th className="px-4 py-2 text-gray-700 font-semibold">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {fakeOrders.map((o) => (
                    <tr key={o.id} className="border-t text-center">
                      <td className="px-4 py-2 text-gray-900 font-bold">{o.id}</td>
                      <td className="px-4 py-2 text-blue-700">{o.date}</td>
                      <td className="px-4 py-2 text-blue-700 font-bold">{o.total} L.E</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${o.status === 'completed' ? 'bg-green-100 text-green-700' : o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'}`}>{o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BranchManagerView = () => {
  const params = useParams()
  const locale: "ar" | "en" =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    (Array.isArray(params?.locale) && (params?.locale[0] === "ar" || params?.locale[0] === "en") && params?.locale[0]) ||
    "en"

  const title = locale === "ar" ? "الفروع (مدير الفروع)" : "Stores (Branch Manager)"
  const employeesLabel = locale === "ar" ? "عدد العاملين" : "Employees"
  const managerLabel = locale === "ar" ? "مدير المتجر" : "Manager"

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Branch | null>(null);

  return (
    <div className="min-h-screen  p-4 sm:p-6 md:p-8" style={{ backgroundImage: "url('/background.jpg')", backgroundRepeat: 'repeat' }}>
      <StoreModal open={modalOpen} onClose={() => setModalOpen(false)} store={selectedStore} locale={locale} />
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
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 p-5 relative overflow-hidden cursor-pointer"
              onClick={() => { setSelectedStore(b); setModalOpen(true); }}
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
