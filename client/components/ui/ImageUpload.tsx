
import React, { useRef, useState } from 'react';
import { Button } from './Button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, value, onChange, className = '' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      
      <div className="flex items-start gap-4">
        {value ? (
          <div className="relative group">
            <img 
              src={value} 
              alt="Preview" 
              className="h-32 w-full max-w-xs object-cover rounded-lg border border-slate-200" 
            />
            <button 
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="h-32 w-full max-w-xs rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-slate-50 cursor-pointer transition-all"
          >
            {loading ? (
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            ) : (
                <>
                    <ImageIcon size={32} className="mb-2" />
                    <span className="text-xs font-medium">Click to upload image</span>
                </>
            )}
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />
        
        {!value && (
            <div className="mt-2">
                 <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} className="mr-2" /> Upload
                 </Button>
            </div>
        )}
      </div>
    </div>
  );
};
