
import React, { useState, useEffect } from 'react';
import { User, AIQuery, AIQueryScope, AIQueryStatus, Space, Page, DocumentItem, KnowledgeArticle, RoleType } from '../types';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { addAIQuery, getAIQueries, getVisibleSpaces, getPages, getDocuments, getKnowledgeArticles, getSpaces, checkFeatureAccess } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { Bot, Send, Clock, CheckCircle, AlertCircle, MessageSquare, Lock } from 'lucide-react';

interface AIAssistantScreenProps {
  currentUser: User;
}

export const AIAssistantScreen: React.FC<AIAssistantScreenProps> = ({ currentUser }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isRestricted, setIsRestricted] = useState(false);
  
  // Form State
  const [scopeType, setScopeType] = useState<AIQueryScope>(AIQueryScope.Global);
  const [scopeId, setScopeId] = useState<string>('');
  const [questionText, setQuestionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Dropdown Data
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);

  // History State
  const [history, setHistory] = useState<AIQuery[]>([]);
  const [showAllCompanyQueries, setShowAllCompanyQueries] = useState(false);

  useEffect(() => {
    // Check Feature Access
    const hasAccess = checkFeatureAccess(currentUser.companyId, 'ai');
    if (!hasAccess) {
        setIsRestricted(true);
        return;
    }

    // Pre-fill from URL
    const typeParam = searchParams.get('scopeType');
    if (typeParam && Object.values(AIQueryScope).includes(typeParam as AIQueryScope)) {
        setScopeType(typeParam as AIQueryScope);
        
        const idParam = searchParams.get('scopeSpaceId') || searchParams.get('scopePageId') || searchParams.get('scopeDocumentId') || searchParams.get('scopeKnowledgeArticleId');
        if (idParam) setScopeId(idParam);
    }

    // Load Data for Dropdowns
    const visibleSpaces = getVisibleSpaces(currentUser.companyId, currentUser.id);
    setSpaces(visibleSpaces);
    
    // For Pages/Docs/Articles, we ideally filter by what's visible.
    setPages(getPages(currentUser.companyId)); 
    setDocs(getDocuments(currentUser.companyId).filter(d => d.isActive));
    setArticles(getKnowledgeArticles(currentUser.companyId).filter(a => a.isActive));

    fetchHistory();
  }, [currentUser, searchParams]);

  useEffect(() => {
      if (!isRestricted) fetchHistory();
  }, [showAllCompanyQueries]);

  const fetchHistory = () => {
      // If admin and toggle is on, fetch all. Else fetch mine.
      const userIdToFetch = (currentUser.role === RoleType.CompanyAdmin && showAllCompanyQueries) ? undefined : currentUser.id;
      setHistory(getAIQueries(currentUser.companyId, userIdToFetch));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!questionText.trim()) return;

      setLoading(true);
      setFeedback('');

      try {
          const payload: any = {
              companyId: currentUser.companyId,
              userId: currentUser.id,
              scopeType,
              questionText,
              status: AIQueryStatus.Pending
          };

          // Assign ID based on type
          if (scopeType === AIQueryScope.Space) payload.scopeSpaceId = scopeId;
          if (scopeType === AIQueryScope.Page) payload.scopePageId = scopeId;
          if (scopeType === AIQueryScope.Document) payload.scopeDocumentId = scopeId;
          if (scopeType === AIQueryScope.KnowledgeBase) payload.scopeKnowledgeArticleId = scopeId;

          await addAIQuery(payload);
          setFeedback('Your question has been recorded.');
          setQuestionText('');
          fetchHistory();
      } catch (err: any) {
          setFeedback('Error submitting query.');
      } finally {
          setLoading(false);
      }
  };

  const getStatusColor = (status: AIQueryStatus) => {
      switch(status) {
          case AIQueryStatus.Answered: return 'text-green-600 bg-green-50 border-green-200';
          case AIQueryStatus.Error: return 'text-red-600 bg-red-50 border-red-200';
          default: return 'text-amber-600 bg-amber-50 border-amber-200';
      }
  };

  if (isRestricted) {
      return (
          <div className="flex items-center justify-center h-96 animate-fade-in">
              <div className="text-center max-w-md p-8 bg-white rounded-2xl border border-slate-100 shadow-lg">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot size={32} className="text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Assistant</h2>
                  <p className="text-slate-500 mb-6">
                      Unlock the power of AI to search and summarize your intranet. Available on the Pro plan.
                  </p>
                  <Button onClick={() => alert("Redirecting to billing...")}>Upgrade to Pro</Button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
                <Bot size={32} className="text-blue-600"/> AI Assistant
            </h1>
            <p className="text-slate-500">Ask questions about your company data.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Scope</label>
                        <select
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={scopeType}
                            onChange={e => {
                                setScopeType(e.target.value as AIQueryScope);
                                setScopeId('');
                            }}
                        >
                            {Object.values(AIQueryScope).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    
                    {/* Dynamic Context Selector */}
                    {scopeType === AIQueryScope.Space && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Space</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={scopeId}
                                onChange={e => setScopeId(e.target.value)}
                                required
                            >
                                <option value="">-- Choose Space --</option>
                                {spaces.map(s => <option key={s.id} value={s.id}>{s.spaceName}</option>)}
                            </select>
                        </div>
                    )}
                    {scopeType === AIQueryScope.Page && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Page</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={scopeId}
                                onChange={e => setScopeId(e.target.value)}
                                required
                            >
                                <option value="">-- Choose Page --</option>
                                {pages.map(p => <option key={p.id} value={p.id}>{p.pageTitle}</option>)}
                            </select>
                        </div>
                    )}
                    {scopeType === AIQueryScope.Document && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Document</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={scopeId}
                                onChange={e => setScopeId(e.target.value)}
                                required
                            >
                                <option value="">-- Choose Document --</option>
                                {docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                            </select>
                        </div>
                    )}
                    {scopeType === AIQueryScope.KnowledgeBase && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Article (Optional)</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={scopeId}
                                onChange={e => setScopeId(e.target.value)}
                            >
                                <option value="">-- All Articles --</option>
                                {articles.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Question</label>
                    <textarea
                        className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Ask something..."
                        value={questionText}
                        onChange={e => setQuestionText(e.target.value)}
                        required
                    />
                </div>

                <div className="flex items-center justify-between">
                    {feedback ? (
                        <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                            <CheckCircle size={16}/> {feedback}
                        </span>
                    ) : <span></span>}
                    <Button type="submit" isLoading={loading}>
                        <Send size={16} className="mr-2"/> Ask
                    </Button>
                </div>
            </form>
        </div>

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Clock size={20} className="text-slate-400"/> Query History
                </h2>
                {currentUser.role === RoleType.CompanyAdmin && (
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="showAll"
                            checked={showAllCompanyQueries}
                            onChange={e => setShowAllCompanyQueries(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="showAll" className="text-sm text-slate-700 font-medium">All Company Queries</label>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {history.map(query => (
                        <div key={query.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 group">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(query.status)}`}>
                                        {query.status}
                                    </span>
                                    <span className="text-xs text-slate-500">{new Date(query.createdOn).toLocaleString()}</span>
                                    <span className="text-xs text-slate-400 bg-slate-100 px-1.5 rounded">{query.scopeType}</span>
                                </div>
                                <p className="text-sm font-medium text-slate-900 truncate">{query.questionText}</p>
                            </div>
                            <Link to={`/ai-assistant/${query.id}`}>
                                <Button variant="ghost" className="text-xs h-8 px-3">View</Button>
                            </Link>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="p-8 text-center text-slate-500 italic">
                            No queries found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
