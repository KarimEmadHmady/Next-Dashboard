"use client";
import { useEffect, useState } from "react";
import { FiUser, FiMail, FiPhone, FiCalendar, FiEdit2, FiUserCheck, FiLogIn, FiX, FiCheck } from "react-icons/fi";

function ProfileEditModal({ open, onClose, user, onSave }: { open: boolean; onClose: () => void; user: any; onSave: (data: any) => void }) {
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });

  useEffect(() => {
    setForm({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  }, [user, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in font-[Cairo]">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-secondary text-2xl font-bold"><FiX /></button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><FiEdit2 className="text-blue-400" />تعديل البروفايل</h2>
        <form onSubmit={e => { e.preventDefault(); onSave(form); onClose(); }} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">الاسم</label>
            <input type="text" className="w-full h-11 rounded-lg border border-gray-200 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 font-[Cairo]" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">البريد الإلكتروني</label>
            <input type="email" className="w-full h-11 rounded-lg border border-gray-200 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 font-[Cairo]" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">رقم الهاتف</label>
            <input type="text" className="w-full h-11 rounded-lg border border-gray-200 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 font-[Cairo]" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <button type="submit" className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold flex items-center justify-center gap-2 transition mt-2"><FiCheck /> تأكيد التعديل</button>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("user");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setUser(parsed);
        } catch {}
      }
    }
  }, []);

  const handleSave = (data: any) => {
    setUser((prev: any) => ({ ...prev, ...data }));
    // يمكن هنا حفظ البيانات في localStorage إذا أردت
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full font-[Cairo] bg-gradient-to-br from-blue-50 to-white">
        <div className="text-gray-500 text-lg">لا يوجد بيانات مستخدم</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full font-[Cairo] bg-gradient-to-br from-blue-100 via-white to-cyan-100 p-0 m-0">
      <ProfileEditModal open={editOpen} onClose={() => setEditOpen(false)} user={user} onSave={handleSave} />
      {/* غلاف وصورة */}
      <div className="relative w-full max-w-3xl mb-0">
        <div className="h-44 w-full rounded-t-3xl bg-gradient-to-r from-red-500 to-red-200 shadow-xl" />
        <div className="absolute left-1/2 -bottom-16 -translate-x-1/2 z-20">
          <img
            src={user.avatarUrl || user.avatar || "/avatar.webp"}
            alt={user.name}
            className="w-36 h-36 rounded-full border-4 border-white shadow-2xl object-cover bg-white"
          />
        </div>
      </div>
      {/* بطاقة البيانات */}
      <div className="bg-white rounded-b-3xl rounded-t-none shadow-2xl p-10 pt-24 max-w-3xl w-full flex flex-col items-center border border-gray-100 relative -mt-0">
        <button onClick={() => setEditOpen(true)} className="absolute top-8 right-8 flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition text-base px-4 py-2 rounded-xl border border-blue-100 bg-blue-50 shadow-sm">
          <FiEdit2 className="inline-block mr-1" /> تعديل البروفايل
        </button>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-2 tracking-tight">
          <FiUser className="text-blue-400" /> {user.name}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full mt-8">
          {/* بيانات أساسية */}
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
              <FiUserCheck className="text-green-500" /> بيانات الحساب
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-700 text-lg">
                <FiMail className="text-blue-500" />
                <span className="font-semibold">البريد الإلكتروني:</span>
                <span>{user.email || <span className="text-gray-400">غير متوفر</span>}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700 text-lg">
                <FiPhone className="text-green-500" />
                <span className="font-semibold">رقم الهاتف:</span>
                <span>{user.phone || <span className="text-gray-400">غير متوفر</span>}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700 text-lg">
                <FiUserCheck className="text-purple-500" />
                <span className="font-semibold">الدور:</span>
                <span>{user.role || <span className="text-gray-400">غير محدد</span>}</span>
              </li>
            </ul>
          </div>
          {/* بيانات إضافية */}
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
              <FiCalendar className="text-orange-400" /> بيانات إضافية
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-700 text-lg">
                <FiCalendar className="text-orange-400" />
                <span className="font-semibold">تاريخ إنشاء الحساب:</span>
                <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("ar-EG") : <span className="text-gray-400">غير متوفر</span>}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700 text-lg">
                <FiLogIn className="text-blue-400" />
                <span className="font-semibold">آخر تسجيل دخول:</span>
                <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString("ar-EG") : <span className="text-gray-400">غير متوفر</span>}</span>
              </li>
              {/* أضف المزيد من الحقول هنا إذا أردت */}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
