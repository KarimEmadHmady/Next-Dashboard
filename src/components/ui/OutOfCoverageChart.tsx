"use client"

import React from "react"
import { useParams } from "next/navigation"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts"

type OutOfCoveragePoint = {
  place: string
  count: number
}

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#a855f7", "#06b6d4", "#f472b6"]

const sampleData: OutOfCoveragePoint[] = [
  { place: "Cairo - Nasr City", count: 42 },
  { place: "Giza - 6th October", count: 35 },
  { place: "Alexandria - Sidi Gaber", count: 28 },
  { place: "Mansoura - Center", count: 18 },
  { place: "Tanta - El Gish", count: 14 },
  { place: "Zagazig - University", count: 11 },
]

export function OutOfCoverageChart({ data = sampleData }: { data?: OutOfCoveragePoint[] }) {
  const params = useParams()
  const locale: "ar" | "en" =
    (typeof params?.locale === "string" && (params.locale === "ar" || params.locale === "en") && params.locale) ||
    (Array.isArray(params?.locale) && (params?.locale[0] === "ar" || params?.locale[0] === "en") && params?.locale[0]) ||
    "en"

  const title = locale === "ar" ? "أكثر المناطق طلباً (خارج التغطية)" : "Most Requested Areas (Out of Coverage)"
  const subtitle = locale === "ar" ? "آخر 30 يوم" : "Last 30 days"
  const isArabic = locale === "ar"

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="font-bold text-gray-900 text-base sm:text-lg">{title}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>
      <div className="w-full h-[260px] sm:h-[300px] dir-ltr">
        <ResponsiveContainer width="100%" height="100%" style={{ direction: "ltr" }}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: isArabic ? 16 : 24, left: isArabic ? 24 : 16, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              reversed={isArabic}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              dataKey="place"
              type="category"
              width={160}
              orientation={isArabic ? "right" : "left"}
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
              formatter={(value: any) => [value, "Requests"]}
            />
            <Bar dataKey="count" radius={[6, 6, 6, 6]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default OutOfCoverageChart


