'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../components/AuthContext';
import { 
  Search, 
  LayoutDashboard, 
  Files, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Bell,
  BrainCircuit
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user: session, loading, logout } = useAuth();

  const user = {
    name: session?.name || 'Guest',
    role: session?.role?.name || 'Guest',
    initial: (session?.name || 'G').charAt(0)
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Knowledge Base', href: '/documents', icon: <Files size={20} /> },
    { label: 'Semantic Search', href: '/search', icon: <Search size={20} /> },
    { label: 'Copilot Chat', href: '#', icon: <MessageSquare size={20} />, badge: 'Beta' },
  ];

  // Global search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery, router]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Global Sidebar (AppShell) */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shadow-sm">
        <div className="p-6 flex items-center gap-3 border-b border-slate-200">
          <BrainCircuit className="text-blue-600" size={28} />
          <span className="font-bold text-lg tracking-tight">Business Copilot</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors ${
                pathname.startsWith(item.href) && item.href !== '#'
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors">
             <Settings size={20} />
             <span className="text-sm">Settings</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 mt-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        
        {/* Global Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Ask Copilot anything or search documents..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-full text-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6 ml-8">
            <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                {user.initial}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

      </main>
    </div>
  );
}
