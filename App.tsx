import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, CreditCard, Menu, Wallet, TrendingUp, LogOut, TrendingDown } from 'lucide-react';
import { Dashboard } from './views/Dashboard';
import { Clients } from './views/Clients';
import { Loans } from './views/Loans';
import { Profits } from './views/Profits';
import { Expenses } from './views/Expenses';
import { Login } from './views/Login';
import { Client, Loan, LoanStatus, Expense } from './types';
import { generateId } from './utils';

// Local Storage Hooks for DATA persistence (Clients/Loans)
const useStickyState = <T,>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

const App: React.FC = () => {
  // --- Authentication State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'loans' | 'profits' | 'expenses'>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // --- Data Store ---
  const [clients, setClients] = useStickyState<Client[]>([], 'app-clients');
  const [loans, setLoans] = useStickyState<Loan[]>([], 'app-loans');
  const [expenses, setExpenses] = useStickyState<Expense[]>([], 'app-expenses');

  // 1. Check Session on Mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('agt_user');
    if (storedUser) {
      setCurrentUser(storedUser);
      setIsAuthenticated(true);
    }
    setIsAuthChecking(false);
  }, []);

  // 2. Handle Login
  const handleLogin = (username: string) => {
    sessionStorage.setItem('agt_user', username);
    setCurrentUser(username);
    setIsAuthenticated(true);
    setActiveTab('dashboard'); // Always reset to dashboard on login
  };

  // 3. Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem('agt_user');
    setIsAuthenticated(false);
    setCurrentUser('');
    setSidebarOpen(false);
  };

  // --- Data Handlers ---
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...clientData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setClients(prev => [newClient, ...prev]);
  };

  const updateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };
  
  const deleteClient = (id: string) => {
    // In a real app, check for active loans before deleting
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
  };

  const addLoan = (loanData: Omit<Loan, 'id' | 'createdAt' | 'status'> & { status?: LoanStatus, paidAt?: string }) => {
    const newLoan: Loan = {
      ...loanData,
      id: generateId(),
      status: loanData.status || LoanStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      paidAt: loanData.paidAt
    };
    setLoans(prev => [newLoan, ...prev]);
  };

  const updateLoan = (updatedLoan: Loan) => {
    setLoans(prev => prev.map(l => l.id === updatedLoan.id ? updatedLoan : l));
  };

  const updateLoanStatus = (id: string, status: LoanStatus) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === id) {
        return { 
          ...loan, 
          status,
          paidAt: status === LoanStatus.PAID ? new Date().toISOString() : undefined
        };
      }
      return loan;
    }));
  };

  // Expense Handlers
  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const NavItem = ({ id, icon, label }: { id: typeof activeTab, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        activeTab === id 
          ? 'bg-brand-yellow text-black font-bold shadow-md' 
          : 'text-gray-400 hover:bg-white/10 hover:text-brand-yellow'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  // Prevent flash of login screen while checking session
  if (isAuthChecking) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-brand-yellow">Carregando...</div>;
  }

  // --- Auth Guard ---
  // If not authenticated, ONLY render Login component
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // --- Main App Layout ---
  return (
    <div className="min-h-screen bg-white flex font-sans text-black">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Black Background */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-brand-black text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static border-r border-gray-800
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 border-b border-gray-800 flex items-center gap-4">
            {/* Logo JM */}
            <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center shrink-0">
              <span className="text-black font-black text-lg">AGT</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Empréstimos AGT</h1>
              <p className="text-xs text-brand-yellow tracking-wider uppercase mt-0.5">Olá, {currentUser}</p>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 mt-4">
            <NavItem id="dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <NavItem id="clients" icon={<Users size={20} />} label="Clientes" />
            <NavItem id="loans" icon={<CreditCard size={20} />} label="Empréstimos" />
            <NavItem id="profits" icon={<TrendingUp size={20} />} label="Lucros" />
            <NavItem id="expenses" icon={<TrendingDown size={20} />} label="Despesas" />
          </nav>

          <div className="p-4 border-t border-gray-800 space-y-4">
             <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Sair</span>
            </button>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse"></span>
                <span className="text-sm font-medium text-gray-300">Sistema Online</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
        {/* Mobile Header */}
        <div className="bg-brand-black shadow-md border-b border-gray-800 p-4 flex items-center justify-between lg:hidden sticky top-0 z-10 text-white">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-brand-yellow hover:text-white">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-xs">AGT</span>
               </div>
               <span className="font-bold text-lg">Empréstimos AGT</span>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard clients={clients} loans={loans} expenses={expenses} />}
          {activeTab === 'clients' && (
            <Clients 
              clients={clients} 
              loans={loans} // Passed for history
              onAddClient={addClient} 
              onUpdateClient={updateClient}
              onDeleteClient={deleteClient}
            />
          )}
          {activeTab === 'loans' && (
            <Loans 
              loans={loans} 
              clients={clients} 
              onAddLoan={addLoan} 
              onUpdateLoan={updateLoan}
              onUpdateClient={updateClient}
              onUpdateStatus={updateLoanStatus} 
            />
          )}
          {activeTab === 'profits' && <Profits clients={clients} loans={loans} expenses={expenses} />}
          {activeTab === 'expenses' && (
            <Expenses 
              expenses={expenses} 
              onAddExpense={addExpense} 
              onUpdateExpense={updateExpense} 
              onDeleteExpense={deleteExpense} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;