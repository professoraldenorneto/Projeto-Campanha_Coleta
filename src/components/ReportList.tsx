import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Camera, MapPin, Search, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Report {
  id: string;
  imageUrl: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    complement: string;
  };
  status: 'pending' | 'in_progress' | 'collected';
  description: string;
  createdAt: any;
}

export default function ReportList({ onReportClick }: { onReportClick: () => void }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(docs);
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => unsubscribe();
  }, []);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'collected': return { color: 'bg-emerald-500', text: 'Coletado' };
      case 'in_progress': return { color: 'bg-amber-500', text: 'Em Coleta' };
      default: return { color: 'bg-red-500', text: 'Pendente' };
    }
  };

  const filteredReports = reports.filter(r => 
    r.address?.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.address?.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
      {/* Search Header */}
      <div className="sticky top-16 z-20 bg-neutral-50/80 backdrop-blur-md pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por rua ou bairro em Luziânia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-neutral-200 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <motion.div
            layoutId={report.id}
            key={report.id}
            onClick={() => setSelectedReport(report)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
          >
            <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-100">
              <img 
                src={report.imageUrl} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                alt="Report"
              />
              <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase ${getStatusInfo(report.status).color}`}>
                {getStatusInfo(report.status).text}
              </div>
            </div>
            
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-1 text-emerald-600">
                <MapPin size={14} className="flex-shrink-0" />
                <h3 className="font-bold text-emerald-900 truncate">
                  {report.address?.street}{report.address?.number ? `, ${report.address.number}` : ''}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 font-medium">Bairro: {report.address?.neighborhood}</p>
              <p className="text-sm text-neutral-600 line-clamp-1 italic">"{report.description || 'Sem descrição'}"</p>
              
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <Calendar size={10} /> 
                  {new Date(report.createdAt?.seconds * 1000).toLocaleDateString()}
                </span>
                <ChevronRight size={16} className="text-neutral-300" />
              </div>
            </div>
          </motion.div>
        ))}

        {filteredReports.length === 0 && (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <Search size={48} className="mx-auto opacity-20" />
            <p className="font-medium">Nenhuma denúncia encontrada.</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-30">
        <button
          onClick={onReportClick}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-emerald-700 transition-all font-bold"
        >
          <Camera size={24} />
          Denunciar agora
        </button>
      </div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              layoutId={selectedReport.id}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <img src={selectedReport.imageUrl} alt="Lixo" className="w-full h-64 object-cover" referrerPolicy="no-referrer" />
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${getStatusInfo(selectedReport.status).color}`}>
                        {getStatusInfo(selectedReport.status).text}
                      </span>
                      <span className="text-xs text-neutral-400">
                        Postado em {new Date(selectedReport.createdAt?.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-xl font-display text-emerald-900">
                      {selectedReport.address?.street}, {selectedReport.address?.number}
                    </h2>
                    <p className="text-emerald-600 font-bold">{selectedReport.address?.neighborhood}</p>
                    {selectedReport.address?.complement && (
                      <p className="text-sm text-neutral-500 italic mt-1">{selectedReport.address.complement}</p>
                    )}
                  </div>
                  <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-neutral-100 rounded-full">
                    <ChevronRight size={24} className="rotate-90 sm:rotate-0" />
                  </button>
                </div>
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  <p className="text-neutral-700 leading-relaxed italic">
                    "{selectedReport.description || 'Nenhuma descrição adicional informada pelo cidadão.'}"
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
