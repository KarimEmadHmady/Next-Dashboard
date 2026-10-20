"use client"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { User, Store, Users, MapPin, UserPlus, Mail, Phone, Calendar, Star, Store as FiStore } from "lucide-react"
import { useState } from "react"
import { FiX, FiUser, FiUsers, FiMapPin, FiList, FiShoppingCart } from "react-icons/fi"
import React from "react"

type StoreManager = {
  id: number
  name: { en: string; ar: string }
  branch: { en: string; ar: string }
  employees: number
  color: string
}

const managers: StoreManager[] = [
  {
    id: 1,
    name: { en: "Ahmed Hassan", ar: "أحمد حسن" },
    branch: { en: "Store - Cairo", ar: "المتجر - القاهرة" },
    employees: 20,
    color: "#fb923c"
  },
  {
    id: 2,
    name: { en: "Youssef Ahmed", ar: "يوسف أحمد" },
    branch: { en: "Store - Dokki", ar: "المتجر - الدقي" },
    employees: 12,
    color: "#6366f1"
  },
  {
    id: 3,
    name: { en: "Mohamed Ali", ar: "محمد علي" },
    branch: { en: "Store - Mokattam", ar: "المتجر - المقطم" },
    employees: 10,
    color: "#06b6d4"
  },
  {
    id: 4,
    name: { en: "Omar Khaled", ar: "عمر خالد" },
    branch: { en: "Store - Nasr City", ar: "المتجر - مدينة نصر" },
    employees: 18,
    color: "#ef4444"
  },
  {
    id: 5,
    name: { en: "Karim Adel", ar: "كريم عادل" },
    branch: { en: "Store - New Cairo", ar: "المتجر - القاهرة الجديدة" },
    employees: 22,
    color: "#8b5cf6"
  },
  {
    id: 6,
    name: { en: "Hassan Tarek", ar: "حسن طارق" },
    branch: { en: "Store - Shorouk & Obour", ar: "المتجر - الشروق والعبور" },
    employees: 11,
    color: "#14b8a6"
  },
  {
    id: 7,
    name: { en: "Mahmoud Essam", ar: "محمود عصام" },
    branch: { en: "Store - Sheikh Zayed", ar: "المتجر - الشيخ زايد" },
    employees: 14,
    color: "#84cc16"
  },
  {
    id: 8,
    name: { en: "Mostafa Samir", ar: "مصطفى سمير" },
    branch: { en: "Store - 6th of October", ar: "المتجر - 6 أكتوبر" },
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
];
const fakeOrders = [
  { id: "ORD-10231", date: "2025-08-18", total: 320, status: "completed" },
  { id: "ORD-10232", date: "2025-08-17", total: 210, status: "pending" },
  { id: "ORD-10233", date: "2025-08-16", total: 540, status: "completed" },
  { id: "ORD-10234", date: "2025-08-15", total: 150, status: "cancelled" },
];
const fakeLocation = { lat: 30.0275, lng: 31.4913, address: { en: "First Settlement, Cairo", ar: "التجمع الأول، القاهرة" } };

function ManagerModal({ open, onClose, manager, locale }: { open: boolean; onClose: () => void; manager: StoreManager | null; locale: 'ar' | 'en' }) {
  if (!open || !manager) return null;
  // بيانات وهمية للمانجر
  const fakeManager = {
    email: 'manager@example.com',
    phone: '+201234567890',
    role: locale === 'ar' ? 'مدير فرع' : 'Branch Manager',
    hiredAt: '2022-01-10',
    rating: 4.8,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(manager.name[locale])}&background=6366f1&color=fff&size=256`,
  };
  // بيانات مختصرة عن الاستور
  const fakeLocation = { address: { en: manager.branch.en + ', Cairo', ar: manager.branch.ar + '، القاهرة' } };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative animate-fade-in font-[Cairo] flex flex-col border border-gray-100 max-h-[90vh]">
        <button onClick={onClose} className="sticky top-0 right-0 self-end z-20 mt-6 mr-6 text-gray-400 hover:text-secondary text-3xl font-bold bg-white rounded-full"><FiX /></button>
        <div className="overflow-y-auto px-8 pt-2 pb-10" style={{ maxHeight: '80vh' }}>
          {/* صورة المانجر */}
          <div className="flex flex-col items-center mb-6 mt-2">
            <img src={fakeManager.avatar} alt={manager.name[locale]} className="w-32 h-32 rounded-full border-4 border-indigo-200 shadow-xl object-cover bg-white mb-2" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1 flex items-center gap-2">{manager.name[locale]}</h2>
            <div className="text-lg text-indigo-500 mb-2">{fakeManager.role}</div>
            <div className="flex gap-4 text-gray-500 text-base mb-2">
              <span><Mail className="inline mr-1 text-blue-400" /> {fakeManager.email}</span>
              <span><Phone className="inline mr-1 text-green-500" /> {fakeManager.phone}</span>
            </div>
            <div className="flex gap-4 text-gray-500 text-base mb-2">
              <span><Calendar className="inline mr-1 text-orange-400" /> {locale === 'ar' ? 'تاريخ التعيين:' : 'Hired at:'} {fakeManager.hiredAt}</span>
              <span className="text-yellow-500 font-bold"><Star className="inline mr-1" /> {locale === 'ar' ? 'تقييم:' : 'Rating:'} {fakeManager.rating}</span>
            </div>
          </div>
          {/* بيانات مختصرة عن الاستور */}
          <div className="bg-indigo-50 rounded-2xl p-6 mb-2 flex flex-col items-start border border-indigo-100">
            <h3 className="text-xl font-bold text-indigo-700 mb-2 flex items-center gap-2"><FiStore className="text-indigo-400" />{locale === 'ar' ? 'بيانات الفرع' : 'Store Info'}</h3>
            <div className="mb-2 flex items-center gap-2 text-base text-gray-700"><FiMapPin className="text-secondary" /> <span className="font-semibold">{locale === 'ar' ? 'الفرع:' : 'Branch:'}</span> <span>{manager.branch[locale]}</span></div>
            <div className="mb-2 flex items-center gap-2 text-base text-gray-700"><FiMapPin className="text-cyan-500" /> <span className="font-semibold">{locale === 'ar' ? 'العنوان:' : 'Address:'}</span> <span>{fakeLocation.address[locale]}</span></div>
            <div className="mb-2 flex items-center gap-2 text-base text-gray-700"><FiUsers className="text-emerald-500" /> <span className="font-semibold">{locale === 'ar' ? 'عدد الموظفين:' : 'Employees:'}</span> <span>{manager.employees}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Locale = "ar" | "en"
type CreatePayload = {
  name: string
  email: string
  password: string
  storeId?: string
  role: "USER_STORE"
}
const availableStores = [
  { id: "first-settlement", label: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" } },
  { id: "dokki", label: { en: "Store - Dokki", ar: "المتجر - الدقى" } },
  { id: "sheraton", label: { en: "Store - Sheraton", ar: "المتجر - شيراتون" } },
]
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
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

function CreateCard({ locale, onSuccess }: { locale: Locale; onSuccess?: () => void }) {
  const [form, setForm] = useState<CreatePayload>({ name: "", email: "", password: "", role: "USER_STORE" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const l = {
    name: locale === "ar" ? "الاسم" : "Name",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email",
    password: locale === "ar" ? "كلمة المرور" : "Password",
    store: locale === "ar" ? "المتجر" : "Store",
    select: locale === "ar" ? "اختر" : "Select",
    create: locale === "ar" ? "إنشاء" : "Create",
  }
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      setToastMsg(locale === "ar" ? "تم إنشاء المستخدم بنجاح " : "User created successfully ")
      setShowToast(true)
      setForm({ name: "", email: "", password: "", role: "USER_STORE" })
      setTimeout(() => setShowToast(false), 2000)
      if (onSuccess) setTimeout(onSuccess, 800)
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 relative mb-2 max-w-md mx-auto">
      {showToast && (
        <div className="absolute left-1/2 -translate-x-1/2 top-2 z-20 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold animate-fade-in">
          {toastMsg}
        </div>
      )}
      <div className="font-semibold text-gray-900 mb-3">{locale === "ar" ? "إضافة مستخدم متجر جديد" : "Add New User Store"}</div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">{l.name}</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600"
            placeholder={locale === "ar" ? "اكتب الاسم" : "Enter full name"}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{l.email}</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600"
            placeholder={locale === "ar" ? "name@example.com" : "name@example.com"}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{l.password}</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600"
            placeholder={locale === "ar" ? "••••••••" : "••••••••"}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{l.store}</label>
          <select
            required
            value={form.storeId || ""}
            onChange={(e) => setForm((f) => ({ ...f, storeId: e.target.value }))}
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" disabled>
              {l.select}
            </option>
            {availableStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label[locale]}
              </option>
            ))}
          </select>
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

// خريطة أسماء المتاجر حسب المعرف
const storeLabelById: Record<string, { en: string; ar: string }> = {
  "first-settlement": { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" },
  dokki: { en: "Store - Dokki", ar: "المتجر - الدقى" },
  sheraton: { en: "Store - Sheraton", ar: "المتجر - شيراتون" },
}

function mapStoreManager(u: any, nextIdStart: number): StoreManager {
  const store = u.storeId && storeLabelById[u.storeId] ? storeLabelById[u.storeId] : { en: "Store", ar: "متجر" }
  return {
    id: nextIdStart,
    name: { en: String(u.name || "Store Manager"), ar: String(u.name || "مدير المتجر") },
    branch: store,
    employees: 0,
    color: "#6366f1",
  }
}

const BranchResponsibleView = () => {
  const params = useParams()
  const locale: Locale =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    (Array.isArray(params?.locale) && (params?.locale[0] === "ar" || params?.locale[0] === "en") && params?.locale[0]) ||
    "en"

  const title = locale === "ar" ? "مسؤولو الفروع (Store Manager)" : "Store Managers"
  const branchLabel = locale === "ar" ? "مسؤول عن" : "Responsible for"
  const employeesLabel = locale === "ar" ? "عدد الموظفين" : "Employees"
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<StoreManager | null>(null);
  const [extraManagers, setExtraManagers] = useState<StoreManager[]>([])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("storeManagers") || "[]"
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) {
          const mapped: StoreManager[] = arr.map((u: any, idx: number) => mapStoreManager(u, 10000 + idx))
          setExtraManagers(mapped)
        }
      } catch {}
    }
  }, [])

  const allManagers: StoreManager[] = React.useMemo(() => [...extraManagers, ...managers], [extraManagers])

  // تحديد مكان الزر العائم حسب اللغة
  const fabPosition = locale === "ar" ? "left-6" : "right-6"

  return (
    <div className="min-h-screen  p-4 sm:p-6 md:p-8" style={{ backgroundImage: "url('/background.jpg')", backgroundRepeat: 'repeat' }}>
      <ManagerModal open={modalOpen} onClose={() => setModalOpen(false)} manager={selectedManager} locale={locale} />
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
              style={{ background: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)" }}
            >
              <User className="text-white" size={22} />
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
          {allManagers.map((m, idx) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 * idx, ease: "easeOut" }}
              whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 p-5 relative overflow-hidden cursor-pointer"
              onClick={() => { setSelectedManager(m); setModalOpen(true); }}
            >
              <div
                className="absolute inset-x-0 -top-12 h-36 opacity-[0.06]"
                style={{ background: `radial-gradient(120px 60px at 50% 0%, ${m.color}, transparent)` }}
              />
              <div className="relative flex items-start gap-4">
                <div
                  className="flex items-center justify-center w-14 h-14 rounded-full shadow-sm shrink-0"
                  style={{ background: m.color }}
                >
                  <User className="text-white" size={26} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 font-bold text-lg truncate">{m.name[locale]}</div>
                  <div className="mt-2 flex items-center gap-2 text-gray-600 text-sm">
                    <Store size={16} className="text-indigo-600" />
                    <span className="truncate">{branchLabel}: {m.branch[locale]}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-gray-600 text-sm">
                    <Users size={16} className="text-emerald-600" />
                    <span className="truncate">{employeesLabel}: {m.employees}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        {/* زر إضافة مستخدم متجر جديد (صغير + أيقونة) */}
        <div className="w-full flex justify-center mt-12 mb-8">
          <button
            onClick={() => setOpen(true)}
            className="w-full max-w-md bg-secondary hover:bg-primary text-white font-bold py-2 px-4 rounded-lg text-base shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            {locale === "ar" ? "إضافة مستخدم متجر جديد" : "Add New User Store"}
          </button>
        </div>
        {/* زر عائم دائري */}
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-6 ${fabPosition} z-50 bg-secondary hover:bg-primary text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center transition-all duration-200 border-4 border-white`}
          aria-label={locale === "ar" ? "إضافة مستخدم متجر جديد" : "Add New User Store"}
        >
          <UserPlus size={28} />
        </button>
        <Modal open={open} onClose={() => setOpen(false)}>
          <CreateCard locale={locale} onSuccess={() => setOpen(false)} />
        </Modal>
      </div>
    </div>
  )
}

export default BranchResponsibleView
