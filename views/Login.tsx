import React, { useState } from 'react';
import { Card, Button } from '../components/UI';
import { Lock, User, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Normalize input (lowercase, remove spaces) to avoid simple typos
    const normalizedUser = username.trim().toLowerCase();
    const normalizedPass = password.trim();

    // 2. Define valid credentials
    const credentials: Record<string, string> = {
      'diego': 'padrinho2148',
      'arthur': 'padrinho2197',
      'andre': 'padrinho3547'
    };

    // 3. Validation Logic
    // Check if user exists AND if password matches exactly
    if (credentials[normalizedUser] && credentials[normalizedUser] === normalizedPass) {
      // Success: Call parent handler with the capitalized name for display
      const displayName = normalizedUser.charAt(0).toUpperCase() + normalizedUser.slice(1);
      onLogin(displayName);
    } else {
      // Failure
      setError('Usuário ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-400/20">
            <span className="text-black font-black text-2xl">AGT</span>
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight">Empréstimos AGT</h1>
          <p className="text-gray-500 mt-2 font-medium">Sistema de Controle Financeiro</p>
        </div>

        <Card className="border-brand-yellow shadow-xl bg-white">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Usuário</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Digite seu usuário"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow transition-all"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(''); // Clear error on typing
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    placeholder="Digite sua senha"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow transition-all"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(''); // Clear error on typing
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-3 text-lg shadow-lg shadow-yellow-400/20" 
              size="lg"
            >
              Entrar no Sistema
            </Button>
          </form>
        </Card>
        
        <p className="text-center text-xs text-gray-400 mt-8">
          © {new Date().getFullYear()} Empréstimos AGT. Acesso Restrito.
        </p>
      </div>
    </div>
  );
};