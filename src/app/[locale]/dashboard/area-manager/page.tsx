"use client"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { Store, MapPin, User, UserPlus, Globe, BarChart3, Users, TrendingUp, User as UserIcon, Mail } from "lucide-react"
import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// استيراد مكون الخريطة بشكل ديناميكي لتجنب مشاكل SSR
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-gray-500">جاري تحميل الخريطة...</div>
    </div>
  )
})

// بيانات المناطق مع إحداثيات جغرافية
const areas = [
  {
    id: 1,
    name: { en: "First Settlement Area", ar: "منطقة التجمع الأول" },
    location: { en: "First Settlement", ar: "التجمع الأول" },
    coordinates: { lat: 30.0275, lng: 31.4913 }, // التجمع الأول
    manager: { en: "Ahmed Hassan", ar: "أحمد حسن" },
    color: "#3b82f6",
    storesCount: 8,
    usersCount: 45,
    performance: 92,
    population: "125K",
    area: "15.2 km²"
  },
  {
    id: 2,
    name: { en: "Dokki Area", ar: "منطقة الدقى" },
    location: { en: "Dokki", ar: "الدقى" },
    coordinates: { lat: 30.0377, lng: 31.2118 }, // الدقي
    manager: { en: "Youssef Ahmed", ar: "يوسف أحمد" },
    color: "#22c55e",
    storesCount: 12,
    usersCount: 67,
    performance: 88,
    population: "98K",
    area: "12.8 km²"
  },
  {
    id: 3,
    name: { en: "Sheraton Area", ar: "منطقة شيراتون" },
    location: { en: "Sheraton", ar: "شيراتون" },
    coordinates: { lat: 30.0996, lng: 31.3758 }, // شيراتون
    manager: { en: "Mohamed Youssef", ar: "محمد يوسف" },
    color: "#f59e0b",
    storesCount: 6,
    usersCount: 38,
    performance: 95,
    population: "76K",
    area: "9.5 km²"
  },
]

type Area = {
  id: number
  name: { en: string; ar: string }
  location: { en: string; ar: string }
  coordinates: { lat: number; lng: number }
  manager: { en: string; ar: string }
  color: string
  storesCount: number
  usersCount: number
  performance: number
  population: string
  area: string
}

type Locale = "ar" | "en"
type CreatePayload = {
  name: string
  email: string
  password: string
  storeId?: string
  role: "STORE_MANAGER" | "USER_STORE"
}

const availableStores = [
  { id: "first-settlement", label: { en: "Store - First Settlement", ar: "المتجر - التجمع الاول" } },
  { id: "dokki", label: { en: "Store - Dokki", ar: "المتجر - الدقى" } },
  { id: "sheraton", label: { en: "Store - Sheraton", ar: "المتجر - شيراتون" } },
]

function CreateCard({ heading, locale, role }: { heading: string; locale: Locale; role: CreatePayload["role"] }) {
  const [form, setForm] = useState<CreatePayload>({ name: "", email: "", password: "", role })
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
      setForm({ name: "", email: "", password: "", role })
      setTimeout(() => setShowToast(false), 2000)
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 relative mb-8 max-w-md mx-auto">
      {showToast && (
        <div className="absolute left-1/2 -translate-x-1/2 top-2 z-20 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold animate-fade-in">
          {toastMsg}
        </div>
      )}
      <div className="font-semibold text-gray-900 mb-3">{heading}</div>
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

// بوب أب تفاصيل المنطقة
function AreaDetailsModal({ open, onClose, area, locale }: { open: boolean; onClose: () => void; area: Area | null; locale: Locale }) {
  if (!open || !area) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 z-[99999]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl relative animate-fade-in font-[Cairo] flex flex-col border border-gray-100 max-h-[90vh]">
        <button onClick={onClose} className="sticky top-0 right-0 self-end z-20 mt-6 mr-6 text-gray-400 hover:text-red-500 text-3xl font-bold bg-white rounded-full">×</button>
        <div className="overflow-y-auto px-8 pt-2 pb-10" style={{ maxHeight: '80vh' }}>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-1">{area.name[locale]}</h2>
          <div className="text-gray-500 mb-6">{area.location[locale]}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* معلومات أساسية عن مدير المنطقة */}
            <div className="space-y-3">
              <div className="text-lg font-bold text-gray-900 mb-2">{locale === 'ar' ? 'بيانات مدير المنطقة' : 'Area Manager Info'}</div>
              <div className="flex items-center gap-2 text-lg"><span className="font-semibold">{locale === 'ar' ? 'الاسم:' : 'Name:'}</span> <span className="text-gray-900">{area.manager[locale]}</span></div>
              <div className="flex items-center gap-2 text-lg"><span className="font-semibold">{locale === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</span> <span className="text-gray-500">{locale === 'ar' ? 'غير متوفر' : 'N/A'}</span></div>
              <div className="flex items-center gap-2 text-lg"><span className="font-semibold">{locale === 'ar' ? 'رقم الهاتف:' : 'Phone:'}</span> <span className="text-gray-500">{locale === 'ar' ? 'غير متوفر' : 'N/A'}</span></div>
            </div>
            {/* معلومات أساسية عن المنطقة/المتاجر */}
            <div className="space-y-3">
              <div className="text-lg font-bold text-gray-900 mb-2">{locale === 'ar' ? 'بيانات أساسية' : 'Basic Info'}</div>
              <div className="flex items-center gap-2 text-lg"><span className="font-semibold">{locale === 'ar' ? 'الموقع:' : 'Location:'}</span> <span className="text-gray-900">{area.location[locale]}</span></div>
              <div className="flex items-center gap-2 text-lg"><span className="font-semibold">{locale === 'ar' ? 'عدد المتاجر:' : 'Stores:'}</span> <span className="text-gray-900">{area.storesCount}</span></div>
              <div className="flex items-center gap-2 text-lg"><span className="font-semibold">{locale === 'ar' ? 'عدد المستخدمين:' : 'Users:'}</span> <span className="text-gray-900">{area.usersCount}</span></div>
            </div>
          </div>
          {/* خريطة */}
          <div>
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm w-full h-56">
              <iframe
                title="map"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${area.coordinates.lat},${area.coordinates.lng}&z=13&output=embed`}
                allowFullScreen
              ></iframe>
            </div>
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

  const [selectedRole, setSelectedRole] = useState<"STORE_MANAGER" | "USER_STORE">("STORE_MANAGER")
  const tabOptions = [
    {
      key: "STORE_MANAGER" as const,
      label: locale === "ar" ? "مدير المتجر" : "Store Manager",
    },
    {
      key: "USER_STORE" as const,
      label: locale === "ar" ? "مستخدم المتجر" : "User Store",
    },
  ]

  const title = locale === "ar" ? "إدارة المناطق" : "Area Management"
  const [open, setOpen] = useState(false)
  const fabPosition = locale === "ar" ? "left-6" : "right-6"
  const [areaManagersExtra, setAreaManagersExtra] = useState<any[]>([])
  const [selectedAreaItem, setSelectedAreaItem] = useState<Area | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("areaManagers") || "[]"
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) setAreaManagersExtra(arr)
      } catch {}
    }
  }, [])

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8" style={{ backgroundImage: "url('/background.jpg')", backgroundRepeat: 'repeat' }}>
      <div className="max-w-[1400px] mx-auto">
        {/* بوب أب التفاصيل */}
        <AreaDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} area={selectedAreaItem} locale={locale} />
        {/* العنوان الرئيسي */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-gray-600 text-lg">
            {locale === "ar" ? "إدارة وتتبع المناطق الجغرافية والمتاجر" : "Manage and track geographical areas and stores"}
          </p>
        </motion.div>

        {/* إحصائيات سريعة */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Store className="text-blue-600" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">26</div>
                <div className="text-sm text-gray-600">{locale === "ar" ? "متجر" : "Stores"}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="text-green-600" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">150</div>
                <div className="text-sm text-gray-600">{locale === "ar" ? "مستخدم" : "Users"}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="text-orange-600" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">92%</div>
                <div className="text-sm text-gray-600">{locale === "ar" ? "أداء" : "Performance"}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">3</div>
                <div className="text-sm text-gray-600">{locale === "ar" ? "منطقة" : "Areas"}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* خريطة المناطق */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <MapComponent areas={areas} locale={locale} />
        </motion.div>

        {/* تفاصيل المناطق */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          {areas.map((area, idx) => (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 * idx, ease: "easeOut" }}
              whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 p-6 relative overflow-hidden cursor-pointer"
              onClick={() => { setSelectedAreaItem(area); setDetailsOpen(true); }}
            >
              {/* شريط ملون علوي */}
              <div
                className="absolute inset-x-0 top-0 h-2"
                style={{ backgroundColor: area.color }}
              />
              
              {/* رأس البطاقة */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="flex items-center justify-center w-16 h-16 rounded-xl shadow-sm shrink-0"
                  style={{ backgroundColor: area.color }}
                >
                  <MapPin className="text-white" size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 font-bold text-xl truncate">{area.name[locale]}</div>
                  <div className="text-gray-600 text-sm mt-1">{area.location[locale]}</div>
                </div>
              </div>

              {/* معلومات المنطقة */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <User size={16} className="text-indigo-600" />
                  <span>{locale === "ar" ? "المدير:" : "Manager:"}</span>
                  <span className="font-medium">{area.manager[locale]}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{area.storesCount}</div>
                    <div className="text-xs text-gray-600">{locale === "ar" ? "متجر" : "Stores"}</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{area.usersCount}</div>
                    <div className="text-xs text-gray-600">{locale === "ar" ? "مستخدم" : "Users"}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="text-sm font-semibold text-blue-900">{area.population}</div>
                    <div className="text-xs text-blue-600">{locale === "ar" ? "سكان" : "Population"}</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="text-sm font-semibold text-green-900">{area.area}</div>
                    <div className="text-xs text-green-600">{locale === "ar" ? "مساحة" : "Area"}</div>
                  </div>
                </div>
              </div>

              {/* مؤشر الأداء */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{locale === "ar" ? "معدل الأداء" : "Performance"}</span>
                  <span className="text-sm font-semibold text-gray-900">{area.performance}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${area.performance}%`,
                      backgroundColor: area.color 
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* زر إضافة مستخدم جديد */}
        <div className="w-full flex justify-center mt-12 mb-8">
          <button
            onClick={() => setOpen(true)}
            className="w-full max-w-md bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
          >
            <UserPlus size={24} />
            {locale === "ar" ? "إضافة مستخدم جديد" : "Add New User"}
          </button>
        </div>

        {/* زر عائم دائري */}
        <button
          onClick={() => setOpen(true)}
          className={`fixed bottom-6 ${fabPosition} z-50 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center transition-all duration-200 border-4 border-white z-[99999]`}
          aria-label={locale === "ar" ? "إضافة مستخدم جديد" : "Add New User"}
        >
          <UserPlus size={32} />
        </button>

        <Modal open={open} onClose={() => setOpen(false)}>
          <div className="flex gap-2 mb-4">
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
          <CreateCard
            heading={tabOptions.find((t) => t.key === selectedRole)?.label || ""}
            locale={locale}
            role={selectedRole}
          />
        </Modal>

        {/* قائمة مديري المناطق من localStorage */}
        {areaManagersExtra.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-12">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{locale === "ar" ? "مديرو المناطق (محلي)" : "Area Managers (Local)"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areaManagersExtra.map((m: any, idx: number) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><UserIcon size={18} /></div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{m.name}</div>
                    {m.email && <div className="text-sm text-gray-600 flex items-center gap-1 truncate"><Mail size={14} className="text-gray-400" />{m.email}</div>}
                    {m.storeId && <div className="text-xs text-gray-500 mt-1">{locale === "ar" ? "متجر:" : "Store:"} {m.storeId}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AreaManagerView
