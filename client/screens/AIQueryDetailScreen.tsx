
import React, { useState, useEffect } from 'react';
import { User, AIQuery, RoleType, AIQueryStatus, AIQueryScope } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { getAIQuery, updateAIQuery, getSpaceById, getPage, getDocument, getKnowledgeArticle } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Bot, User as UserIcon, Save } from 'lucide-react';

interface AIQueryDetailScreenProps {
  currentUser: User;
}

export const AIQueryDetailScreen: React.FC<AIQueryDetailScreenProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState<AIQuery | null>(null);
  const [contextName, setContextName] = useState('');
  
  // Admin Edit State
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchedQuery = getAIQuery(id);
    
    if (!fetchedQuery) {
        navigate('/ai-assistant');
        return;
    }

    // Permission Check
    if (fetchedQuery.companyId !== currentUser.companyId) {
        navigate('/ai-assistant');
        return;
    }
    if (currentUser.role !== RoleType.CompanyAdmin && fetchedQuery.userId !== currentUser.id) {
        navigate('/ai-assistant');
        return;
    }

    setQuery(fetchedQuery);
    setAnswerText(fetchedQuery.answerText || '');

    // Resolve Context Name
    resolveContextName(fetchedQuery);

  }, [id, currentUser, navigate]);

  const resolveContextName = (q: AIQuery) => {
      let name = '';
      if (q.scopeType === AIQueryScope.Space && q.scopeSpaceId) {
          const s = getSpaceById(q.scopeSpaceId);
          if (s) name = `Space: ${s.spaceName}`;
      } else if (q.scopeType === AIQueryScope.Page && q.scopePageId) {
          const p = getPage(q.scopePageId);
          if (p) name = `Page: ${p.pageTitle}`;
      } else if (q.scopeType === AIQueryScope.Document && q.scopeDocumentId) {
          const d = getDocument(q.scopeDocumentId);
          if (d) name = `Document: ${d.title}`;
      } else if (q.scopeType === AIQueryScope.KnowledgeBase && q.scopeKnowledgeArticleId) {
          const a = getKnowledgeArticle(q.scopeKnowledgeArticleId);
          if (a) name = `Article: ${a.title}`;
      }
      setContextName(name);
  };

  const handleSaveAnswer = async () => {
      if (!query) return;
      setLoading(true);
      try {
          const updated = await updateAIQuery({
              ...query,
              answerText: answerText,
              status: AIQueryStatus.Answered,
              answeredOn: new Date().toISOString()
          });
          setQuery(updated);
          alert('Answer saved successfully.');
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  if (!query) return <div className="p-12 text-center">Loading...</div>;

  const isAdmin = currentUser.role === RoleType.CompanyAdmin;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/ai-assistant')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Query Details</h1>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Question</span>
                <h2 className="text-lg font-medium text-slate-900">{query.questionText}</h2>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded">{query.scopeType}</span>
                    {contextName && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{contextName}</span>}
                    <span>{new Date(query.createdOn).toLocaleString()}</span>
                </div>
            </div>

            <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Bot size={16} /> AI Answer
                </span>
                
                {isAdmin ? (
                    <div className="space-y-3">
                        <textarea 
                            className="w-full h-40 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter answer manually..."
                            value={answerText}
                            onChange={e => setAnswerText(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <Button onClick={handleSaveAnswer} isLoading={loading}>
                                <Save size={16} className="mr-2" /> Save Answer
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 whitespace-pre-wrap">
                        {query.answerText || <span className="text-slate-400 italic">No answer has been recorded yet.</span>}
                    </div>
                )}
                
                {query.answeredOn && (
                    <p className="text-xs text-slate-400 text-right mt-1">Answered on {new Date(query.answeredOn).toLocaleString()}</p>
                )}
            </div>
        </div>
    </div>
  );
};
