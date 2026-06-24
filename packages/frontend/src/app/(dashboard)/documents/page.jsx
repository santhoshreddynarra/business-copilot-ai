'use client';

import React, { useState } from 'react';
import { Upload, FileText, Search, Filter, MoreVertical, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function KnowledgeBasePage() {
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  
  // Mock Data
  const documents = [
    { id: 1, name: 'Q3_Financial_Report_2026.pdf', type: 'PDF', date: 'Today, 09:41 AM', status: 'completed' },
    { id: 2, name: 'Engineering_Architecture_V2.docx', type: 'DOCX', date: 'Yesterday, 04:20 PM', status: 'completed' },
    { id: 3, name: 'Employee_Handbook_2026.pdf', type: 'PDF', date: 'Oct 12, 11:30 AM', status: 'processing' },
    { id: 4, name: 'Marketing_Strategy_Draft.txt', type: 'TXT', date: 'Oct 10, 02:15 PM', status: 'failed' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Knowledge Base</h1>
          <p className="text-slate-500 mt-1">Manage and index your enterprise documents.</p>
        </div>
        <button 
          onClick={() => setUploadModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Upload size={18} />
          Upload Document
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search documents..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider font-semibold text-slate-500">
                <th className="p-4 pl-6">Document Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Date Added</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {documents.map(doc => (
                <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 pl-6 flex items-center gap-3 font-medium text-slate-900">
                    <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    {doc.name}
                  </td>
                  <td className="p-4 text-slate-500">{doc.type}</td>
                  <td className="p-4 text-slate-500">{doc.date}</td>
                  <td className="p-4"><StatusBadge status={doc.status} /></td>
                  <td className="p-4 text-right pr-6">
                    <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal Overlay */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Upload Document</h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8">
              <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-12 flex flex-col items-center justify-center text-center hover:bg-slate-100 hover:border-blue-400 transition-colors cursor-pointer">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Upload size={24} />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-1">Click or drag file to this area</h4>
                <p className="text-slate-500 text-sm">Supports PDF, DOCX, and TXT (Max 50MB)</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setUploadModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                Start Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'completed') {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle size={12}/> Vectorized</span>;
  }
  if (status === 'processing') {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><Clock size={12} className="animate-pulse"/> Processing</span>;
  }
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200"><AlertCircle size={12}/> Failed</span>;
}
