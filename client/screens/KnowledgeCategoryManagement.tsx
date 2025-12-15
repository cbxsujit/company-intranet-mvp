
import React, { useState, useEffect } from 'react';
import { User, KnowledgeCategory } from '../types';
import { getKnowledgeCategories, updateKnowledgeCategory } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Ban } from 'lucide-react';

interface KnowledgeCategoryManagementProps {
  currentUser: User;
}

export const KnowledgeCategoryManagement: React.FC<KnowledgeCategoryManagementProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);

  useEffect(() => {
    fetchCategories();
  }, [currentUser.companyId]);

  const fetchCategories = () => {
    setCategories(getKnowledgeCategories(currentUser.companyId));
  };

  const handleDisable = async (category: KnowledgeCategory) => {
    if(!window.confirm('Disable this category?')) return;
    await updateKnowledgeCategory({ ...category, isActive: false });
    fetchCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Categories</h1>
          <p className="text-sm text-slate-500">Organize your help content.</p>
        </div>
        <Link to="/admin/knowledge-categories/new">
          <Button>
            <Plus size={18} /> Add Category
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Order</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Created</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{cat.name}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{cat.description || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{cat.displayOrder}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                      {cat.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(cat.createdOn).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/knowledge-categories/${cat.id}/edit`}>
                        <button className="p-1 text-slate-400 hover:text-blue-600" title="Edit">
                          <Edit2 size={16} />
                        </button>
                      </Link>
                      {cat.isActive && (
                        <button onClick={() => handleDisable(cat)} className="p-1 text-slate-400 hover:text-red-600" title="Disable">
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
