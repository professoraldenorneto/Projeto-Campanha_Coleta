import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, X, ArrowLeft, Upload, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import Map from '../components/MapComponent';
import { addDoc, collection, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export default function ReportForm() {
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const handleCapture = () => {
    const canvas = document.createElement('canvas');
    if (videoRef.current) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setPhoto(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const handleSubmit = async () => {
    if (!photo || !location || !auth.currentUser) return;

    setLoading(true);
    try {
      let photoUrl = '';
      
      // If we have a real storage bucket
      try {
        const storageRef = ref(storage, `reports/${Date.now()}.jpg`);
        await uploadString(storageRef, photo, 'data_url');
        photoUrl = await getDownloadURL(storageRef);
      } catch (e) {
        console.warn("Storage upload failed (likely due to config), using data URL for local demo.");
        photoUrl = photo; // Fallback for demo
      }

      const reportData = {
        lat: location.lat,
        lng: location.lng,
        photoUrl,
        description,
        status: 'pending',
        createdAt: serverTimestamp(),
        reporterId: auth.currentUser.uid
      };

      await addDoc(collection(db, 'reports'), reportData);
      
      // Award 10 points for submission
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { 
        points: increment(10) 
      });

      navigate('/dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="px-6 py-4 flex items-center gap-4 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Nova Denúncia</h1>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
              <motion.div 
                animate={{ width: step >= s ? '100%' : '0%' }}
                className="h-full bg-blue-600"
              />
            </div>
          ))}
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">1. Foto do local</h2>
            <p className="text-sm text-gray-500">Tire uma foto clara do descarte irregular para ajudar na identificação.</p>
            
            <div className="aspect-square rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden flex flex-col items-center justify-center relative">
              {photo ? (
                <>
                  <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setPhoto(null)}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="text-center p-8 space-y-4">
                   <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                    <Camera className="w-8 h-8" />
                  </div>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="hidden"
                  />
                  <button 
                    onClick={() => { startCamera(); }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
                    id="open-camera"
                  >
                    Abrir Câmera
                  </button>
                </div>
              )}
            </div>
            
            {photo && (
              <button 
                onClick={() => setStep(2)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-transform"
              >
                Próximo Passo
              </button>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 h-full flex flex-col">
            <h2 className="text-lg font-bold text-gray-900">2. Marque no mapa</h2>
            <p className="text-sm text-gray-500">Toque no mapa para marcar o local exato do descarte.</p>
            
            <div className="flex-1 min-h-[300px]">
              <Map onLocationSelect={(lat, lng) => setLocation({ lat, lng })} />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold"
              >
                Voltar
              </button>
              <button 
                disabled={!location}
                onClick={() => setStep(3)}
                className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-bold disabled:opacity-50"
              >
                Próximo Passo
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">3. Detalhes finais</h2>
            <p className="text-sm text-gray-500">Adicione uma descrição opcional sobre o que foi descartado.</p>
            
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Entulho de construção, móveis velhos, lixo orgânico..."
              className="w-full h-32 p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            />

            <div className="flex gap-4 pt-10">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold"
              >
                Voltar
              </button>
              <button 
                disabled={loading}
                onClick={handleSubmit}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                Enviar Denúncia
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
