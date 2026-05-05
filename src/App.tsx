import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import Welcome from './views/Welcome';
import Dashboard from './views/Dashboard';
import Report from './views/Report';
import AdminPanel from './views/AdminPanel';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const d = await getDoc(doc(db, 'users', u.uid));
        setUserData(d.data());
      }
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/" />;

  if (role && userData?.role !== role) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

// Simple Login View (Simulation/Google)
function Login() {
  const [loading, setLoading] = useState(false);
  const query = new URLSearchParams(window.location.search);
  const role = query.get('role') || 'citizen';

  const handleLogin = async () => {
    setLoading(true);
    try {
      // In this environment, popup might be blocked or need auth persistence
      // We'll use signInAnonymously for rapid demo if social fails, 
      // but try Google first as standard practice.
      let credential;
      try {
        const provider = new GoogleAuthProvider();
        credential = await signInWithPopup(auth, provider);
      } catch (e) {
        console.warn("Popup blocked or failed, using guest access for demo.");
        credential = await signInAnonymously(auth);
      }

      const user = credential.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || (role === 'driver' ? 'Motorista Parceiro' : role === 'admin' ? 'Gestor Luziânia' : 'Cidadão'),
          email: user.email || 'guest@luziania.gov.br',
          role: role,
          points: 0,
          badges: [],
          createdAt: new Date().toISOString()
        });
      }
      
      const target = role === 'admin' ? '/admin' : '/dashboard';
      window.location.href = target;
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Entrar no Coleta Luziânia</h1>
      <p className="text-gray-500 mb-8 max-w-xs">{role === 'driver' ? 'Área restrita para motoristas parceiros.' : 'Faça login para começar a denunciar.'}</p>
      
      <button 
        onClick={handleLogin}
        disabled={loading}
        className="w-full max-w-xs py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>Acessar agora</>
        )}
      </button>
      
      <button onClick={() => window.history.back()} className="mt-6 text-gray-400 text-sm font-medium">Voltar</button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute role="admin">
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/report" 
          element={
            <ProtectedRoute>
              <Report />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
