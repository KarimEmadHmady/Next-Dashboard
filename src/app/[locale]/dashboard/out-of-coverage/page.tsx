"use client"
 
import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, BarChart3, Filter, TrendingUp, AlertTriangle } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie, Legend } from "recharts"
import dynamic from "next/dynamic"
 
// Dynamic import for map component to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/ui/OutOfCoverageChart"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
})
 
type CityData = {
  id: number
  name: { ar: string; en: string }
  coordinates: { lat: number; lng: number }
  orders: number
  percentage: number
  color: string
  region: { ar: string; en: string }
}
 
type Locale = "ar" | "en"
 
const citiesData: CityData[] = [
  {
    id: 1,
    name: { ar: "القاهرة - مدينة نصر", en: "Cairo - Nasr City" },
    coordinates: { lat: 30.0444, lng: 31.2357 },
    orders: 142,
    percentage: 28.4,
    color: "#ef4444",
    region: { ar: "القاهرة", en: "Cairo" }
  },
  {
    id: 2,
    name: { ar: "الجيزة - 6 أكتوبر", en: "Giza - 6th October" },
    coordinates: { lat: 29.9792, lng: 30.7293 },
    orders: 118,
    percentage: 23.6,
    color: "#f59e0b",
    region: { ar: "الجيزة", en: "Giza" }
  },
  {
    id: 3,
    name: { ar: "الإسكندرية - سيدي جابر", en: "Alexandria - Sidi Gaber" },
    coordinates: { lat: 31.2057, lng: 29.9247 },
    orders: 89,
    percentage: 17.8,
    color: "#3b82f6",
    region: { ar: "الإسكندرية", en: "Alexandria" }
  },
  {
    id: 4,
    name: { ar: "المنصورة - وسط البلد", en: "Mansoura - Center" },
    coordinates: { lat: 31.0364, lng: 31.3806 },
    orders: 67,
    percentage: 13.4,
    color: "#22c55e",
    region: { ar: "الدقهلية", en: "Dakahlia" }
  },
  {
    id: 5,
    name: { ar: "طنطا - الجيش", en: "Tanta - El Gish" },
    coordinates: { lat: 30.7885, lng: 30.9991 },
    orders: 45,
    percentage: 9.0,
    color: "#a855f7",
    region: { ar: "الغربية", en: "Gharbia" }
  },
  {
    id: 6,
    name: { ar: "الزقازيق - الجامعة", en: "Zagazig - University" },
    coordinates: { lat: 30.5746, lng: 31.5021 },
    orders: 39,
    percentage: 7.8,
    color: "#06b6d4",
    region: { ar: "الشرقية", en: "Sharqia" }
  }
]
 
const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#a855f7", "#06b6d4", "#f472b6"]
 
export default function OutOfCoveragePage() {
  const params = useParams()
  const locale: Locale =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    (Array.isArray(params?.locale) && (params.locale[0] === "ar" || params.locale[0] === "en") && params.locale[0]) ||
    "en"
 
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [selectedCity, setSelectedCity] = useState<string>("all")
 
  const isRTL = locale === "ar"
 
  // Get unique regions
  const regions = useMemo(() => {
    const uniqueRegions = new Set(citiesData.map(city => city.region[locale]))
    return Array.from(uniqueRegions)
  }, [locale])
 
  // Filter data based on selections
  const filteredData = useMemo(() => {
    let filtered = citiesData
 
    if (selectedRegion !== "all") {
      filtered = filtered.filter(city => city.region[locale] === selectedRegion)
    }
 
    if (selectedCity !== "all") {
      filtered = filtered.filter(city => city.name[locale] === selectedCity)
    }
 
    return filtered
  }, [selectedRegion, selectedCity, locale])
 
  // Prepare data for charts
  const chartData = useMemo(() => {
    return filteredData.map(city => ({
      name: city.name[locale],
      orders: city.orders,
      percentage: city.percentage
    })).sort((a, b) => b.orders - a.orders)
  }, [filteredData, locale])
 
  // Pie chart data
  const pieData = useMemo(() => {
    return filteredData.map(city => ({
      name: city.name[locale],
      value: city.orders,
      color: city.color
    }))
  }, [filteredData, locale])
 
  // Statistics
  const totalOrders = useMemo(() => filteredData.reduce((sum, city) => sum + city.orders, 0), [filteredData])
  const avgOrders = useMemo(() => Math.round(totalOrders / filteredData.length) || 0, [filteredData, totalOrders])
  const topCity = useMemo(() => filteredData.reduce((max, city) => city.orders > max.orders ? city : max, filteredData[0] || citiesData[0]), [filteredData])
 
  return (
    <div className={`p-6 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
            <AlertTriangle className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {locale === "ar" ? "تحليل الطلبات خارج نطاق التغطية" : "Out of Coverage Orders Analytics"}
            </h1>
            <p className="text-gray-600 mt-1">
              {locale === "ar" ? "إحصائيات وتحليلات للطلبات من المناطق غير المغطاة" : "Statistics and analysis for orders from uncovered areas"}
            </p>
          </div>
        </div>
      </motion.div>
 
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-6"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {locale === "ar" ? "المرشحات" : "Filters"}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === "ar" ? "المنطقة" : "Region"}
                </label>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={locale === "ar" ? "اختر المنطقة" : "Select region"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {locale === "ar" ? "جميع المناطق" : "All regions"}
                    </SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === "ar" ? "المدينة" : "City"}
                </label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={locale === "ar" ? "اختر المدينة" : "Select city"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {locale === "ar" ? "جميع المدن" : "All cities"}
                    </SelectItem>
                    {filteredData.map((city) => (
                      <SelectItem key={city.id} value={city.name[locale]}>
                        {city.name[locale]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
 
      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {locale === "ar" ? "إجمالي الطلبات" : "Total Orders"}
                </p>
                <p className="text-3xl font-bold text-gray-900">{totalOrders.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {locale === "ar" ? "آخر 30 يوم" : "Last 30 days"}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
 
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {locale === "ar" ? "متوسط الطلبات" : "Average Orders"}
                </p>
                <p className="text-3xl font-bold text-gray-900">{avgOrders}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {locale === "ar" ? "لكل مدينة" : "Per city"}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <BarChart3 className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
 
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {locale === "ar" ? "الأعلى طلباً" : "Most Requested"}
                </p>
                <p className="text-lg font-bold text-gray-900">{topCity?.name[locale]}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {topCity?.orders} {locale === "ar" ? "طلب" : "orders"}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <MapPin className="text-red-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Map - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mb-6"
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={20} />
              {locale === "ar" ? "خريطة التوزيع" : "Distribution Map"}
            </CardTitle>
            <CardDescription>
              {locale === "ar" ? "المدن مع أعلى عدد من الطلبات خارج التغطية" : "Cities with highest out-of-coverage orders"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 lg:h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
              <MapComponent cities={filteredData} locale={locale} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Three Cards Grid - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={20} />
                {locale === "ar" ? "تحليل الطلبات" : "Orders Analysis"}
              </CardTitle>
              <CardDescription>
                {locale === "ar" ? "عدد الطلبات لكل مدينة" : "Number of orders per city"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={55} 
                      textAnchor="end" 
                      height={90}
                      tick={{ fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value: any) => [value, locale === "ar" ? "طلبات" : "Orders"]}
                    />
                    <Bar dataKey="orders" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>
                {locale === "ar" ? "توزيع النسب المئوية" : "Percentage Distribution"}
              </CardTitle>
              <CardDescription>
                {locale === "ar" ? "نسبة كل مدينة من إجمالي الطلبات" : "Each city's percentage of total orders"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, index }) => {
                        if (!value) return ""
                        const total = pieData.reduce((sum, item) => sum + item.value, 0)
                        const percentage = ((value / total) * 100).toFixed(1)
                        const shortName = name.split(' - ')[0] || name
                        return `${shortName}: ${percentage}%`
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cities Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>
                {locale === "ar" ? "تفاصيل المدن" : "Cities Details"}
              </CardTitle>
              <CardDescription>
                {locale === "ar" ? "قائمة بجميع المدن والإحصائيات" : "List of all cities and statistics"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredData.map((city) => (
                  <div key={city.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: city.color }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{city.name[locale]}</p>
                        <p className="text-sm text-gray-600">{city.region[locale]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{city.orders}</p>
                      <p className="text-sm text-gray-600">{city.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}