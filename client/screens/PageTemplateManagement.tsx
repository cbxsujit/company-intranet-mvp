

import React, { useState, useEffect } from 'react';
import { User, PageTemplate } from '../types';
import { getPageTemplates, deletePageTemplate } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Ban } from 'lucide-react';

interface PageTemplateManagementProps {
  currentUser: User;
}

export const PageTemplateManagement: React.FC<PageTemplateManagementProps> = ({ currentUser }) => {
  const [templates, setTemplates] = useState<PageTemplate[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, [currentUser.companyId]);

  const fetchTemplates = () => {
    setTemplates(getPageTemplates(currentUser.companyId));
  };

  const handleDisable = async (id: string) => {
    if(!window.confirm('Disable this template? It will no longer be available for new pages.')) return;
    await deletePageTemplate(id);
    fetchTemplates();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Page Templates</h1>
          <p className="text-sm text-slate-500">Manage standard templates for creating pages.</p>
        </div>
        <Link to="/templates/new">
            <Button>
                <Plus size={18} /> Add Template
            </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Template Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Default Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Created</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.map(tpl => (
                <tr key={tpl.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{tpl.templateName}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{tpl.description || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{tpl.defaultStatus}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tpl.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {tpl.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                     {new Date(tpl.createdOn).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Link to={`/templates/${tpl.id}/edit`}>
                            <button className="p-1 text-slate-400 hover:text-blue-600" title="Edit">
                                <Edit2 size={16} />
                            </button>
                        </Link>
                        {tpl.isActive && (
                            <button onClick={() => handleDisable(tpl.id)} className="p-1 text-slate-400 hover:text-red-600" title="Disable">
                                <Ban size={16} />
                            </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No templates found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};