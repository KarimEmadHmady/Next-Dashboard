"use client"
import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapPin } from "lucide-react"
 
// Fix Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
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
 
interface OutOfCoverageMapProps {
  cities: CityData[]
  locale: Locale
}
 
const OutOfCoverageMap = ({ cities, locale }: OutOfCoverageMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
 
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !cities || cities.length === 0) return
 
    // Create map centered on Egypt
    const map = L.map(mapRef.current, {
      center: [30.0444, 31.2357], // Cairo coordinates
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
    })
 
    // Add base map layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
 
    // Add satellite layer
    const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: '© <a href="https://www.esri.com/">Esri</a>',
      maxZoom: 19,
    })
 
    // Add layer controls
    const baseMaps = {
      [locale === "ar" ? "الخريطة الأساسية" : "Basic Map"]: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }),
      [locale === "ar" ? "صور الأقمار الصناعية" : "Satellite"]: satelliteLayer,
    }
 
    L.control.layers(baseMaps).addTo(map)
 
    // Add city markers
    cities.forEach((city) => {
      // Create custom icon based on order volume
      const iconSize = Math.max(20, Math.min(40, city.orders / 3))
 
      const customIcon = L.divIcon({
        className: "custom-city-marker",
        html: `
          <div style="
            width: ${iconSize}px;
            height: ${iconSize}px;
            background-color: ${city.color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: ${Math.max(10, iconSize / 3)}px;
          ">
            ${city.orders}
          </div>
        `,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2],
      })
 
      // Create marker
      const marker = L.marker([city.coordinates.lat, city.coordinates.lng], {
        icon: customIcon,
      }).addTo(map)
 
      // Create popup content
      const popupContent = `
        <div style="min-width: 220px; font-family: inherit;">
          <div style="
            background-color: ${city.color};
            color: white;
            padding: 10px 12px;
            margin: -12px -16px 12px -16px;
            border-radius: 8px 8px 0 0;
            font-weight: bold;
            text-align: center;
          ">
            ${city.name[locale]}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>${locale === "ar" ? "المنطقة:" : "Region:"}</strong> ${city.region[locale]}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <div style="text-align: center; padding: 6px; background-color: #f3f4f6; border-radius: 4px;">
              <div style="font-weight: bold; color: ${city.color}; font-size: 18px;">${city.orders}</div>
              <div style="font-size: 12px; color: #6b7280;">${locale === "ar" ? "طلبات" : "Orders"}</div>
            </div>
            <div style="text-align: center; padding: 6px; background-color: #f3f4f6; border-radius: 4px;">
              <div style="font-weight: bold; color: ${city.color}; font-size: 18px;">${city.percentage}%</div>
              <div style="font-size: 12px; color: #6b7280;">${locale === "ar" ? "نسبة" : "Share"}</div>
            </div>
          </div>
          <div style="width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
            <div style="
              width: ${city.percentage * 3}%;
              height: 100%;
              background-color: ${city.color};
              border-radius: 4px;
            "></div>
          </div>
          <div style="margin-top: 8px; text-align: center; font-size: 12px; color: #6b7280;">
            ${locale === "ar" ? "إحداثيات:" : "Coordinates:"} ${city.coordinates.lat.toFixed(4)}, ${city.coordinates.lng.toFixed(4)}
          </div>
        </div>
      `
 
      marker.bindPopup(popupContent, {
        maxWidth: 250,
        className: "city-popup",
      })
 
      // Add hover effects
      marker.on("mouseover", function (this: L.Marker) {
        this.setZIndexOffset(1000)
      })
 
      marker.on("mouseout", function (this: L.Marker) {
        this.setZIndexOffset(0)
      })
    })
 
    // Add Egypt boundaries
    const egyptBounds: L.LatLngBoundsExpression = [
      [22.0, 25.0], // Southwest
      [31.7, 36.9], // Northeast
    ]
 
    // Fit map to show all markers
    if (cities.length > 0) {
      const group = new L.FeatureGroup(cities.map(city => 
        L.marker([city.coordinates.lat, city.coordinates.lng])
      ))
      map.fitBounds(group.getBounds().pad(0.1))
    }
 
    // Save map instance
    mapInstanceRef.current = map
 
    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [cities, locale])
 
  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
 
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-10">
        <div className="text-sm font-semibold text-gray-900 mb-2">
          {locale === "ar" ? "مفتاح الخريطة" : "Map Legend"}
        </div>
        <div className="space-y-2">
          {cities && cities.length > 0 && cities.slice(0, 3).map((city) => (
            <div key={city.id} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: city.color }}
              />
              <div className="text-xs text-gray-600">
                {city.name[locale]}: {city.orders}
              </div>
            </div>
          ))}
          {cities && cities.length > 3 && (
            <div className="text-xs text-gray-500">
              +{cities.length - 3} {locale === "ar" ? "أخرى" : "more"}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
 
export default OutOfCoverageMap
 