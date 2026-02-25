import React, { useState, useEffect } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import { AdminRole, AdminPrivileges } from '../types';
import {
    grantAdminRole,
    getAdmins,
    updateAdminRoles,
    toggleInfluencerStatus,
    getSafetyReports,
    resolveReport,
    type SafetyReport,
    getOutletApplications,
    resolveApplication,
    type OutletApplication
} from '../services/adminService';
import { Shield, Users, AlertTriangle, Plus, MapPin, Check, X, Search, Crown, Loader2, FileText, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

// Reusing the Autocomplete Component Style from Feed/Home but minimal for Admin
const PlacesAutocomplete = ({ onSelect }: { onSelect: (address: string, lat: number, lng: number) => void }) => {
    const {
        ready,
        value,
        setValue,
        suggestions: { status, data },
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            /* Define search scope here if needed */
        },
        debounce: 300,
    });

    const handleSelect = async (address: string) => {
        setValue(address, false);
        clearSuggestions();
        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            onSelect(address, lat, lng);
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    return (
        <div className="relative w-full">
            <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={!ready}
                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                placeholder="Search places..."
            />
            {status === "OK" && (
                <ul className="absolute z-50 w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 overflow-hidden shadow-xl max-h-60 overflow-y-auto">
                    {data.map(({ place_id, description }) => (
                        <li
                            key={place_id}
                            onClick={() => handleSelect(description)}
                            className="px-4 py-3 hover:bg-slate-800 cursor-pointer text-sm text-slate-300 border-b border-slate-800/50 last:border-0"
                        >
                            {description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

interface AdminDashboardProps {
    onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
    const { adminPrivileges, isSuperAdmin, hasRole } = useAdmin();
    const [activeTab, setActiveTab] = useState<'users' | 'safety' | 'onboarding' | 'influencers' | 'posts' | 'comments'>('users');

    // User Management State
    const [targetEmail, setTargetEmail] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<AdminRole[]>([]);
    const [existingAdmins, setExistingAdmins] = useState<AdminPrivileges[]>([]);
    const [isGranting, setIsGranting] = useState(false);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (activeTab === 'users' && isSuperAdmin) {
            loadAdmins();
        }
    }, [activeTab, isSuperAdmin]);

    const loadAdmins = async () => {
        setIsLoadingList(true);
        const list = await getAdmins();
        setExistingAdmins(list);
        setIsLoadingList(false);
    };

    const handleToggleRoleSelection = (role: AdminRole) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(prev => prev.filter(r => r !== role));
        } else {
            setSelectedRoles(prev => [...prev, role]);
        }
    };

    const handleGrantRole = async () => {
        if (!isSuperAdmin) return;
        if (selectedRoles.length === 0) {
            setMessage('Error: Please select at least one role.');
            return;
        }

        setIsGranting(true);
        setMessage('');
        try {
            await grantAdminRole(targetEmail, selectedRoles);
            setMessage('Success! Privileges updated.');
            setTargetEmail('');
            setSelectedRoles([]);
            loadAdmins(); // Refresh list
        } catch (e: any) {
            setMessage(`Error: ${e.message}`);
        }
        setIsGranting(false);
    };

    const handleRevokeRole = async (adminUid: string, roleToRevoke: AdminRole, currentRoles: AdminRole[]) => {
        if (!confirm('Are you sure you want to remove this role?')) return;
        try {
            const newRoles = currentRoles.filter(r => r !== roleToRevoke);
            await updateAdminRoles(adminUid, newRoles);
            loadAdmins();
        } catch (e) {
            alert('Failed to update roles');
        }
    };

    const AVAILABLE_ROLES: AdminRole[] = [
        'INFLUENCER_MANAGER',
        'OUTLET_ONBOARDING',
        'SAFETY_MANAGER',
        'POST_MODERATOR',
        'COMMENT_MODERATOR'
    ];

    if (!adminPrivileges) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'users': return <UserManagerView isSuperAdmin={isSuperAdmin} targetEmail={targetEmail} setTargetEmail={setTargetEmail} selectedRoles={selectedRoles} handleToggleRoleSelection={handleToggleRoleSelection} isGranting={isGranting} handleGrantRole={handleGrantRole} message={message} isLoadingList={isLoadingList} existingAdmins={existingAdmins} handleRevokeRole={handleRevokeRole} AVAILABLE_ROLES={AVAILABLE_ROLES} />;
            case 'influencers': return <InfluencerManagerView />;
            case 'safety': return <SafetyManagerView />;
            case 'onboarding': return <OutletOnboardingView />;
            case 'posts': return <PostModeratorView />;
            case 'comments': return <CommentModeratorView />;
            default: return <UserManagerView isSuperAdmin={isSuperAdmin} targetEmail={targetEmail} setTargetEmail={setTargetEmail} selectedRoles={selectedRoles} handleToggleRoleSelection={handleToggleRoleSelection} isGranting={isGranting} handleGrantRole={handleGrantRole} message={message} isLoadingList={isLoadingList} existingAdmins={existingAdmins} handleRevokeRole={handleRevokeRole} AVAILABLE_ROLES={AVAILABLE_ROLES} />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-brand-900/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 p-2 rounded-lg">
                        <Shield className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Admin Command</h2>
                        <span className="text-xs text-slate-400 font-mono uppercase tracking-widest hidden sm:inline-block">
                            {adminPrivileges.roles.join(' • ')}
                        </span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
                    <X className="w-6 h-6 text-slate-300" />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-20 md:w-64 border-r border-white/10 bg-black/20 p-4 space-y-2 flex flex-col items-center md:items-stretch">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'users' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                        title="User Management"
                    >
                        <Users className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:block">User Management</span>
                    </button>

                    {(hasRole('INFLUENCER_MANAGER') || isSuperAdmin) && (
                        <button
                            onClick={() => setActiveTab('influencers')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'influencers' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                            title="Influencer Manager"
                        >
                            <Crown className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:block">Influencers</span>
                        </button>
                    )}

                    {(hasRole('SAFETY_MANAGER') || isSuperAdmin) && (
                        <button
                            onClick={() => setActiveTab('safety')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'safety' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                            title="Safety Center"
                        >
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:block">Safety Center</span>
                        </button>
                    )}
                    {(hasRole('OUTLET_ONBOARDING') || isSuperAdmin) && (
                        <button
                            onClick={() => setActiveTab('onboarding')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'onboarding' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                            title="Outlet Onboarding"
                        >
                            <MapPin className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:block">Onboarding</span>
                        </button>
                    )}
                    {(hasRole('POST_MODERATOR') || isSuperAdmin) && (
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'posts' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                            title="Post Moderation"
                        >
                            <FileText className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:block">Post Mod</span>
                        </button>
                    )}
                    {(hasRole('COMMENT_MODERATOR') || isSuperAdmin) && (
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'comments' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                            title="Comment Moderation"
                        >
                            <MessageSquare className="w-5 h-5 flex-shrink-0" /> <span className="hidden md:block">Comment Mod</span>
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/40">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

// --- SUB COMPONENTS ---

const UserManagerView = ({ isSuperAdmin, targetEmail, setTargetEmail, selectedRoles, handleToggleRoleSelection, isGranting, handleGrantRole, message, isLoadingList, existingAdmins, handleRevokeRole, AVAILABLE_ROLES }: any) => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Grant Roles Section */}
            {isSuperAdmin && (
                <div className="bg-slate-900/80 border border-brand-500/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Shield className="w-32 h-32 text-brand-500" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-brand-400" /> Grant Privileges
                    </h4>

                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <input
                            type="text"
                            placeholder="Enter user email or handle (@user)..."
                            value={targetEmail}
                            onChange={(e: any) => setTargetEmail(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-brand-500 outline-none placeholder:text-slate-600"
                        />
                    </div>

                    {/* Role Selection Checkboxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                        {AVAILABLE_ROLES.map((role: AdminRole) => (
                            <label key={role} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${selectedRoles.includes(role) ? 'bg-brand-500/20 border-brand-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedRoles.includes(role) ? 'bg-brand-500 border-brand-500' : 'border-slate-500'}`}>
                                    {selectedRoles.includes(role) && <Check className="w-3 h-3 text-black" />}
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-300">{role.replace('_', ' ')}</span>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedRoles.includes(role)}
                                    onChange={() => handleToggleRoleSelection(role)}
                                />
                            </label>
                        ))}
                    </div>

                    <button
                        onClick={handleGrantRole}
                        disabled={isGranting || !targetEmail || selectedRoles.length === 0}
                        className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl transition flex items-center justify-center gap-2 w-full md:w-auto"
                    >
                        {isGranting ? 'Processing...' : 'Grant Selected Roles'}
                    </button>

                    {message && (
                        <div className={`mt-4 p-3 rounded-lg text-sm font-medium animate-fade-in ${message.startsWith('Success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {message}
                        </div>
                    )}
                </div>
            )}

            {/* Existing Admins List */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-400" /> Active Administrators
                </h3>
                {isLoadingList ? (
                    <div className="text-slate-500 italic">Loading personnel...</div>
                ) : (
                    <div className="grid gap-4">
                        {existingAdmins.map((admin: any) => (
                            <div key={admin.uid} className="bg-slate-900 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-brand-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {admin.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-white">{admin.email}</h5>
                                        <p className="text-xs text-slate-500">
                                            Assigned {formatDistanceToNow(new Date(admin.assignedAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {admin.roles.map((role: any) => (
                                        <span key={role} className="flex items-center gap-1 bg-slate-800 text-slate-300 text-[10px] px-2 py-1 rounded-lg border border-slate-700">
                                            {role.replace('_', ' ')}
                                            {isSuperAdmin && role !== 'SUPER_ADMIN' && (
                                                <button onClick={() => handleRevokeRole(admin.uid, role, admin.roles)} className="hover:text-red-400 ml-1">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {existingAdmins.length === 0 && (
                            <div className="text-slate-500 text-sm p-4 text-center border border-dashed border-slate-800 rounded-xl">
                                No other administrators found.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const InfluencerManagerView = () => {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initial load of ONLY influencers
        const fetchInfluencers = async () => {
            setLoading(true);
            const q = query(collection(db, 'users'), where('isInfluencer', '==', true));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(data);
            setLoading(false);
        };
        fetchInfluencers();
    }, []);

    const handleSearch = async () => {
        if (!search) return;
        setLoading(true);
        try {
            const usersRef = collection(db, 'users');
            // Fetch ALL users (limitation of Firestore for "contains" search without 3rd party like Algolia)
            // For Admin dashboard volume, this is acceptable for now.
            const snap = await getDocs(usersRef);
            const clean = search.toLowerCase().replace('@', '').trim();

            const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            console.log(`Admin Search: Scanned ${allDocs.length} users.`);

            const matches = allDocs.filter((u: any) =>
                (u.handle && u.handle.toLowerCase().includes(clean)) ||
                (u.displayName && u.displayName.toLowerCase().includes(clean)) ||
                (u.email && u.email.toLowerCase().includes(clean)) ||
                (u.id && u.id.toLowerCase().includes(clean))
            );

            if (matches.length === 0) {
                console.log("No matches found. Sample handles:", allDocs.slice(0, 5).map((u: any) => u.handle));
            }

            setUsers(matches);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const toggle = async (uid: string, current: boolean) => {
        await toggleInfluencerStatus(uid, !current);
        // Optimistic update
        setUsers(prev => prev.map(u => u.id === uid ? { ...u, isInfluencer: !current } : u));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Crown className="w-6 h-6 text-brand-400" /> Influencer Management
            </h3>

            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by handle, name, email or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-500 transition"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-6 rounded-xl font-bold transition disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                    </button>
                </div>
                {users.length > 0 && <div className="text-xs text-slate-500 mb-4 px-1">Found {users.length} matches</div>}

                <div className="space-y-4">
                    {users.map(u => (
                        <div key={u.id} className="bg-slate-800/50 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src={u.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                                <div>
                                    <div className="font-bold text-white">{u.displayName}</div>
                                    <div className="text-xs text-slate-500">@{u.handle}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => toggle(u.id, u.isInfluencer)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${u.isInfluencer ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'}`}
                            >
                                {u.isInfluencer ? 'Active Influencer' : 'Promote to Influencer'}
                            </button>
                        </div>
                    ))}
                    {users.length === 0 && !loading && <div className="text-slate-500 text-center">Search for a user to manage their status</div>}
                </div>
            </div>
        </div>
    );
};

const SafetyManagerView = () => {
    const [reports, setReports] = useState<SafetyReport[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        const data = await getSafetyReports();
        setReports(data);
        setLoading(false);
    };

    const handleResolve = async (id: string, action: 'dismiss' | 'ban_user' | 'delete_content') => {
        await resolveReport(id, action);
        // Optimistic update
        setReports(prev => prev.filter(r => r.id !== id));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-brand-400" /> Safety Operations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-white">Live Reports</h4>
                        {reports.length > 0 && <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full font-bold">{reports.length} New</span>}
                    </div>
                    {loading ? (
                        <div className="text-slate-500 p-4">Loading reports...</div>
                    ) : (
                        <div className="space-y-4">
                            {reports.map((report) => (
                                <div key={report.id} className="bg-black/20 p-3 rounded-xl border border-white/5 flex gap-3">
                                    <div className="w-2 h-full bg-red-500 rounded-full" />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-red-400 capitalize">{report.type}</span>
                                            <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}</span>
                                        </div>
                                        <p className="text-sm text-slate-300 mt-1 line-clamp-2">{report.reason}</p>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => handleResolve(report.id, 'ban_user')} className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-200 px-3 py-1 rounded-lg">Ban User</button>
                                            <button onClick={() => handleResolve(report.id, 'dismiss')} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg text-white">Dismiss</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {reports.length === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    <p>All clear. No pending reports.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                    <h4 className="font-bold text-white mb-4">Banned Users</h4>
                    <div className="text-center py-8 text-slate-500">
                        <Check className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>No active bans</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OutletOnboardingView = () => {
    const [applications, setApplications] = useState<OutletApplication[]>([]);
    const [loading, setLoading] = useState(false);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);

    // Manual Form State
    const [manualName, setManualName] = useState('');
    const [manualAddress, setManualAddress] = useState('');
    const [manualDesc, setManualDesc] = useState('');
    const [manualCoords, setManualCoords] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        loadApps();
    }, []);

    const loadApps = async () => {
        setLoading(true);
        const data = await getOutletApplications();
        setApplications(data);
        setLoading(false);
    };

    const handleAction = async (id: string, action: 'approved' | 'rejected') => {
        await resolveApplication(id, action);
        // Update local state to reflect change (move to approved list or remove if rejected)
        if (action === 'approved') {
            setApplications(prev => prev.map(app => app.id === id ? { ...app, status: 'approved' } : app));
        } else {
            setApplications(prev => prev.filter(app => app.id !== id));
        }
    };

    const handleManualSubmit = async () => {
        if (!manualName || !manualAddress) return;

        try {
            await addDoc(collection(db, 'outlet_applications'), {
                name: manualName,
                address: manualAddress,
                description: manualDesc || 'Manual Entry',
                submitterEmail: 'admin@manual', // Or current admin email
                timestamp: new Date().toISOString(),
                status: 'approved', // Auto-approve manual
                coordinates: manualCoords || { lat: 0, lng: 0 }
            });
            alert("Outlet manually added and approved.");
            setIsManualModalOpen(false);
            setManualName('');
            setManualAddress('');
            setManualDesc('');
            setManualCoords(null);
            loadApps(); // Refresh
        } catch (e: any) {
            console.error("Manual Add Failed:", e);
            alert(`Failed to manual add: ${e?.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-brand-400" /> Outlet Applications
                </h3>
                <button
                    onClick={() => setIsManualModalOpen(true)}
                    className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Manual Onboard
                </button>
            </div>

            {loading ? (
                <div className="text-slate-500 text-center p-8">Loading applications...</div>
            ) : (
                <div className="space-y-8">
                    {/* Pending Applications */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Pending Review</h4>
                        <div className="grid gap-4">
                            {applications.filter(a => a.status === 'pending').map((app) => (
                                <div key={app.id} className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-brand-500/50 transition">
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shrink-0">
                                            <MapPin className="w-8 h-8 text-slate-500 group-hover:text-amber-400 transition" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-bold text-white">{app.name}</h4>
                                                <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Pending</span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1">{app.address} • {app.description}</p>
                                            <p className="text-xs text-slate-500 mt-2">Submitted by {app.submitterEmail} • {formatDistanceToNow(new Date(app.timestamp), { addSuffix: true })}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button onClick={() => handleAction(app.id, 'approved')} className="flex-1 md:flex-none px-6 py-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/20 font-bold text-sm transition">
                                            Approve
                                        </button>
                                        <button onClick={() => handleAction(app.id, 'rejected')} className="flex-1 md:flex-none px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 font-bold text-sm transition">
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {applications.filter(a => a.status === 'pending').length === 0 && (
                                <div className="text-center py-6 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                                    <p>No pending applications.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Approved Outlets */}
                    <div>
                        <h4 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                            Approved Outlets <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">{applications.filter(a => a.status === 'approved').length}</span>
                        </h4>
                        <div className="grid gap-4">
                            {applications.filter(a => a.status === 'approved').map((app) => (
                                <div key={app.id} className="bg-slate-900 border border-green-500/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 opacity-75 hover:opacity-100 transition">
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shrink-0">
                                            <MapPin className="w-8 h-8 text-green-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-bold text-white">{app.name}</h4>
                                                <span className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Active</span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1">{app.address}</p>
                                            <p className="text-xs text-slate-500 mt-2">Added {formatDistanceToNow(new Date(app.timestamp), { addSuffix: true })}</p>
                                        </div>
                                    </div>
                                    {/* Optional: Add Revoke/Delete button in future */}
                                </div>
                            ))}
                            {applications.filter(a => a.status === 'approved').length === 0 && (
                                <div className="text-center py-6 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                                    <p>No approved outlets yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isManualModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button onClick={() => setIsManualModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
                        <h3 className="text-xl font-bold text-white mb-4">Manual Outlet Onboarding</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Outlet Name</label>
                                <input value={manualName} onChange={e => setManualName(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-white" placeholder="e.g. The Vibe Bar" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Location Search</label>
                                <PlacesAutocomplete onSelect={(addr, lat, lng) => {
                                    setManualAddress(addr);
                                    if (!manualName) setManualName(addr.split(',')[0]);
                                    setManualCoords({ lat, lng });
                                }} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Selected Address</label>
                                <input value={manualAddress} onChange={e => setManualAddress(e.target.value)} className="w-full bg-black/40 border border-brand-500/50 rounded-xl px-4 py-2 text-white" placeholder="Address from search..." />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Description</label>
                                <input value={manualDesc} onChange={e => setManualDesc(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-white" placeholder="Category, vibe, etc." />
                            </div>
                            <button onClick={handleManualSubmit} disabled={!manualName || !manualAddress} className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl mt-2 disabled:opacity-50">
                                Create & Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PostModeratorView = () => {
    const [reports, setReports] = useState<SafetyReport[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        const data = await getSafetyReports();
        setReports(data.filter(r => r.type === 'post'));
        setLoading(false);
    };

    const handleResolve = async (id: string, action: 'dismiss' | 'ban_user' | 'delete_content') => {
        await resolveReport(id, action);
        setReports(prev => prev.filter(r => r.id !== id));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-brand-400" /> Post Moderation Queue
            </h3>
            {loading ? <div className="text-slate-500">Loading...</div> : (
                <div className="space-y-4">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-slate-900 border border-white/10 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-bold uppercase">{report.reason}</span>
                                <span className="text-slate-500 text-xs">{formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}</span>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg mb-4 text-slate-300 text-sm">
                                {report.details?.text || "Content snippet unavailable"}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleResolve(report.id, 'dismiss')} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-white">Mark Safe</button>
                                <button onClick={() => handleResolve(report.id, 'delete_content')} className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-200 px-3 py-2 rounded-lg">Delete Post</button>
                                <button onClick={() => handleResolve(report.id, 'ban_user')} className="text-xs bg-red-950 text-red-500 border border-red-900/50 hover:bg-red-900/20 px-3 py-2 rounded-lg">Ban User</button>
                            </div>
                        </div>
                    ))}
                    {reports.length === 0 && <div className="text-slate-500 text-center py-8">Queue empty. Good vibes only!</div>}
                </div>
            )}
        </div>
    );
};

const CommentModeratorView = () => {
    const [reports, setReports] = useState<SafetyReport[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        const data = await getSafetyReports();
        setReports(data.filter(r => r.type === 'comment'));
        setLoading(false);
    };

    const handleResolve = async (id: string, action: 'dismiss' | 'ban_user' | 'delete_content') => {
        await resolveReport(id, action);
        setReports(prev => prev.filter(r => r.id !== id));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-brand-400" /> Comment Moderation Queue
            </h3>
            {loading ? <div className="text-slate-500">Loading...</div> : (
                <div className="space-y-4">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-slate-900 border border-white/10 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-bold uppercase">{report.reason}</span>
                                <span className="text-slate-500 text-xs">{formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}</span>
                            </div>
                            <div className="bg-black/30 p-3 rounded-lg mb-4 text-slate-300 text-sm italic">
                                "{report.details?.text || "Content snippet unavailable"}"
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleResolve(report.id, 'dismiss')} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-white">Mark Safe</button>
                                <button onClick={() => handleResolve(report.id, 'delete_content')} className="text-xs bg-red-900/40 hover:bg-red-900/60 text-red-200 px-3 py-2 rounded-lg">Delete Comment</button>
                                <button onClick={() => handleResolve(report.id, 'ban_user')} className="text-xs bg-red-950 text-red-500 border border-red-900/50 hover:bg-red-900/20 px-3 py-2 rounded-lg">Ban User</button>
                            </div>
                        </div>
                    ))}
                    {reports.length === 0 && <div className="text-slate-500 text-center py-8">No flagged comments.</div>}
                </div>
            )}
        </div>
    );
};
