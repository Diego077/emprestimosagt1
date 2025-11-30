import React, { useState } from 'react';
import { Card, Modal, Button } from '../components/UI';
import { TrendingUp, Calendar, DollarSign, PieChart, Info, BarChart3, TrendingDown } from 'lucide-react';
import { Client, Loan, LoanStatus, CalculatedLoan, Expense } from '../types';
import { calculateLoanDetails, formatCurrency, formatDate } from '../utils';
import { startOfMonth, subDays, parseISO, format, startOfDay, isSameDay, isSameWeek, isSameMonth, isSameYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfitsProps {
  clients: Client[];
  loans: Loan[];
  expenses: Expense[];
}

export const Profits: React.FC<ProfitsProps> = ({ clients, loans, expenses }) => {
  const [selectedLoan, setSelectedLoan] = useState<CalculatedLoan | null>(null);

  const calculatedLoans = loans.map(l => calculateLoanDetails(l, clients));
  const paidLoans = calculatedLoans.filter(l => l.status === LoanStatus.PAID && l.paidAt);
  const activeLoans = calculatedLoans.filter(l => l.status === LoanStatus.ACTIVE);

  // --- KPI Calculations (Realized) ---
  const grossProfit = paidLoans.reduce((acc, curr) => acc + curr.profit, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  
  const currentMonthStart = startOfMonth(new Date());
  const monthProfit = paidLoans
    .filter(l => l.paidAt && parseISO(l.paidAt) >= currentMonthStart)
    .reduce((acc, curr) => acc + curr.profit, 0);

  const thirtyDaysAgo = subDays(new Date(), 30);
  const last30DaysProfit = paidLoans
    .filter(l => l.paidAt && parseISO(l.paidAt) >= thirtyDaysAgo)
    .reduce((acc, curr) => acc + curr.profit, 0);

  // --- Forecast Calculations (Projected Interest) ---
  const now = startOfDay(new Date());
  
  const getInterestForecast = (filterFn: (date: Date) => boolean) => {
    return activeLoans
      .filter(l => filterFn(parseISO(l.dueDate)))
      .reduce((acc, curr) => acc + curr.initialInterest, 0); // Only interest, no penalties
  };

  const forecastInterestDay = getInterestForecast((d) => isSameDay(d, now));
  const forecastInterestWeek = getInterestForecast((d) => isSameWeek(d, now, { weekStartsOn: 1 })); // Monday start
  const forecastInterestMonth = getInterestForecast((d) => isSameMonth(d, now));
  const forecastInterestYear = getInterestForecast((d) => isSameYear(d, now));

  // --- Chart Data Preparation ---
  const getMonthlyData = () => {
    const data: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = format(d, 'MMM/yy', { locale: ptBR });
        data[key] = 0;
    }

    paidLoans.forEach(loan => {
      if (loan.paidAt) {
        const key = format(parseISO(loan.paidAt), 'MMM/yy', { locale: ptBR });
        if (data[key] !== undefined) {
          data[key] += loan.profit;
        }
      }
    });
    return Object.entries(data);
  };
  const chartData = getMonthlyData();
  const maxChartValue = Math.max(...chartData.map(([_, val]) => val), 1);

  const profitByClient = clients.map(client => {
    const clientProfit = paidLoans
      .filter(l => l.clientId === client.id)
      .reduce((acc, curr) => acc + curr.profit, 0);
    return { ...client, totalProfit: clientProfit };
  }).filter(c => c.totalProfit > 0).sort((a, b) => b.totalProfit - a.totalProfit);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black border-l-4 border-brand-yellow pl-3">Lucros Gerais</h2>

      {/* Forecast Section - New */}
      <Card className="border-brand-yellow/50 bg-yellow-50/30">
        <h3 className="font-bold text-black mb-6 flex items-center gap-2">
          <BarChart3 size={20} className="text-brand-yellow" />
          Previsão de Ganhos (Juros a Receber)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
          <div className="p-2 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Hoje</p>
            <p className="text-2xl font-black text-black">{formatCurrency(forecastInterestDay)}</p>
          </div>
          <div className="p-2 text-center">
             <p className="text-xs font-bold text-gray-400 uppercase mb-1">Esta Semana</p>
             <p className="text-2xl font-black text-black">{formatCurrency(forecastInterestWeek)}</p>
          </div>
          <div className="p-2 text-center">
             <p className="text-xs font-bold text-gray-400 uppercase mb-1">Este Mês</p>
             <p className="text-2xl font-black text-black">{formatCurrency(forecastInterestMonth)}</p>
          </div>
          <div className="p-2 text-center">
             <p className="text-xs font-bold text-gray-400 uppercase mb-1">Este Ano</p>
             <p className="text-2xl font-black text-black">{formatCurrency(forecastInterestYear)}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center italic">* Baseado nos juros de empréstimos ativos (não inclui multas).</p>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-brand-black border-brand-yellow/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-yellow rounded-lg">
              <TrendingUp size={24} className="text-black" />
            </div>
            <p className="text-brand-yellow font-medium uppercase tracking-wider text-xs">Lucro Líquido</p>
          </div>
          <h3 className="text-3xl font-black text-white">{formatCurrency(netProfit)}</h3>
          <p className="text-sm text-gray-400 mt-1">Bruto ({formatCurrency(grossProfit)}) - Despesas ({formatCurrency(totalExpenses)})</p>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown size={24} className="text-red-600" />
            </div>
            <p className="text-red-600 font-medium uppercase tracking-wider text-xs">Total Despesas</p>
          </div>
          <h3 className="text-2xl font-black text-black">{formatCurrency(totalExpenses)}</h3>
          <p className="text-sm text-red-500 mt-1">Custos operacionais</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar size={24} className="text-black" />
            </div>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Este Mês (Bruto)</p>
          </div>
          <h3 className="text-2xl font-black text-black">{formatCurrency(monthProfit)}</h3>
          <p className="text-sm text-green-600 mt-1 font-medium">
             Já recebido
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign size={24} className="text-black" />
            </div>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Últimos 30 Dias (Bruto)</p>
          </div>
          <h3 className="text-2xl font-black text-black">{formatCurrency(last30DaysProfit)}</h3>
          <p className="text-sm text-gray-400 mt-1">Janela móvel de 30 dias</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <h3 className="font-bold text-black mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-brand-yellow" />
            Evolução Mensal do Lucro (Bruto Realizado)
          </h3>
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {chartData.map(([month, value]) => {
              const heightPercentage = (value / maxChartValue) * 100;
              return (
                <div key={month} className="flex flex-col items-center flex-1 group relative">
                   <div 
                      className="w-full max-w-[40px] bg-brand-black rounded-t-sm hover:bg-brand-yellow transition-all duration-300 relative"
                      style={{ height: `${Math.max(heightPercentage, 2)}%` }}
                   >
                     {/* Tooltip */}
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-brand-yellow font-bold text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none border border-brand-yellow">
                       {formatCurrency(value)}
                     </div>
                   </div>
                   <span className="text-xs text-gray-500 mt-2 font-bold uppercase">{month}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Profit by Client */}
        <Card className="overflow-hidden flex flex-col">
          <h3 className="font-bold text-black mb-4">Lucro por Cliente (Bruto)</h3>
          <div className="overflow-y-auto flex-1 pr-2 max-h-[300px] space-y-3 custom-scrollbar">
            {profitByClient.map(client => (
              <div key={client.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 hover:bg-yellow-50 transition-colors">
                <span className="font-bold text-gray-800 truncate mr-2">{client.name}</span>
                <span className="font-black text-black">{formatCurrency(client.totalProfit)}</span>
              </div>
            ))}
            {profitByClient.length === 0 && (
              <p className="text-gray-400 text-center text-sm py-4 italic">Sem lucros registrados.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Transaction List with Details */}
      <Card>
        <h3 className="font-bold text-black mb-4">Últimos Empréstimos Pagos (Detalhes)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-black text-brand-yellow">
              <tr>
                <th className="px-4 py-3 font-bold">Cliente</th>
                <th className="px-4 py-3 font-bold">Data Pagamento</th>
                <th className="px-4 py-3 font-bold">Valor Empr.</th>
                <th className="px-4 py-3 font-bold">Valor Pago</th>
                <th className="px-4 py-3 font-bold text-right">Lucro</th>
                <th className="px-4 py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paidLoans
                // Fix sorting to use string comparison for consistent result
                .sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || ''))
                .slice(0, 10)
                .map(loan => (
                <tr key={loan.id} className="hover:bg-yellow-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-black">{loan.clientName}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(loan.paidAt || '')}</td>
                  <td className="px-4 py-3 text-gray-500">{formatCurrency(loan.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatCurrency(loan.finalTotal)}</td>
                  <td className="px-4 py-3 font-black text-black text-right">{formatCurrency(loan.profit)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedLoan(loan)} icon={<Info size={16}/>}>
                      Detalhes
                    </Button>
                  </td>
                </tr>
              ))}
              {paidLoans.length === 0 && (
                 <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400 italic">Nenhum empréstimo pago ainda.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Details Modal */}
      <Modal 
        isOpen={!!selectedLoan} 
        onClose={() => setSelectedLoan(null)}
        title="Detalhes do Lucro"
      >
        {selectedLoan && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
               <div className="flex justify-between mb-2">
                 <span className="text-gray-500 font-medium">Cliente:</span>
                 <span className="font-bold text-black">{selectedLoan.clientName}</span>
               </div>
               <div className="flex justify-between mb-2">
                 <span className="text-gray-500 font-medium">Data Pagamento:</span>
                 <span className="font-bold text-black">{formatDate(selectedLoan.paidAt || '')}</span>
               </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-4">
               <div className="flex justify-between items-center text-gray-600">
                 <span>Valor Emprestado (Principal)</span>
                 <span>{formatCurrency(selectedLoan.amount)}</span>
               </div>
               <div className="flex justify-between items-center text-gray-600">
                 <span>Juros Calculados ({selectedLoan.interestRate}%)</span>
                 <span className="text-green-600 font-bold">+{formatCurrency(selectedLoan.initialInterest)}</span>
               </div>
               {selectedLoan.penaltyAmount > 0 && (
                 <div className="flex justify-between items-center text-red-500 font-bold">
                   <span>Multas por Atraso</span>
                   <span>+{formatCurrency(selectedLoan.penaltyAmount)}</span>
                 </div>
               )}
               <div className="border-t border-gray-200 my-2"></div>
               <div className="flex justify-between items-center font-black text-lg text-black">
                 <span>Valor Total Pago</span>
                 <span>{formatCurrency(selectedLoan.finalTotal)}</span>
               </div>
            </div>

            <div className="bg-brand-yellow/20 p-4 rounded-lg border border-brand-yellow mt-4 text-center">
               <p className="text-sm text-black font-bold mb-1 uppercase">Lucro Final deste Empréstimo</p>
               <p className="text-3xl font-black text-black">{formatCurrency(selectedLoan.profit)}</p>
               <p className="text-xs text-gray-600 mt-1">Juros + Multas</p>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={() => setSelectedLoan(null)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};