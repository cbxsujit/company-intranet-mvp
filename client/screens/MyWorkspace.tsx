




import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Space, Page, DocumentItem, SpaceMember, FavoriteItem, EntityType, Event, EventType } from '../types';
import { getPages, getDocuments, getUserMemberships, getSpaceById, getFavorites, getPage, getDocument, getEvents } from '../services/mockDb';
import { Button } from '../components/ui/Button';
import { User as UserIcon, Mail, Briefcase, FileText, Link as LinkIcon, Grid, Edit2, ArrowRight, Star, Calendar } from 'lucide-react';

interface MyWorkspaceProps {
  currentUser: User;
}

export const MyWorkspace: React.FC<MyWorkspaceProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<{space: Space, member: SpaceMember}[]>([]);
  const [pages, setPages] = useState<{page: Page, spaceName: string}[]>([]);
  const [docs, setDocs] = useState<{doc: DocumentItem, spaceName: string}[]>([]);
  const [recentFavs, setRecentFavs] = useState<{type: string, name: string, link: string}[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);

  useEffect(() => {
    // 1. Fetch My Spaces
    const memberships = getUserMemberships(currentUser.id);
    const spaceList: {space: Space, member: SpaceMember}[] = [];
    const spaceMap: Record<string, string> = {};
    const mySpaceIds = new Set<string>();

    memberships.forEach(m => {
        const s = getSpaceById(m.spaceId);
        if (s) {
            spaceList.push({ space: s, member: m });
            spaceMap[s.id] = s.spaceName;
            mySpaceIds.add(s.id);
        }
    });
    setSpaces(spaceList);

    // 2. Fetch My Pages (Created or Updated by me)
    const allPages = getPages(currentUser.companyId);
    const myPages = allPages.filter(p => p.createdBy === currentUser.id || p.updatedBy === currentUser.id)
        .map(p => ({ page: p, spaceName: spaceMap[p.spaceId] || 'Unknown' }));
    setPages(myPages);

    // 3. Fetch My Documents (Created by me)
    const allDocs = getDocuments(currentUser.companyId);
    const myDocs = allDocs.filter(d => d.createdBy === currentUser.id && d.isActive)
        .map(d => ({ doc: d, spaceName: spaceMap[d.spaceId] || 'Unknown' }));
    setDocs(myDocs);

    // 4. Fetch Recent Favorites (Top 5)
    const favs = getFavorites(currentUser.id).slice(0, 5);
    const resolvedFavs: {type: string, name: string, link: string}[] = [];
    
    favs.forEach(f => {
        if (f.entityType === EntityType.Page) {
            const p = getPage(f.entityId);
            if (p) resolvedFavs.push({ type: 'Page', name: p.pageTitle, link: `/pages/${p.id}` });
        } else if (f.entityType === EntityType.DocumentItem) {
            const d = getDocument(f.entityId);
            if (d) resolvedFavs.push({ type: 'Document', name: d.title, link: `/documents/${d.id}` });
        } else if (f.entityType === EntityType.Space) {
            const s = getSpaceById(f.entityId);
            if (s) resolvedFavs.push({ type: 'Space', name: s.spaceName, link: `/pages?spaceId=${s.id}` });
        }
    });
    setRecentFavs(resolvedFavs);

    // 5. Fetch My Upcoming Events
    const allEvents = getEvents(currentUser.companyId);
    const now = new Date();
    now.setHours(0,0,0,0);
    const filteredEvents = allEvents.filter(e => {
        if (new Date(e.startDateTime) < now) return false;
        if (!e.isActive) return false;
        
        // Condition: In my spaces OR CompanyEvent/Holiday
        if (e.spaceId && mySpaceIds.has(e.spaceId)) return true;
        if (e.eventType === EventType.CompanyEvent || e.eventType === EventType.Holiday) return true;
        
        return false;
    }).sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()).slice(0, 5);
    setMyEvents(filteredEvents);

  }, [currentUser]);

  return (
    <div className="space-y-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900">My Workspace</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile & Spaces */}
            <div className="lg:col-span-1 space-y-8">
                {/* Profile Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">My Profile</h2>
                        <Link to="/profile/edit">
                            <Button variant="ghost" className="h-8 px-2 text-xs">
                                <Edit2 size={14} className="mr-1"/> Edit
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="p-2 bg-blue-50 rounded-full text-blue-600"><UserIcon size={18}/></div>
                            <div>
                                <p className="text-sm font-medium">Full Name</p>
                                <p className="text-slate-900 font-medium">{currentUser.fullName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="p-2 bg-purple-50 rounded-full text-purple-600"><Mail size={18}/></div>
                            <div>
                                <p className="text-sm font-medium">Email</p>
                                <p className="text-slate-900">{currentUser.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                            <div className="p-2 bg-indigo-50 rounded-full text-indigo-600"><Briefcase size={18}/></div>
                            <div>
                                <p className="text-sm font-medium">Role & Department</p>
                                <p className="text-slate-900">{currentUser.designation} • {currentUser.department}</p>
                            </div>
                        </div>
                        <div className="pt-4 mt-2 border-t border-slate-100 flex gap-2">
                             <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold uppercase text-slate-600">{currentUser.role}</span>
                             <span className="bg-green-100 px-2 py-1 rounded text-xs font-bold uppercase text-green-700">{currentUser.status}</span>
                        </div>
                    </div>
                </div>

                {/* Favorites (Quick Access) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Star size={20} className="text-yellow-500 fill-current"/> Favorites
                        </h2>
                        <Link to="/favorites" className="text-xs text-blue-600 hover:underline">View All</Link>
                    </div>
                    <div className="space-y-2">
                        {recentFavs.map((fav, i) => (
                            <Link key={i} to={fav.link} className="block p-2 hover:bg-slate-50 rounded-lg group transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {fav.type === 'Page' && <FileText size={16} className="text-blue-500 shrink-0"/>}
                                        {fav.type === 'Document' && <LinkIcon size={16} className="text-emerald-500 shrink-0"/>}
                                        {fav.type === 'Space' && <Grid size={16} className="text-indigo-500 shrink-0"/>}
                                        <span className="text-sm font-medium text-slate-700 truncate">{fav.name}</span>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500 shrink-0" />
                                </div>
                            </Link>
                        ))}
                        {recentFavs.length === 0 && <p className="text-slate-500 text-sm italic">No favorites added yet.</p>}
                    </div>
                </div>

                {/* My Spaces */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Grid size={20} className="text-indigo-600"/> My Spaces
                    </h2>
                    <div className="space-y-3">
                        {spaces.map(({space, member}) => (
                            <div key={space.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-blue-200 transition-colors">
                                <div>
                                    <p className="font-medium text-slate-900">{space.spaceName}</p>
                                    <p className="text-xs text-slate-500">{member.roleInSpace}</p>
                                </div>
                                <Link to={`/pages?spaceId=${space.id}`} title="Open Pages">
                                    <button className="p-1.5 bg-white text-slate-400 hover:text-blue-600 rounded-md border border-slate-200 shadow-sm">
                                        <ArrowRight size={14} />
                                    </button>
                                </Link>
                            </div>
                        ))}
                        {spaces.length === 0 && <p className="text-slate-500 text-sm">You are not a member of any space.</p>}
                    </div>
                </div>
            </div>

            {/* Right Column: Content */}
            <div className="lg:col-span-2 space-y-8">
                {/* My Upcoming Events */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar size={20} className="text-pink-600"/>
                            <h2 className="text-lg font-bold text-slate-900">My Upcoming Events</h2>
                        </div>
                        <Link to="/events" className="text-xs text-blue-600 hover:underline">Calendar</Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {myEvents.map(event => (
                            <Link to={`/events/${event.id}`} key={event.id} className="block p-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center bg-slate-50 rounded p-1 min-w-[40px] border border-slate-200 text-slate-600">
                                            <span className="text-[10px] font-bold uppercase">{new Date(event.startDateTime).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-sm font-bold">{new Date(event.startDateTime).getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 group-hover:text-blue-600">{event.title}</p>
                                            <p className="text-xs text-slate-500">{event.eventType} {event.isAllDay ? '• All Day' : `• ${new Date(event.startDateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`}</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500" />
                                </div>
                            </Link>
                        ))}
                        {myEvents.length === 0 && <div className="p-6 text-center text-slate-500 text-sm italic">No upcoming events relevant to you.</div>}
                    </div>
                </div>

                {/* My Pages */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600"/>
                        <h2 className="text-lg font-bold text-slate-900">My Pages</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-700">Title</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700">Space</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700">Updated</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pages.map(({page, spaceName}) => (
                                    <tr key={page.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 font-medium text-slate-900">{page.pageTitle}</td>
                                        <td className="px-6 py-3 text-slate-600">{spaceName}</td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${page.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {page.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-500 text-xs">{new Date(page.updatedOn).toLocaleDateString()}</td>
                                        <td className="px-6 py-3 text-right">
                                            <Link to={`/pages/${page.id}`}>
                                                <Button variant="ghost" className="text-xs py-1 h-auto">Open</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {pages.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No pages found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* My Documents */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                        <LinkIcon size={20} className="text-emerald-600"/>
                        <h2 className="text-lg font-bold text-slate-900">My Documents</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-700">Title</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700">Type</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700">Space</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700">Created</th>
                                    <th className="px-6 py-3 font-semibold text-slate-700"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {docs.map(({doc, spaceName}) => (
                                    <tr key={doc.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3 font-medium text-slate-900">{doc.title}</td>
                                        <td className="px-6 py-3 text-slate-600">{doc.itemType}</td>
                                        <td className="px-6 py-3 text-slate-600">{spaceName}</td>
                                        <td className="px-6 py-3 text-slate-500 text-xs">{new Date(doc.createdOn).toLocaleDateString()}</td>
                                        <td className="px-6 py-3 text-right">
                                            <Link to={`/documents/${doc.id}`}>
                                                <Button variant="ghost" className="text-xs py-1 h-auto">Open</Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {docs.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No documents found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};