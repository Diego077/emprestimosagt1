import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Modal, StatusBadge } from '../components/UI';
import { Plus, Download, Search, CheckCircle, AlertTriangle, Pencil, CalendarCheck, Calculator, Clock } from 'lucide-react';
import { Client, Loan, LoanStatus, PenaltyType, InterestType } from '../types';
import { calculateLoanDetails, formatCurrency, formatDate, generateId } from '../utils';
import { addMonths, parseISO, format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LoansProps {
  loans: Loan[];
  clients: Client[];
  onAddLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'status'> & { status?: LoanStatus, paidAt?: string }) => void;
  onUpdateLoan: (loan: Loan) => void;
  onUpdateClient: (client: Client) => void;
  onUpdateStatus: (id: string, status: LoanStatus) => void;
}

export const Loans: React.FC<LoansProps> = ({ loans, clients, onAddLoan, onUpdateLoan, onUpdateClient, onUpdateStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  // Unified Form Data
  const [formData, setFormData] = useState({
    // Loan Fields
    clientId: '',
    amount: '',
    interestRate: '10',
    interestType: InterestType.PERCENTAGE, 
    installments: '1', 
    dueDate: '',
    penaltyRate: '1',
    penaltyType: PenaltyType.DAILY_PERCENTAGE, // Default to New Daily System
    isPaid: false,
    paidAt: '',
    
    // Client Edit Fields
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    clientProfession: '',
    clientCollateral: ''
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      clientId: '',
      amount: '',
      interestRate: '10',
      interestType: InterestType.PERCENTAGE,
      installments: '1',
      dueDate: '',
      penaltyRate: '1',
      penaltyType: PenaltyType.DAILY_PERCENTAGE,
      isPaid: false,
      paidAt: '',
      clientName: '',
      clientPhone: '',
      clientAddress: '',
      clientProfession: '',
      clientCollateral: ''
    });
    setIsEditMode(false);
    setEditingLoanId(null);
  };

  const openNewLoanModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditLoanModal = (loan: Loan, client?: Client) => {
    setIsEditMode(true);
    setEditingLoanId(loan.id);
    setFormData({
      clientId: loan.clientId,
      amount: loan.amount.toString(),
      interestRate: loan.interestRate.toString(),
      interestType: loan.interestType || InterestType.PERCENTAGE,
      installments: '1', 
      dueDate: loan.dueDate,
      penaltyRate: loan.penaltyRate.toString(),
      penaltyType: loan.penaltyType,
      isPaid: loan.status === LoanStatus.PAID,
      paidAt: loan.paidAt || '',
      
      clientName: client?.name || '',
      clientPhone: client?.phone || '',
      clientAddress: client?.address || '',
      clientProfession: client?.profession || '',
      clientCollateral: client?.collateral || ''
    });
    setIsModalOpen(true);
  };

  const calculatedLoans = loans.map(l => calculateLoanDetails(l, clients));

  const filteredLoans = calculatedLoans.filter(loan => {
    const matchesSearch = loan.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' 
      ? true 
      : filter === 'OVERDUE' 
        ? loan.isOverdue && loan.status !== LoanStatus.PAID
        : loan.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode && editingLoanId) {
      const originalLoan = loans.find(l => l.id === editingLoanId);
      const originalClient = clients.find(c => c.id === formData.clientId);
      
      if (originalLoan) {
        onUpdateLoan({
          ...originalLoan,
          amount: parseFloat(formData.amount),
          interestRate: parseFloat(formData.interestRate),
          interestType: formData.interestType,
          dueDate: formData.dueDate, 
          penaltyRate: parseFloat(formData.penaltyRate),
          penaltyType: formData.penaltyType,
          status: formData.isPaid ? LoanStatus.PAID : LoanStatus.ACTIVE,
          paidAt: formData.isPaid ? (formData.paidAt || new Date().toISOString()) : undefined
        });
      }

      if (originalClient) {
        onUpdateClient({
          ...originalClient,
          name: formData.clientName,
          phone: formData.clientPhone,
          address: formData.clientAddress,
          profession: formData.clientProfession,
          collateral: formData.clientCollateral
        });
      }

    } else {
      if (formData.clientId && formData.amount && formData.dueDate) {
        const installmentsCount = parseInt(formData.installments);
        const totalAmount = parseFloat(formData.amount);
        const principalPerInstallment = totalAmount / installmentsCount;
        const groupId = installmentsCount > 1 ? generateId() : undefined;
        const baseDate = parseISO(formData.dueDate);

        for (let i = 0; i < installmentsCount; i++) {
            const nextDate = addMonths(baseDate, i);
            const dueDateString = format(nextDate, 'yyyy-MM-dd');
            
            onAddLoan({
              clientId: formData.clientId,
              amount: principalPerInstallment,
              interestRate: parseFloat(formData.interestRate),
              interestType: formData.interestType,
              dueDate: dueDateString, 
              penaltyRate: parseFloat(formData.penaltyRate),
              penaltyType: formData.penaltyType,
              status: formData.isPaid ? LoanStatus.PAID : LoanStatus.ACTIVE,
              paidAt: formData.isPaid ? formData.paidAt : undefined,
              installmentNumber: i + 1,
              installmentTotal: installmentsCount,
              groupId: groupId
            });
        }
      }
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const getSimulation = () => {
    const amount = parseFloat(formData.amount) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const installments = parseInt(formData.installments) || 1;
    const type = formData.interestType;

    const principalPart = amount / installments;
    let interestPart = 0;

    if (type === InterestType.FIXED_VALUE) {
      interestPart = rate;
    } else {
      interestPart = principalPart * (rate / 100);
    }

    const parcelTotal = principalPart + interestPart;
    const totalLoan = parcelTotal * installments;
    const totalInterest = interestPart * installments;

    return { parcelTotal, totalLoan, totalInterest };
  };

  const simulation = getSimulation();

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Empréstimos - Empréstimos AGT", 14, 10);
    
    const tableData = filteredLoans.map(row => [
      row.clientName,
      row.installmentTotal && row.installmentTotal > 1 ? `${row.installmentNumber}/${row.installmentTotal}` : '1/1',
      formatCurrency(row.amount),
      formatCurrency(row.finalTotal),
      formatDate(row.dueDate),
      row.isOverdue && row.status !== LoanStatus.PAID ? 'ATRASADO' : row.status === LoanStatus.PAID ? 'PAGO' : 'EM DIA'
    ]);

    autoTable(doc, {
      head: [['Cliente', 'Parc.', 'Principal', 'Total a Pagar', 'Vencimento', 'Status']],
      body: tableData,
      startY: 20,
    });

    doc.save('emprestimos-agt.pdf');
  };

  // Helper to get Label for Penalty Input
  const getPenaltyLabel = () => {
    switch(formData.penaltyType) {
      case PenaltyType.DAILY_PERCENTAGE: return "Porcentagem Diária (%)";
      case PenaltyType.DAILY_VALUE: return "Valor Fixo Diário (R$)";
      case PenaltyType.FIXED: return "Porcentagem Única (%)";
      case PenaltyType.FIXED_VALUE: return "Valor Fixo Único (R$)";
      default: return "Valor";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-black border-l-4 border-brand-yellow pl-3">Empréstimos</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="secondary" icon={<Download size={18} />} onClick={exportPDF}>
            Exportar
          </Button>
          <Button icon={<Plus size={18} />} onClick={openNewLoanModal}>
            Novo Empréstimo
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por cliente..."
            className="w-full pl-10 pr-4 py-2 border border-brand-yellow/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow bg-white placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-brand-yellow/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow bg-white text-black font-medium"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">Todos os Status</option>
          <option value={LoanStatus.ACTIVE}>Em Aberto</option>
          <option value="OVERDUE">Atrasados</option>
          <option value={LoanStatus.PAID}>Pagos</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-yellow/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-black text-white border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Parc.</th>
                <th className="px-6 py-4 font-bold">Valor Inicial</th>
                <th className="px-6 py-4 font-bold">Total Atual</th>
                <th className="px-6 py-4 font-bold">Vencimento</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-yellow-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-black">{loan.clientName}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">
                    {loan.installmentTotal && loan.installmentTotal > 1 ? (
                      <span className="bg-gray-200 px-2 py-1 rounded text-gray-700">{loan.installmentNumber}/{loan.installmentTotal}</span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatCurrency(loan.amount)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-black text-lg">{formatCurrency(loan.finalTotal)}</span>
                      {loan.penaltyAmount > 0 && (
                        <div className="mt-1 flex flex-col text-xs text-red-600 font-bold bg-red-50 p-1 rounded">
                           <span className="flex items-center gap-1">
                              <AlertTriangle size={10} /> + {formatCurrency(loan.penaltyAmount)}
                           </span>
                           {loan.isOverdue && loan.status !== LoanStatus.PAID && (
                              <div className="flex flex-col text-[10px] opacity-75 mt-0.5 ml-1">
                                 <span>{loan.daysOverdue} dias de atraso</span>
                                 <span>
                                   {loan.penaltyType === PenaltyType.DAILY_PERCENTAGE ? 
                                     `(${loan.penaltyRate}% ao dia)` : 
                                    loan.penaltyType === PenaltyType.DAILY_VALUE ? 
                                     `(${formatCurrency(loan.penaltyRate)} ao dia)` : 
                                     'Multa Única'}
                                 </span>
                              </div>
                           )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      {formatDate(loan.dueDate)}
                      {loan.isOverdue && loan.status !== LoanStatus.PAID && (
                         <div className="flex items-center gap-1 text-red-600 font-bold text-xs">
                           <Clock size={12} /> {loan.daysOverdue}d
                         </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={loan.status === LoanStatus.PAID ? 'paid' : loan.isOverdue ? 'overdue' : 'active'} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          const client = clients.find(c => c.id === loan.clientId);
                          openEditLoanModal(loan, client);
                        }}
                        className="text-gray-500 hover:text-black p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar Empréstimo/Cliente"
                      >
                        <Pencil size={16} />
                      </button>
                      
                      {loan.status !== LoanStatus.PAID && (
                        <button 
                          onClick={() => onUpdateStatus(loan.id, LoanStatus.PAID)}
                          className="text-black bg-brand-yellow hover:bg-yellow-400 px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm"
                          title="Marcar como pago"
                        >
                          <CheckCircle size={14} /> Pagar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400 italic">
                    Nenhum empréstimo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? "Editar Empréstimo e Cliente" : "Novo Empréstimo"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Client Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="text-sm font-bold text-black mb-3 border-b border-gray-200 pb-2 flex items-center gap-2">
              <span className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
              Dados do Cliente
            </h3>
            
            {!isEditMode ? (
              <Select
                label="Selecionar Cliente"
                value={formData.clientId}
                onChange={e => setFormData({...formData, clientId: e.target.value})}
                options={[
                  { label: 'Selecione um cliente...', value: '' },
                  ...clients.map(c => ({ label: c.name, value: c.id }))
                ]}
                required
              />
            ) : (
              <div className="space-y-3">
                 <Input
                   label="Nome Completo"
                   value={formData.clientName}
                   onChange={e => setFormData({...formData, clientName: e.target.value})}
                   required
                 />
                 <div className="grid grid-cols-2 gap-3">
                   <Input
                     label="Telefone"
                     value={formData.clientPhone}
                     onChange={e => setFormData({...formData, clientPhone: e.target.value})}
                   />
                   <Input
                     label="Profissão"
                     value={formData.clientProfession}
                     onChange={e => setFormData({...formData, clientProfession: e.target.value})}
                   />
                 </div>
                 <Input
                   label="Endereço"
                   value={formData.clientAddress}
                   onChange={e => setFormData({...formData, clientAddress: e.target.value})}
                 />
                 <div>
                    <label className="block text-sm font-bold text-black mb-1">Garantia</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-none text-sm"
                      rows={2}
                      value={formData.clientCollateral}
                      onChange={e => setFormData({...formData, clientCollateral: e.target.value})}
                    />
                 </div>
              </div>
            )}
          </div>

          {/* Loan Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
             <h3 className="text-sm font-bold text-black mb-3 border-b border-gray-200 pb-2 flex items-center gap-2">
              <span className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
              Dados Financeiros
            </h3>
             <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valor Total (R$)"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                required
              />
              <Input
                label="Primeiro Vencimento"
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({...formData, dueDate: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <Select
                label="Parcelas"
                value={formData.installments}
                onChange={e => setFormData({...formData, installments: e.target.value})}
                disabled={isEditMode} 
                options={Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}x`, value: (i + 1).toString() }))}
              />
              <div>
                <label className="block text-sm font-bold text-black mb-1">Tipo de Juros</label>
                <div className="flex bg-gray-200 rounded-lg p-1">
                   <button
                     type="button"
                     className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${formData.interestType === InterestType.PERCENTAGE ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                     onClick={() => setFormData({...formData, interestType: InterestType.PERCENTAGE})}
                   >
                     % Porc.
                   </button>
                   <button
                     type="button"
                     className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${formData.interestType === InterestType.FIXED_VALUE ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                     onClick={() => setFormData({...formData, interestType: InterestType.FIXED_VALUE})}
                   >
                     R$ Fixo
                   </button>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <Input
                label={formData.interestType === InterestType.FIXED_VALUE ? "Valor de Juros por Parcela (R$)" : "Porcentagem de Juros por Parcela (%)"}
                type="number"
                step="0.1"
                value={formData.interestRate}
                onChange={e => setFormData({...formData, interestRate: e.target.value})}
                required
              />
            </div>

            {/* Simulation Summary */}
            {!isEditMode && formData.amount && formData.interestRate && (
              <div className="mt-4 bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg p-3">
                 <h4 className="text-xs font-bold text-brand-black uppercase flex items-center gap-1 mb-2">
                   <Calculator size={14} /> Resumo da Simulação
                 </h4>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-600">Valor Parcela:</span>
                   <span className="font-bold text-black">{formatCurrency(simulation.parcelTotal)} <span className="text-xs text-gray-500 font-normal">({formData.installments}x)</span></span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-600">Juros Totais:</span>
                   <span className="font-bold text-green-700">+{formatCurrency(simulation.totalInterest)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm border-t border-brand-yellow/20 mt-1 pt-1">
                   <span className="font-bold text-black">Total a Pagar:</span>
                   <span className="font-black text-black">{formatCurrency(simulation.totalLoan)}</span>
                 </div>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-3 mt-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Multa por Atraso (Diária ou Única)</p>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Tipo de Multa"
                  value={formData.penaltyType}
                  onChange={e => setFormData({...formData, penaltyType: e.target.value as PenaltyType})}
                  options={[
                    { label: 'Diária - Porcentagem (%)', value: PenaltyType.DAILY_PERCENTAGE },
                    { label: 'Diária - Valor Fixo (R$)', value: PenaltyType.DAILY_VALUE },
                    { label: 'Única - Porcentagem (%)', value: PenaltyType.FIXED },
                    { label: 'Única - Valor Fixo (R$)', value: PenaltyType.FIXED_VALUE },
                  ]}
                />
                <Input
                  label={getPenaltyLabel()}
                  type="number"
                  step="0.1"
                  value={formData.penaltyRate}
                  onChange={e => setFormData({...formData, penaltyRate: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Status / History Section */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
             <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isPaid" 
                  className="w-5 h-5 text-brand-yellow rounded focus:ring-brand-yellow border-gray-300"
                  checked={formData.isPaid}
                  onChange={e => setFormData({...formData, isPaid: e.target.checked})}
                />
                <label htmlFor="isPaid" className="font-bold text-black cursor-pointer flex items-center gap-2">
                   <CalendarCheck size={18} />
                   {isEditMode ? "Empréstimo Pago" : "Cadastrar como Empréstimo Antigo (Pago)"}
                </label>
             </div>
             
             {formData.isPaid && (
               <div className="mt-3 pl-8 animate-in slide-in-from-top-2 duration-200">
                  <Input
                    label="Data do Pagamento"
                    type="date"
                    value={formData.paidAt}
                    onChange={e => setFormData({...formData, paidAt: e.target.value})}
                    required={formData.isPaid}
                  />
               </div>
             )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditMode ? "Salvar Alterações" : "Criar Empréstimo"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};