
import React from 'react';
import { Smartphone, Tablet, Monitor, RotateCcw } from 'lucide-react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DevicePreviewToolbarProps {
  currentDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

export const DevicePreviewToolbar: React.FC<DevicePreviewToolbarProps> = ({ currentDevice, onDeviceChange }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 p-2 bg-slate-900 text-white rounded-full shadow-2xl border border-slate-700 animate-fade-in">
      <span className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Preview</span>
      
      <button
        onClick={() => onDeviceChange('mobile')}
        className={`p-2 rounded-full transition-all ${currentDevice === 'mobile' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
        title="Mobile (375px)"
      >
        <Smartphone size={18} />
      </button>
      
      <button
        onClick={() => onDeviceChange('tablet')}
        className={`p-2 rounded-full transition-all ${currentDevice === 'tablet' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
        title="Tablet (768px)"
      >
        <Tablet size={18} />
      </button>
      
      <button
        onClick={() => onDeviceChange('desktop')}
        className={`p-2 rounded-full transition-all ${currentDevice === 'desktop' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
        title="Desktop (Full)"
      >
        <Monitor size={18} />
      </button>

      <div className="w-px h-6 bg-slate-700 mx-1"></div>

      <button
        onClick={() => onDeviceChange('desktop')}
        className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
        title="Reset View"
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
};
