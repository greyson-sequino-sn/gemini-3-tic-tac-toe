import React, { useState } from 'react';
import { Copy, Check, Wifi, ArrowRight } from 'lucide-react';

interface OnlineSetupProps {
  myPeerId: string | null;
  connectToPeer: (peerId: string) => void;
  isConnecting: boolean;
  connectionError: string | null;
}

export const OnlineSetup: React.FC<OnlineSetupProps> = ({ 
  myPeerId, 
  connectToPeer, 
  isConnecting,
  connectionError
}) => {
  const [remoteId, setRemoteId] = useState('');
  const [view, setView] = useState<'menu' | 'host' | 'join'>('menu');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (myPeerId) {
      navigator.clipboard.writeText(myPeerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (view === 'menu') {
    return (
      <div className="w-full max-w-md bg-slate-800/40 border border-slate-700 rounded-xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center mb-2">
          <h3 className="text-xl font-bold text-white mb-1">Online Multiplayer</h3>
          <p className="text-slate-400 text-sm">Play with a friend on a different device</p>
        </div>
        
        <button 
          onClick={() => setView('host')}
          className="w-full py-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 hover:border-emerald-500 text-emerald-400 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 group"
        >
          <Wifi className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Host Game
        </button>
        
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-sm">OR</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        <button 
          onClick={() => setView('join')}
          className="w-full py-4 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 hover:border-indigo-500 text-indigo-400 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 group"
        >
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          Join Game
        </button>
      </div>
    );
  }

  if (view === 'host') {
    return (
      <div className="w-full max-w-md bg-slate-800/40 border border-slate-700 rounded-xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mb-4">Share this Code</h3>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
            <code className="text-2xl font-mono font-bold text-emerald-400 tracking-wider">
              {myPeerId || 'Generating...'}
            </code>
            <button 
              onClick={copyToClipboard}
              className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-white"
              title="Copy Code"
            >
              {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
            </button>
          </div>
          <p className="text-slate-500 text-sm mt-4 animate-pulse">Waiting for opponent to join...</p>
        </div>
        <button onClick={() => setView('menu')} className="text-slate-400 hover:text-white text-sm underline mt-2">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-slate-800/40 border border-slate-700 rounded-xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-2">
        <h3 className="text-lg font-bold text-white">Enter Host Code</h3>
      </div>
      
      <div className="flex gap-2">
        <input 
          type="text" 
          value={remoteId}
          onChange={(e) => setRemoteId(e.target.value)}
          placeholder="e.g. a4f2"
          className="flex-1 bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-slate-600"
        />
        <button 
          onClick={() => connectToPeer(remoteId)}
          disabled={!remoteId || isConnecting}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {isConnecting ? '...' : 'Join'}
        </button>
      </div>
      
      {connectionError && (
         <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-md border border-red-900/50">{connectionError}</p>
      )}

      <button onClick={() => setView('menu')} className="text-slate-400 hover:text-white text-sm underline mt-2 text-center">
        Back
      </button>
    </div>
  );
};