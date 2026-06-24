'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  BrainCircuit, 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  FileText, 
  Database, 
  Network, 
  Lock,
  Server,
  Code2
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Global Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-blue-600" size={24} />
            <span className="font-bold text-lg tracking-tight">Business Copilot</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
            <a href="#tech" className="hover:text-blue-600 transition-colors">Architecture</a>
            <a href="#security" className="hover:text-blue-600 transition-colors">Security</a>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/login')} 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden sm:block"
            >
              Sign In
            </button>
            <button 
              onClick={() => router.push('/login')} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
          Your Company's Brain. <br />
          <span className="text-blue-600">Instantly Accessible.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed">
          Transform scattered documents into actionable knowledge. Upload your PDFs, reports, and policies, and let our AI provide source-backed answers and business insights in seconds.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            Start Free Trial <ArrowRight size={20} />
          </button>
          <button className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-8 py-4 rounded-lg text-lg font-medium shadow-sm transition-all">
            View Demo
          </button>
        </div>

        {/* Hero Visual Mockup */}
        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-10"></div>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform perspective-1000 rotate-x-12 scale-100 sm:scale-105 transition-transform duration-700 hover:scale-100 hover:rotate-0">
            <div className="h-12 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="p-8 text-left">
              <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0"></div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 text-slate-700">
                  Summarize the key risk factors mentioned in the Q3 Financial Report.
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <BrainCircuit size={16} />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-none p-4 text-slate-800">
                  <p className="mb-3">Based on the uploaded <span className="font-semibold text-blue-700 bg-blue-100 px-1 rounded cursor-pointer">Q3_Financial_Report.pdf</span>, the key risk factors are:</p>
                  <ul className="list-disc pl-5 space-y-2 mb-3">
                    <li><strong>Supply Chain Volatility:</strong> Lead times for hardware components have increased by 14% (Page 12).</li>
                    <li><strong>Regulatory Compliance:</strong> Upcoming EU data privacy regulations require an estimated $1.2M in compliance auditing (Page 18).</li>
                  </ul>
                  <p className="text-xs text-slate-500 mt-4 flex items-center gap-1"><ShieldCheck size={12}/> Responses are generated securely using your isolated enterprise data.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">From raw data to actionable intelligence</h2>
          <p className="text-lg text-slate-500 mb-16 max-w-2xl mx-auto">Upload your documents and let our pipeline handle the heavy lifting of extraction, chunking, and vectorization.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10 -translate-y-1/2"></div>
            
            <WorkflowStep num="1" title="Upload Documents" desc="Drag & drop PDFs, DOCX, and TXT files securely into your isolated workspace." />
            <WorkflowStep num="2" title="AI Processing" desc="Automated text extraction, intelligent cleaning, and semantic chunking." />
            <WorkflowStep num="3" title="Semantic Search" desc="Advanced vector embeddings map concepts, not just keywords." />
            <WorkflowStep num="4" title="Business Insights" desc="Chat with your data using LLMs to generate reports and summaries." />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Enterprise-grade capabilities</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={<FileText />} title="Document Analysis" desc="Our engine parses complex formatting, tables, and dense text with unparalleled accuracy." />
            <FeatureCard icon={<Search />} title="Semantic Search" desc="Powered by state-of-the-art vector embeddings, retrieve the exact paragraph you need in milliseconds." />
            <FeatureCard icon={<BrainCircuit />} title="AI Copilot" desc="Chat with your data to generate summaries and ask complex questions with full source citations." />
            <FeatureCard icon={<ShieldCheck />} title="Enterprise Security" desc="Strict user isolation, role-based access control, and zero-retention policies on our LLMs." />
            <FeatureCard icon={<Database />} title="Knowledge Management" desc="Organize, tag, and manage thousands of documents across different team workspaces." />
            <FeatureCard icon={<Network />} title="Decision Intelligence" desc="Synthesize data across multiple reports simultaneously to make faster, data-driven decisions." />
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-blue-600 opacity-20 blur-3xl"></div>
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl font-bold mb-4">Built for scale. Architected for speed.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Our production-grade microservices architecture ensures reliable, lightning-fast processing for massive enterprise datasets.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
            <TechBadge name="Next.js" icon={<Code2 />} />
            <TechBadge name="FastAPI" icon={<Server />} />
            <TechBadge name="PostgreSQL" icon={<Database />} />
            <TechBadge name="Qdrant DB" icon={<Network />} />
            <TechBadge name="LangChain" icon={<BrainCircuit />} />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6">Unlock Your Enterprise Knowledge Today</h2>
          <p className="text-xl text-blue-100 mb-10">Join forward-thinking companies making faster decisions with Business Copilot AI.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => router.push('/login')}
              className="bg-white text-blue-600 hover:bg-slate-50 px-8 py-4 rounded-lg text-lg font-bold shadow-lg transition-all"
            >
              Start Free Trial
            </button>
            <button className="bg-blue-700 border border-blue-500 text-white hover:bg-blue-800 px-8 py-4 rounded-lg text-lg font-medium transition-all">
              Request Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 text-center text-sm border-t border-slate-900">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BrainCircuit size={20} />
          <span className="font-bold text-white tracking-tight">Business Copilot AI</span>
        </div>
        <p>© {new Date().getFullYear()} Business Copilot AI Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

function WorkflowStep({ num, title, desc }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative z-10 flex flex-col items-center text-center hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl mb-4 border-4 border-white shadow-sm">
        {num}
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function TechBadge({ name, icon }) {
  return (
    <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-slate-700 transition-colors">
      <div className="text-blue-400">
        {icon}
      </div>
      <span className="font-semibold text-sm">{name}</span>
    </div>
  );
}
