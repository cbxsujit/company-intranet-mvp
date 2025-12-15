import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Announcement, RoleType, Company, NavQuickLink, NavTargetType, Event, Space, SpaceMember } from '../types';
import { getAnnouncements, getUserById, getCompany, getNavQuickLinks, getEvents, getUserMemberships, getSpaceById } from '../services/mockDb';
import { Bell, Pin, Clock, ExternalLink, Grid, FileText, Link as LinkIcon, Calendar, ArrowRight } from 'lucide-react';

interface HomeScreenProps {
  currentUser: User;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState<Announcement[]>([]);
  const [latestAnnouncements, setLatestAnnouncements] = useState<Announcement[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [company, setCompany] = useState<Company | undefined>(undefined);
  const [quickLinks, setQuickLinks] = useState<NavQuickLink[]>([]);
  const [mySpaces, setMySpaces] = useState<Space[]>([]);

  useEffect(() => {
    setCompany(getCompany(currentUser.companyId));
    setQuickLinks(getNavQuickLinks(currentUser.companyId));

    const memberships = getUserMemberships(currentUser.id);
    const spaces = memberships.map(m => getSpaceById(m.spaceId)).filter(s => !!s) as Space[];
    setMySpaces(spaces);

    const all = getAnnouncements(currentUser.companyId);
    const active = all.filter(a => a.isActive).sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
    const pinned = active.filter(a => a.isPinned).slice(0, 3);
    const pinnedIds = new Set(pinned.map(a => a.id));
    const latest = active.filter(a => !pinnedIds.has(a.id)).slice(0, 10);

    setPinnedAnnouncements(pinned);
    setLatestAnnouncements(latest);

    const allEvents = getEvents(currentUser.companyId);
    const now = new Date();
    now.setHours(0,0,0,0);
    const futureEvents = allEvents
        .filter(e => new Date(e.startDateTime) >= now && e.isActive)
        .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
        .slice(0, 5);
    setUpcomingEvents(futureEvents);

    const uMap: Record<string, string> = {};
    [...pinned, ...latest].forEach(a => {
        if (!uMap[a.createdBy]) {
            const u = getUserById(a.createdBy);
            if (u) uMap[a.createdBy] = u.fullName;
        }
    });
    setUserMap(uMap);

  }, [currentUser.companyId, currentUser.id]);

  const handleLinkClick = (link: NavQuickLink) => {
      switch(link.targetType) {
          case NavTargetType.Page:
              if(link.pageId) navigate(`/pages/${link.pageId}`);
              break;
          case NavTargetType.Space:
              if(link.spaceId) navigate(`/pages?spaceId=${link.spaceId}`);
              break;
          case NavTargetType.Documents:
              navigate('/documents');
              break;
          case NavTargetType.Announcements:
              navigate('/announcements');
              break;
          case NavTargetType.ExternalURL:
          case NavTargetType.Other:
              if(link.targetURL) window.open(link.targetURL, '_blank');
              break;
      }
  };

  return (
    <div className="space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                 <h1 className="text-3xl font-bold text-slate-900">
                     {company?.homeTitle || `Welcome back, ${currentUser.fullName}`}
                 </h1>
                 <p className="text-slate-500 mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Sidebar - Context (Stacks on Mobile) */}
            <div className="md:col-span-1 space-y-8">
                {/* User Context */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Quick Access</h3>
                    <ul className="space-y-2 text-sm">
                        {quickLinks.map(link => (
                            <li key={link.id}>
                                <button onClick={() => handleLinkClick(link)} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors w-full text-left">
                                    <ExternalLink size={14} /> {link.label}
                                </button>
                            </li>
                        ))}
                        {quickLinks.length === 0 && <li className="text-slate-400 italic">No quick links configured.</li>}
                    </ul>
                </div>

                {/* My Spaces */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900">My Spaces</h3>
                        <Link to="/spaces" className="text-xs text-blue-600 hover:underline">View All</Link>
                    </div>
                    <ul className="space-y-3">
                        {mySpaces.slice(0, 5).map(space => (
                            <li key={space.id}>
                                <Link to={`/pages?spaceId=${space.id}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 font-medium">
                                    <Grid size={16} className="text-slate-400"/> {space.spaceName}
                                </Link>
                            </li>
                        ))}
                        {mySpaces.length === 0 && <li className="text-slate-400 italic text-sm">You are not in any spaces.</li>}
                    </ul>
                </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2 lg:col-span-3 space-y-8">
                {/* Pinned Announcements */}
                {pinnedAnnouncements.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pinnedAnnouncements.map(ann => (
                            <Link to={`/announcements/${ann.id}`} key={ann.id} className="block group h-full">
                                <div className="bg-white border-l-4 border-blue-500 rounded-r-xl shadow-sm p-5 h-full hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Pin size={14} className="text-red-500" />
                                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Featured</span>
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{ann.title}</h3>
                                    <p className="text-slate-600 text-sm line-clamp-2 mb-3">{ann.message}</p>
                                    <div className="text-xs text-slate-400">{new Date(ann.createdOn).toLocaleDateString()}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Latest News */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Bell size={18} className="text-blue-500"/> Latest News
                                </h3>
                                <Link to="/announcements" className="text-sm text-blue-600 hover:underline">View All</Link>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {latestAnnouncements.map(ann => (
                                    <div key={ann.id} className="p-5 hover:bg-slate-50 transition-colors">
                                        <Link to={`/announcements/${ann.id}`} className="block">
                                            <h4 className="font-medium text-slate-900 hover:text-blue-600 mb-1">{ann.title}</h4>
                                            <p className="text-slate-500 text-sm line-clamp-2">{ann.message}</p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                                <span>{new Date(ann.createdOn).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{userMap[ann.createdBy]}</span>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                                {latestAnnouncements.length === 0 && <div className="p-8 text-center text-slate-500">No new announcements.</div>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Upcoming Events */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Calendar size={18} className="text-pink-500"/> Events
                                </h3>
                                <Link to="/events" className="text-sm text-blue-600 hover:underline">View All</Link>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {upcomingEvents.map(event => (
                                    <Link to={`/events/${event.id}`} key={event.id} className="block p-4 hover:bg-slate-50 transition-colors group">
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-slate-200 px-2 py-1 min-w-[50px]">
                                                <span className="text-[10px] font-bold uppercase text-slate-500">{new Date(event.startDateTime).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-xl font-bold text-slate-900">{new Date(event.startDateTime).getDate()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 text-sm group-hover:text-blue-600 truncate">{event.title}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{new Date(event.startDateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {upcomingEvents.length === 0 && <div className="p-6 text-center text-slate-500 text-sm italic">No upcoming events.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};