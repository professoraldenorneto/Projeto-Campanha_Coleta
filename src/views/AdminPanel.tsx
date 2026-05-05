import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, increment, getDoc, getDocs, where, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Users, Trash2, CheckCircle2, AlertTriangle, Clock, Truck, BarChart3, 
  ChevronRight, ArrowLeft, Trophy, Medal, UserCheck, XCircle, MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const POINT_VALUES = {
  REPORT: 10,
  VERIFIED: 50,
  COLLECTED: 100
};

export default function AdminPanel() {
  const [reports, setReports] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Reports sub
    const qReports = query(collection(db, 'reports'));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'reports'));

    // Drivers sub
    const qDrivers = query(collection(db, 'users'), where('role', '==', 'driver'));
    const unsubDrivers = onSnapshot(qDrivers, (snapshot) => {
      setDrivers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => handleFirestoreError(error, OperationType.GET, 'users'));

    // Leaderboard sub (Citizens sorted by points)
    const qLeader = query(collection(db, 'users'), where('role', '==', 'citizen'));
    const unsubLeader = onSnapshot(qLeader, (snapshot) => {
      const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeaderboard(users.sort((a, b) => (b.points || 0) - (a.points || 0)));
      setLoading(false);
    }, error => handleFirestoreError(error, OperationType.GET, 'users'));

    return () => {
      unsubReports();
      unsubDrivers();
      unsubLeader();
    };
  }, []);

  const seedTestData = async () => {
    try {
      setLoading(true);
      // Create some test drivers
      const testDrivers = [
        { name: 'Carlos Motorista', role: 'driver', email: 'carlos@coleta.br' },
        { name: 'Ana Coleta', role: 'driver', email: 'ana@coleta.br' }
      ];

      for (const d of testDrivers) {
        const id = d.name.toLowerCase().replace(' ', '_');
        await setDoc(doc(db, 'users', id), { ...d, createdAt: new Date().toISOString() });
      }

      // Create some test citizens for leaderboard
      const testCitizens = [
        { name: 'João Silva', role: 'citizen', points: 150, badges: ['Cidadão Vip'], email: 'joao@user.br' },
        { name: 'Maria Souza', role: 'citizen', points: 80, badges: ['Eco Amigo'], email: 'maria@user.br' },
        { name: 'Pedro Limpeza', role: 'citizen', points: 200, badges: ['Herói Local', 'Sentinela de Luziânia'], email: 'pedro@user.br' }
      ];

      for (const c of testCitizens) {
        const id = c.name.toLowerCase().replace(' ', '_');
        await setDoc(doc(db, 'users', id), { ...c, createdAt: new Date().toISOString() });
      }

      // Create some initial reports
      const testReports = [
        { 
          lat: -16.2526, lng: -47.9504, 
          description: 'Entulho na calçada da Rua 10', 
          status: 'pending', 
          reporterId: 'pedro_limpeza',
          createdAt: serverTimestamp()
        },
        { 
          lat: -16.2600, lng: -47.9600, 
          description: 'Lixo acumulado no terreno baldio', 
          status: 'verified', 
          reporterId: 'joao_silva',
          createdAt: serverTimestamp()
        }
      ];

      for (const r of testReports) {
        await addDoc(collection(db, 'reports'), r);
      }

      alert('Dados de teste gerados com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar dados. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string, reporterId: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
      
      // Points logic only if moving to verified or collected
      if (status === 'verified' && currentStatus === 'pending') {
        const userRef = doc(db, 'users', reporterId);
        await updateDoc(userRef, { 
          points: increment(POINT_VALUES.VERIFIED),
          'badges': ['Sentinela de Luziânia'] // Example badge
        });
      } else if (status === 'collected' && currentStatus !== 'collected') {
        const userRef = doc(db, 'users', reporterId);
        await updateDoc(userRef, { 
          points: increment(POINT_VALUES.COLLECTED)
        });
      }
      setSelectedReport(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'reports');
    }
  };

  const assignDriver = async (reportId: string, driverId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { 
        assignedDriverId: driverId,
        status: 'scheduled' 
      });
      setSelectedReport(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'reports');
    }
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    collected: reports.filter(r => r.status === 'collected').length,
    verified: reports.filter(r => r.status === 'verified').length,
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-gray-400 hover:text-purple-600 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Painel Administrativo</h1>
            <p className="text-gray-400 text-sm font-medium">Gestão e Coleta • Luziânia</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={seedTestData}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20"
          >
            Gerar Dados Teste
          </button>
          <div className="flex -space-x-2">
            {drivers.slice(0, 3).map((d) => (
              <div key={d.id} className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-purple-600 uppercase">
                {d.name.charAt(0)}
              </div>
            ))}
            {drivers.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                +{drivers.length - 3}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stats & Reports */}
        <div className="lg:col-span-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: stats.total, icon: Trash2, color: 'bg-gray-100 text-gray-600' },
              { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'bg-blue-50 text-blue-600' },
              { label: 'Verificados', value: stats.verified, icon: AlertTriangle, color: 'bg-orange-50 text-orange-600' },
              { label: 'Coletados', value: stats.collected, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div className={`w-10 h-10 rounded-2xl ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <List className="w-5 h-5 text-purple-600" /> Todas as Denúncias
              </h2>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full uppercase tracking-widest">
                  Live View
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID / Data</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Local / Status</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-4">
                        <p className="text-xs font-mono text-gray-400">#{report.id.slice(0, 6)}</p>
                        <p className="text-xs font-medium text-gray-900 mt-0.5">{new Date(report.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-3 h-3 text-gray-300" />
                          <span className="text-[10px] font-medium text-gray-500">{report.lat.toFixed(4)}, {report.lng.toFixed(4)}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          report.status === 'collected' ? 'bg-green-100 text-green-700' :
                          report.status === 'scheduled' ? 'bg-orange-100 text-orange-700' : 
                          report.status === 'dismissed' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <button 
                          onClick={() => setSelectedReport(report)}
                          className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-600 hover:text-white transition-all"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Leaderboard & Drivers */}
        <div className="lg:col-span-4 space-y-8">
          {/* Leaderboard */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 overflow-hidden">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-6 px-2">
              <Trophy className="w-5 h-5 text-orange-500" /> Placar de Líderes
            </h2>
            <div className="space-y-4">
              {leaderboard.slice(0, 5).map((user, idx) => (
                <div key={user.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-orange-100 text-orange-600' : 
                    idx === 1 ? 'bg-gray-100 text-gray-600' : 
                    idx === 2 ? 'bg-orange-50 text-orange-400' : 
                    'text-gray-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {user.badges?.map((b: string) => (
                        <Medal key={b} className="w-3 h-3 text-purple-400" title={b} />
                      ))}
                      <span className="text-[10px] text-gray-400 font-medium">{user.badges?.length || 0} badges</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">{user.points || 0}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Drivers List */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-6 px-2">
              <Truck className="w-5 h-5 text-blue-500" /> Motoristas em Rota
            </h2>
            <div className="space-y-3">
              {drivers.map((driver) => (
                <div key={driver.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                      {driver.name.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{driver.name}</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-50" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Report Action Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="h-48 bg-gray-100 relative">
                {selectedReport.photoUrl ? (
                  <img src={selectedReport.photoUrl} alt="Trash" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Trash2 className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="absolute top-6 right-6 p-2 bg-black/30 text-white rounded-full backdrop-blur-md hover:bg-black/50 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Gerenciar Denúncia</h3>
                    <p className="text-sm text-gray-400 mt-1">{selectedReport.description || 'Sem descrição detalhada.'}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-widest">
                    {selectedReport.status}
                  </span>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reporter ID</p>
                      <p className="text-xs font-medium text-gray-700">{selectedReport.reporterId}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Atribuir Motorista</p>
                    <div className="flex flex-wrap gap-2">
                       {drivers.map((d) => (
                        <button 
                          key={d.id}
                          onClick={() => assignDriver(selectedReport.id, d.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            selectedReport.assignedDriverId === d.id 
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
                            : 'bg-white text-purple-600 hover:bg-purple-100 border border-purple-100'
                          }`}
                        >
                          {d.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => updateReportStatus(selectedReport.id, 'verified', selectedReport.reporterId, selectedReport.status)}
                    className="py-4 bg-orange-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
                  >
                    Verificar
                  </button>
                  <button 
                    onClick={() => updateReportStatus(selectedReport.id, 'collected', selectedReport.reporterId, selectedReport.status)}
                    className="py-4 bg-green-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-green-500/20 active:scale-95 transition-transform"
                  >
                    Coletar
                  </button>
                  <button 
                    onClick={() => updateReportStatus(selectedReport.id, 'dismissed', selectedReport.reporterId, selectedReport.status)}
                    className="py-4 bg-gray-100 text-gray-600 rounded-2xl text-xs font-bold active:scale-95 transition-transform"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub components placeholders
function MapPin({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
}

function List({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
