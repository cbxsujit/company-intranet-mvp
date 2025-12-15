
import React, { useState, useEffect } from 'react';
import { User, Company, NavQuickLink, CustomDomain } from '../types';
import { getCompany, updateCompany, getNavQuickLinks, deleteNavQuickLink, checkFeatureAccess, getCustomDomains, addCustomDomain, verifyCustomDomain, deleteCustomDomain } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Link } from 'react-router-dom';
import { Palette, Link as LinkIcon, Plus, Edit2, Trash2, Save, Image as ImageIcon, Globe, Type, Lock, Bot, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { UpgradeModal } from '../components/UpgradeModal';

interface CompanySettingsProps {
  currentUser: User;
}

// Font Options
const FONT_OPTIONS = [
    { label: 'System Default', value: '' },
    { label: 'Inter', value: "'Inter', sans-serif" },
    { label: 'Roboto', value: "'Roboto', sans-serif" },
    { label: 'Open Sans', value: "'Open Sans', sans-serif" },
    { label: 'Lato', value: "'Lato', sans-serif" }
];

export const CompanySettings: React.FC<CompanySettingsProps> = ({ currentUser }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<NavQuickLink[]>([]);
  const [activeTab, setActiveTab] = useState<'branding' | 'links' | 'ai' | 'domain'>('branding');
  const [hasAdvancedBranding, setHasAdvancedBranding] = useState(false);
  const [hasAI, setHasAI] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Domain State
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);

  // Form states
  const [brandingForm, setBrandingForm] = useState({
    primaryColor: '',
    secondaryColor: '',
    accentColor: '',
    homeTitle: '',
    showLogoInHeader: true,
    logoURL: '',
    faviconURL: '',
    headingFontFamily: '',
    bodyFontFamily: ''
  });
  
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
    fetchData();
    setHasAdvancedBranding(checkFeatureAccess(currentUser.companyId, 'advanced_branding'));
    setHasAI(checkFeatureAccess(currentUser.companyId, 'ai'));
  }, [currentUser.companyId]);

  const fetchData = () => {
    const comp = getCompany(currentUser.companyId);
    if (comp) {
        setCompany(comp);
        setBrandingForm({
            primaryColor: comp.primaryColor || '#2563eb',
            secondaryColor: comp.secondaryColor || '#f8fafc',
            accentColor: comp.accentColor || '#1d4ed8',
            homeTitle: comp.homeTitle || '',
            showLogoInHeader: comp.showLogoInHeader ?? true,
            logoURL: comp.logoURL || '',
            faviconURL: comp.faviconURL || '',
            headingFontFamily: comp.headingFontFamily || '',
            bodyFontFamily: comp.bodyFontFamily || ''
        });
        setGeminiKey(comp.geminiApiKey || '');
        setDomains(getCustomDomains(comp.id));
    }
    const quickLinks = getNavQuickLinks(currentUser.companyId);
    setLinks(quickLinks);
  };

  const handleBrandingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setLoading(true);
    try {
        // If no advanced branding, ensure we don't save restricted fields even if UI was somehow bypassed
        const payload = {
            ...company,
            ...brandingForm
        };
        if (!hasAdvancedBranding) {
            delete payload.faviconURL;
            delete payload.headingFontFamily;
            delete payload.bodyFontFamily;
        }

        await updateCompany(payload);
        window.location.reload(); 
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleAISave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!company) return;
      setLoading(true);
      try {
          await updateCompany({
              ...company,
              geminiApiKey: geminiKey
          });
          alert('AI settings saved.');
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteLink = async (id: string) => {
      if(!window.confirm('Disable this link?')) return;
      await deleteNavQuickLink(id);
      fetchData();
  };

  // Domain Handlers
  const handleAddDomain = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newDomain || !company) return;
      setDomainLoading(true);
      try {
          await addCustomDomain(company.id, newDomain);
          setNewDomain('');
          fetchData();
      } catch (err: any) {
          alert(err.message);
      } finally {
          setDomainLoading(false);
      }
  };

  const handleVerifyDomain = async (id: string) => {
      setDomainLoading(true);
      try {
          const updated = await verifyCustomDomain(id);
          if (updated.isVerified) {
              alert('Domain verified successfully!');
          } else {
              alert('Verification failed. Please check your DNS settings.');
          }
          fetchData();
      } catch (err: any) {
          alert(err.message);
      } finally {
          setDomainLoading(false);
      }
  };

  const handleDeleteDomain = async (id: string) => {
      if (!window.confirm('Remove this domain?')) return;
      await deleteCustomDomain(id);
      fetchData();
  };

  if (!company) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
        <UpgradeModal 
            isOpen={showUpgradeModal} 
            onClose={() => setShowUpgradeModal(false)} 
            featureName="Pro Features" 
            message="This feature is available in the Pro plan."
        />

        <div>
            <h1 className="text-2xl font-bold text-slate-900">Company Settings</h1>
            <div className="flex gap-2 items-center mt-1">
                <p className="text-sm text-slate-500">Manage configuration.</p>
                {company.inviteCode && (
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono border border-indigo-100">
                        Invite Code: <strong>{company.inviteCode}</strong>
                    </span>
                )}
            </div>
        </div>

        <div className="flex space-x-4 border-b border-slate-200 overflow-x-auto">
            <button
                className={`pb-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'branding' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('branding')}
            >
                <div className="flex items-center gap-2">
                    <Palette size={16} /> Branding
                </div>
            </button>
            <button
                className={`pb-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'links' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('links')}
            >
                 <div className="flex items-center gap-2">
                    <LinkIcon size={16} /> Navigation Links
                </div>
            </button>
            <button
                className={`pb-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'ai' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('ai')}
            >
                 <div className="flex items-center gap-2">
                    <Bot size={16} /> AI Integration
                </div>
            </button>
            <button
                className={`pb-2 px-1 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'domain' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('domain')}
            >
                 <div className="flex items-center gap-2">
                    <Globe size={16} /> Custom Domain
                </div>
            </button>
        </div>

        {activeTab === 'branding' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-2xl">
                <form onSubmit={handleBrandingSave} className="space-y-6">
                    {/* Colors */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Input 
                                label="Primary Color" 
                                type="color"
                                className="h-12 p-1 cursor-pointer"
                                value={brandingForm.primaryColor} 
                                onChange={e => setBrandingForm({...brandingForm, primaryColor: e.target.value})} 
                            />
                            <p className="text-xs text-slate-500 mt-1">Header background</p>
                        </div>
                        <div>
                            <Input 
                                label="Secondary Color" 
                                type="color"
                                className="h-12 p-1 cursor-pointer"
                                value={brandingForm.secondaryColor} 
                                onChange={e => setBrandingForm({...brandingForm, secondaryColor: e.target.value})} 
                            />
                            <p className="text-xs text-slate-500 mt-1">Page background</p>
                        </div>
                        <div>
                            <Input 
                                label="Accent Color" 
                                type="color"
                                className="h-12 p-1 cursor-pointer"
                                value={brandingForm.accentColor} 
                                onChange={e => setBrandingForm({...brandingForm, accentColor: e.target.value})} 
                            />
                            <p className="text-xs text-slate-500 mt-1">Buttons & Links</p>
                        </div>
                    </div>

                    {/* Typography Section */}
                    <div className="border-t border-slate-100 pt-6 relative">
                        {!hasAdvancedBranding && (
                            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                                <Button type="button" variant="secondary" onClick={() => setShowUpgradeModal(true)} className="shadow-lg">
                                    <Lock size={16} className="mr-2"/> Unlock Typography
                                </Button>
                            </div>
                        )}
                        <label className="block text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                            <Type size={16}/> Typography
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Heading Font</label>
                                <select 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={brandingForm.headingFontFamily}
                                    onChange={e => setBrandingForm({...brandingForm, headingFontFamily: e.target.value})}
                                    disabled={!hasAdvancedBranding}
                                >
                                    {FONT_OPTIONS.map(opt => (
                                        <option key={opt.label} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Body Font</label>
                                <select 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={brandingForm.bodyFontFamily}
                                    onChange={e => setBrandingForm({...brandingForm, bodyFontFamily: e.target.value})}
                                    disabled={!hasAdvancedBranding}
                                >
                                    {FONT_OPTIONS.map(opt => (
                                        <option key={opt.label} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <Input 
                        label="Home Screen Title" 
                        value={brandingForm.homeTitle} 
                        onChange={e => setBrandingForm({...brandingForm, homeTitle: e.target.value})} 
                        placeholder="Welcome to Our Intranet"
                    />

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="showLogo"
                            checked={brandingForm.showLogoInHeader}
                            onChange={e => setBrandingForm({...brandingForm, showLogoInHeader: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="showLogo" className="text-sm text-slate-700">Show Company Logo in Header</label>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <ImageIcon size={16}/> Company Logo
                        </label>
                        <div className="flex gap-4 items-start">
                            <div className="flex-1">
                                <Input 
                                    value={brandingForm.logoURL} 
                                    onChange={e => setBrandingForm({...brandingForm, logoURL: e.target.value})} 
                                    placeholder="https://example.com/logo.png"
                                />
                                <p className="text-xs text-slate-500 mt-1">Recommended size: square or horizontal logo. Auto-resizes to header height.</p>
                            </div>
                            {brandingForm.logoURL && (
                                <div className="h-16 w-16 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-2">
                                    <img src={brandingForm.logoURL} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6 relative">
                        {!hasAdvancedBranding && (
                            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                                <Button type="button" variant="secondary" onClick={() => setShowUpgradeModal(true)} className="shadow-lg">
                                    <Lock size={16} className="mr-2"/> Unlock Favicon
                                </Button>
                            </div>
                        )}
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <Globe size={16}/> Favicon
                        </label>
                        <div className="flex gap-4 items-start">
                            <div className="flex-1">
                                <Input 
                                    value={brandingForm.faviconURL} 
                                    onChange={e => setBrandingForm({...brandingForm, faviconURL: e.target.value})} 
                                    placeholder="https://example.com/favicon.ico"
                                    disabled={!hasAdvancedBranding}
                                />
                                <p className="text-xs text-slate-500 mt-1">Recommended size: 16x16 or 32x32 PNG/ICO. This icon appears in the browser tab.</p>
                            </div>
                            {brandingForm.faviconURL && (
                                <div className="h-10 w-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-1">
                                    <img src={brandingForm.faviconURL} alt="Favicon Preview" className="max-w-full max-h-full object-contain" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" isLoading={loading}>
                            <Save size={16} className="mr-2" /> Save Branding Settings
                        </Button>
                    </div>
                </form>
            </div>
        )}

        {activeTab === 'links' && (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <Link to="/settings/nav-links/new">
                        <Button size="sm"><Plus size={16}/> Add Quick Link</Button>
                    </Link>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-700">Label</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">Type</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">Target</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">Order</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {links.map(link => (
                                <tr key={link.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-medium text-slate-900">{link.label}</td>
                                    <td className="px-6 py-3 text-slate-600">{link.targetType}</td>
                                    <td className="px-6 py-3 text-slate-500 max-w-xs truncate">
                                        {link.targetURL || link.pageId || link.spaceId || '-'}
                                    </td>
                                    <td className="px-6 py-3 text-slate-600">{link.displayOrder}</td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link to={`/settings/nav-links/${link.id}/edit`}>
                                                <button className="p-1 text-slate-400 hover:text-blue-600" title="Edit">
                                                    <Edit2 size={14} />
                                                </button>
                                            </Link>
                                            <button onClick={() => handleDeleteLink(link.id)} className="p-1 text-slate-400 hover:text-red-600" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {links.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No quick links found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'ai' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-2xl relative">
                {!hasAI && (
                     <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="text-center">
                            <Button type="button" onClick={() => setShowUpgradeModal(true)} className="shadow-lg mb-2">
                                <Lock size={16} className="mr-2"/> Unlock AI Features
                            </Button>
                            <p className="text-sm text-slate-500 font-medium">Upgrade to Pro to enable Gemini integration.</p>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Google Gemini Integration</h2>
                        <p className="text-sm text-slate-500">Connect your Gemini API key to enable the AI Assistant.</p>
                    </div>
                </div>

                <form onSubmit={handleAISave} className="space-y-6">
                    <Input 
                        label="Gemini API Key" 
                        value={geminiKey} 
                        onChange={e => setGeminiKey(e.target.value)} 
                        placeholder="AIza..."
                        type="password"
                        disabled={!hasAI}
                    />
                    <p className="text-xs text-slate-500">
                        Your key is stored securely and used only for your company's AI queries.
                    </p>
                    
                    <div className="flex justify-end">
                        <Button type="submit" isLoading={loading} disabled={!hasAI}>Save API Key</Button>
                    </div>
                </form>
            </div>
        )}

        {activeTab === 'domain' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Custom Domain</h2>
                            <p className="text-sm text-slate-500">Map your own domain to your intranet.</p>
                        </div>
                    </div>
                    
                    <form onSubmit={handleAddDomain} className="space-y-4">
                        <div className="flex gap-2 items-end">
                             <Input 
                                label="Add New Domain"
                                placeholder="intranet.example.com"
                                value={newDomain}
                                onChange={e => setNewDomain(e.target.value)}
                             />
                             <Button type="submit" isLoading={domainLoading}>Add</Button>
                        </div>
                    </form>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Domain</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Verification Token</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {domains.map(domain => (
                                <tr key={domain.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{domain.domainName}</td>
                                    <td className="px-6 py-4">
                                        {domain.isVerified ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle size={12} className="mr-1" /> Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                <AlertCircle size={12} className="mr-1" /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs bg-slate-100 p-1 rounded border border-slate-200 inline-block max-w-[200px] truncate" title={domain.dnsVerificationToken}>
                                            {domain.dnsVerificationToken}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">TXT Record: _companyhub-verification</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {!domain.isVerified && (
                                                <Button size="sm" variant="secondary" onClick={() => handleVerifyDomain(domain.id)} isLoading={domainLoading} className="h-8 text-xs">
                                                    <RefreshCw size={14} className="mr-1" /> Verify
                                                </Button>
                                            )}
                                            <button onClick={() => handleDeleteDomain(domain.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50" title="Remove">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {domains.length === 0 && (
                                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No custom domains configured.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
};
