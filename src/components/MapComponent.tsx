import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trash2, Navigation, AlertTriangle } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const customIcon = (color: string) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
         </div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

interface LocationMarkerProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  reports?: any[];
  userLocation?: [number, number];
}

function LocationMarker({ onLocationSelect, reports, userLocation }: LocationMarkerProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.flyTo(userLocation, 15);
      setPosition(userLocation);
    }
  }, [userLocation, map]);

  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return (
    <>
      {position && onLocationSelect && (
        <Marker position={position} icon={customIcon('#ef4444')}>
          <Popup>Local da Denúncia</Popup>
        </Marker>
      )}
      {reports?.map((report) => (
        <Marker 
          key={report.id} 
          position={[report.lat, report.lng]} 
          icon={customIcon(report.status === 'collected' ? '#22c55e' : report.status === 'scheduled' ? '#f59e0b' : '#3b82f6')}
        >
          <Popup>
            <div className="p-1">
              <p className="font-bold">Status: {report.status}</p>
              <p className="text-sm">{report.description}</p>
              {report.photoUrl && <img src={report.photoUrl} alt="Trash" className="mt-2 rounded w-full h-24 object-cover" referrerPolicy="no-referrer" />}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function Map({ reports, onLocationSelect }: { reports?: any[], onLocationSelect?: (lat: number, lng: number) => void }) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const locateUser = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.error(err);
        // Fallback to Luziânia coordinates
        setUserLocation([-16.2526, -47.9504]);
      }
    );
  };

  useEffect(() => {
    locateUser();
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-gray-200">
      <MapContainer 
        center={[-16.2526, -47.9504]} 
        zoom={13} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={onLocationSelect} reports={reports} userLocation={userLocation || undefined} />
      </MapContainer>
      
      <button 
        onClick={locateUser}
        className="absolute bottom-6 right-6 z-[1000] p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
        title="Minha Localização"
        id="locate-btn"
      >
        <Navigation className="w-6 h-6 text-blue-600" />
      </button>

      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="w-3 h-3 rounded-full bg-blue-500" /> <span>Pendente</span>
        </div>
         <div className="flex items-center gap-2 text-xs font-medium">
          <div className="w-3 h-3 rounded-full bg-orange-500" /> <span>Agendado</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="w-3 h-3 rounded-full bg-green-500" /> <span>Coletado</span>
        </div>
      </div>
    </div>
  );
}
