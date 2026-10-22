"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "@/i18n/navigation"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Loader2, LockIcon, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { loginUser, clearError, initializeFromStorage } from "@/redux/features/auth/authSlice"
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAllowedPages,
  selectAuthLoading,
  selectAuthError,
} from "@/redux/features/auth/authSelectors"
import { getDefaultPathForRole } from "@/services/authService"

export default function AuthPage() {
  const router = useRouter()
  const params = useParams()
  const dispatch = useAppDispatch()

  const user = useAppSelector(selectCurrentUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const allowedPages = useAppSelector(selectAllowedPages)
  const isLoading = useAppSelector(selectAuthLoading)
  const authError = useAppSelector(selectAuthError)

  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  const locale: "ar" | "en" =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    (Array.isArray(params?.locale) && (params.locale[0] === "ar" || params.locale[0] === "en") && params.locale[0]) ||
    "en"

  const isRTL = locale === "ar"

  // On mount, check if already authenticated and redirect
  useEffect(() => {
    dispatch(initializeFromStorage())
  }, [dispatch])

  useEffect(() => {
    if (isAuthenticated && user) {
      const defaultPath = getDefaultPathForRole(user.role, allowedPages)
      router.replace(defaultPath)
    }
  }, [isAuthenticated, user, allowedPages, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    dispatch(clearError())

    if (!formEmail.trim() || !formPassword.trim()) {
      setLocalError(
        locale === "ar"
          ? "يرجى إدخال البريد الإلكتروني وكلمة المرور"
          : "Please enter both email and password"
      )
      return
    }

    try {
      const result = await dispatch(
        loginUser({
          email: formEmail.trim(),
          password: formPassword,
        })
      ).unwrap()

      const targetPath = getDefaultPathForRole(result.user.role, result.allowedPages)
      router.push(targetPath)
    } catch (err: any) {
      // Handled by Redux rejected state or local fallback
      const errorMsg =
        typeof err === "string"
          ? err
          : err?.message || (locale === "ar" ? "فشل تسجيل الدخول. يرجى التحقق من البيانات" : "Login failed. Please check credentials")
      setLocalError(errorMsg)
    }
  }

  const displayedError = localError || authError

  return (
    <div
      className={`flex min-h-screen items-center justify-center p-4 ${isRTL ? "font-arabic" : ""}`}
      style={{ backgroundImage: "url('/background.jpg')", backgroundRepeat: "repeat" }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[450px]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="w-full h-48 relative mb-4"
        >
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            className="object-contain"
            priority
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          <Card className="w-full border-0 shadow-xl backdrop-blur-md bg-white/95">
            <CardHeader className="space-y-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              >
                <div className="space-y-2 flex flex-row items-center justify-center gap-2">
                  <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#73cdca] to-[#131e48] bg-clip-text text-transparent">
                    {locale === "ar" ? "سينابون أوردر سنتر" : "CINNABON Order Center"}
                  </CardTitle>
                  <div className="flex items-center justify-center gap-2">
                    <div className="px-3 py-1 bg-gradient-to-r from-[#73cdca] to-white rounded-full border border-blue-200">
                      <span className="text-sm font-semibold text-blue-700">COC</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
              >
                <CardTitle className="text-2xl font-semibold tracking-tight text-black">
                  {locale === "ar" ? "مرحباً بعودتك" : "Welcome back"}
                </CardTitle>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
              >
                <CardDescription className="text-neutral-600">
                  {locale === "ar"
                    ? "أدخل بياناتك للوصول إلى لوحة التحكم الخاصة بك"
                    : "Enter your credentials to access your dashboard"}
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Message Alert */}
              <AnimatePresence>
                {displayedError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                    <span>{displayedError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-black">
                    {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 flex items-center justify-center w-4 h-4 rtl:left-auto rtl:right-3">
                      @
                    </span>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={formEmail}
                      onChange={(e) => {
                        setFormEmail(e.target.value)
                        if (displayedError) {
                          setLocalError(null)
                          dispatch(clearError())
                        }
                      }}
                      placeholder="admin@roxy.com"
                      required
                      disabled={isLoading}
                      className="pl-10 rtl:pl-3 rtl:pr-10 h-12 bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-black">
                    {locale === "ar" ? "كلمة المرور" : "Password"}
                  </label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 rtl:left-auto rtl:right-3" />
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      value={formPassword}
                      onChange={(e) => {
                        setFormPassword(e.target.value)
                        if (displayedError) {
                          setLocalError(null)
                          dispatch(clearError())
                        }
                      }}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      className="pl-10 rtl:pl-3 rtl:pr-10 h-12 bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-medium bg-[#131e48] text-[#73cdca] hover:bg-[#1f2e6b] transition-colors cursor-pointer"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:mr-0 rtl:ml-2" />}
                  {isLoading
                    ? locale === "ar"
                      ? "جاري تسجيل الدخول..."
                      : "Signing in..."
                    : locale === "ar"
                    ? "تسجيل الدخول"
                    : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
