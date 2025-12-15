
import React, { useState, useEffect } from 'react';
import { User, Event, EventType, RoleType, SpaceRole } from '../types';
import { getEvents, getVisibleSpaces, getMemberRole } from '../services/mockDb';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Plus, Calendar, MapPin, Filter, ArrowRight } from 'lucide-react';

interface EventsListProps {
  currentUser: User;
}

export const EventsList: React.FC<EventsListProps> = ({ currentUser }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [showPast, setShowPast] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleSpaceIds, setVisibleSpaceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchEvents = () => {
        const allEvents = getEvents(currentUser.companyId);
        const spaces = getVisibleSpaces(currentUser.companyId, currentUser.id);
        const vSpaceIds = new Set(spaces.map(s => s.id));
        setVisibleSpaceIds(vSpaceIds);

        const visibleEvents = allEvents.filter(e => {
            if (currentUser.role === RoleType.CompanyAdmin) return true;
            if (e.isPublic) return true;
            if (e.spaceId && vSpaceIds.has(e.spaceId)) return true;
            return false;
        });

        setEvents(visibleEvents.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()));
    };
    fetchEvents();
  }, [currentUser]);

  const canCreate = currentUser.role === RoleType.CompanyAdmin || visibleSpaceIds.size > 0;

  const filteredEvents = events.filter(e => {
      const eventDate = new Date(e.startDateTime);
      const now = new Date();
      now.setHours(0,0,0,0);

      if (!showPast && eventDate < now) return false;
      if (filterType && e.eventType !== filterType) return false;
      if (searchTerm && !e.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
      <aside className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Filter size={18} className="text-blue-600"/> Filters
              </h3>
              
              <div className="space-y-6">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Event Type</label>
                      <div className="space-y-1">
                          <button onClick={() => setFilterType('')} className={`w-full text-left px-2 py-1.5 rounded text-sm ${!filterType ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>All Types</button>
                          {Object.values(EventType).map(t => (
                              <button key={t} onClick={() => setFilterType(t)} className={`w-full text-left px-2 py-1.5 rounded text-sm ${filterType === t ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>{t}</button>
                          ))}
                      </div>
                  </div>

                  <div>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={showPast} 
                            onChange={e => setShowPast(e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          Show Past Events
                      </label>
                  </div>
              </div>
          </div>
      </aside>

      <main className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Events Calendar</h1>
              <p className="text-sm text-slate-500">Upcoming company events and important dates.</p>
            </div>
            {canCreate && (
                <Link to="/events/new">
                    <Button>
                        <Plus size={18} /> Create Event
                    </Button>
                </Link>
            )}
          </div>

          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
             <input 
                type="text" 
                placeholder="Search events..." 
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredEvents.map(event => (
                  <div key={event.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col group overflow-hidden">
                      {event.eventBannerURL && (
                          <div className="h-32 w-full">
                              <img src={event.eventBannerURL} alt={event.title} className="w-full h-full object-cover" />
                          </div>
                      )}
                      <div className="p-6 flex gap-6">
                          <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-4 min-w-[80px] border border-blue-100 text-blue-700 h-fit">
                              <span className="text-xs font-bold uppercase tracking-wider">{new Date(event.startDateTime).toLocaleString('default', { month: 'short' })}</span>
                              <span className="text-3xl font-bold">{new Date(event.startDateTime).getDate()}</span>
                          </div>
                          <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">{event.eventType}</span>
                                  <span className="text-xs text-slate-400">{event.isAllDay ? 'All Day' : new Date(event.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                                  <Link to={`/events/${event.id}`}>{event.title}</Link>
                              </h3>
                              <p className="text-sm text-slate-500 line-clamp-2 mb-3">{event.description}</p>
                              
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                  {event.location && (
                                      <div className="flex items-center gap-1">
                                          <MapPin size={14} /> {event.location}
                                      </div>
                                  )}
                                  <Link to={`/events/${event.id}`} className="ml-auto text-blue-600 font-medium flex items-center gap-1 hover:underline">
                                      Details <ArrowRight size={14} />
                                  </Link>
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
              {filteredEvents.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-500">
                      No events found matching your criteria.
                  </div>
              )}
          </div>
      </main>
    </div>
  );
};
