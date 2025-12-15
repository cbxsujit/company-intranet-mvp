
import React from 'react';
import { Button } from './ui/Button';
import { X, Crown } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  message?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, featureName, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Crown size={32} className="text-amber-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Upgrade to Pro</h2>
          <p className="text-slate-600 mb-6">
            {message || `The ${featureName} feature is available in the Pro plan.`}
          </p>
          
          <div className="space-y-3">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-lg shadow-blue-500/30" onClick={() => alert("Redirecting to billing...")}>
              Upgrade Plan
            </Button>
            <button 
              onClick={onClose}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium"
            >
              Maybe Later
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50 px-6 py-4 text-xs text-center text-slate-500 border-t border-slate-100">
          Unlock unlimited users, spaces, AI features, and advanced analytics.
        </div>
      </div>
    </div>
  );
};
