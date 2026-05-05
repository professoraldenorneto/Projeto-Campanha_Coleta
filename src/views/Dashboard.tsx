import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import Map from '../components/MapComponent';
import { Plus, List, Map as MapIcon, LogOut, Info, Clock, CheckCircle2, Truck, Trash2, Trophy, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.currentUser) {
      const unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
        setUserProfile(doc.data());
      });
      return () => unsubUser();
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    
    // onSnapshot listener with error handling as per instructions
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reports');
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Mapa de Coleta</h1>
            <p className="text-xs text-gray-400 font-medium tracking-tight">Luziânia, Goiás</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userProfile && userProfile.role === 'citizen' && (
            <div className="hidden sm:flex items-center gap-3 mr-4 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-orange-500 uppercase tracking-[0.2em]">Meus Pontos</span>
                <span className="text-sm font-black text-gray-900 leading-none">{userProfile.points || 0}</span>
              </div>
              <div className="flex -space-x-1">
                {userProfile.badges?.slice(0, 3).map((b: string) => (
                  <div key={b} title={b} className="w-5 h-5 rounded-full bg-white border border-purple-100 flex items-center justify-center shadow-sm">
                    <Medal className="w-3 h-3 text-purple-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
          <button 
            onClick={() => setView(view === 'map' ? 'list' : 'map')}
            className="p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
            id="view-toggle"
          >
            {view === 'map' ? <List className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
          </button>
          {userProfile?.role === 'admin' && (
            <button 
              onClick={() => navigate('/admin')}
              className="p-2.5 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
              title="Painel Admin"
            >
              <Trophy className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
            id="logout-btn"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'map' ? (
            <motion.div 
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <Map reports={reports} />
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full h-full overflow-y-auto px-6 py-4 space-y-4"
            >
              {reports.length === 0 && !loading && (
                <div className="text-center py-20">
                  <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhuma denúncia encontrada.</p>
                </div>
              )}
              {reports.map((report) => (
                <div key={report.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-4">
                  {report.photoUrl ? (
                    <img src={report.photoUrl} alt="Trash" className="w-20 h-20 rounded-xl object-cover shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                      <Trash2 className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        report.status === 'collected' ? 'bg-green-100 text-green-700' :
                        report.status === 'scheduled' ? 'bg-orange-100 text-orange-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {report.status}
                      </span>
                      <span className="text-[10px] text-gray-400">{new Date(report.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{report.description || 'Sem descrição'}</p>
                    <div className="mt-2 flex items-center gap-4">
                       <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                        <Clock className="w-3 h-3" /> 
                        <span>Pendente</span>
                      </div>
                      {report.status === 'collected' && (
                        <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> 
                          <span>Resolvido</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/report')}
          className="absolute bottom-10 right-6 z-[1001] bg-blue-600 text-white rounded-2xl p-4 shadow-xl shadow-blue-500/20 flex items-center gap-3"
          id="new-report-fab"
        >
          <Plus className="w-6 h-6" />
          <span className="font-semibold pr-2">Nova Denúncia</span>
        </motion.button>
      </main>

      {/* Bottom Nav (If mobile feel) */}
      <nav className="h-20 border-t border-gray-100 bg-white flex items-center justify-around px-6 shrink-0 lg:hidden">
        <button className="flex flex-col items-center gap-1 text-blue-600">
          <MapIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Mapa</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-300">
          <Truck className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Minhas</span>
        </button>
      </nav>
    </div>
  );
}
