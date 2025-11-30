import React from 'react';
import { X } from 'lucide-react';

// --- Card ---
// Fundo branco, Bordas amarelas
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-brand-yellow/60 p-6 ${className}`}>
    {children}
  </div>
);

// --- Button ---
// Botões: Fundo amarelo, Texto preto, Bordas arredondadas
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";
  
  const variants = {
    primary: "bg-brand-yellow text-black hover:bg-yellow-400 focus:ring-brand-yellow shadow-sm hover:shadow-md",
    secondary: "bg-white text-black border-2 border-brand-yellow hover:bg-yellow-50 focus:ring-brand-yellow",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    ghost: "text-black hover:bg-yellow-50 focus:ring-brand-yellow",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {icon && <span className="mr-2 -ml-1 h-4 w-4">{icon}</span>}
      {children}
    </button>
  );
};

// --- Input ---
// Focus ring Yellow
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-bold text-black mb-1">
      {label}
    </label>
    <input
      className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow transition-colors ${error ? 'border-red-500' : 'border-gray-300'}`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
  </div>
);

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-bold text-black mb-1">
      {label}
    </label>
    <select
      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow bg-white"
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// --- Modal ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-brand-yellow">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-brand-yellow/10">
          <h3 className="text-lg font-bold text-black">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Badge ---
export const StatusBadge: React.FC<{ status: 'active' | 'paid' | 'overdue' }> = ({ status }) => {
  const styles = {
    active: "bg-gray-100 text-gray-800 border-gray-200", // Neutral for active
    paid: "bg-brand-yellow text-black border-yellow-500 font-bold", // Brand style for paid
    overdue: "bg-black text-brand-yellow border-black", // High contrast for overdue (Black bg, yellow text)
  };

  const labels = {
    active: "Em Aberto",
    paid: "Pago",
    overdue: "Atrasado",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};