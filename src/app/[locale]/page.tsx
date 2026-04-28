"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { Loader2, LockIcon } from "lucide-react"
import { motion } from "framer-motion"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  
  const locale: "ar" | "en" = 
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    (Array.isArray(params?.locale) && (params.locale[0] === "ar" || params.locale[0] === "en") && params.locale[0]) ||
    "en"

  const isRTL = locale === "ar"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      // Add your authentication logic here
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("Signing in with:", email, password)
      // Store a simple user profile for Sidebar consumption
      try {
        const displayName = email?.split("@")[0] || "User"
        const capitalizedName = displayName
          .split(/[._-]/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
        const avatarUrl = "/avatar.webp"
        window.localStorage.setItem(
          "user",
          JSON.stringify({ name: capitalizedName, avatarUrl })
        )
      } catch (_) {
        // ignore storage issues
      }
      router.push("/dashboard/manager")
    } catch (error) {
      console.error("Authentication error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    try {
      // Add your Google sign-in logic here
      await new Promise((resolve) => setTimeout(resolve, 1500))
      console.log("Signing in with Google")
    } catch (error) {
      console.error("Google sign-in error:", error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  function GoogleIcon() {
    return (
      <svg
        className="mr-2 h-4 w-4"
        aria-hidden="true"
        focusable="false"
        data-prefix="fab"
        data-icon="google"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 488 512"
      >
        <path
          fill="currentColor"
          d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
        ></path>
      </svg>
    )
  }

  return (
    <div
      className={`flex min-h-screen items-center justify-center p-4 ${isRTL ? 'font-arabic' : ''}`}
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
          <Card className="w-full border-0 shadow-lg">
            <CardHeader className="space-y-4 text-center">
              {/* Synabon Order Center Title */}
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
                  {locale === "ar" ? "أدخل بياناتك للوصول إلى حسابك" : "Enter your credentials to access your account"}
                </CardDescription>
              </motion.div>
            </CardHeader>

          <CardContent className="space-y-6">
            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-black">
                  {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 flex items-center justify-center w-4 h-4">
                    @
                  </span>
                  <Input
                    type="email"
                    name="email"
                    placeholder={locale === "ar" ? "name@example.com" : "name@example.com"}
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">{locale === "ar" ? "كلمة المرور" : "Password"}</label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="password"
                    name="password"
                    placeholder={locale === "ar" ? "أدخل كلمة المرور" : "Enter your password"}
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-medium bg-[#131e48] text-[#73cdca] hover:bg-neutral-800 transition-colors"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? (locale === "ar" ? "جاري تسجيل الدخول..." : "Signing in...") : (locale === "ar" ? "تسجيل الدخول" : "Sign in")}
              </Button>
            </form>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
