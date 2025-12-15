
import React, { useState, useEffect } from 'react';
import { User, DocumentItem, DocumentImportance } from '../types';
import { getDocuments, getSpaces, getPages, getUsers, checkFeatureAccess } from '../services/mockDb';
import { Link } from 'react-router-dom';
import { FileText, AlertTriangle, Shield, CheckCircle, Clock, ArrowRight, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface DocumentPolicyDashboardProps {
  currentUser: User;
}

export const DocumentPolicyDashboard: React.FC<DocumentPolicyDashboardProps> = ({ currentUser }) => {
  const [expiredDocs, setExpiredDocs] = useState<DocumentItem[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<DocumentItem[]>([]);
  const [policies, setPolicies] = useState<DocumentItem[]>([]);
  const [isRestricted, setIsRestricted] = useState(false);
  
  // Maps for display
  const [spaceMap, setSpaceMap] = useState<Record<string, string>>({});
  const [pageMap, setPageMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const hasAccess = checkFeatureAccess(currentUser.companyId, 'policies');
    if (!hasAccess) {
        setIsRestricted(true);
        return;
    }

    const allDocs = getDocuments(currentUser.companyId).filter(d => d.isActive);
    const spaces = getSpaces(currentUser.companyId);
    const pages = getPages(currentUser.companyId);
    const users = getUsers(currentUser.companyId);

    // Build Maps
    const sMap: Record<string, string> = {};
    spaces.forEach(s => sMap[s.id] = s.spaceName);
    setSpaceMap(sMap);

    const pMap: Record<string, string> = {};
    pages.forEach(p => pMap[p.id] = p.pageTitle);
    setPageMap(pMap);

    const uMap: Record<string, string> = {};
    users.forEach(u => uMap[u.id] = u.fullName);
    setUserMap(uMap);

    // Date calculations
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expired: DocumentItem[] = [];
    const expiring: DocumentItem[] = [];
    const keyPolicies: DocumentItem[] = [];

    allDocs.forEach(doc => {
        // Policy Check
        if (doc.isPolicy) {
            keyPolicies.push(doc);
        }

        // Expiry Check
        if (doc.expiryDate) {
            const expDate = new Date(doc.expiryDate);
            const expParts = doc.expiryDate.split('-');
            const exp = new Date(Number(expParts[0]), Number(expParts[1]) - 1, Number(expParts[2]));

            if (exp < today) {
                expired.push(doc);
            } else if (exp >= today && exp <= thirtyDaysFromNow) {
                expiring.push(doc);
            }
        }
    });

    setExpiredDocs(expired);
    setExpiringDocs(expiring);
    setPolicies(keyPolicies);

  }, [currentUser.companyId]);

  if (isRestricted) {
      return (
          <div className="flex items-center justify-center h-96 animate-fade-in">
              <div className="text-center max-w-md p-8 bg-white rounded-2xl border border-slate-100 shadow-lg">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock size={32} className="text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Policy Management</h2>
                  <p className="text-slate-500 mb-6">
                      Advanced policy tracking and expiry alerts are available on the Pro plan.
                  </p>
                  <Button onClick={() => alert("Redirecting to billing...")}>Upgrade to Pro</Button>
              </div>
          </div>
      );
  }

  const getImportanceColor = (level?: DocumentImportance) => {
      switch(level) {
          case DocumentImportance.High: return 'text-red-600 bg-red-50 border-red-200';
          case DocumentImportance.Medium: return 'text-amber-600 bg-amber-50 border-amber-200';
          case DocumentImportance.Low: return 'text-blue-600 bg-blue-50 border-blue-200';
          default: return 'text-slate-600 bg-slate-50 border-slate-200';
      }
  };

  const DocTable = ({ docs, showExpiry }: { docs: DocumentItem[], showExpiry: boolean }) => (
      <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                      <th className="px-6 py-3 font-semibold text-slate-700">Title</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Location</th>
                      {showExpiry && <th className="px-6 py-3 font-semibold text-slate-700">Expiry Date</th>}
                      <th className="px-6 py-3 font-semibold text-slate-700">Importance</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">Owner</th>
                      <th className="px-6 py-3 font-semibold text-slate-700 text-right">Action</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {docs.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-900">
                              <Link to={`/documents/${doc.id}`} className="hover:text-blue-600 hover:underline">{doc.title}</Link>
                              <div className="text-xs text-slate-500">{doc.itemType}</div>
                          </td>
                          <td className="px-6 py-3 text-slate-600">
                              <div>{spaceMap[doc.spaceId]}</div>
                              {doc.pageId && <div className="text-xs text-slate-400">{pageMap[doc.pageId]}</div>}
                          </td>
                          {showExpiry && (
                              <td className="px-6 py-3 font-medium text-slate-700">
                                  {doc.expiryDate}
                              </td>
                          )}
                          <td className="px-6 py-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getImportanceColor(doc.importanceLevel)}`}>
                                  {doc.importanceLevel || 'Medium'}
                              </span>
                          </td>
                          <td className="px-6 py-3 text-slate-600">
                              {userMap[doc.ownerUserId || ''] || '-'}
                          </td>
                          <td className="px-6 py-3 text-right">
                              <Link to={`/documents/${doc.id}`}>
                                  <Button variant="ghost" className="text-xs py-1 h-auto">Open <ArrowRight size={12} className="ml-1"/></Button>
                              </Link>
                          </td>
                      </tr>
                  ))}
                  {docs.length === 0 && (
                      <tr>
                          <td colSpan={showExpiry ? 6 : 5} className="px-6 py-6 text-center text-slate-500 italic">No documents found.</td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Document & Policy Dashboard</h1>
            <p className="text-sm text-slate-500">Track expirations and critical company policies.</p>
        </div>

        <div className="space-y-8">
            {/* Expired Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-red-50">
                    <AlertTriangle className="text-red-600" size={20} />
                    <h2 className="font-bold text-red-900">Expired Documents</h2>
                    <span className="ml-auto bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{expiredDocs.length}</span>
                </div>
                <DocTable docs={expiredDocs} showExpiry={true} />
            </div>

            {/* Expiring Soon Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-amber-50">
                    <Clock className="text-amber-600" size={20} />
                    <h2 className="font-bold text-amber-900">Expiring Soon (Next 30 Days)</h2>
                    <span className="ml-auto bg-amber-200 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{expiringDocs.length}</span>
                </div>
                <DocTable docs={expiringDocs} showExpiry={true} />
            </div>

            {/* Key Policies Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-blue-50">
                    <Shield className="text-blue-600" size={20} />
                    <h2 className="font-bold text-blue-900">Key Policies</h2>
                    <span className="ml-auto bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{policies.length}</span>
                </div>
                <DocTable docs={policies} showExpiry={true} />
            </div>
        </div>
    </div>
  );
};
