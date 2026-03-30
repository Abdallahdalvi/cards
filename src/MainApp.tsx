import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  Trash2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  FolderOpen,
  X,
  Settings,
  LayoutGrid,
  CloudUpload,
  Download,
  Users,
  Grid
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Supabase
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';

interface Lead {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string[];
  phone: string[];
  address: string;
  scanDate: string;
  folder_id: string | null;
  owner_id: string;
  model_used: string;
}

interface EventFolder {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
}

interface MainAppProps {
  userId: string;
}

const MainApp: React.FC<MainAppProps> = ({ userId }) => {
  const { signOut } = useAuth();
  // Core State
  const [events, setEvents] = useState<EventFolder[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeEventId, setActiveEventId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  // Flyout State (View/Edit)
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // UI State
  const [aiModel, setAiModel] = useState('Alpha'); // 'Alpha' (OpenRouter) or 'Beta' (OpenAI)

  // UI Flow State
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Partial<Lead>[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  // Move to collection
  const [showMoveModal, setShowMoveModal] = useState(false);
  // Target collection for the review/import modal ('' = no collection / universal)
  const [reviewTargetFolder, setReviewTargetFolder] = useState<string>('');
  // Manual Create Contact
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', company: '', role: '', email: '', phone: '', address: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Init
  useEffect(() => {
    const m = localStorage.getItem('dalvicard_ai_selection');
    if (m) setAiModel(m);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchData();
    const sub = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'card_leads' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [userId, activeEventId]);

  const fetchData = async () => {
    if (!userId) return;
    const { data: f } = await supabase.from('card_folders').select('*').eq('owner_id', userId);
    setEvents(f || []);

    let query = supabase.from('card_leads').select('*').order('scanDate', { ascending: false });
    if (activeEventId !== 'all') {
      query = query.eq('folder_id', activeEventId);
    } else {
      query = query.eq('owner_id', userId);
    }
    const { data: l } = await query;
    setLeads(l || []);
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleSelectLead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(selectedLeadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeadIds(next);
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedLeadIds.size} selected leads?`)) return;
    const { error } = await supabase.from('card_leads').delete().in('id', Array.from(selectedLeadIds));
    if (!error) { setSelectedLeadIds(new Set()); fetchData(); }
  };

  const bulkMove = async (folderId: string | null) => {
    const { error } = await supabase.from('card_leads').update({ folder_id: folderId }).in('id', Array.from(selectedLeadIds));
    if (!error) { setSelectedLeadIds(new Set()); setShowMoveModal(false); fetchData(); }
  };

  const bulkExport = () => {
    const subset = leads.filter(l => selectedLeadIds.has(l.id));
    const ws = XLSX.utils.json_to_sheet(subset.map(l => ({
      Name: l.name,
      Company: l.company,
      Role: l.role,
      Email: l.email.join(', '),
      Phone: l.phone.join(', '),
      Address: l.address,
      ScannedBy: l.model_used
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    XLSX.writeFile(wb, "dalvicard_contacts.xlsx");
  };

  const processImages = async (imageUrls: string[]) => {
    try {
      setIsProcessing(true);

      // Call backend proxy instead of directly calling AI APIs
      const response = await fetch('http://localhost:3001/api/process-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrls,
          model: aiModel,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Server error: ${response.status}`);
      }

      const parsed = await response.json();
      const newItems = (parsed.leads || []).map((item: any) => ({
        name: item.name || '',
        company: item.company || '',
        role: item.role || '',
        address: item.address || '',
        email: Array.isArray(item.emails || item.email) ? (item.emails || item.email) : [item.emails || item.email].filter(Boolean),
        phone: (Array.isArray(item.phones || item.phone) ? (item.phones || item.phone) : [item.phones || item.phone].filter(Boolean)).map((p: string) => p.replace(/[^\d+]/g, '')),
        scanDate: new Date().toISOString(),
        folder_id: activeEventId === 'all' ? null : activeEventId,
        owner_id: userId,
        model_used: aiModel
      }));
      setReviewQueue(newItems);
    } catch (e: any) {
      console.error(e);
      alert("AI Processing Failed. " + (e.message || ""));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const urls = await Promise.all(files.map(f => new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = (ev) => res(ev.target?.result as string);
      reader.readAsDataURL(f);
    })));
    if (urls.length > 0) await processImages(urls);
  };

  const filteredLeads = leads.filter(l =>
    !searchTerm || l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* SIDEBAR */}
      <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      <aside className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="brand-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Grid size={20} fill="#D0E2F2" color="#D0E2F2" />
            DalviCard CRM
          </div>
          <button className="mobile-close" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} color="#fff" />
          </button>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-label">Views</div>
          <div
            className={`nav-item ${activeEventId === 'all' ? 'active' : ''}`}
            onClick={() => setActiveEventId('all')}
          >
            <Users size={16} /> All Contacts
          </div>

          <div className="sidebar-label">Collections</div>
          {events.map(e => (
            <div
              key={e.id}
              className={`nav-item ${activeEventId === e.id ? 'active' : ''}`}
              onClick={() => setActiveEventId(e.id)}
            >
              <FolderOpen size={16} /> <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
            </div>
          ))}
          <div className="nav-item" onClick={() => setShowAddEvent(true)}>
            <Plus size={16} /> New Collection
          </div>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 0' }}>
          <div className="nav-item" onClick={() => setShowSettingsModal(true)}>
            <Settings size={16} /> Settings
          </div>
          <div className="nav-item" onClick={() => signOut()} style={{ color: '#FCA5A5', marginTop: 8 }}>
            <X size={16} /> Logout
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-viewport">
        {/* HEADER */}
        <div className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <LayoutGrid size={20} />
            </button>
            <h1>Contacts</h1>
          </div>
          <div className="header-actions">
            <button className="btn-outline hide-mobile" onClick={() => fileInputRef.current?.click()}>
              <CloudUpload size={16} /> Batch Import
            </button>
            <input type="file" multiple ref={fileInputRef} hidden onChange={handleFileUpload} />
            <button className="btn-primary" onClick={() => {
              setNewContact({ name: '', company: '', role: '', email: '', phone: '', address: '' });
              setShowCreateModal(true);
            }}>
              <Plus size={16} className="show-mobile" />
              <span className="hide-mobile">+ Create contact</span>
              <span className="show-mobile">Create</span>
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="tabs-container">
          <div className="tab active">{activeEventId === 'all' ? 'All Contacts' : events.find(e => e.id === activeEventId)?.name}</div>
        </div>

        {/* FILTER BAR */}
        <div className="filter-bar">
          <div className="filters-left">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                className="search-input"
                placeholder="Search name, phone, email"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedLeadIds.size > 0 && (
              <>
                <div style={{ width: 1, height: 24, background: '#E2E8F0', margin: '0 8px' }}></div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>
                  {selectedLeadIds.size} selected
                </div>
                <button className="filter-btn" onClick={bulkExport}>
                  <Download size={14} /> Export
                </button>
                <button className="filter-btn" onClick={() => setShowMoveModal(true)}>
                  <FolderOpen size={14} /> Move to Collection
                </button>
                <button className="filter-btn" style={{ color: '#DC2626' }} onClick={bulkDelete}>
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
          </div>
          <div>
            <span style={{ fontSize: 13, color: '#94A3B8' }}>{filteredLeads.length} records</span>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input type="checkbox" className="checkbox-custom"
                    checked={selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll} />
                </th>
                <th style={{ width: '240px' }}>NAME</th>
                <th style={{ width: '200px' }}>EMAIL</th>
                <th style={{ width: '160px' }}>PHONE NUMBER</th>
                <th style={{ width: '180px' }}>ROLE</th>
                <th style={{ width: '180px' }}>ASSOCIATED COMPANY</th>
                <th>AI MODEL</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(l => (
                <tr key={l.id} className={selectedLeadIds.has(l.id) ? 'selected' : ''} onClick={() => setEditingLead(l)}>
                  <td className="checkbox-cell" onClick={(e) => toggleSelectLead(e, l.id)}>
                    <input type="checkbox" className="checkbox-custom" checked={selectedLeadIds.has(l.id)} readOnly />
                  </td>
                  <td>
                    <div className="name-cell">
                      <div className="avatar">{l.name.charAt(0) || '?'}</div>
                      <span className="name-text">{l.name || 'Unknown Contact'}</span>
                    </div>
                  </td>
                  <td><div className="cell-text">{l.email[0] || '-'}</div></td>
                  <td><div className="cell-text">{l.phone[0] || '-'}</div></td>
                  <td><div className="cell-text">{l.role || '-'}</div></td>
                  <td><div className="cell-text">{l.company || '-'}</div></td>
                  <td><span className="badge">{l.model_used?.split('/').pop()}</span></td>
                  <td>
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) { supabase.from('card_leads').delete().eq('id', l.id).then(() => fetchData()); } }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLeads.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px', color: '#94A3B8' }}>
              <Search size={32} style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 15, fontWeight: 500 }}>No contacts found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Import or scan business cards to see them here.</div>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT FLYOUT DRAWER FOR DETAILS / EDIT */}
      {editingLead && (
        <div className="flyout-overlay" onClick={() => setEditingLead(null)}>
          <div className="flyout-panel" onClick={e => e.stopPropagation()}>
            <div className="flyout-header">
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Contact Details</h2>
              <button className="icon-btn" onClick={() => setEditingLead(null)}><X size={20} /></button>
            </div>
            <div className="flyout-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>{editingLead.name.charAt(0)}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{editingLead.name}</div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>Scanned by {editingLead.model_used}</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={editingLead.name} onChange={e => setEditingLead({ ...editingLead, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="form-input" value={editingLead.company} onChange={e => setEditingLead({ ...editingLead, company: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Professional Role</label>
                <input className="form-input" value={editingLead.role} onChange={e => setEditingLead({ ...editingLead, role: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Addresses (Comma separated)</label>
                <input className="form-input" value={editingLead.email.join(', ')} onChange={e => setEditingLead({ ...editingLead, email: e.target.value.split(',').map(s => s.trim()) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Numbers (Comma separated)</label>
                <input className="form-input" value={editingLead.phone.join(', ')} onChange={e => setEditingLead({ ...editingLead, phone: e.target.value.split(',').map(s => s.replace(/[^\d+]/g, '')) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Office Address</label>
                <textarea className="form-input" value={editingLead.address} onChange={e => setEditingLead({ ...editingLead, address: e.target.value })} />
              </div>
            </div>
            <div className="flyout-footer">
              <button className="btn-outline" onClick={() => setEditingLead(null)}>Cancel</button>
              <button className="btn-primary" onClick={async () => {
                await supabase.from('card_leads').update(editingLead).eq('id', editingLead.id);
                setEditingLead(null);
                fetchData();
              }}>Save changes</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {reviewQueue.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="flyout-header">
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>Review Imported Contacts ({reviewQueue.length})</h2>
                <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Edit details below, then choose a collection to save into.</p>
              </div>
              {/* Collection picker inside the review modal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>Save to:</label>
                <select
                  className="form-input"
                  style={{ padding: '6px 10px', minWidth: 180 }}
                  value={reviewTargetFolder}
                  onChange={e => setReviewTargetFolder(e.target.value)}
                >
                  <option value="">â˜ï¸ Universal Cloud (No folder)</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>ðŸ“ {ev.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flyout-body" style={{ background: '#F8FAFC', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {reviewQueue.map((r, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '16px', position: 'relative' }}>
                    <button
                      className="icon-btn"
                      style={{ position: 'absolute', top: '8px', right: '8px', background: '#FEE2E2', color: '#DC2626' }}
                      onClick={() => setReviewQueue(reviewQueue.filter((_, idx) => idx !== i))}
                    >
                      <X size={14} />
                    </button>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Full Name</label>
                      <input className="form-input" style={{ padding: '6px 10px' }} value={r.name} onChange={e => { const n = [...reviewQueue]; n[i].name = e.target.value; setReviewQueue(n); }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Company</label>
                      <input className="form-input" style={{ padding: '6px 10px' }} value={r.company} onChange={e => { const n = [...reviewQueue]; n[i].company = e.target.value; setReviewQueue(n); }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Email</label>
                      <input className="form-input" style={{ padding: '6px 10px' }} value={r.email?.join(', ')} onChange={e => { const n = [...reviewQueue]; n[i].email = e.target.value.split(',').map(s => s.trim()); setReviewQueue(n); }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Phone</label>
                      <input className="form-input" style={{ padding: '6px 10px' }} value={r.phone?.join(', ')} onChange={e => { const n = [...reviewQueue]; n[i].phone = e.target.value.split(',').map(s => s.replace(/[^\d+]/g, '')); setReviewQueue(n); }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '4px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Address</label>
                      <input className="form-input" style={{ padding: '6px 10px' }} value={r.address || ''} onChange={e => { const n = [...reviewQueue]; n[i].address = e.target.value; setReviewQueue(n); }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flyout-footer">
              <button className="btn-outline" onClick={() => setReviewQueue([])}>Discard All</button>
              <button className="btn-primary" onClick={async () => {
                const withFolder = reviewQueue.map(r => ({ ...r, folder_id: reviewTargetFolder || null }));
                const { error } = await supabase.from('card_leads').insert(withFolder);
                if (!error) { setReviewQueue([]); fetchData(); }
                else alert('Import failed: ' + error.message);
              }}>Import Contacts</button>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: 32, alignItems: 'center', textAlign: 'center', maxWidth: 400 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }}></div>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Analyzing Cards...</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Processing with {aiModel}</p>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 450 }}>
            <div className="flyout-header">
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>AI Selection (Configured)</h2>
              <button className="icon-btn" onClick={() => setShowSettingsModal(false)}><X size={18} /></button>
            </div>
            <div className="flyout-body">
              <div className="form-group">
                <label className="form-label">Active Analysis Engine</label>
                <select className="form-input" value={aiModel} onChange={e => { setAiModel(e.target.value); localStorage.setItem('dalvicard_ai_selection', e.target.value); }}>
                  <option value="Alpha">Alpha (OpenRouter - Gemini 3.1)</option>
                  <option value="Beta">Beta (OpenAI - GPT-4o)</option>
                </select>
                <p style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
                  The API keys are already integrated into the application for your convenience.
                </p>
              </div>
            </div>
            <div className="flyout-footer">
              <button className="btn-primary" onClick={() => setShowSettingsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showAddEvent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400 }}>
            <div className="flyout-header">
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>New Collection</h2>
            </div>
            <div className="flyout-body">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Collection Name</label>
                <input className="form-input" value={newEventName} onChange={e => setNewEventName(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="flyout-footer">
              <button className="btn-outline" onClick={() => setShowAddEvent(false)}>Cancel</button>
              <button className="btn-primary" onClick={async () => {
                if (!newEventName.trim()) return;
                await supabase.from('card_folders').insert([{ name: newEventName.trim(), owner_id: userId }]);
                setShowAddEvent(false); setNewEventName(''); fetchData();
              }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* MOVE TO COLLECTION MODAL */}
      {showMoveModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div className="flyout-header">
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Move {selectedLeadIds.size} Contact{selectedLeadIds.size !== 1 ? 's' : ''} to Collection</h2>
              <button className="icon-btn" onClick={() => setShowMoveModal(false)}><X size={18} /></button>
            </div>
            <div className="flyout-body" style={{ paddingTop: 8 }}>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Select a destination collection below:</p>
              {/* Universal cloud option */}
              <button
                className="btn-outline"
                style={{ width: '100%', marginBottom: 8, justifyContent: 'flex-start', gap: 10 }}
                onClick={() => bulkMove(null)}
              >
                <LayoutGrid size={16} /> â˜ï¸ Universal Cloud (No folder)
              </button>
              {events.map(ev => (
                <button
                  key={ev.id}
                  className="btn-outline"
                  style={{ width: '100%', marginBottom: 8, justifyContent: 'flex-start', gap: 10 }}
                  onClick={() => bulkMove(ev.id)}
                >
                  <FolderOpen size={16} /> {ev.name}
                </button>
              ))}
              {events.length === 0 && (
                <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>No collections yet â€” create one first.</p>
              )}
            </div>
            <div className="flyout-footer">
              <button className="btn-outline" onClick={() => setShowMoveModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CONTACT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="flyout-header">
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Create New Contact</h2>
              <button className="icon-btn" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>
            <div className="flyout-body">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" autoFocus placeholder="e.g. Rahul Sharma" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input className="form-input" placeholder="e.g. Acme Corp" value={newContact.company} onChange={e => setNewContact({ ...newContact, company: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role / Title</label>
                  <input className="form-input" placeholder="e.g. Sales Manager" value={newContact.role} onChange={e => setNewContact({ ...newContact, role: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Addresses <span style={{ fontWeight: 400, textTransform: 'none' }}>(comma separated)</span></label>
                <input className="form-input" placeholder="e.g. rahul@acme.com, r.sharma@gmail.com" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Numbers <span style={{ fontWeight: 400, textTransform: 'none' }}>(comma separated)</span></label>
                <input className="form-input" placeholder="e.g. +919876543210, +911234567890" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-input" style={{ minHeight: 72, resize: 'vertical' }} placeholder="Office address..." value={newContact.address} onChange={e => setNewContact({ ...newContact, address: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Save to Collection</label>
                <select className="form-input" value={reviewTargetFolder} onChange={e => setReviewTargetFolder(e.target.value)}>
                  <option value="">â˜ï¸ Universal Cloud (No folder)</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>ðŸ“ {ev.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flyout-footer">
              <button className="btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={async () => {
                if (!newContact.name.trim()) { alert('Name is required'); return; }
                const record = {
                  name: newContact.name.trim(),
                  company: newContact.company.trim(),
                  role: newContact.role.trim(),
                  address: newContact.address.trim(),
                  email: newContact.email.split(',').map(s => s.trim()).filter(Boolean),
                  phone: newContact.phone.split(',').map(s => s.replace(/[^\d+]/g, '')).filter(Boolean),
                  scanDate: new Date().toISOString(),
                  folder_id: reviewTargetFolder || null,
                  owner_id: userId,
                  model_used: 'Manual'
                };
                const { error } = await supabase.from('card_leads').insert([record]);
                if (!error) { setShowCreateModal(false); fetchData(); }
                else alert('Save failed: ' + error.message);
              }}>Save Contact</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MainApp;

