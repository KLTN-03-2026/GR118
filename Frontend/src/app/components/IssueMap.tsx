import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

interface IssueMapProps {
  lat: number;
  lng: number;
  title: string;
  location: string;
}

export function IssueMap({ lat, lng, title, location }: IssueMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Dynamically import Leaflet CSS and setup
    const setupLeaflet = async () => {
      if (typeof window !== "undefined") {
        const L = await import("leaflet");
        
        // Fix default marker icon
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Create map
        const mapDiv = document.getElementById(`map-${lat}-${lng}`);
        if (mapDiv && !mapDiv.hasChildNodes()) {
          // Set position imperatively so Leaflet's scroll-offset check passes
          mapDiv.style.position = "relative";
          const map = L.map(mapDiv).setView([lat, lng], 16);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map);

          // Custom red icon
          const redIcon = new L.Icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });

          const marker = L.marker([lat, lng], { icon: redIcon }).addTo(map);
          
          marker.bindPopup(`
            <div style="padding: 8px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <strong style="font-size: 14px;">${title}</strong>
              </div>
              <p style="font-size: 12px; color: #666; margin: 4px 0;">${location}</p>
              <p style="font-size: 11px; color: #999; margin: 4px 0;">
                GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}
              </p>
            </div>
          `);

          setMapLoaded(true);
        }
      }
    };

    setupLeaflet();
  }, [lat, lng, title, location]);

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
      <div id={`map-${lat}-${lng}`} className="w-full h-full relative z-0" style={{ position: 'relative' }} />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <MapPin size={32} className="text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-gray-500">Đang tải bản đồ...</p>
          </div>
        </div>
      )}
    </div>
  );
}