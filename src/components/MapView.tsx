import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Camera, MapPin, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

interface Report {
  id: string;
  imageUrl: string;
  location: { lat: number; lng: number };
  status: 'pending' | 'in_progress' | 'collected';
  description: string;
  createdAt: any;
}

export default function MapView({ onReportClick }: { onReportClick: () => void }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Error getting location:", error)
      );
    }

    // Real-time listener for reports
    const q = query(collection(db, 'reports'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(docs);
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'collected': return '#10b981'; // green
      case 'in_progress': return '#f59e0b'; // yellow
      default: return '#ef4444'; // red
    }
  };

  if (!API_KEY || API_KEY === 'MY_GOOGLE_MAPS_KEY') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white h-[calc(100vh-64px)]">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Info size={32} />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Configuração Incompleta</h2>
        <p className="text-neutral-600 max-w-sm mb-6">
          Para visualizar o mapa, você precisa adicionar a chave <strong>GOOGLE_MAPS_PLATFORM_KEY</strong> no menu <strong>Settings &gt; Secrets</strong> do AI Studio.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <div className="text-left bg-neutral-50 p-4 rounded-xl border border-neutral-200 font-mono text-xs">
            GOOGLE_MAPS_PLATFORM_KEY="sua_chave_aqui"
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-64px)]">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={userLocation || { lat: -16.25, lng: -47.95 }} // Luziânia center approx
          defaultZoom={13}
          mapId="REPORT_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {reports.map((report) => (
            <AdvancedMarker
              key={report.id}
              position={report.location}
              onClick={() => setSelectedReport(report)}
            >
              <Pin 
                background={getStatusColor(report.status)} 
                glyphColor="#fff" 
                scale={1.2}
              />
            </AdvancedMarker>
          ))}
          
          {userLocation && (
            <AdvancedMarker position={userLocation}>
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      {/* Action Button */}
      <div className="absolute bottom-8 right-8 z-10">
        <button
          onClick={onReportClick}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-emerald-700 transition-all font-bold group"
        >
          <Camera size={24} className="group-hover:scale-110 transition-transform" />
          Denunciar Descarte
        </button>
      </div>

      {/* Report Summary Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 glass-panel p-4 rounded-2xl z-20"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-emerald-900">Detalhes da Denúncia</h3>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-1 hover:bg-emerald-100 rounded-full text-emerald-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <img 
              src={selectedReport.imageUrl} 
              alt="Waste" 
              className="w-full h-40 object-cover rounded-xl mb-3 shadow-inner"
              referrerPolicy="no-referrer"
            />
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white`} style={{ backgroundColor: getStatusColor(selectedReport.status) }}>
                  {selectedReport.status === 'pending' ? 'Pendente' : selectedReport.status === 'in_progress' ? 'Em Coleta' : 'Coletado'}
                </span>
                <span className="text-xs text-neutral-500">
                  {new Date(selectedReport.createdAt?.seconds * 1000).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-neutral-700 line-clamp-3">
                {selectedReport.description || "Sem descrição adicional."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
