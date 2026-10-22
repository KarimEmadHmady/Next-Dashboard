"use client";
import { useEffect, useState } from "react";
import { FiUser, FiMail, FiPhone, FiCalendar, FiUserCheck, FiLogIn, FiMapPin, FiLayers } from "react-icons/fi";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSelectors";

const roleLabels: Record<string, string> = {
  OPERATION_MANAGER: "مدير العمليات (Operation Manager)",
  AREA_MANAGER: "مدير المنطقة (Area Manager)",
  STORE_MANAGER: "مدير الفرع (Store Manager)",
  STORE_USER: "مستخدم الفرع (Store User)",
};

export default function ProfilePage() {
  const reduxUser = useAppSelector(selectCurrentUser);
  const [user, setUser] = useState<any>(reduxUser || null);

  useEffect(() => {
    if (reduxUser) {
      setUser(reduxUser);
      return;
    }
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("roxy_user_session");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.user) setUser(parsed.user);
        } catch {}
      }
    }
  }, [reduxUser]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full font-[Cairo]">
        <div className="text-gray-500 text-lg">جاري تحميل بيانات المستخدم...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full font-[Cairo] bg-gradient-to-br from-blue-100 via-white to-cyan-100 p-4 sm:p-8">
      {/* غلاف وصورة */}
      <div className="relative w-full max-w-3xl mb-0">
        <div className="h-44 w-full rounded-t-3xl bg-gradient-to-r from-[#131e48] to-[#73cdca] shadow-xl" />
        <div className="absolute left-1/2 -bottom-16 -translate-x-1/2 z-20">
          <img
            src={user.avatarUrl || "/avatar.webp"}
            alt={user.name}
            className="w-36 h-36 rounded-full border-4 border-white shadow-2xl object-cover bg-white"
          />
        </div>
      </div>
      {/* بطاقة البيانات */}
      <div className="bg-white rounded-b-3xl rounded-t-none shadow-2xl p-10 pt-24 max-w-3xl w-full flex flex-col items-center border border-gray-100 relative">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-2 tracking-tight">
          <FiUser className="text-[#131e48]" /> {user.name}
        </h2>
        <span className="inline-block px-3 py-1 text-sm font-semibold text-teal-800 bg-teal-50 rounded-full border border-teal-200 mb-6">
          {roleLabels[user.role] || user.role}
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full mt-4">
          {/* بيانات أساسية */}
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
              <FiUserCheck className="text-green-500" /> بيانات الحساب
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-700 text-base">
                <FiMail className="text-blue-500" />
                <span className="font-semibold">البريد الإلكتروني:</span>
                <span>{user.email || <span className="text-gray-400">غير متوفر</span>}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700 text-base">
                <FiPhone className="text-green-500" />
                <span className="font-semibold">رقم الهاتف:</span>
                <span>{user.phone || <span className="text-gray-400">غير متوفر</span>}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700 text-base">
                <FiUserCheck className="text-purple-500" />
                <span className="font-semibold">الدور:</span>
                <span>{user.role || <span className="text-gray-400">غير محدد</span>}</span>
              </li>
              {user.areaName && (
                <li className="flex items-center gap-3 text-gray-700 text-base">
                  <FiMapPin className="text-cyan-500" />
                  <span className="font-semibold">المنطقة:</span>
                  <span>{user.areaName}</span>
                </li>
              )}
              {user.storeName && (
                <li className="flex items-center gap-3 text-gray-700 text-base">
                  <FiLayers className="text-yellow-500" />
                  <span className="font-semibold">الفرع:</span>
                  <span>{user.storeName}</span>
                </li>
              )}
            </ul>
          </div>
          {/* بيانات إضافية */}
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
              <FiCalendar className="text-orange-400" /> بيانات إضافية
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-700 text-base">
                <FiCalendar className="text-orange-400" />
                <span className="font-semibold">تاريخ إنشاء الحساب:</span>
                <span>
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("ar-EG")
                    : <span className="text-gray-400">غير متوفر</span>}
                </span>
              </li>
              <li className="flex items-center gap-3 text-gray-700 text-base">
                <FiLogIn className="text-blue-400" />
                <span className="font-semibold">آخر تسجيل دخول:</span>
                <span>
                  {user.lastLoginAt || user.lastLogin
                    ? new Date(user.lastLoginAt || user.lastLogin).toLocaleString("ar-EG")
                    : <span className="text-gray-400">غير متوفر</span>}
                </span>
              </li>
              <li className="flex items-center gap-3 text-gray-700 text-base">
                <span className="font-semibold">حالة الحساب:</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                  نشط
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
