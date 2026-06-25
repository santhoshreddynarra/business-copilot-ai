'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Files, Activity, Database, TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalDocuments: '-',
    indexedVectors: '-',
    searchCount: '-'
  });

  const session = {
    user: { name: 'Sarah Executive', role: 'Decision Maker' }
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/search/metrics');
        const data = await res.json();
        if (data.data) {
          setMetrics(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Good Morning, {session.user.name.split(' ')[0]}</h1>
        <p className="text-slate-500 mt-2 text-lg">Here is an overview of your enterprise knowledge base.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Documents" 
          value={metrics.totalDocuments} 
          trend="Active" 
          trendUp={true} 
          icon={<Files className="text-blue-500" />} 
        />
        <StatCard 
          title="Indexed Vectors" 
          value={metrics.indexedVectors} 
          trend="Synced with Qdrant" 
          trendUp={true} 
          icon={<Database className="text-indigo-500" />} 
        />
        <StatCard 
          title="Copilot Queries" 
          value={metrics.searchCount} 
          trend="Active usage" 
          trendUp={true} 
          icon={<Activity className="text-emerald-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Activity Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Upload CTA */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Upload className="text-blue-600" size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Build your Knowledge Base</h3>
            <p className="text-slate-500 max-w-md mb-6">Upload PDFs, DOCX, or TXT files. Copilot will automatically extract, clean, and vectorize the content for semantic search.</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
              <Files size={18} />
              Upload Document
            </button>
          </div>

          {/* Processing Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recent Processing Activity</h3>
              <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
            </div>
            <div className="divide-y divide-slate-100">
              <ActivityItem doc="Q3_Financial_Report.pdf" status="Completed" time="10 mins ago" />
              <ActivityItem doc="Engineering_Architecture.docx" status="Processing" time="1 hour ago" />
              <ActivityItem doc="HR_Policies_2026.pdf" status="Failed" time="2 hours ago" />
            </div>
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="space-y-8">
          
          {/* Recent Searches */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Recent Searches</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="text-slate-400 mt-0.5" size={16} />
                <p className="text-sm text-slate-600 leading-tight">What were our key risk factors in Q3?</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="text-slate-400 mt-0.5" size={16} />
                <p className="text-sm text-slate-600 leading-tight">Summarize the onboarding process for engineers.</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="text-slate-400 mt-0.5" size={16} />
                <p className="text-sm text-slate-600 leading-tight">List all security compliance requirements.</p>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-slate-900 rounded-2xl shadow-sm p-6 text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Server className="text-blue-400" size={18} /> System Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">PostgreSQL DB</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Online</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Qdrant Vector DB</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Online</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Extraction Worker</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Idle</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
        <div className="text-3xl font-bold text-slate-900 mb-2">{value}</div>
        <div className="text-sm text-emerald-600 font-medium flex items-center gap-1">
          <TrendingUp size={14} /> {trend}
        </div>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl">
        {icon}
      </div>
    </div>
  );
}

function ActivityItem({ doc, status, time }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
          <Files size={18} />
        </div>
        <div>
          <p className="font-medium text-slate-900 text-sm">{doc}</p>
          <p className="text-xs text-slate-500">{time}</p>
        </div>
      </div>
      <div>
        {status === 'Completed' && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">Completed</span>}
        {status === 'Processing' && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1"><Activity size={12}/> Processing</span>}
        {status === 'Failed' && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 flex items-center gap-1"><AlertCircle size={12}/> Failed</span>}
      </div>
    </div>
  );
}

function Server(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}
