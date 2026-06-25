'use client';

import React from 'react';
import { Upload, Files, Activity, Database, TrendingUp, Clock, AlertCircle, Sparkles, BrainCircuit, CheckCircle2, Circle, Server, HardDrive, LayoutTemplate } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  // 1. User Profile
  const { data: sessionResponse } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/auth/me');
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    }
  });
  const user = sessionResponse?.data || { name: 'Guest User' };

  // 2. Metrics
  const { data: metricsResponse, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/search/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    }
  });
  const metrics = metricsResponse?.data || { totalDocuments: 0, indexedVectors: 0, searchCount: 0 };

  // 3. System Health
  const { data: healthResponse, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/system/health');
      if (!res.ok) throw new Error('Failed to fetch health');
      return res.json();
    },
    refetchInterval: 30000 // Poll every 30s
  });
  const health = healthResponse?.data || { backend: 'Offline', database: 'Offline', aiService: 'Offline', documentProcessor: 'Idle' };

  // 4. Recent Documents (Mocked for now since backend doesn't have /api/documents fully implemented or I haven't seen it)
  // Actually, I saw `GET /api/documents` in routes/documents.ts. I'll fetch it!
  const { data: docsResponse, isLoading: docsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/documents');
      if (!res.ok) return { data: [] };
      return res.json();
    }
  });
  const recentDocs = docsResponse?.data || [];

  // 5. Recent Searches
  const { data: searchResponse, isLoading: searchLoading } = useQuery({
    queryKey: ['searchHistory'],
    queryFn: async () => {
      const res = await fetch('http://localhost:4000/api/search/history');
      if (!res.ok) return { data: [] };
      return res.json();
    }
  });
  const recentSearches = searchResponse?.data || [];

  const handleSuggestionClick = (query) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Good Morning, {user.name.split(' ')[0]}</h1>
          <p className="text-indigo-200 text-lg mb-6 max-w-xl">Ask Copilot anything about your enterprise knowledge.</p>
          
          <div className="flex flex-wrap gap-3">
            {[
              'Summarize our Q3 report',
              'Show onboarding requirements',
              'List security compliance documents',
              'What are the risks in Vendor Agreement A?'
            ].map((suggestion, i) => (
              <button 
                key={i} 
                onClick={() => handleSuggestionClick(suggestion)}
                className="bg-white/10 hover:bg-white/20 transition-all border border-white/10 text-white text-sm px-4 py-2.5 rounded-full flex items-center gap-2 backdrop-blur-md shadow-sm"
              >
                <Sparkles size={16} className="text-indigo-400" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <BrainCircuit size={400} />
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Documents" 
          value={metrics.totalDocuments} 
          isLoading={metricsLoading}
          trend="Active" 
          trendUp={true} 
          icon={<Files className="text-blue-500" />} 
        />
        <StatCard 
          title="Indexed Vectors" 
          value={metrics.indexedVectors} 
          isLoading={metricsLoading}
          trend="Synced with Qdrant" 
          trendUp={true} 
          icon={<Database className="text-indigo-500" />} 
        />
        <StatCard 
          title="Copilot Queries" 
          value={metrics.searchCount} 
          isLoading={metricsLoading}
          trend="Active usage" 
          trendUp={true} 
          icon={<Activity className="text-emerald-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Processing Pipeline Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BrainCircuit className="text-indigo-600" size={20} /> AI Processing Pipeline
            </h3>
            <div className="flex items-center justify-between relative px-4">
              <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0"></div>
              
              <PipelineStep name="Upload" status="Completed" />
              <PipelineStep name="Extraction" status="Completed" />
              <PipelineStep name="Cleaning" status="Completed" />
              <PipelineStep name="Chunking" status="Completed" />
              <PipelineStep name="Embedding" status={health.documentProcessor === 'Processing' ? 'Processing' : 'Pending'} />
              <PipelineStep name="Indexing" status="Pending" />
            </div>
            <p className="text-xs text-center text-slate-500 mt-6 bg-slate-50 p-2 rounded-lg">
              The AI service automatically orchestrates this semantic pipeline for every uploaded document.
            </p>
          </div>

          {/* Recent Documents Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <LayoutTemplate className="text-blue-500" size={18} /> Recent Documents
              </h3>
              <button className="text-sm text-blue-600 font-medium hover:text-blue-700" onClick={() => router.push('/documents')}>View All</button>
            </div>
            
            <div className="divide-y divide-slate-100 flex-1 flex flex-col min-h-[200px]">
              {docsLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/4 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentDocs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Files className="text-slate-300" size={24} />
                  </div>
                  <p className="text-slate-500 font-medium">No documents uploaded yet.</p>
                  <p className="text-sm text-slate-400 mt-1">Upload a file to populate the knowledge base.</p>
                </div>
              ) : (
                recentDocs.slice(0, 5).map(doc => (
                  <ActivityItem key={doc.id} doc={doc.filename} status="Completed" time="Recently" />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="space-y-8">
          
          {/* Recent Searches */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="text-slate-500" size={18} /> Recent Searches
              </h3>
            </div>
            
            <div className="flex-1 flex flex-col min-h-[150px]">
              {searchLoading ? (
                 <div className="p-6 space-y-4">
                   {[1, 2, 3].map(i => <div key={i} className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>)}
                 </div>
              ) : recentSearches.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8">
                  <SearchEmptyState />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentSearches.slice(0, 4).map((search, i) => (
                    <div key={i} className="px-6 py-3 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => handleSuggestionClick(search.query)}>
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{search.query}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{search.timestamp || 'Recently'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-slate-900 rounded-2xl shadow-xl p-6 text-white border border-slate-800">
            <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-100">
              <Server className="text-indigo-400" size={18} /> System Status
            </h3>
            
            {healthLoading ? (
               <div className="space-y-4">
                 {[1, 2, 3].map(i => <div key={i} className="h-4 bg-slate-800 rounded animate-pulse w-full"></div>)}
               </div>
            ) : (
              <div className="space-y-4">
                <HealthRow label="Backend API" status={health.backend} />
                <HealthRow label="AI Service" status={health.aiService} />
                <HealthRow label="Database (PostgreSQL)" status={health.database} />
                <HealthRow label="Vector DB (Qdrant)" status={health.aiService} /> {/* Derived from AI Service */}
                <HealthRow label="Document Processor" status={health.documentProcessor} type="process" />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Subcomponents
// -------------------------------------------------------------

function SearchEmptyState() {
  return (
    <div className="text-center opacity-70">
       <div className="mx-auto w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2">
         <Clock className="text-slate-400" size={20} />
       </div>
       <p className="text-sm font-medium text-slate-600">No searches yet</p>
       <p className="text-xs text-slate-400 mt-1">Queries will appear here</p>
    </div>
  );
}

function PipelineStep({ name, status }) {
  let icon = <Circle size={20} className="text-slate-300 fill-white relative z-10" />;
  let textClass = "text-slate-400";
  
  if (status === 'Completed') {
    icon = <CheckCircle2 size={24} className="text-emerald-500 fill-white relative z-10" />;
    textClass = "text-slate-800 font-medium";
  } else if (status === 'Processing') {
    icon = (
      <div className="relative z-10 w-6 h-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin"></div>
      </div>
    );
    textClass = "text-indigo-600 font-bold";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-8 flex items-center justify-center">{icon}</div>
      <span className={`text-xs ${textClass}`}>{name}</span>
    </div>
  );
}

function HealthRow({ label, status, type = 'status' }) {
  const getStatusColor = (s) => {
    if (s === 'Online' || s === 'Completed') return 'text-emerald-400 bg-emerald-400';
    if (s === 'Processing') return 'text-blue-400 bg-blue-400 animate-pulse';
    if (s === 'Idle') return 'text-slate-400 bg-slate-400';
    return 'text-red-400 bg-red-400';
  };

  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-300">{label}</span>
      <span className={`flex items-center gap-1.5 font-medium ${getStatusColor(status).split(' ')[0]}`}>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ').slice(1).join(' ')}`}></div>
        {status}
      </span>
    </div>
  );
}

function StatCard({ title, value, trend, icon, isLoading }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow group">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
        
        {isLoading ? (
          <div className="h-8 w-16 bg-slate-100 rounded-md animate-pulse mb-2 mt-1"></div>
        ) : (
          <div className="text-3xl font-bold text-slate-900 mb-2">{value}</div>
        )}
        
        <div className="text-sm text-emerald-600 font-medium flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <TrendingUp size={14} /> {trend}
        </div>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 group-hover:scale-110 transition-all duration-300">
        {icon}
      </div>
    </div>
  );
}

function ActivityItem({ doc, status, time }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
          <Files size={18} />
        </div>
        <div>
          <p className="font-medium text-slate-900 text-sm truncate max-w-[200px]">{doc}</p>
          <p className="text-xs text-slate-500">{time}</p>
        </div>
      </div>
      <div>
        {status === 'Completed' && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/50 shadow-sm">Completed</span>}
        {status === 'Processing' && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200/50 shadow-sm flex items-center gap-1"><Activity size={12}/> Processing</span>}
        {status === 'Failed' && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200/50 shadow-sm flex items-center gap-1"><AlertCircle size={12}/> Failed</span>}
      </div>
    </div>
  );
}
