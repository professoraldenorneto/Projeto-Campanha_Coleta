import React from 'react';
import { motion } from 'motion/react';
import { Trash2, ShieldCheck, UserPlus, LogIn, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  const options = [
    {
      id: 'login',
      title: 'Já possuo conta',
      description: 'Acesse sua conta para fazer novas denúncias ou acompanhar status.',
      icon: LogIn,
      action: () => navigate('/login'),
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      id: 'driver',
      title: 'Motorista Parceiro',
      description: 'Área exclusiva para motoristas cadastrados na rede de coleta.',
      icon: Truck,
      action: () => navigate('/login?role=driver'),
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      id: 'register',
      title: 'Novo Usuário',
      description: 'Cadastre-se para ajudar a manter Luziânia limpa.',
      icon: UserPlus,
      action: () => navigate('/register'),
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      id: 'admin',
      title: 'Administrador',
      description: 'Painel de gestão, estatísticas e atribuição de tarefas.',
      icon: ShieldCheck,
      action: () => navigate('/login?role=admin'),
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05)_0%,transparent_50%)]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-xl shadow-blue-500/10 mb-6 border border-blue-50/50">
          <Trash2 className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Coleta Luziânia</h1>
        <p className="text-gray-500 max-w-xs mx-auto">Sua ferramenta oficial para denunciar e gerenciar resíduos em nossa cidade.</p>
      </motion.div>

      <div className="w-full max-w-md space-y-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={option.action}
            id={option.id}
            className="w-full flex items-center p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group text-left"
          >
            <div className={`w-12 h-12 rounded-xl ${option.color} bg-opacity-10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
              <option.icon className={`w-6 h-6 ${option.textColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{option.title}</h3>
              <p className="text-xs text-gray-500">{option.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-xs text-gray-400 font-medium uppercase tracking-widest"
      >
        Prefeitura de Luziânia • 2026
      </motion.p>
    </div>
  );
}
