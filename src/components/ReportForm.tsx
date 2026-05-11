import React, { useState, useRef } from 'react';
import { Camera, X, Upload, MapPin, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ReportFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportForm({ onClose, onSuccess }: ReportFormProps) {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError("Por favor, tire uma foto ou selecione uma imagem.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // In a real app, you'd upload the image to Firebase Storage first.
      // Here we store the b64 string for demo purposes, but normally it's a URL.
      await addDoc(collection(db, 'reports'), {
        imageUrl: image, 
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        description,
        status: 'pending',
        userId: auth.currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp(),
      });

      onSuccess();
    } catch (err: any) {
      console.error("Error submitting report:", err);
      setError("Erro ao enviar denúncia. Verifique o console ou sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-emerald-50 flex justify-between items-center bg-emerald-600 text-white">
          <h2 className="text-xl font-display">Nova Denúncia</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div 
            className="relative w-full aspect-video bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-100 transition-colors group overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? (
              <>
                <img src={image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold">
                  <Camera size={24} /> Trocar Foto
                </div>
              </>
            ) : (
              <div className="text-emerald-400 flex flex-col items-center gap-2">
                <Camera size={48} />
                <p className="font-medium">Tirar foto do local</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              className="hidden" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <Upload size={14} /> Descrição (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que foi descartado ou detalhes do local..."
              className="w-full p-4 bg-emerald-50 rounded-xl border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all h-32 resize-none text-emerald-900"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-3 rounded-lg">
            <MapPin size={14} />
            <span>Sua localização será capturada automaticamente ao enviar.</span>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Enviando...
              </>
            ) : (
              "Confirmar Denúncia"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
