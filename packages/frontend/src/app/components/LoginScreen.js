import React from 'react';
import { BrainCircuit, ShieldCheck, Zap, ArrowRight, FileText } from 'lucide-react';

export default function LoginScreen({ onLoginPat, oauthLoading, errorMsg }) {
  // We simulate logging in for the MVP
  const handleSimulateLogin = () => {
    onLoginPat({
      authenticated: true,
      user: { name: 'Sarah Executive', role: 'Decision Maker' }
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900">
      {/* Left Side - Brand & Value Prop */}
      <div className="md:w-1/2 bg-blue-600 text-white p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500 opacity-50 blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500 opacity-50 blur-3xl mix-blend-screen"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <BrainCircuit size={32} className="text-blue-200" />
            <h1 className="text-2xl font-bold tracking-tight">Business Copilot AI</h1>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Unlock your enterprise knowledge. <br/>
            <span className="text-blue-200">Empower every decision.</span>
          </h2>
          
          <p className="text-lg text-blue-100 mb-12 max-w-md">
            The secure, intelligent platform for document analysis, semantic search, and AI-driven business insights.
          </p>

          <div className="space-y-6">
            <FeatureRow icon={<ShieldCheck />} title="Enterprise-Grade Security" desc="SOC2 compliant data processing with strict user isolation." />
            <FeatureRow icon={<Zap />} title="Instant Semantic Search" desc="Find exact paragraphs across thousands of PDFs in milliseconds." />
            <FeatureRow icon={<FileText />} title="Automated Extraction" desc="Seamlessly processes PDFs, DOCX, and text formats." />
          </div>
        </div>
        
        <div className="relative z-10 mt-12 text-sm text-blue-200">
          © 2026 Business Copilot AI Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side - Auth Flow */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Sign in to access your secure knowledge base.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4 mt-8">
            <button 
              onClick={handleSimulateLogin}
              disabled={oauthLoading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            
            <button 
              onClick={handleSimulateLogin}
              disabled={oauthLoading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" preserveAspectRatio="xMidYMid"><path d="M121.666 121.666H0V0h121.666v121.666zM256 121.666H134.335V0H256v121.666zM121.666 256H0V134.335h121.666V256zM256 256H134.335V134.335H256V256z" fill="#00a4ef"/></svg>
              Continue with Microsoft
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">Or continue with SSO</span>
              </div>
            </div>

            <button 
              onClick={handleSimulateLogin}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-sm"
            >
              Sign in with Email
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 bg-blue-500/30 rounded-lg text-blue-100">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-blue-200 mt-1">{desc}</p>
      </div>
    </div>
  );
}
