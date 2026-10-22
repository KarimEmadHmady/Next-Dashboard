'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Role } from '@/types/auth';
import { UserItem, CreateUserInput, UpdateUserInput, AreaOption, StoreOption } from '@/types/user';
import { userService } from '@/services/userService';
import { useAppSelector } from '@/redux/hooks';
import { selectCurrentUser } from '@/redux/features/auth/authSelectors';
import { FiX, FiUser, FiMail, FiPhone, FiLock, FiCheck, FiLayers, FiMapPin, FiShield } from 'react-icons/fi';
import { Loader2, AlertCircle } from 'lucide-react';

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  userToEdit?: UserItem | null;
  defaultRole?: Role;
  fixedRole?: Role;
  onSuccess: (user: UserItem) => void;
}

const roleNames: Record<Role, { ar: string; en: string }> = {
  OPERATION_MANAGER: { ar: 'مدير عمليات (Operation Manager)', en: 'Operation Manager' },
  AREA_MANAGER: { ar: 'مدير منطقة (Area Manager)', en: 'Area Manager' },
  STORE_MANAGER: { ar: 'مدير فرع (Store Manager)', en: 'Store Manager' },
  STORE_USER: { ar: 'مستخدم فرع (Store User)', en: 'Store User' },
};

export default function UserModal({
  open,
  onClose,
  userToEdit,
  defaultRole = 'STORE_USER',
  fixedRole,
  onSuccess,
}: UserModalProps) {
  const params = useParams();
  const locale =
    (typeof params?.locale === 'string' && (params.locale === 'ar' || params.locale === 'en') && params.locale) ||
    'ar';
  const isRTL = locale === 'ar';

  const currentUser = useAppSelector(selectCurrentUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(fixedRole || defaultRole);
  const [areaId, setAreaId] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');

  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available roles the actor can create
  const getAvailableRoles = (): Role[] => {
    if (fixedRole) return [fixedRole];
    if (currentUser?.role === 'OPERATION_MANAGER') {
      return ['AREA_MANAGER', 'STORE_MANAGER', 'STORE_USER'];
    }
    if (currentUser?.role === 'AREA_MANAGER') {
      return ['STORE_MANAGER', 'STORE_USER'];
    }
    if (currentUser?.role === 'STORE_MANAGER') {
      return ['STORE_USER'];
    }
    return [defaultRole];
  };

  // Load areas & stores options
  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const loadData = async () => {
      setLoadingOptions(true);
      try {
        const [areasList, storesList] = await Promise.all([
          userService.getAreas(),
          userService.getStores(),
        ]);
        if (isMounted) {
          setAreas(areasList);
          setStores(storesList);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [open]);

  // Reset form or populate from userToEdit
  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name || '');
      setEmail(userToEdit.email || '');
      setPhone(userToEdit.phone || '');
      setPassword('');
      setRole(userToEdit.role);
      setAreaId(userToEdit.areaId || '');
      setStoreId(userToEdit.storeId || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole(fixedRole || defaultRole);
      setAreaId(currentUser?.role === 'AREA_MANAGER' ? currentUser.areaId || '' : '');
      setStoreId(currentUser?.role === 'STORE_MANAGER' ? currentUser.storeId || '' : '');
    }
    setErrorMsg(null);
  }, [userToEdit, open, fixedRole, defaultRole, currentUser]);

  if (!open) return null;

  // Filter stores according to selected area
  const filteredStores = areaId
    ? stores.filter((s) => s.areaId === areaId)
    : stores;

  const handleAreaChange = (newAreaId: string) => {
    setAreaId(newAreaId);
    // If current store does not belong to new area, reset storeId
    if (storeId) {
      const match = stores.find((s) => s.id === storeId);
      if (match && match.areaId !== newAreaId) {
        setStoreId('');
      }
    }
  };

  const handleStoreChange = (newStoreId: string) => {
    setStoreId(newStoreId);
    // If area not set, automatically select area of this store
    if (newStoreId) {
      const selected = stores.find((s) => s.id === newStoreId);
      if (selected && selected.areaId) {
        setAreaId(selected.areaId);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg(isRTL ? 'الاسم مطلوب' : 'Name is required');
      return;
    }

    if (!userToEdit && !email.trim()) {
      setErrorMsg(isRTL ? 'البريد الإلكتروني مطلوب' : 'Email is required');
      return;
    }

    if (!userToEdit && !password) {
      setErrorMsg(isRTL ? 'كلمة المرور مطلوبة' : 'Password is required');
      return;
    }

    if (password) {
      const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password) && password.length >= 8;
      if (!strongPass) {
        setErrorMsg(
          isRTL
            ? 'كلمة المرور يجب أن تكون 8 خانات على الأقل وتتضمن حرف كبير وحرف صغير ورقماً'
            : 'Password must be at least 8 characters with upper, lower, and digit'
        );
        return;
      }
    }

    if (role === 'AREA_MANAGER' && !areaId && currentUser?.role === 'OPERATION_MANAGER') {
      setErrorMsg(isRTL ? 'يجب اختيار المنطقة لمدير المنطقة' : 'Area is required for Area Manager');
      return;
    }

    if ((role === 'STORE_MANAGER' || role === 'STORE_USER') && !storeId && currentUser?.role !== 'STORE_MANAGER') {
      setErrorMsg(isRTL ? 'يجب اختيار الفرع' : 'Store/Branch is required');
      return;
    }

    setSubmitting(true);
    try {
      if (userToEdit) {
        const updateData: UpdateUserInput = {
          name: name.trim(),
          phone: phone.trim() || null,
          role,
          areaId: areaId || null,
          storeId: role === 'AREA_MANAGER' ? null : (storeId || null),
        };
        if (password) updateData.password = password;

        const updated = await userService.updateUser(userToEdit.id, updateData);
        onSuccess(updated);
        onClose();
      } else {
        const createData: CreateUserInput = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          phone: phone.trim() || null,
          areaId: areaId || null,
          storeId: role === 'AREA_MANAGER' ? null : (storeId || null),
        };
        const created = await userService.createUser(createData);
        onSuccess(created);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isRTL ? 'حدث خطأ أثناء حفظ البيانات' : 'Failed to save user'));
    } finally {
      setSubmitting(false);
    }
  };

  const availableRoles = getAvailableRoles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative border border-gray-100 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          disabled={submitting}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
            <FiUser className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {userToEdit
                ? isRTL
                  ? 'تعديل بيانات المستخدم'
                  : 'Edit User'
                : isRTL
                ? 'إضافة مستخدم جديد'
                : 'Create New User'}
            </h2>
            <p className="text-xs text-gray-500">
              {isRTL
                ? 'أدخل بيانات الحساب والصلاحيات المطلوبة'
                : 'Fill in user credentials and role scoping'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isRTL ? 'الاسم الكامل *' : 'Full Name *'}
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isRTL ? 'مثال: أحمد محمود' : 'e.g. John Doe'}
                className="w-full h-11 rounded-xl border border-gray-200 pl-10 rtl:pl-3 rtl:pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isRTL ? 'البريد الإلكتروني *' : 'Email Address *'}
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                disabled={!!userToEdit}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@roxy.com"
                className={`w-full h-11 rounded-xl border border-gray-200 pl-10 rtl:pl-3 rtl:pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  userToEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isRTL ? 'رقم الهاتف' : 'Phone Number'}
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full h-11 rounded-xl border border-gray-200 pl-10 rtl:pl-3 rtl:pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {userToEdit
                ? isRTL
                  ? 'كلمة المرور الجديدة (اختياري)'
                  : 'New Password (Optional)'
                : isRTL
                ? 'كلمة المرور *'
                : 'Password *'}
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required={!userToEdit}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl border border-gray-200 pl-10 rtl:pl-3 rtl:pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {isRTL
                ? '8 أحرف على الأقل، تتضمن حرفاً كبيراً وحرفاً صغيراً ورقماً'
                : 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number'}
            </p>
          </div>

          {/* Role Selection */}
          {!fixedRole && availableRoles.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {isRTL ? 'الدور الوظيفي *' : 'Role *'}
              </label>
              <div className="relative">
                <FiShield className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={role}
                  onChange={(e) => {
                    const nextRole = e.target.value as Role;
                    setRole(nextRole);
                    if (nextRole === 'AREA_MANAGER') {
                      setStoreId('');
                    }
                  }}
                  className="w-full h-11 rounded-xl border border-gray-200 pl-10 rtl:pl-3 rtl:pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {roleNames[r][locale as 'ar' | 'en']}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Area Selection (For Area Manager or Operation Manager assigning area) */}
          {(role === 'AREA_MANAGER' || role === 'STORE_MANAGER' || role === 'STORE_USER') &&
            currentUser?.role === 'OPERATION_MANAGER' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isRTL ? 'المنطقة' : 'Area'}
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={areaId}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 pl-10 rtl:pl-3 rtl:pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">{isRTL ? '-- اختر المنطقة --' : '-- Select Area --'}</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

          {/* Store Selection (For Store Manager or Store User) */}
          {(role === 'STORE_MANAGER' || role === 'STORE_USER') &&
            currentUser?.role !== 'STORE_MANAGER' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {isRTL ? 'الفرع *' : 'Store / Branch *'}
                </label>
                <div className="relative">
                  <FiLayers className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={storeId}
                    onChange={(e) => handleStoreChange(e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 pl-10 rtl:pl-3 rtl:pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">{isRTL ? '-- اختر الفرع --' : '-- Select Store --'}</option>
                    {filteredStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.areaName ? `(${s.areaName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

          {/* Submit Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-11 rounded-xl bg-[#131e48] hover:bg-[#1f2e6b] text-[#73cdca] font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FiCheck className="w-4 h-4" />
              )}
              <span>{userToEdit ? (isRTL ? 'تحديث' : 'Update') : (isRTL ? 'حفظ' : 'Save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
