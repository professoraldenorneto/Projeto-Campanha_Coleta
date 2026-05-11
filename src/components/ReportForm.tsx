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
  const [address, setAddress] = useState({
    street: '',
    number: '',
    neighborhood: '',
    complement: ''
  });
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

    if (!address.street || !address.neighborhood) {
      setError("Rua e Bairro são obrigatórios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'reports'), {
        imageUrl: image, 
        address,
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

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                <MapPin size={14} /> Rua / Avenida *
              </label>
              <input
                type="text"
                required
                value={address.street}
                onChange={(e) => setAddress({...address, street: e.target.value})}
                placeholder="Nome da rua ou avenida"
                className="w-full p-3 bg-emerald-50 rounded-xl border border-emerald-100 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-900">Número</label>
              <input
                type="text"
                value={address.number}
                onChange={(e) => setAddress({...address, number: e.target.value})}
                placeholder="Ex: 123"
                className="w-full p-3 bg-emerald-50 rounded-xl border border-emerald-100 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-900">Bairro *</label>
              <input
                type="text"
                required
                value={address.neighborhood}
                onChange={(e) => setAddress({...address, neighborhood: e.target.value})}
                placeholder="Nome do bairro"
                className="w-full p-3 bg-emerald-50 rounded-xl border border-emerald-100 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-emerald-900">Complemento</label>
              <input
                type="text"
                value={address.complement}
                onChange={(e) => setAddress({...address, complement: e.target.value})}
                placeholder="Ponto de referência, apto, etc."
                className="w-full p-3 bg-emerald-50 rounded-xl border border-emerald-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <Upload size={14} /> Descrição Adicional
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: entulho, móveis velhos, lixo doméstico..."
              className="w-full p-3 bg-emerald-50 rounded-xl border border-emerald-100 outline-none focus:border-emerald-500 h-24 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : "Confirmar Denúncia"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
