import React, { useState } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  Files, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Bell,
  Upload,
  BrainCircuit,
  FileText
} from 'lucide-react';

export default function Dashboard({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      
      {/* Global Sidebar (AppShell) */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <BrainCircuit className="text-blue-600 dark:text-blue-500" size={28} />
          <span className="font-bold text-lg tracking-tight">Business Copilot</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            isActive={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
          />
          <NavItem 
            icon={<Files size={20} />} 
            label="Knowledge Base" 
            isActive={activeTab === 'documents'} 
            onClick={() => setActiveTab('documents')} 
          />
          <NavItem 
            icon={<Search size={20} />} 
            label="Semantic Search" 
            isActive={activeTab === 'search'} 
            onClick={() => setActiveTab('search')} 
          />
          <NavItem 
            icon={<MessageSquare size={20} />} 
            label="Copilot Chat" 
            isActive={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            badge="Soon"
          />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <NavItem icon={<Settings size={20} />} label="Settings" />
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 mt-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Global Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-8">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Ask Copilot anything or search documents..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6 ml-8">
            <button className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              <Bell size={20} />
              <span className="absolute 0 right-0 w-2 h-2 bg-blue-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{session?.user?.role || 'Admin'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'home' && <HomeView user={session?.user} />}
          {activeTab === 'documents' && <KnowledgeBaseView />}
          {activeTab === 'search' && <SearchView />}
          {activeTab === 'chat' && <div>Copilot Chat coming soon.</div>}
        </div>

      </main>
    </div>
  );
}

// Sub-components for views

function NavItem({ icon, label, isActive, onClick, badge }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors ${
        isActive 
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      {badge && (
        <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

function HomeView({ user }) {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Good Morning, {user?.name?.split(' ')[0] || 'User'}</h1>
        <p className="text-slate-500 mt-2">Here is an overview of your enterprise knowledge base.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Documents" value="124" trend="+12 this week" />
        <StatCard title="Indexed Chunks" value="45,291" trend="Synced with Qdrant" />
        <StatCard title="Copilot Queries" value="892" trend="Active usage" />
      </div>

      <div className="glass p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <Upload className="text-blue-500 mb-4" size={48} />
          <h3 className="text-xl font-bold mb-2">Build your Knowledge Base</h3>
          <p className="text-slate-500 max-w-md mb-6">Upload PDFs, DOCX, or TXT files. Copilot will automatically extract, clean, and vectorize the content for semantic search.</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
            <Files size={18} />
            Upload Document
          </button>
        </div>
      </div>
    </div>
  );
}

function KnowledgeBaseView() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-slate-500 mt-1">Manage your uploaded enterprise documents.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
          <Upload size={18} />
          Upload New
        </button>
      </div>
      
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-500">
              <th className="p-4">Document Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Date Added</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <td className="p-4 flex items-center gap-3 font-medium">
                <FileText className="text-blue-500" size={18} />
                Q3_Financial_Report_2026.pdf
              </td>
              <td className="p-4 text-slate-500">PDF</td>
              <td className="p-4 text-slate-500">Today, 09:41 AM</td>
              <td className="p-4"><StatusBadge status="completed" /></td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <td className="p-4 flex items-center gap-3 font-medium">
                <FileText className="text-blue-500" size={18} />
                Engineering_Architecture_V2.docx
              </td>
              <td className="p-4 text-slate-500">DOCX</td>
              <td className="p-4 text-slate-500">Yesterday</td>
              <td className="p-4"><StatusBadge status="completed" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SearchView() {
  return (
    <div className="max-w-4xl mx-auto pt-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Semantic Search</h1>
        <p className="text-slate-500">Instantly find exact paragraphs and insights across your entire knowledge base using vector similarity.</p>
      </div>

      <div className="relative max-w-2xl mx-auto shadow-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={24} />
        <input 
          type="text" 
          placeholder="e.g. 'What were our key risk factors in Q3?'" 
          className="w-full pl-14 pr-32 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
        />
        <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors">
          Search
        </button>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend }) {
  return (
    <div className="bg-white dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-green-600 dark:text-green-500 mt-2 font-medium">{trend}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'completed') {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Vectorized</span>;
  }
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Processing</span>;
}
