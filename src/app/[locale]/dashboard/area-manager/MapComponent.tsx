"use client"
import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Globe } from "lucide-react"

// إصلاح مشكلة الأيقونات في Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

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

interface MapComponentProps {
  areas: Area[]
  locale: Locale
}

const MapComponent = ({ areas, locale }: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // إنشاء الخريطة مع التركيز على القاهرة
    const map = L.map(mapRef.current, {
      center: [30.0444, 31.2357], // إحداثيات القاهرة
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    })

    // إضافة طبقة الخريطة الأساسية (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // إضافة طبقة خريطة إضافية (Satellite)
    const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: '© <a href="https://www.esri.com/">Esri</a>',
      maxZoom: 19,
    })

    // إضافة طبقة خريطة الطرق
    const roadsLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    })

    // إضافة أزرار تبديل الطبقات
    const baseMaps = {
      [locale === "ar" ? "الخريطة الأساسية" : "Basic Map"]: roadsLayer,
      [locale === "ar" ? "صور الأقمار الصناعية" : "Satellite"]: satelliteLayer,
    }

    L.control.layers(baseMaps).addTo(map)

    // إضافة المناطق كعلامات على الخريطة
    areas.forEach((area) => {
      // إنشاء أيقونة مخصصة لكل منطقة
      const customIcon = L.divIcon({
        className: "custom-area-marker",
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background-color: ${area.color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            position: relative;
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 8px;
              height: 8px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      // إنشاء العلامة
      const marker = L.marker([area.coordinates.lat, area.coordinates.lng], {
        icon: customIcon,
      }).addTo(map)

      // إنشاء محتوى النافذة المنبثقة
      const popupContent = `
        <div style="min-width: 200px; font-family: inherit;">
          <div style="
            background-color: ${area.color};
            color: white;
            padding: 8px 12px;
            margin: -12px -16px 12px -16px;
            border-radius: 8px 8px 0 0;
            font-weight: bold;
            text-align: center;
          ">
            ${area.name[locale]}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>${locale === "ar" ? "الموقع:" : "Location:"}</strong> ${area.location[locale]}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>${locale === "ar" ? "المدير:" : "Manager:"}</strong> ${area.manager[locale]}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <div style="text-align: center; padding: 4px; background-color: #f3f4f6; border-radius: 4px;">
              <div style="font-weight: bold; color: ${area.color};">${area.storesCount}</div>
              <div style="font-size: 12px; color: #6b7280;">${locale === "ar" ? "متجر" : "Stores"}</div>
            </div>
            <div style="text-align: center; padding: 4px; background-color: #f3f4f6; border-radius: 4px;">
              <div style="font-weight: bold; color: ${area.color};">${area.usersCount}</div>
              <div style="font-size: 12px; color: #6b7280;">${locale === "ar" ? "مستخدم" : "Users"}</div>
            </div>
          </div>
          <div style="margin-bottom: 8px;">
            <strong>${locale === "ar" ? "الأداء:" : "Performance:"}</strong> ${area.performance}%
          </div>
          <div style="width: 100%; height: 6px; background-color: #e5e7eb; border-radius: 3px; overflow: hidden;">
            <div style="
              width: ${area.performance}%;
              height: 100%;
              background-color: ${area.color};
              border-radius: 3px;
            "></div>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: "area-popup",
      })

      // إضافة تأثيرات تفاعلية مع أنواع صحيحة
      marker.on("mouseover", function (this: L.Marker) {
        this.setZIndexOffset(1000)
      })

      marker.on("mouseout", function (this: L.Marker) {
        this.setZIndexOffset(0)
      })
    })

    // إضافة حدود مصر مع أنواع صحيحة
    const egyptBounds: L.LatLngBoundsExpression = [
      [22.0, 25.0], // جنوب غرب
      [31.7, 36.9], // شمال شرق
    ]

    // إضافة مستطيل حدود مصر
    // L.rectangle(egyptBounds, {
    //   color: "#f59e0b",
    //   weight: 2,
    //   fillColor: "#fef3c7",
    //   fillOpacity: 0.1,
    // }).addTo(map)

    // إضافة نهر النيل مع أنواع صحيحة
    // (تم حذف الكود نهائياً)

    // إضافة بحر المتوسط مع أنواع صحيحة
    const mediterraneanSea: L.LatLngExpression[] = [
      [31.0, 30.0],
      [31.0, 32.0],
      [32.0, 32.0],
      [32.0, 30.0],
    ]

    L.polygon(mediterraneanSea, {
      color: "#0ea5e9",
      weight: 1,
      fillColor: "#0ea5e9",
      fillOpacity: 0.3,
    }).addTo(map)

    // إضافة البحر الأحمر مع أنواع صحيحة
    const redSea: L.LatLngExpression[] = [
      [22.0, 35.0],
      [22.0, 37.0],
      [24.0, 37.0],
      [24.0, 35.0],
    ]

    L.polygon(redSea, {
      color: "#dc2626",
      weight: 1,
      fillColor: "#dc2626",
      fillOpacity: 0.3,
    }).addTo(map)

    // حفظ مرجع الخريطة
    mapInstanceRef.current = map

    // تنظيف عند إلغاء المكون
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [areas, locale])

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="text-blue-600" size={24} />
        <h3 className="text-xl font-bold text-gray-900">
          {locale === "ar" ? "خريطة المناطق" : "Areas Map"}
        </h3>
      </div>
      
      {/* الخريطة الحقيقية */}
      <div className="relative h-80 bg-white rounded-xl overflow-hidden border-2 border-gray-300 shadow-inner">
        <div ref={mapRef} className="w-full h-full" />
      </div>
      
      {/* مفتاح الخريطة */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {areas.map((area) => (
          <div key={area.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: area.color }}></div>
              <div className="text-sm font-medium text-gray-700">{area.location[locale]}</div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {area.storesCount} {locale === "ar" ? "متجر" : "stores"}
            </div>
          </div>
        ))}
      </div>
      
      {/* إحصائيات إضافية */}
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800 text-center">
          <span className="font-semibold">
            {locale === "ar" ? "إجمالي المساحة:" : "Total Area:"}
          </span>{" "}
          <span className="text-blue-600">37.5 km²</span>
          {" • "}
          <span className="font-semibold">
            {locale === "ar" ? "إجمالي السكان:" : "Total Population:"}
          </span>{" "}
          <span className="text-blue-600">299K</span>
        </div>
      </div>
    </div>
  )
}

export default MapComponent
