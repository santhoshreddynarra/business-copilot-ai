'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Search, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../components/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left Side - Brand & Value Prop */}
      <div className="md:w-5/12 bg-blue-700 text-white p-12 flex flex-col justify-between relative overflow-hidden hidden md:flex">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600 opacity-80 blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-600 opacity-80 blur-3xl mix-blend-screen"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16 cursor-pointer" onClick={() => router.push('/')}>
            <BrainCircuit size={32} className="text-white" />
            <span className="text-2xl font-bold tracking-tight">Business Copilot</span>
          </div>
          
          <h2 className="text-4xl font-bold leading-tight mb-6">
            The intelligent core of your enterprise.
          </h2>
          
          <p className="text-lg text-blue-100 mb-12 max-w-md">
            Sign in to securely access your organization's knowledge base and start finding insights instantly.
          </p>

          <div className="space-y-6">
            <FeatureRow icon={<Search />} title="Semantic AI Search" desc="Find exact answers across thousands of documents." />
            <FeatureRow icon={<ShieldCheck />} title="Enterprise Security" desc="SOC2 compliant data isolation and privacy." />
            <FeatureRow icon={<Zap />} title="Instant Insights" desc="Generate summaries and reports in seconds." />
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-blue-200 mt-12">
          © {new Date().getFullYear()} Business Copilot AI Inc.
        </div>
      </div>

      {/* Right Side - Auth Flow */}
      <div className="md:w-7/12 w-full flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-8">
          
          {/* Mobile Header */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <BrainCircuit size={40} className="text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          </div>

          <div className="text-center hidden md:block">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="mt-2 text-slate-500">Sign in to your secure workspace.</p>
          </div>

          <div className="space-y-4 mt-8">
            <button 
              onClick={handleSimulateLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-all shadow-sm"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            
            <button 
              onClick={handleSimulateLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" preserveAspectRatio="xMidYMid"><path d="M121.666 121.666H0V0h121.666v121.666zM256 121.666H134.335V0H256v121.666zM121.666 256H0V134.335h121.666V256zM256 256H134.335V134.335H256V256z" fill="#00a4ef"/></svg>
              Continue with Microsoft
            </button>

            <div className="relative my-8 py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-slate-500">Or sign in with email</span>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Work Email</label>
                <input 
                  id="email"
                  type="email" 
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  id="password"
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue with Email'}
              </button>
            </form>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-green-600" />
            <span>Secure, encrypted, and SOC2 compliant.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2.5 bg-blue-600/50 border border-blue-500/30 rounded-xl text-blue-100 shadow-inner">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white tracking-tight">{title}</h3>
        <p className="text-sm text-blue-200 mt-1 leading-snug">{desc}</p>
      </div>
    </div>
  );
}
