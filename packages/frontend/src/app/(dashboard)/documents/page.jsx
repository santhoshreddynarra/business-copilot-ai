'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Search, Filter, MoreVertical, X, CheckCircle, Clock, AlertCircle, Loader2, FileUp, Trash2, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/apiClient';

// ─── API Functions ────────────────────────────────────────────────────────────

async function fetchDocuments() {
  const res = await fetchWithAuth(`/api/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

async function uploadDocument(formData) {
  const res = await fetchWithAuth(`/api/documents/upload`, {
    method: 'POST',
    body: formData,
    // Note: Do NOT set Content-Type — browser sets it automatically with boundary for multipart
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Upload failed' } }));
    throw new Error(err?.error?.message || 'Upload failed');
  }
  return res.json();
}

async function triggerProcessing(documentId) {
  const res = await fetchWithAuth(`/api/documents/${documentId}/process`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to trigger processing');
  return res.json();
}

async function deleteDocument(documentId) {
  const res = await fetchWithAuth(`/api/documents/${documentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KnowledgeBasePage() {
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch real document list
  const { data: docsResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    refetchInterval: 10000, // Poll every 10s to catch processing updates
  });

  const rawDocs = docsResponse?.data || [];

  // Filter by search query
  const documents = rawDocs.filter(doc =>
    doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.versions?.[0]?.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => refetch()}
            title="Refresh document list"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Document Table */}
        <div className="overflow-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col divide-y divide-slate-100">
              {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-14 h-14 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-3">
                <AlertCircle size={28} />
              </div>
              <p className="font-semibold text-slate-700">Failed to load documents</p>
              <p className="text-sm text-slate-400 mt-1">Make sure the backend server is running on port 4000.</p>
              <button onClick={() => refetch()} className="mt-4 text-sm text-blue-600 hover:underline">Try again</button>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-14 h-14 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mb-3">
                <FileUp size={28} />
              </div>
              <p className="font-semibold text-slate-700">{searchQuery ? 'No documents match your search' : 'No documents yet'}</p>
              <p className="text-sm text-slate-400 mt-1">{searchQuery ? 'Try a different search term.' : 'Upload a file to get started.'}</p>
              {!searchQuery && (
                <button onClick={() => setUploadModalOpen(true)} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Upload your first document
                </button>
              )}
            </div>
          ) : (
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
                  <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3 font-medium text-slate-900">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 truncate max-w-xs">{doc.title || doc.versions?.[0]?.originalName}</p>
                          {doc.versions?.[0]?.originalName && doc.title !== doc.versions?.[0]?.originalName && (
                            <p className="text-xs text-slate-400 truncate max-w-xs">{doc.versions[0].originalName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 uppercase text-xs font-mono">
                      {doc.fileType?.split('/')[1]?.replace('vnd.openxmlformats-officedocument.wordprocessingml.document', 'DOCX') || '—'}
                    </td>
                    <td className="p-4 text-slate-500">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-4">
                      <ProcessingStatusBadge doc={doc} />
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${doc.title}"?`)) {
                            deleteMutation.mutate(doc.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-all"
                        title="Delete document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadModal
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => {
            setUploadModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['documents'] });
          }}
        />
      )}
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | processing | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const MAX_SIZE_MB = 50;

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Invalid file type. Only PDF, DOCX, and TXT are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      return;
    }
    setErrorMessage('');
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleFileInputChange = (e) => {
    validateAndSetFile(e.target.files?.[0]);
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setErrorMessage('');

    try {
      // Step 1: Upload the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', selectedFile.name);

      const uploadResult = await uploadDocument(formData);
      const documentId = uploadResult?.data?.id;

      if (!documentId) throw new Error('Upload succeeded but no document ID returned.');

      // Step 2: Trigger AI pipeline
      setUploadState('processing');
      try {
        await triggerProcessing(documentId);
      } catch (procErr) {
        // Non-fatal: document was saved, just pipeline couldn't start
        console.warn('Could not trigger AI pipeline:', procErr.message);
      }

      setUploadState('success');
      setTimeout(() => {
        onSuccess();
      }, 1200);

    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setUploadState('error');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileUp size={18} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Upload Document</h3>
          </div>
          <button
            onClick={onClose}
            disabled={uploadState === 'uploading' || uploadState === 'processing'}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {selectedFile ? (
              <>
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle size={28} />
                </div>
                <p className="font-semibold text-slate-900">{selectedFile.name}</p>
                <p className="text-sm text-slate-500 mt-1">{formatFileSize(selectedFile.size)}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setUploadState('idle'); }}
                  className="mt-3 text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Remove file
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <Upload size={24} />
                </div>
                <p className="font-semibold text-slate-900">Click or drag file here</p>
                <p className="text-sm text-slate-500 mt-1">PDF, DOCX, or TXT — max 50MB</p>
              </>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {errorMessage}
            </div>
          )}

          {/* Upload Progress States */}
          {(uploadState === 'uploading' || uploadState === 'processing') && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <Loader2 size={18} className="text-blue-600 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {uploadState === 'uploading' ? 'Uploading file to server...' : 'Triggering AI processing pipeline...'}
                </p>
                <p className="text-xs text-blue-600 mt-0.5">Please don&apos;t close this window.</p>
              </div>
            </div>
          )}

          {uploadState === 'success' && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-800">Upload successful! AI pipeline is now running.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploadState === 'uploading' || uploadState === 'processing'}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleStartUpload}
            disabled={!selectedFile || uploadState === 'uploading' || uploadState === 'processing' || uploadState === 'success'}
            className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(uploadState === 'uploading' || uploadState === 'processing') && <Loader2 size={14} className="animate-spin" />}
            {uploadState === 'idle' || uploadState === 'error' ? 'Start Upload' : uploadState === 'uploading' ? 'Uploading...' : uploadState === 'processing' ? 'Processing...' : 'Done!'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProcessingStatusBadge({ doc }) {
  // Derive status from the processing/upload jobs attached to document
  const processingJob = doc.processingJob;
  const uploadJobs = doc.jobs || [];
  const latestUploadJob = uploadJobs[0];

  if (processingJob?.status === 'COMPLETED') {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle size={12} /> Vectorized</span>;
  }
  if (processingJob?.status === 'EXTRACTING' || processingJob?.status === 'CHUNKING' || processingJob?.status === 'EMBEDDING') {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Clock size={12} className="animate-pulse" /> Processing</span>;
  }
  if (processingJob?.status === 'FAILED') {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><AlertCircle size={12} /> Failed</span>;
  }
  if (latestUploadJob?.status === 'COMPLETED') {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Uploaded</span>;
  }
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock size={12} /> Pending</span>;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
      <div className="w-9 h-9 rounded-lg bg-slate-100 animate-pulse flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse"></div>
        <div className="h-3 bg-slate-100 rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse"></div>
    </div>
  );
}
