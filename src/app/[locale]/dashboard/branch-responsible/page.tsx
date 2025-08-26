"use client"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { User, Store, Users, MapPin, UserPlus } from "lucide-react"
import { useState } from "react"

type StoreManager = {
  id: number
  name: { en: string; ar: string }
  branch: { en: string; ar: string }
  employees: number
  color: string
}

const managers: StoreManager[] = [
  { id: 1, name: { en: "Ahmed Hassan", ar: "أحمد حسن" }, branch: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" }, employees: 12, color: "#fb923c" },
  { id: 2, name: { en: "Youssef Ahmed", ar: "يوسف أحمد" }, branch: { en: "Store - Dokki", ar: "المتجر - الدقى" }, employees: 9, color: "#6366f1" },
  { id: 3, name: { en: "Mohamed Youssef", ar: "محمد يوسف" }, branch: { en: "Store - Sheraton", ar: "المتجر - شيراتون" }, employees: 7, color: "#06b6d4" },
]

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
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative animate-fade-in">
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
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={locale === "ar" ? "••••••••" : "••••••••"}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">{l.store}</label>
          <select
            required
            value={form.storeId || ""}
            onChange={(e) => setForm((f) => ({ ...f, storeId: e.target.value }))}
            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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

  // تحديد مكان الزر العائم حسب اللغة
  const fabPosition = locale === "ar" ? "left-6" : "right-6"

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
          {managers.map((m, idx) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 * idx, ease: "easeOut" }}
              whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 p-5 relative overflow-hidden"
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
            className="w-full max-w-md bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-base shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            {locale === "ar" ? "إضافة مستخدم متجر جديد" : "Add New User Store"}
          </button>
        </div>
        {/* زر عائم دائري */}
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-6 ${fabPosition} z-50 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center transition-all duration-200 border-4 border-white`}
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
