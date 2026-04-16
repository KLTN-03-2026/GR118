import { useState, useEffect } from "react";
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

export function LocationPicker({ lat, lng, onChange, height = "300px", zoom = 15 }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([lat, lng]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        {
          headers: {
            "User-Agent": "IssueReportingSystem/1.0",
          },
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
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
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Tìm kiếm địa chỉ..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
          />
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
