"use client"
import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Globe, MapPin } from "lucide-react"

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

export type MapArea = {
  id: string
  name: string
  lat: number
  lng: number
  managerName?: string | null
  color: string
  storesCount: number
}

type Locale = "ar" | "en"

interface MapComponentProps {
  areas: MapArea[]
  locale: Locale
}

const MapComponent = ({ areas, locale }: MapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [30.0444, 31.2357], // Cairo center
        zoom: 11,
        zoomControl: true,
        attributionControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      markersLayerRef.current = L.layerGroup().addTo(map)
      mapInstanceRef.current = map
    }

    const map = mapInstanceRef.current
    const markersLayer = markersLayerRef.current

    if (markersLayer) {
      markersLayer.clearLayers()
    }

    const validMarkers: L.Marker[] = []

    areas.forEach((area) => {
      if (typeof area.lat !== "number" || typeof area.lng !== "number" || isNaN(area.lat) || isNaN(area.lng)) {
        return
      }

      const customIcon = L.divIcon({
        className: "custom-area-marker",
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background-color: ${area.color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 3px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 11px;
            font-family: inherit;
          ">
            ${area.storesCount}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([area.lat, area.lng], { icon: customIcon })

      const popupContent = `
        <div style="min-width: 220px; font-family: Cairo, sans-serif; text-align: ${locale === "ar" ? "right" : "left"}; direction: ${locale === "ar" ? "rtl" : "ltr"}; padding: 2px;">
          <div style="
            background-color: ${area.color};
            color: white;
            padding: 8px 12px;
            margin: -14px -14px 10px -14px;
            border-radius: 8px 8px 0 0;
            font-weight: bold;
            text-align: center;
            font-size: 14px;
          ">
            ${area.name}
          </div>
          <div style="margin-bottom: 6px; font-size: 13px;">
            <strong>${locale === "ar" ? "المدير:" : "Manager:"}</strong> 
            <span>${area.managerName || (locale === "ar" ? "غير محدد" : "Unassigned")}</span>
          </div>
          <div style="margin-bottom: 6px; font-size: 13px;">
            <strong>${locale === "ar" ? "عدد الفروع:" : "Stores:"}</strong> 
            <span style="font-weight: bold; color: ${area.color};">${area.storesCount}</span>
          </div>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; font-family: monospace;">
            GPS: ${area.lat.toFixed(4)}, ${area.lng.toFixed(4)}
          </div>
        </div>
      `

      marker.bindPopup(popupContent, { maxWidth: 300 })
      if (markersLayer) {
        marker.addTo(markersLayer)
      }
      validMarkers.push(marker)
    })

    if (validMarkers.length > 0 && map) {
      const group = L.featureGroup(validMarkers)
      map.fitBounds(group.getBounds().pad(0.25))
    }
  }, [areas, locale])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Globe size={22} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              {locale === "ar" ? "خريطة توزيع المناطق والفروع" : "Areas Distribution Map"}
            </h3>
            <p className="text-xs text-gray-500">
              {locale === "ar" ? "مواقع حقيقية مستمدة من قواعد البيانات" : "Live coordinates retrieved from backend"}
            </p>
          </div>
        </div>

        <span className="text-xs bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-full">
          {areas.length} {locale === "ar" ? "مناطق" : "Areas"}
        </span>
      </div>

      {/* Map Canvas */}
      <div className="relative h-80 sm:h-96 bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Map Legend */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {areas.map((area) => (
          <div
            key={area.id}
            className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm shrink-0"
                style={{ backgroundColor: area.color }}
              />
              <div className="text-sm font-bold text-gray-800 truncate">{area.name}</div>
            </div>
            <div className="text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-200 shrink-0">
              {area.storesCount} {locale === "ar" ? "فرع" : "stores"}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MapComponent
