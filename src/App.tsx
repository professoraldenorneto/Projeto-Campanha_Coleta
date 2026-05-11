import { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import ReportList from './components/ReportList';
import ReportForm from './components/ReportForm';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { LogOut, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AppState = 'welcome' | 'map' | 'driver-view';

export default function App() {
  const [state, setState] = useState<AppState>('welcome');
  const [showReportForm, setShowReportForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && state === 'welcome') {
        setState('map');
      }
    });

    return () => unsubscribe();
  }, [state]);

  const handleRoleSelection = async (role: 'login' | 'driver' | 'signup') => {
    // For demo purposes, we automatically sign in anonymously for signup/login
    // In a real app, you'd show a login/signup form here.
    try {
      if (role === 'driver') {
        setState('driver-view');
      } else {
        await signInAnonymously(auth);
        setState('map');
      }
    } catch (error) {
      console.error("Auth error:", error);
      // Fallback for demo
      setState('map');
    }
  };

  const handleLogout = () => {
    auth.signOut();
    setState('welcome');
  };

  if (state === 'welcome') {
    return <WelcomeScreen onSelectRole={handleRoleSelection} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="h-16 px-6 bg-white border-b border-neutral-200 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center">
            <Trash2 size={18} />
          </div>
          <h1 className="font-display font-bold text-lg text-emerald-900 hidden sm:block">
            Coleta Luziânia
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-700">
            <User size={16} />
            <span className="text-sm font-medium">
              {currentUser?.isAnonymous ? 'Anônimo' : currentUser?.email || 'Usuário'}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {state === 'map' && (
          <ReportList onReportClick={() => setShowReportForm(true)} />
        )}
        {state === 'driver-view' && (
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <div>
                <h2 className="text-2xl font-display text-emerald-900 leading-tight">Módulo do Motorista</h2>
                <p className="text-emerald-600 text-sm">Visualizando denúncias de descarte irregular</p>
              </div>
              <button 
                onClick={() => setState('map')}
                className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-sm hover:bg-emerald-100 transition-all"
              >
                Voltar ao Mapa
              </button>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-emerald-600 text-white p-6 rounded-2xl">
                <p className="text-sm opacity-80 uppercase tracking-wider font-bold">Total Pendentes</p>
                <h3 className="text-4xl mt-1">Luziânia-GO</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-neutral-200">
                <p className="text-sm text-neutral-500 uppercase tracking-wider font-bold">Instrução</p>
                <h3 className="text-lg text-emerald-800 mt-1">Selecione uma ocorrência no mapa para atualizar status.</h3>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-dashed border-neutral-300 text-center text-neutral-400">
              <Truck size={48} className="mx-auto mb-4 opacity-20" />
              <p>Funcionalidade de lista de rotas em desenvolvimento.</p>
              <p className="text-sm">Use o mapa principal para identificar pontos de coleta próximos.</p>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showReportForm && (
          <ReportForm 
            onClose={() => setShowReportForm(false)} 
            onSuccess={() => {
              setShowReportForm(false);
              // Maybe show a success toast here
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
