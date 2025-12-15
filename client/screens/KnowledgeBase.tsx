
import React, { useState, useEffect } from 'react';
import { User, KnowledgeCategory, KnowledgeArticle } from '../types';
import { getKnowledgeCategories, getKnowledgeArticles } from '../services/mockDb';
import { Search, ChevronDown, ChevronRight, HelpCircle, Star, BookOpen } from 'lucide-react';

interface KnowledgeBaseProps {
  currentUser: User;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  useEffect(() => {
    setCategories(getKnowledgeCategories(currentUser.companyId).filter(c => c.isActive));
    setArticles(getKnowledgeArticles(currentUser.companyId).filter(a => a.isActive));
  }, [currentUser.companyId]);

  const filteredArticles = articles.filter(a => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches = 
        a.title.toLowerCase().includes(q) ||
        (a.question && a.question.toLowerCase().includes(q)) ||
        a.answer.toLowerCase().includes(q) ||
        (a.tags && a.tags.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (selectedCategoryId && a.categoryId !== selectedCategoryId) return false;
    return true;
  });

  const featuredArticles = articles.filter(a => a.isFeatured);

  const toggleArticle = (id: string) => {
    setExpandedArticleId(expandedArticleId === id ? null : id);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900">How can we help you?</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-4 text-lg border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Categories */}
        <aside className="hidden lg:block lg:col-span-1 space-y-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 mb-4 px-2">Categories</h3>
              <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategoryId('')}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedCategoryId ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    All Categories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategoryId === cat.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
              </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3 space-y-8">
            {!searchQuery && !selectedCategoryId && featuredArticles.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Star className="text-yellow-500 fill-current" size={20} />
                        <h2 className="text-lg font-bold text-slate-800">Featured Articles</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {featuredArticles.slice(0, 4).map(article => (
                        <div 
                            key={article.id} 
                            onClick={() => {
                                setSelectedCategoryId(article.categoryId);
                                setExpandedArticleId(article.id);
                            }}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                        >
                            <h3 className="font-medium text-slate-900 group-hover:text-blue-600">{article.title}</h3>
                            <p className="text-sm text-slate-500 mt-2 line-clamp-2">{article.question || article.answer}</p>
                        </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="text-slate-400" size={20}/>
                    <h2 className="text-xl font-bold text-slate-800">
                        {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name : 'All Articles'}
                    </h2>
                    <span className="text-sm text-slate-500 font-normal ml-2">({filteredArticles.length})</span>
                </div>

                {filteredArticles.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                        <HelpCircle size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">No articles found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    {filteredArticles.map(article => (
                        <div key={article.id} className="group">
                        <button
                            onClick={() => toggleArticle(article.id)}
                            className={`w-full text-left px-6 py-4 flex items-start justify-between hover:bg-slate-50 transition-colors focus:outline-none ${expandedArticleId === article.id ? 'bg-slate-50' : ''}`}
                        >
                            <div>
                                <h3 className={`font-medium text-lg ${expandedArticleId === article.id ? 'text-blue-600' : 'text-slate-900'}`}>{article.title}</h3>
                                {article.question && <p className="text-slate-500 mt-1 font-medium">{article.question}</p>}
                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                    {!selectedCategoryId && <span>{categories.find(c => c.id === article.categoryId)?.name}</span>}
                                    {article.tags && <span>• Tags: {article.tags}</span>}
                                </div>
                            </div>
                            <div className="mt-1 text-slate-400">
                                {expandedArticleId === article.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </div>
                        </button>
                        {expandedArticleId === article.id && (
                            <div className="px-6 pb-6 pt-2 text-slate-700 whitespace-pre-wrap leading-relaxed border-t border-slate-100 bg-slate-50/50">
                                {article.answer}
                            </div>
                        )}
                        </div>
                    ))}
                    </div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};
