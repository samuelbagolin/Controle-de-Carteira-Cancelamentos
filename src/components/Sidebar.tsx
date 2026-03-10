import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  Package, 
  LogOut,
  TrendingUp
} from 'lucide-react';
import { auth } from '../firebase';
import { cn } from '../lib/utils';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/records', icon: Database, label: 'Registros Mensais' },
    { to: '/products', icon: Package, label: 'Produtos' },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <TrendingUp className="w-6 h-6 text-emerald-500" />
        </div>
        <span className="font-bold text-lg tracking-tight">Controle de Carteira</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-emerald-500/10 text-emerald-500" 
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
