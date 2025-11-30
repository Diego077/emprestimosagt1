import React, { useState, useRef } from 'react';
import { Card, Button, Input, Modal, StatusBadge } from '../components/UI';
import { Plus, Search, User, Phone, Package, Briefcase, MapPin, Camera, Trash2, ArrowLeft, Pencil, CreditCard, Calendar } from 'lucide-react';
import { Client, Loan } from '../types';
import { calculateLoanDetails, formatCurrency, formatDate } from '../utils';

interface ClientsProps {
  clients: Client[];
  loans: Loan[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

export const Clients: React.FC<ClientsProps> = ({ clients, loans, onAddClient, onUpdateClient, onDeleteClient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null); // For Details View
  const [isEditMode, setIsEditMode] = useState(false); // For Modal Mode

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    phone: '',
    address: '',
    profession: '',
    cpf: '',
    photo: '',
    collateral: '',
    createdAt: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove non-digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1'); // Limit to 11 digits + masks
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      phone: '',
      address: '',
      profession: '',
      cpf: '',
      photo: '',
      collateral: '',
      createdAt: ''
    });
    setIsEditMode(false);
  };

  const openNewClientModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditClientModal = (client: Client) => {
    setIsEditMode(true);
    setFormData({
      id: client.id,
      name: client.name,
      phone: client.phone,
      address: client.address || '',
      profession: client.profession || '',
      cpf: client.cpf || '',
      photo: client.photo || '',
      collateral: client.collateral || '',
      createdAt: client.createdAt
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone) {
      if (isEditMode && formData.id) {
        // Update
        const updatedClient: Client = {
           id: formData.id,
           name: formData.name,
           phone: formData.phone,
           address: formData.address,
           profession: formData.profession,
           cpf: formData.cpf,
           photo: formData.photo,
           collateral: formData.collateral,
           createdAt: formData.createdAt
        };
        onUpdateClient(updatedClient);
        // If updating the currently viewed client in details
        if (selectedClient?.id === updatedClient.id) {
          setSelectedClient(updatedClient);
        }
      } else {
        // Create
        onAddClient({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          profession: formData.profession,
          cpf: formData.cpf,
          photo: formData.photo,
          collateral: formData.collateral
        });
      }
      setIsModalOpen(false);
      resetForm();
    }
  };

  const handleDelete = () => {
    if (selectedClient) {
      onDeleteClient(selectedClient.id);
      setSelectedClient(null); // Return to list
    }
  };

  // --- Views ---

  const renderDetailsView = () => {
    if (!selectedClient) return null;

    // Filter loans for this client
    const clientLoans = loans
      .filter(l => l.clientId === selectedClient.id)
      .map(l => calculateLoanDetails(l, clients)); // Calculate details like status

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => setSelectedClient(null)} icon={<ArrowLeft size={18}/>}>
            Voltar
          </Button>
          <h2 className="text-2xl font-bold text-black">Detalhes do Cliente</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <Card className="lg:col-span-1 flex flex-col items-center text-center p-8">
            <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-brand-yellow flex items-center justify-center overflow-hidden mb-4 shadow-lg">
               {selectedClient.photo ? (
                 <img src={selectedClient.photo} alt={selectedClient.name} className="w-full h-full object-cover" />
               ) : (
                 <User size={48} className="text-gray-400" />
               )}
            </div>
            <h3 className="text-xl font-black text-black mb-1">{selectedClient.name}</h3>
            {selectedClient.profession && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full mb-4">
                {selectedClient.profession}
              </span>
            )}
            
            <div className="w-full space-y-3 text-left mt-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
               <div className="flex items-center gap-3">
                 <Phone size={18} className="text-brand-yellow shrink-0" />
                 <span className="text-sm font-medium">{selectedClient.phone}</span>
               </div>
               {selectedClient.cpf && (
                 <div className="flex items-center gap-3">
                   <CreditCard size={18} className="text-brand-yellow shrink-0" />
                   <span className="text-sm font-medium">{selectedClient.cpf}</span>
                 </div>
               )}
               {selectedClient.address && (
                 <div className="flex items-center gap-3">
                   <MapPin size={18} className="text-brand-yellow shrink-0" />
                   <span className="text-sm font-medium">{selectedClient.address}</span>
                 </div>
               )}
            </div>

            <div className="flex gap-3 mt-6 w-full">
               <Button 
                 className="flex-1" 
                 icon={<Pencil size={16}/>} 
                 onClick={() => openEditClientModal(selectedClient)}
               >
                 Editar
               </Button>
               <Button 
                 className="flex-1" 
                 variant="danger" 
                 icon={<Trash2 size={16}/>} 
                 onClick={handleDelete}
               >
                 Excluir
               </Button>
            </div>
          </Card>

          {/* Additional Info & Loans */}
          <div className="lg:col-span-2 space-y-6">
             {/* Collateral Card */}
             <Card>
                <h4 className="font-bold text-black mb-3 flex items-center gap-2">
                  <Package size={20} className="text-brand-yellow"/>
                  Garantias Vinculadas
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-700 min-h-[80px]">
                  {selectedClient.collateral || "Nenhuma garantia registrada."}
                </div>
             </Card>

             {/* Loan History */}
             <Card>
                <h4 className="font-bold text-black mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-brand-yellow"/>
                  Histórico de Empréstimos
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-brand-black text-white">
                      <tr>
                        <th className="px-4 py-3 font-bold">Valor Empr.</th>
                        <th className="px-4 py-3 font-bold">Total Final</th>
                        <th className="px-4 py-3 font-bold">Vencimento</th>
                        <th className="px-4 py-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clientLoans.map(loan => (
                        <tr key={loan.id} className="hover:bg-yellow-50 transition-colors">
                          <td className="px-4 py-3">{formatCurrency(loan.amount)}</td>
                          <td className="px-4 py-3 font-bold">{formatCurrency(loan.finalTotal)}</td>
                          <td className="px-4 py-3">{formatDate(loan.dueDate)}</td>
                          <td className="px-4 py-3">
                             <StatusBadge status={loan.status === 'PAID' ? 'paid' : loan.isOverdue ? 'overdue' : 'active'} />
                          </td>
                        </tr>
                      ))}
                      {clientLoans.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-gray-400 italic">
                            Nenhum empréstimo encontrado para este cliente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
             </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const filteredClients = clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm)
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-black border-l-4 border-brand-yellow pl-3">Clientes</h2>
          <Button onClick={openNewClientModal} icon={<Plus size={18} />}>
            Novo Cliente
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-10 pr-4 py-2 border border-brand-yellow/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow bg-white placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => (
            <Card 
              key={client.id} 
              className="hover:shadow-lg transition-all group cursor-pointer border-brand-yellow/30 hover:border-brand-yellow"
            >
              <div onClick={() => setSelectedClient(client)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-brand-yellow/20 flex items-center justify-center overflow-hidden border border-brand-yellow/50">
                      {client.photo ? (
                        <img src={client.photo} alt={client.name} className="w-full h-full object-cover"/>
                      ) : (
                        <User size={20} className="text-black" />
                      )}
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-black leading-tight">{client.name}</h3>
                       {client.profession && (
                        <p className="text-xs text-gray-500">{client.profession}</p>
                       )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-brand-yellow shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  {client.cpf && (
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-brand-yellow shrink-0" />
                      <span>{client.cpf}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-brand-yellow shrink-0" />
                      <span className="truncate" title={client.address}>{client.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {filteredClients.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {selectedClient ? renderDetailsView() : renderListView()}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Editar Cliente" : "Cadastrar Novo Cliente"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Photo Upload */}
          <div className="flex flex-col items-center mb-6">
             <div 
               className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-yellow transition-colors relative group"
               onClick={() => fileInputRef.current?.click()}
             >
               {formData.photo ? (
                 <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
               ) : (
                 <Camera className="text-gray-400 group-hover:text-brand-yellow" size={32} />
               )}
             </div>
             <button 
               type="button" 
               className="text-xs text-brand-yellow font-bold mt-2 hover:underline"
               onClick={() => fileInputRef.current?.click()}
             >
               {formData.photo ? "Alterar Foto" : "Adicionar Foto"}
             </button>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*"
               onChange={handlePhotoUpload}
             />
          </div>

          <Input
            label="Nome Completo"
            placeholder="Ex: João da Silva"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              placeholder="Ex: (11) 99999-9999"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              required
            />
             <div className="mb-4">
                <label className="block text-sm font-bold text-black mb-1">
                  CPF
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow transition-colors"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  maxLength={14}
                  onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                />
             </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Input
               label="Profissão"
               placeholder="Ex: Motoboy"
               value={formData.profession}
               onChange={e => setFormData({...formData, profession: e.target.value})}
             />
             <Input
               label="Endereço"
               placeholder="Ex: Rua das Flores, 123"
               value={formData.address}
               onChange={e => setFormData({...formData, address: e.target.value})}
             />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-black mb-1">
              Descrição da Garantia
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow resize-none"
              rows={3}
              placeholder="Ex: Moto Honda 2018, Celular Samsung S20..."
              value={formData.collateral}
              onChange={e => setFormData({...formData, collateral: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditMode ? "Salvar Alterações" : "Salvar Cliente"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};