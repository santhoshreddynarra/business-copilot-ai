'use client';

import React, { useState } from 'react';
import { Search, Loader2, FileText, BrainCircuit, MessageSquare, ExternalLink } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setResults(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4000/api/search', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query, topK: 5 })
      });
      
      const data = await response.json();
      
      if (data.data) {
        setResults(data.data.map((r, i) => ({
          id: r.chunkId || i,
          score: r.score,
          document: r.source?.documentName || 'Unknown',
          content: r.content,
          page: 1 // We could parse this from metadata if available
        })));
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Search Header Area */}
      <div className="bg-white border-b border-slate-200 p-8 flex-shrink-0">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">Semantic Search</h1>
          <p className="text-slate-500 text-lg">Ask natural language questions to instantly find exact paragraphs across your entire knowledge base.</p>
        </div>

        <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-blue-600' : 'text-slate-400 group-focus-within:text-blue-600'}`} size={24} />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 'What were our key risk factors in Q3?'" 
            className="w-full pl-14 pr-32 py-4 bg-white border border-slate-300 rounded-2xl text-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none shadow-sm transition-all"
          />
          <button 
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-80 flex items-center justify-center min-w-[100px]"
          >
            {isSearching ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
          </button>
        </form>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          
          {!results && !isSearching && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <BrainCircuit size={48} className="mb-4 opacity-20" />
              <p>Type a question above to search your enterprise documents.</p>
            </div>
          )}

          {isSearching && (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-8"></div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 h-40"></div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 h-40"></div>
            </div>
          )}

          {results && !isSearching && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Generated AI Answer Summary (Future RAG integration) */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 shadow-sm">
                <div className="flex items-center gap-2 text-blue-800 font-bold mb-3">
                  <BrainCircuit size={20} />
                  Copilot Summary
                </div>
                <p className="text-slate-800 leading-relaxed">
                  Based on the retrieved documents, the primary risk factor in Q3 is a <strong className="bg-blue-100 px-1 rounded">14% increase in hardware lead times</strong> from the APAC region due to supply chain volatility. To mitigate this, engineering proposes shifting 30% of workloads to AWS spot instances in Q4.
                </p>
                <div className="mt-4 flex justify-end">
                  <button className="flex items-center gap-2 text-sm text-blue-700 font-medium hover:text-blue-800 bg-white border border-blue-200 px-3 py-1.5 rounded-lg shadow-sm">
                    <MessageSquare size={16} /> Continue in Chat
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Semantic Matches ({results.length})</h3>
              
              <div className="space-y-6">
                {results.map(result => (
                  <div key={result.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                        <FileText size={16} className="text-blue-500" />
                        {result.document}
                        <ExternalLink size={14} className="text-slate-400 ml-1" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Similarity</span>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-bold">
                          {Math.round(result.score * 100)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      &quot;{result.content}&quot;
                    </p>
                    <div className="mt-4 text-xs font-semibold text-slate-400 flex items-center gap-2">
                      <span className="bg-slate-100 px-2 py-1 rounded">Page {result.page}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
