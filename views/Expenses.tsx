import React, { useState } from 'react';
import { Card, Button, Input, Modal } from '../components/UI';
import { Plus, Search, Trash2, Pencil, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { Expense } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onUpdateExpense, onDeleteExpense }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({ description: '', amount: '', category: '', date: '', notes: '' });
    setIsEditMode(false);
    setEditingId(null);
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setIsEditMode(true);
    setEditingId(expense.id);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category || '',
      date: expense.date,
      notes: expense.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.description && formData.amount && formData.date) {
      if (isEditMode && editingId) {
        // Find original to preserve creation date
        const original = expenses.find(e => e.id === editingId);
        if (original) {
          onUpdateExpense({
            ...original,
            description: formData.description,
            amount: parseFloat(formData.amount),
            category: formData.category,
            date: formData.date,
            notes: formData.notes
          });
        }
      } else {
        onAddExpense({
          description: formData.description,
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.date,
          notes: formData.notes
        });
      }
      setIsModalOpen(false);
      resetForm();
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      onDeleteExpense(id);
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-black border-l-4 border-brand-yellow pl-3">Despesas</h2>
        <Button onClick={openNewModal} icon={<Plus size={18} />}>
          Nova Despesa
        </Button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown size={24} className="text-red-600" />
            </div>
            <p className="text-red-600 font-bold text-xs uppercase tracking-wider">Total de Despesas</p>
          </div>
          <h3 className="text-2xl font-black text-black">{formatCurrency(totalExpenses)}</h3>
          <p className="text-xs text-gray-500 mt-1">Soma das despesas listadas</p>
        </Card>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar despesa..."
          className="w-full pl-10 pr-4 py-2 border border-brand-yellow/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow bg-white placeholder-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-yellow/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-black text-white border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold">Descrição</th>
                <th className="px-6 py-4 font-bold">Categoria</th>
                <th className="px-6 py-4 font-bold">Data</th>
                <th className="px-6 py-4 font-bold">Valor</th>
                <th className="px-6 py-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses
                // Sort by date descending
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((expense) => (
                <tr key={expense.id} className="hover:bg-yellow-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-black">{expense.description}</div>
                    {expense.notes && <div className="text-xs text-gray-500 truncate max-w-[200px]">{expense.notes}</div>}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {expense.category ? (
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{expense.category}</span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                       <Calendar size={14} className="text-gray-400"/>
                       {formatDate(expense.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-red-600">
                    - {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(expense)}
                        className="text-gray-500 hover:text-black p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">
                    Nenhuma despesa registrada.
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
        title={isEditMode ? "Editar Despesa" : "Nova Despesa"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Descrição"
            placeholder="Ex: Aluguel do escritório"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              required
            />
            <Input
              label="Data"
              type="date"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>
          <Input
            label="Categoria (Opcional)"
            placeholder="Ex: Fixas, Transporte, Alimentação"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
          />
          <div>
            <label className="block text-sm font-bold text-black mb-1">Observações</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-none text-sm"
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditMode ? "Salvar Alterações" : "Salvar Despesa"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};