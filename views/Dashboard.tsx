import React from 'react';
import { Card } from '../components/UI';
import { DollarSign, AlertCircle, Calendar, TrendingUp, Wallet, BarChart3, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { Client, Loan, LoanStatus, Expense } from '../types';
import { calculateLoanDetails, formatCurrency } from '../utils';
import { isSameDay, isSameWeek, isSameMonth, isSameYear, parseISO, startOfDay } from 'date-fns';

interface DashboardProps {
  clients: Client[];
  loans: Loan[];
  expenses: Expense[];
}

export const Dashboard: React.FC<DashboardProps> = ({ clients, loans, expenses }) => {
  const calculatedLoans = loans.map(l => calculateLoanDetails(l, clients));
  
  const activeLoans = calculatedLoans.filter(l => l.status === LoanStatus.ACTIVE);
  const totalLentActive = activeLoans.reduce((acc, curr) => acc + curr.amount, 0);
  const totalReceivable = activeLoans.reduce((acc, curr) => acc + curr.finalTotal, 0);
  const overdueLoans = calculatedLoans.filter(l => l.isOverdue && l.status === LoanStatus.ACTIVE);
  const totalOverdue = overdueLoans.reduce((acc, curr) => acc + curr.finalTotal, 0);
  const paidLoans = calculatedLoans.filter(l => l.status === LoanStatus.PAID);
  
  // Financial Calculations including Expenses
  const grossRealizedProfit = paidLoans.reduce((acc, curr) => acc + curr.profit, 0);
  const grossProjectedProfit = activeLoans.reduce((acc, curr) => acc + curr.profit, 0);
  
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  const netRealizedProfit = grossRealizedProfit - totalExpenses;
  const netProjectedProfit = grossProjectedProfit - totalExpenses; 

  // New Penalty Metrics
  const totalPenaltiesCollected = paidLoans.reduce((acc, curr) => acc + curr.penaltyAmount, 0);
  const totalPenaltiesPending = overdueLoans.reduce((acc, curr) => acc + curr.penaltyAmount, 0);

  // Forecast Calculations
  const now = startOfDay(new Date());
  
  const getForecast = (filterFn: (date: Date) => boolean) => {
    return activeLoans
      .filter(l => filterFn(parseISO(l.dueDate)))
      .reduce((acc, curr) => acc + curr.finalTotal, 0);
  };

  const forecastDay = getForecast((d) => isSameDay(d, now));
  const forecastWeek = getForecast((d) => isSameWeek(d, now, { weekStartsOn: 1 }));
  const forecastMonth = getForecast((d) => isSameMonth(d, now));
  const forecastYear = getForecast((d) => isSameYear(d, now));

  // Cards: Fundo branco, Bordas amarelas, Ícones pretos
  const stats = [
    {
      title: "Total Emprestado",
      value: formatCurrency(totalLentActive),
      subtext: "Empréstimos ativos",
      icon: <Wallet className="text-black" size={24} />,
      bg: "bg-brand-yellow",
    },
    {
      title: "Total a Receber",
      value: formatCurrency(totalReceivable),
      subtext: "Capital + Juros",
      icon: <DollarSign className="text-black" size={24} />,
      bg: "bg-brand-yellow",
    },
    {
      title: "Total Vencido",
      value: formatCurrency(totalOverdue),
      subtext: `${overdueLoans.length} pagamentos atrasados`,
      icon: <AlertCircle className="text-white" size={24} />, 
      bg: "bg-red-600", 
      textClass: "text-red-600",
    },
    {
      title: "Lucro Líquido",
      value: formatCurrency(netRealizedProfit),
      subtext: "Recebido - Despesas",
      icon: <TrendingUp className="text-black" size={24} />,
      bg: "bg-brand-yellow",
    },
    // New Penalty Cards
    {
      title: "Multas Recebidas",
      value: formatCurrency(totalPenaltiesCollected),
      subtext: "Já pagas",
      icon: <CheckCircle className="text-green-600" size={24} />,
      bg: "bg-green-100",
      textClass: "text-green-700",
    },
    {
      title: "Multas Pendentes",
      value: formatCurrency(totalPenaltiesPending),
      subtext: "Aguardando pagamento",
      icon: <Clock className="text-orange-600" size={24} />,
      bg: "bg-orange-100",
      textClass: "text-orange-700",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black border-l-4 border-brand-yellow pl-3">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="flex flex-col justify-between transition-transform hover:-translate-y-1">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-3 rounded-lg ${stat.bg} shadow-sm`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wide">{stat.title}</p>
              <h3 className={`text-xl font-black ${stat.textClass || 'text-black'}`}>{stat.value}</h3>
              <p className="text-xs text-gray-400 mt-1 font-medium">{stat.subtext}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Forecast Section */}
      <Card className="border-brand-yellow">
        <h3 className="font-bold text-black mb-6 flex items-center gap-2">
          <BarChart3 size={20} className="text-brand-yellow" />
          Previsão de Faturamento (Recebimentos)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="p-2 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Hoje</p>
            <p className="text-2xl font-black text-black">{formatCurrency(forecastDay)}</p>
          </div>
          <div className="p-2 text-center">
             <p className="text-xs font-bold text-gray-400 uppercase mb-1">Esta Semana</p>
             <p className="text-2xl font-black text-black">{formatCurrency(forecastWeek)}</p>
          </div>
          <div className="p-2 text-center">
             <p className="text-xs font-bold text-gray-400 uppercase mb-1">Este Mês</p>
             <p className="text-2xl font-black text-black">{formatCurrency(forecastMonth)}</p>
          </div>
          <div className="p-2 text-center">
             <p className="text-xs font-bold text-gray-400 uppercase mb-1">Este Ano</p>
             <p className="text-2xl font-black text-black">{formatCurrency(forecastYear)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-black mb-4 flex items-center gap-2">
            <Calendar className="text-brand-yellow" size={20} />
            Próximos Vencimentos
          </h3>
          <div className="space-y-3">
             {calculatedLoans
                .filter(l => l.status === LoanStatus.ACTIVE && !l.isOverdue)
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .slice(0, 5)
                .map(loan => (
                  <div key={loan.id} className="flex justify-between items-center p-3 hover:bg-yellow-50 rounded-lg border border-gray-100 transition-colors">
                    <div>
                      <p className="font-bold text-black">{loan.clientName}</p>
                      <p className="text-xs text-gray-500">Vence em {loan.dueDate.split('-').reverse().join('/')}</p>
                    </div>
                    <span className="font-bold text-black bg-yellow-100 px-2 py-1 rounded text-sm">{formatCurrency(loan.finalTotal)}</span>
                  </div>
                ))}
              {calculatedLoans.filter(l => l.status === LoanStatus.ACTIVE && !l.isOverdue).length === 0 && (
                <p className="text-center text-gray-400 py-4 italic">Nenhum vencimento próximo.</p>
              )}
          </div>
        </Card>
        
        <Card>
           <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
             <AlertCircle size={20} />
             Em Atraso
           </h3>
           <div className="space-y-3">
             {calculatedLoans
                .filter(l => l.isOverdue && l.status !== LoanStatus.PAID)
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .slice(0, 5)
                .map(loan => (
                  <div key={loan.id} className="flex justify-between items-center p-3 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors">
                    <div>
                      <p className="font-bold text-black">{loan.clientName}</p>
                      <p className="text-xs text-red-600 font-bold">{loan.daysOverdue} dias de atraso</p>
                    </div>
                    <div className="text-right">
                       <span className="block font-black text-red-700">{formatCurrency(loan.finalTotal)}</span>
                       <span className="text-xs text-gray-500">Multa: {formatCurrency(loan.penaltyAmount)}</span>
                    </div>
                  </div>
                ))}
              {calculatedLoans.filter(l => l.isOverdue && l.status !== LoanStatus.PAID).length === 0 && (
                <p className="text-center text-gray-400 py-4 italic">Nenhum pagamento em atraso.</p>
              )}
           </div>
        </Card>
      </div>
    </div>
  );
};