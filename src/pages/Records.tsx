import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, MonthlyRecord } from '../types';
import { Plus, Pencil, Trash2, Database, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatNumber } from '../lib/utils';

export const Records: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MonthlyRecord | null>(null);
  const [formData, setFormData] = useState<Partial<MonthlyRecord>>({
    productId: '',
    date: new Date().toISOString().slice(0, 7),
    activeClientsPrevious: 0,
    newContracts: 0,
    cancellationRequests: 0,
    cancelledInMonth: 0,
    autoCancellations: 0,
    inactivationsInMonth: 0,
    totalMRR: 0,
    lostMRRCancel: 0,
    lostMRRInact: 0
  });

  useEffect(() => {
    const qProducts = query(collection(db, 'products'), orderBy('name'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const qRecords = query(collection(db, 'records'), orderBy('date', 'desc'));
    const unsubscribeRecords = onSnapshot(qRecords, (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonthlyRecord)));
    });

    return () => {
      unsubscribeProducts();
      unsubscribeRecords();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await updateDoc(doc(db, 'records', editingRecord.id), formData);
      } else {
        await addDoc(collection(db, 'records'), formData);
      }
      closeModal();
    } catch (error) {
      console.error('Error saving record:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      await deleteDoc(doc(db, 'records', id));
    }
  };

  const openModal = (record?: MonthlyRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData(record);
    } else {
      setEditingRecord(null);
      setFormData({
        productId: products[0]?.id || '',
        date: new Date().toISOString().slice(0, 7),
        activeClientsPrevious: 0,
        newContracts: 0,
        cancellationRequests: 0,
        cancelledInMonth: 0,
        autoCancellations: 0,
        inactivationsInMonth: 0,
        totalMRR: 0,
        lostMRRCancel: 0,
        lostMRRInact: 0
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Registros Mensais</h1>
          <p className="text-zinc-400 text-sm md:text-base">Gerencie os dados mensais de cada produto</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 px-4 py-2.5 rounded-xl font-semibold transition-all w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Registro
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800">
                <th className="px-6 py-4 font-semibold text-zinc-400 uppercase tracking-wider">Mês/Ano</th>
                <th className="px-6 py-4 font-semibold text-zinc-400 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 font-semibold text-zinc-400 uppercase tracking-wider text-right">Ativos (Ant.)</th>
                <th className="px-6 py-4 font-semibold text-zinc-400 uppercase tracking-wider text-right">Novos</th>
                <th className="px-6 py-4 font-semibold text-zinc-400 uppercase tracking-wider text-right">MRR Total</th>
                <th className="px-6 py-4 font-semibold text-zinc-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">{record.date}</td>
                  <td className="px-6 py-4 text-zinc-300">
                    {products.find(p => p.id === record.productId)?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-300">{formatNumber(record.activeClientsPrevious)}</td>
                  <td className="px-6 py-4 text-right text-sky-400 font-medium">+{record.newContracts}</td>
                  <td className="px-6 py-4 text-right text-white font-semibold">{formatCurrency(record.totalMRR)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(record)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(record.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold">{editingRecord ? 'Editar Registro' : 'Novo Registro Mensal'}</h2>
              <button onClick={closeModal} className="p-2 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Produto</label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  >
                    <option value="">Selecione um produto</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Mês de Referência</label>
                  <input
                    type="month"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField label="Clientes Ativos (Mês Ant.)" value={formData.activeClientsPrevious} onChange={(v) => setFormData({...formData, activeClientsPrevious: v})} />
                <FormField label="Novos Contratos" value={formData.newContracts} onChange={(v) => setFormData({...formData, newContracts: v})} />
                <FormField label="Solicit. de Cancelamento" value={formData.cancellationRequests} onChange={(v) => setFormData({...formData, cancellationRequests: v})} />
                <FormField label="Cancelados no Mês" value={formData.cancelledInMonth} onChange={(v) => setFormData({...formData, cancelledInMonth: v})} />
                <FormField label="Canc. Automáticos" value={formData.autoCancellations} onChange={(v) => setFormData({...formData, autoCancellations: v})} />
                <FormField label="Inativações no Mês" value={formData.inactivationsInMonth} onChange={(v) => setFormData({...formData, inactivationsInMonth: v})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField label="MRR Total do Produto" value={formData.totalMRR} onChange={(v) => setFormData({...formData, totalMRR: v})} isCurrency />
                <FormField label="MRR Perdido (Canc.)" value={formData.lostMRRCancel} onChange={(v) => setFormData({...formData, lostMRRCancel: v})} isCurrency />
                <FormField label="MRR Perdido (Inat.)" value={formData.lostMRRInact} onChange={(v) => setFormData({...formData, lostMRRInact: v})} isCurrency />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold py-4 rounded-xl transition-all"
                >
                  {editingRecord ? 'Salvar Alterações' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const FormField: React.FC<{ label: string; value: any; onChange: (v: number) => void; isCurrency?: boolean }> = ({ label, value, onChange, isCurrency }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-zinc-400">{label}</label>
    <div className="relative">
      {isCurrency && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>}
      <input
        type="number"
        step={isCurrency ? "0.01" : "1"}
        required
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 ${isCurrency ? 'pl-10' : 'px-4'} pr-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50`}
      />
    </div>
  </div>
);
