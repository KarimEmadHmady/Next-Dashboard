'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { FiAlertTriangle, FiTrash2, FiX } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false,
}: DeleteConfirmModalProps) {
  const params = useParams();
  const locale =
    (typeof params?.locale === 'string' && (params.locale === 'ar' || params.locale === 'en') && params.locale) ||
    'ar';
  const isRTL = locale === 'ar';

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative border border-gray-100">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <FiAlertTriangle className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {title || (isRTL ? 'تأكيد الحذف' : 'Confirm Deletion')}
          </h3>

          <p className="text-sm text-gray-500 mb-6">
            {message ||
              (isRTL
                ? `هل أنت متأكد من رغبتك في حذف "${itemName || 'هذا العنصر'}"؟ سيتم إلغاء تفعيل الحساب وحظر الوصول.`
                : `Are you sure you want to delete "${itemName || 'this item'}"?`)}
          </p>

          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FiTrash2 className="w-4 h-4" />
              )}
              <span>{isRTL ? 'حذف' : 'Delete'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
