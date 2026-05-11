import { motion } from 'motion/react';
import { Trash2, Truck, UserPlus, LogIn, MapPin } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectRole: (role: 'login' | 'driver' | 'signup') => void;
}

export default function WelcomeScreen({ onSelectRole }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 text-white rounded-3xl shadow-xl mb-4">
            <Trash2 size={40} />
          </div>
          <h1 className="text-4xl font-display text-emerald-900">
            Coleta Luziânia
          </h1>
          <p className="text-emerald-700 font-medium">
            Juntos por uma cidade mais limpa e sustentável.
          </p>
        </div>

        <div className="grid gap-4 mt-12">
          <button
            onClick={() => onSelectRole('login')}
            className="flex items-center justify-between w-full p-5 bg-white rounded-2xl shadow-sm border border-emerald-100 hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <LogIn size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-emerald-900">Já tenho conta</p>
                <p className="text-sm text-emerald-600">Acessar denúncias e perfil</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectRole('driver')}
            className="flex items-center justify-between w-full p-5 bg-white rounded-2xl shadow-sm border border-emerald-100 hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Truck size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-emerald-900">Motorista Parceiro</p>
                <p className="text-sm text-emerald-600">Coletar e atualizar status</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectRole('signup')}
            className="flex items-center justify-between w-full p-5 bg-white rounded-2xl shadow-sm border border-emerald-100 hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <UserPlus size={24} />
              </div>
              <div className="text-left">
                <p className="font-bold text-emerald-900">Novo Usuário</p>
                <p className="text-sm text-emerald-600">Criar cadastro para denunciar</p>
              </div>
            </div>
          </button>
        </div>

        <div className="pt-8 flex items-center justify-center gap-2 text-emerald-600/60 text-sm">
          <MapPin size={14} />
          <span>Luziânia, Goiás</span>
        </div>
      </motion.div>
    </div>
  );
}
