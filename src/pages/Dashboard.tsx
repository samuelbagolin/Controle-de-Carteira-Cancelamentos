import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, MonthlyRecord } from '../types';
import { 
  Users, 
  FilePlus, 
  FileX, 
  DollarSign, 
  TrendingDown, 
  Percent,
  Download,
  Filter
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency, formatNumber, formatPercent } from '../lib/utils';
import * as XLSX from 'xlsx';

export const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const qProducts = query(collection(db, 'products'), orderBy('name'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const qRecords = query(collection(db, 'records'), orderBy('date', 'asc'));
    const unsubscribeRecords = onSnapshot(qRecords, (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MonthlyRecord)));
    });

    return () => {
      unsubscribeProducts();
      unsubscribeRecords();
    };
  }, []);

  const aggregatedRecords = useMemo(() => {
    const filtered = records.filter(record => {
      const matchProduct = selectedProduct === 'all' || record.productId === selectedProduct;
      const matchStart = !dateRange.start || record.date >= dateRange.start;
      const matchEnd = !dateRange.end || record.date <= dateRange.end;
      return matchProduct && matchStart && matchEnd;
    });

    if (selectedProduct !== 'all') return filtered;

    // Group by date and sum values
    const grouped = filtered.reduce((acc, r) => {
      if (!acc[r.date]) {
        acc[r.date] = { ...r, id: r.date };
      } else {
        acc[r.date].activeClientsPrevious += r.activeClientsPrevious;
        acc[r.date].newContracts += r.newContracts;
        acc[r.date].cancellationRequests += r.cancellationRequests;
        acc[r.date].cancelledInMonth += r.cancelledInMonth;
        acc[r.date].autoCancellations += r.autoCancellations;
        acc[r.date].inactivationsInMonth += r.inactivationsInMonth;
        acc[r.date].totalMRR += r.totalMRR;
        acc[r.date].lostMRRCancel += r.lostMRRCancel;
        acc[r.date].lostMRRInact += r.lostMRRInact;
      }
      return acc;
    }, {} as Record<string, MonthlyRecord>);

    return (Object.values(grouped) as MonthlyRecord[]).sort((a, b) => a.date.localeCompare(b.date));
  }, [records, selectedProduct, dateRange]);

  const metrics = useMemo(() => {
    if (aggregatedRecords.length === 0) return null;

    const lastRecord = aggregatedRecords[aggregatedRecords.length - 1];
    
    const totalNew = aggregatedRecords.reduce((acc, r) => acc + r.newContracts, 0);
    const totalCancelled = aggregatedRecords.reduce((acc, r) => acc + r.cancelledInMonth, 0);
    const totalAuto = aggregatedRecords.reduce((acc, r) => acc + r.autoCancellations, 0);
    const totalInactivated = aggregatedRecords.reduce((acc, r) => acc + r.inactivationsInMonth, 0);
    
    const totalMRR = lastRecord.totalMRR;
    const lostMRRCancel = aggregatedRecords.reduce((acc, r) => acc + r.lostMRRCancel, 0);
    const lostMRRInact = aggregatedRecords.reduce((acc, r) => acc + r.lostMRRInact, 0);
    
    // Churn calculation: (Total Cancelled + Total Auto) / Last Month Active Clients
    const churnRate = lastRecord.activeClientsPrevious > 0 
      ? ((totalCancelled + totalAuto) / lastRecord.activeClientsPrevious) * 100 
      : 0;

    return {
      activeClients: lastRecord.activeClientsPrevious,
      newContracts: totalNew,
      cancelledInMonth: totalCancelled,
      autoCancellations: totalAuto,
      inactivationsInMonth: totalInactivated,
      totalMRR,
      lostMRRCancel,
      lostMRRInact,
      churnRate
    };
  }, [aggregatedRecords]);

  const chartData = useMemo(() => {
    return aggregatedRecords.map(r => ({
      date: r.date,
      active: r.activeClientsPrevious,
      cancelled: r.cancelledInMonth + r.autoCancellations,
      inactivated: r.inactivationsInMonth,
      mrr: r.totalMRR,
      lostMRR: r.lostMRRCancel + r.lostMRRInact,
      churn: r.activeClientsPrevious > 0 ? ((r.cancelledInMonth + r.autoCancellations) / r.activeClientsPrevious) * 100 : 0
    }));
  }, [aggregatedRecords]);

  const exportToExcel = () => {
    const data = aggregatedRecords.map(r => ({
      'Produto': selectedProduct === 'all' ? 'Todos' : products.find(p => p.id === r.productId)?.name || 'N/A',
      'Mês/Ano': r.date,
      'Clientes Ativos (Ant.)': r.activeClientsPrevious,
      'Novos Contratos': r.newContracts,
      'Solicit. Cancelamento': r.cancellationRequests,
      'Cancelados': r.cancelledInMonth,
      'Canc. Automáticos': r.autoCancellations,
      'Inativações': r.inactivationsInMonth,
      'MRR Total': r.totalMRR,
      'MRR Perdido (Canc.)': r.lostMRRCancel,
      'MRR Perdido (Inat.)': r.lostMRRInact
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Carteira');
    XLSX.writeFile(wb, `carteira_clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Analítico</h1>
          <p className="text-zinc-400">Visão geral da sua carteira de clientes</p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 rounded-xl font-semibold transition-all"
        >
          <Download className="w-4 h-4" />
          Exportar Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-wrap gap-6 items-end">
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-3 h-3" /> Produto
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none w-48"
          >
            <option value="all">Todos os Produtos</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Início</label>
          <input
            type="month"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Fim</label>
          <input
            type="month"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard 
          title="Clientes Ativos" 
          value={formatNumber(metrics?.activeClients || 0)} 
          icon={Users} 
          color="emerald" 
        />
        <MetricCard 
          title="Novos Contratos" 
          value={formatNumber(metrics?.newContracts || 0)} 
          icon={FilePlus} 
          color="blue" 
        />
        <MetricCard 
          title="Cancelados" 
          value={formatNumber(metrics?.cancelledInMonth || 0)} 
          icon={FileX} 
          color="red" 
        />
        <MetricCard 
          title="Canc. Automáticos" 
          value={formatNumber(metrics?.autoCancellations || 0)} 
          icon={FileX} 
          color="orange" 
        />
        <MetricCard 
          title="Inativações" 
          value={formatNumber(metrics?.inactivationsInMonth || 0)} 
          icon={FileX} 
          color="zinc" 
        />
        <MetricCard 
          title="MRR Total" 
          value={formatCurrency(metrics?.totalMRR || 0)} 
          icon={DollarSign} 
          color="emerald" 
        />
        <MetricCard 
          title="MRR Perdido (Canc.)" 
          value={formatCurrency(metrics?.lostMRRCancel || 0)} 
          icon={TrendingDown} 
          color="red" 
        />
        <MetricCard 
          title="MRR Perdido (Inat.)" 
          value={formatCurrency(metrics?.lostMRRInact || 0)} 
          icon={TrendingDown} 
          color="orange" 
        />
        <MetricCard 
          title="Taxa de Churn (Período)" 
          value={formatPercent(metrics?.churnRate || 0)} 
          icon={Percent} 
          color="purple" 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Evolução de Clientes Ativos">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Cancelamentos e Inativações">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Bar dataKey="cancelled" name="Cancelados" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="inactivated" name="Inativados" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Receita (MRR) e Perdas">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="#71717a" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                formatter={(value: number) => [formatCurrency(value), ""]}
              />
              <Legend verticalAlign="top" height={36}/>
              <Area type="monotone" dataKey="mrr" name="MRR Total" stroke="#10b981" fill="url(#colorMrr)" />
              <Area type="monotone" dataKey="lostMRR" name="MRR Perdido" stroke="#ef4444" fill="url(#colorLost)" />
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Taxa de Churn (%)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="#71717a" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                unit="%" 
                tickFormatter={(value) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                formatter={(value: number) => [`${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%`, "Churn"]}
              />
              <Line type="monotone" dataKey="churn" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string; icon: any; color: string }> = ({ title, value, icon: Icon, color }) => {
  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    red: "text-red-500 bg-red-500/10",
    orange: "text-orange-500 bg-orange-500/10",
    purple: "text-purple-500 bg-purple-500/10",
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
};

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
    <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
    {children}
  </div>
);
