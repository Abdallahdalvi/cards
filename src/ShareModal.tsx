import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { X, UserPlus, Shield, ShieldAlert, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ShareModalProps {
    event: { id: string, name: string };
    onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ event, onClose }) => {
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<'view' | 'edit'>('view');
    const [loading, setLoading] = useState(false);
    const [shares, setShares] = useState<any[]>([]);

    useEffect(() => {
        fetchShares();
    }, [event.id]);

    const fetchShares = async () => {
        const { data } = await supabase
            .from('card_shared_folders')
            .select('*')
            .eq('folder_id', event.id);
        if (data) setShares(data);
    };

    const handleShare = async () => {
        if (!email.trim()) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('card_shared_folders')
                .insert([{ 
                    folder_id: event.id, 
                    shared_with_email: email.trim().toLowerCase(), 
                    permission 
                }]);
            if (error) throw error;
            setEmail('');
            fetchShares();
        } catch (error) {
            console.error("Sharing failed", error);
            alert("Could not share. Please check permissions.");
        } finally {
            setLoading(false);
        }
    };

    const removeShare = async (shareId: string) => {
        try {
            await supabase.from('card_shared_folders').delete().eq('id', shareId);
            fetchShares();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="modal-overlay">
            <motion.div 
                className="modal-card" 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
            >
                <div className="modal-header">
                    <h3>Share "{event.name}"</h3>
                    <button className="btn-ghost" onClick={onClose}><X /></button>
                </div>
                
                <div className="modal-body">
                    <p className="modal-description">Share this folder with others via Supabase.</p>
                    
                    <div className="share-input-group">
                        <input 
                            type="email" 
                            placeholder="user@example.com" 
                            className="card share-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <select 
                            className="card share-select"
                            value={permission}
                            onChange={(e) => setPermission(e.target.value as any)}
                        >
                            <option value="view">Viewer</option>
                            <option value="edit">Editor</option>
                        </select>
                        <button 
                            className="btn btn-primary share-btn" 
                            onClick={handleShare}
                            disabled={loading}
                        >
                            <UserPlus size={18} />
                        </button>
                    </div>

                    <div className="shares-list">
                        <h4>Shared with</h4>
                        {shares.length === 0 ? (
                            <p className="empty-mini">Not shared with anyone yet.</p>
                        ) : (
                            shares.map((s: any, idx: number) => (
                                <div key={idx} className="share-row card">
                                    <div className="share-info">
                                        <span className="share-email">{s.shared_with_email}</span>
                                        <span className="share-badge">
                                            {s.permission === 'edit' ? <Shield size={12}/> : <ShieldAlert size={12}/>}
                                            {s.permission}
                                        </span>
                                    </div>
                                    <button className="btn-ghost" onClick={() => removeShare(s.id)}>
                                        <Trash2 size={16} color="#ef4444" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ShareModal;

