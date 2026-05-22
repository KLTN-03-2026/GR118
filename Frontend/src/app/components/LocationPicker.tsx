import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap
} from "react-leaflet";
import L from "leaflet";
import { Search, MapPin, Loader2, Navigation } from "lucide-react";

// Fix for default marker icons in Leaflet with Webpack/Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number, address?: any) => void;
  height?: string;
  zoom?: number;
  city?: string;
  district?: string;
  ward?: string;
  showSearch?: boolean;
}

// Internal component to handle map clicks
function LocationMarker({ position, setPosition, onChange }: {
  position: [number, number],
  setPosition: (pos: [number, number]) => void,
  onChange: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onChange(lat, lng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

// Internal component to handle map movement when position prop changes
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function LocationPicker({
  lat,
  lng,
  onChange,
  height = "300px",
  zoom = 15,
  city,
  district,
  ward,
  showSearch = true
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([lat, lng]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync internal position with props
  useEffect(() => {
    if (lat !== position[0] || lng !== position[1]) {
      setPosition([lat, lng]);
    }
  }, [lat, lng]);

  const handleReverseGeocode = async (lt: number, lg: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lt}&lon=${lg}&format=json&addressdetails=1`,
        {
          headers: {
            "User-Agent": "IssueReportingSystem/1.0",
          },
        }
      );
      const data = await res.json();
      if (data && data.address) {
        onChange(lt, lg, data);
      } else {
        onChange(lt, lg);
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      onChange(lt, lg);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);

    suggestionTimeoutRef.current = setTimeout(async () => {
      try {
        const searchParts = [query];
        if (ward) searchParts.push(ward);
        if (district) searchParts.push(district);
        if (city) searchParts.push(city);
        const fullQuery = searchParts.join(" ").trim();

        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(fullQuery)}&limit=5&lat=${position[0]}&lon=${position[1]}`
        );
        const data = await res.json();
        const results = data.features.map((f: any) => {
          const p = f.properties;
          const name = [p.name, p.street, p.housenumber].filter(Boolean).join(" ");
          const context = [p.district, p.city, p.state].filter(Boolean).join(", ");
          return {
            display_name: `${name}${name && context ? ", " : ""}${context}` || p.display_name,
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0]
          };
        });
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error("Photon suggestions failed:", error);
      }
    }, 800);
  };

  const handleSearch = async (customQuery?: any) => {
    // Ensure query is a string (React event might be passed if called from onClick)
    const query = typeof customQuery === "string" ? customQuery : searchQuery;
    if (!query || !query.trim()) return;
    setLoading(true);
    setShowSuggestions(false);

    try {
      const searchParts = [query];
      if (ward) searchParts.push(ward);
      if (district) searchParts.push(district);
      if (city) searchParts.push(city);
      const fullQuery = searchParts.join(" ").trim();

      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(fullQuery)}&limit=1&lat=${position[0]}&lon=${position[1]}`
      );
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const feature = data.features[0];
        const newLat = feature.geometry.coordinates[1];
        const newLng = feature.geometry.coordinates[0];
        setPosition([newLat, newLng]);
        handleReverseGeocode(newLat, newLng);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          handleReverseGeocode(latitude, longitude);
          setLoading(false);
        },
        (error) => {
          console.error("Geolocation failed:", error);
          setLoading(false);
        }
      );
    }
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {showSearch && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchSuggestions(e.target.value);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Tìm kiếm địa chỉ..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            />

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-[1001] left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPosition([suggestion.lat, suggestion.lon]);
                        handleReverseGeocode(suggestion.lat, suggestion.lon);
                        setSearchQuery(suggestion.display_name.split(',')[0]);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 flex items-start gap-2.5 border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <MapPin size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 line-clamp-2">{suggestion.display_name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
          <button
            type="button"
            onClick={handleCurrentLocation}
            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
            title="Vị trí hiện tại"
          >
            <Navigation size={18} />
          </button>
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-inner group" style={{ height }}>
        <MapContainer
          center={position}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", zIndex: 10 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            onChange={(lt, lg) => handleReverseGeocode(lt, lg)}
          />
          <ChangeView center={position} zoom={zoom} />
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 z-[1000] bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
            <Loader2 size={32} className="text-red-500 animate-spin" />
          </div>
        )}

        <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-2 pointer-events-none">
          <MapPin size={14} className="text-red-500" />
          <span className="text-[10px] font-bold text-gray-700">CLICK ĐỂ CHỌN VỊ TRÍ</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 text-[11px] text-gray-400 font-medium">
        <div className="flex gap-3">
          <span>Lat: {position[0].toFixed(6)}</span>
          <span>Lng: {position[1].toFixed(6)}</span>
        </div>
        <span>OpenStreetMap Foundation</span>
      </div>
    </div>
  );
}
