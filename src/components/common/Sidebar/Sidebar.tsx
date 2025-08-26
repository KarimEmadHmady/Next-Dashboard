

"use client"
import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import en from "@/messages/en.json"
import ar from "@/messages/ar.json"
import { FiHome, FiMapPin, FiLayers, FiShoppingCart, FiLogOut, FiUsers, FiUserCheck } from "react-icons/fi"

const translations: Record<string, any> = { en, ar }

function getTranslation(obj: any, key: string): string {
  return key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj) ?? key
}

function useI18n() {
  const params = useParams()
  const locale: string =
    typeof params?.locale === "string" ? params.locale : Array.isArray(params?.locale) ? params?.locale[0] : "en"
  return (key: string) => getTranslation(translations[locale], key)
}

const sidebarLinks = [
  {
    href: "manager",
    labelKey: "sidebar.overview",
    icon: <FiHome className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors duration-200" />,
  },
  {
    href: "area-manager",
    labelKey: "sidebar.areas",
    icon: <FiMapPin className="w-5 h-5 text-cyan-500 group-hover:text-cyan-600 transition-colors duration-200" />,
  },
  {
    href: "branch-manager",
    labelKey: "sidebar.branches",
    icon: <FiLayers className="w-5 h-5 text-yellow-500 group-hover:text-yellow-600 transition-colors duration-200" />,
  },
  {
    href: "branch-responsible",
    labelKey: "sidebar.branchResponsibles",
    icon: <FiUsers className="w-5 h-5 text-orange-500 group-hover:text-orange-600 transition-colors duration-200" />,
  },
  {
    href: "orders",
    labelKey: "sidebar.orders",
    icon: (
      <FiShoppingCart className="w-5 h-5 text-purple-500 group-hover:text-purple-600 transition-colors duration-200" />
    ),
  },
  {
    href: "branch-user",
    labelKey: "sidebar.branchUser2",
    icon: <FiUserCheck className="w-5 h-5 text-pink-500 group-hover:text-pink-600 transition-colors duration-200" />,
  },
]

interface SidebarProps {
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setSidebarOpen }) => {
  const t = useI18n()
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const locale: string =
    typeof params?.locale === "string" ? params.locale : Array.isArray(params?.locale) ? params?.locale[0] : "en"

  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [userProfile, setUserProfile] = useState<{ name: string; avatarUrl?: string } | null>(null)

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("user") : null
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === "object") {
          setUserProfile({ name: parsed.name ?? "User", avatarUrl: parsed.avatarUrl ?? parsed.avatar })
        }
      }
    } catch (err) {
      // ignore malformed localStorage
    }
  }, [])

  const getInitials = (fullName?: string) => {
    if (!fullName) return "U"
    const parts = String(fullName).trim().split(/\s+/)
    const first = parts[0]?.[0] ?? ""
    const last = parts[parts.length - 1]?.[0] ?? ""
    return (first + last).toUpperCase() || "U"
  }

  useEffect(() => {
    if (isSidebarOpen) {
      setSidebarVisible(true)
    } else {
      const timeout = setTimeout(() => setSidebarVisible(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [isSidebarOpen])

  const handleLangSwitch = (lang: string) => {
    if (lang === locale) return
    const newPath = pathname.replace(`/${locale}`, `/${lang}`)
    router.push(newPath)
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSidebarOpen(false)
    }
  }

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("user")
      }
    } catch (_) {
      // ignore storage issues
    }
    router.push(`/${locale}`)
  }

  return (
    <>
      {/* Sidebar toggle button for mobile */}
      <button
        onClick={() => setSidebarOpen(true)}
        type="button"
        className={`fixed top-4 z-50 inline-flex p-[20px] text-sm text-gray-600 sm:hidden focus:outline-none cursor-pointer bg-white shadow-lg rounded-lg transition-all duration-300 hover:shadow-xl ${locale === "ar" ? "right-4" : "left-4"}`}
      >
        <div className="group flex flex-col justify-center items-center w-6 h-5 gap-1 cursor-pointer">
          <span className="block w-4 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ease-in-out group-hover:w-6"></span>
          <span className="block w-6 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ease-in-out group-hover:w-4"></span>
          <span className="block w-4 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ease-in-out group-hover:w-6"></span>
        </div>
      </button>

      {/* Vertical Navigation Bar for mobile */}
      <nav
        className={`
          fixed z-40 bg-white/95 backdrop-blur-md shadow-2xl flex flex-col items-center gap-3 py-4 px-2 sm:hidden border border-gray-200/50
          ${locale === "ar" ? "right-4 top-20 rounded-2xl" : "left-4 top-20 rounded-2xl"}
        `}
        style={{ height: "calc(100vh - 120px)", width: "64px" }}
      >
        <div className="flex flex-col justify-start items-center w-full gap-3">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={`/${locale}/dashboard/${link.href}`}
              className="flex flex-col items-center justify-center w-12 h-12 text-xs text-gray-500 hover:text-gray-700 transition-all duration-300 hover:scale-110 hover:bg-gray-100 rounded-xl group"
            >
              {link.icon}
            </Link>
          ))}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full">
          <button
            onClick={() => handleLangSwitch("en")}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 ${locale === "en" ? "bg-blue-500 shadow-lg" : "bg-gray-100 hover:bg-gray-200"}`}
            aria-label="English"
          >
            <img src="/flags/gb.svg" alt="English" className="w-5 h-5 rounded-sm" />
          </button>
          <button
            onClick={() => handleLangSwitch("ar")}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 ${locale === "ar" ? "bg-blue-500 shadow-lg" : "bg-gray-100 hover:bg-gray-200"}`}
            aria-label="Arabic"
          >
            <img src="/flags/sa.svg" alt="Arabic" className="w-5 h-5 rounded-sm" />
          </button>
          <button onClick={handleLogout} className="flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg">
            <FiLogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Sidebar for large screens */}
      <aside
        id="default-sidebar"
        className={`
          hidden sm:flex fixed top-0 z-40 w-64 h-screen flex-col justify-between bg-white shadow-2xl border-r border-gray-100
          ${locale === "ar" ? "sm:right-0 sm:left-auto" : "sm:left-0 sm:right-auto"}
        `}
        aria-label="Sidenav"
      >
        <div className="flex flex-col h-full">
          {/* Header with background image */}
          <div className="relative border-b border-gray-100 p-4 overflow-hidden">
            <div
              className="absolute inset-0 bg-center bg-cover opacity-30"
              style={{ backgroundImage: "url('/background.jpg')" }}
            />
            <div className="absolute inset-0 bg-white/40" />
            <div className="relative flex flex-col items-center gap-2">
              {userProfile ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={userProfile.avatarUrl || "/avatar.webp"}
                    alt={userProfile.name}
                    className="w-16 h-16 rounded-full object-cover shadow-sm border border-white"
                  />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 leading-none">{userProfile.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(() => {
                        const matched = sidebarLinks.find((l) => pathname.includes(`/dashboard/${l.href}`))
                        return matched ? t(matched.labelKey) : ""
                      })()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain drop-shadow-sm" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-base font-semibold text-gray-800">
                      {(() => {
                        const matched = sidebarLinks.find((l) => pathname.includes(`/dashboard/${l.href}`))
                        return matched ? t(matched.labelKey) : ""
                      })()}
                    </h2>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-4 py-5 overflow-y-auto ">
            <ul className="space-y-3">
              {sidebarLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={`/${locale}/dashboard/${link.href}`}
                    className="flex items-center p-1 text-base font-medium text-gray-700 rounded-xl hover:bg-red-100 hover:text-gray-900 group transition-all duration-200 hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-red-100"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-white group-hover:shadow-sm transition-all duration-200 mr-4">
                      {link.icon}
                    </div>
                    <span className="font-medium">{t(link.labelKey)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {/* Logo under links */}
            <div className="flex items-center justify-center mt-[100px] py-6">
              <img src="/logo.png" alt="Logo" className="w-50 h-auto opacity-30" />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50/50 p-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                onClick={() => handleLangSwitch("en")}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 ${locale === "en" ? "bg-blue-500 shadow-lg" : "bg-white hover:bg-gray-100 shadow-sm border border-gray-200"}`}
                aria-label="English"
              >
                <img src="/flags/gb.svg" alt="English" className="w-5 h-5 rounded-sm" />
              </button>
              <button
                onClick={() => handleLangSwitch("ar")}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 ${locale === "ar" ? "bg-blue-500 shadow-lg" : "bg-white hover:bg-gray-100 shadow-sm border border-gray-200"}`}
                aria-label="Arabic"
              >
                <img src="/flags/sa.svg" alt="Arabic" className="w-5 h-5 rounded-sm" />
              </button>
              <button onClick={handleLogout} className="flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg">
                <FiLogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Drawer for mobile */}
      {sidebarVisible && (
        <div className="fixed inset-0 z-50 flex sm:hidden" onClick={handleOverlayClick}>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"></div>
          <aside
            className={`
              fixed top-0 h-full bg-white shadow-2xl flex flex-col justify-between
              transition-all duration-300 ease-out
              ${locale === "ar" ? "right-0" : "left-0"}
              ${isSidebarOpen ? "translate-x-0 opacity-100" : locale === "ar" ? "translate-x-full opacity-0" : "-translate-x-full opacity-0"}
              w-80
            `}
            aria-label="Sidenav"
          >
            {/* Close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 z-50 text-gray-400 bg-gray-100 hover:bg-gray-200 hover:text-gray-600 rounded-full p-2 cursor-pointer transition-all duration-200 hover:scale-105"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col h-full">
              {/* Header with background image */}
              <div className="relative border-b border-gray-100 p-4 pt-5 overflow-hidden">
                <div
                  className="absolute inset-0 bg-center bg-cover opacity-30"
                  style={{ backgroundImage: "url('/background.jpg')" }}
                />
                <div className="absolute inset-0 bg-white/40" />
                <div className="relative flex flex-col items-center gap-2 mb-1">
                  {userProfile ? (
                    <>
                      <img
                        src={userProfile.avatarUrl || "/avatar.webp"}
                        alt={userProfile.name}
                        className="w-16 h-16 rounded-full object-cover shadow-sm border border-white"
                      />
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900 leading-none">{userProfile.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {(() => {
                            const matched = sidebarLinks.find((l) => pathname.includes(`/dashboard/${l.href}`))
                            return matched ? t(matched.labelKey) : ""
                          })()}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain drop-shadow-sm" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                      </div>
                      <div className="text-center">
                        <h2 className="text-base font-semibold text-gray-800">
                          {(() => {
                            const matched = sidebarLinks.find((l) => pathname.includes(`/dashboard/${l.href}`))
                            return matched ? t(matched.labelKey) : ""
                          })()}
                        </h2>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex-1 px-4 py-6 overflow-y-auto">
                <ul className="space-y-3">
                  {sidebarLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={`/${locale}/dashboard/${link.href}`}
                        className="flex items-center p-4 text-base font-medium text-gray-700 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-gray-900 group transition-all duration-200 hover:shadow-md border border-transparent hover:border-red-100"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 group-hover:bg-white group-hover:shadow-sm transition-all duration-200 mr-4">
                          {link.icon}
                        </div>
                        <span className="font-medium">{t(link.labelKey)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {/* Logo under links */}
                <div className="flex items-center justify-center mt-10 py-6">
                  <img src="/logo.png" alt="Logo" className="w-20 h-auto opacity-90" />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    onClick={() => handleLangSwitch("en")}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 ${locale === "en" ? "bg-blue-500 shadow-lg" : "bg-white hover:bg-gray-100 shadow-sm border border-gray-200"}`}
                    aria-label="English"
                  >
                    <img src="/flags/gb.svg" alt="English" className="w-5 h-5 rounded-sm" />
                  </button>
                  <button
                    onClick={() => handleLangSwitch("ar")}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 ${locale === "ar" ? "bg-blue-500 shadow-lg" : "bg-white hover:bg-gray-100 shadow-sm border border-gray-200"}`}
                    aria-label="Arabic"
                  >
                    <img src="/flags/sa.svg" alt="Arabic" className="w-5 h-5 rounded-sm" />
                  </button>
                  <button onClick={handleLogout} className="flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white w-10 h-10 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg">
                    <FiLogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

export default Sidebar
