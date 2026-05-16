import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    LayoutDashboard,
    ShoppingCart,
    History,
    Settings,
    MessageCircle,
    Search,
    RefreshCcw,
    Send,
    User,
    Clock,
    CheckCircle2,
    Phone,
    Truck,
    XCircle,
    ChevronLeft,
    X,
    Paperclip,
    Megaphone,
    Image as ImageIcon,
    Package,
    Sun,
    Moon,
    CheckCheck,
    Check,
    Cog,
    Eye,
    EyeOff,
    ShieldCheck,
    Zap,
    Plus,
    Trash2,
    ToggleLeft,
    ToggleRight,
    ChevronDown,
    Users,
    Tag,
    StickyNote,
    UserCheck,
    Filter,
    Sparkles,
    FileText,
    Gift,
    Globe,
    Link2,
    Calendar,
    MessageSquareQuote,
    Download,
    Star,
    Brain,
    Palette,
    UserPlus,
    Bell,
    CheckCircle,
    Copy,
    ExternalLink,
    LogOut,
} from 'lucide-react';
import { PricingPage as AuthPricingPage, RegisterPage, LoginPage } from './Auth';
import { PricingPage } from './PricingPage';

const API_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : `${window.location.origin}/api`;

const OmniFlowMark = ({ size = 24, bg = '#F5EBE1', fg = '#003223', pulse = '#FF6400' }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', flexShrink: 0 }}>
        <circle cx="50" cy="50" r="40" fill={bg} />
        <circle cx="64" cy="42" r="32" fill={fg} />
        <circle cx="32" cy="62" r="5" fill={pulse} />
    </svg>
);


// ── Professional notification sound (Web Audio API) ──────────────────────────
const playNotifSound = (type = 'message') => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const freqs = type === 'order'
            ? [[660, 880, 0.12], [880, 1100, 0.12]]   // two rising tones for orders
            : [[880, 660, 0.10], [1320, 880, 0.10]];   // descending chime for messages
        freqs.forEach(([from, to, dur], i) => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(from, ctx.currentTime + i * 0.13);
            osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + i * 0.13 + dur);
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.13);
            gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.13 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + dur + 0.3);
            osc.start(ctx.currentTime + i * 0.13);
            osc.stop(ctx.currentTime + i * 0.13 + dur + 0.35);
        });
    } catch(e) {}
};

// ── Notification Center ───────────────────────────────────────────────────────
const NotificationCenter = ({ notifications, onRead, onClear, onNavigate, lang }) => {
    const isEn = lang === 'en';
    const unread = notifications.filter(n => !n.read).length;

    const iconFor = (type) => {
        if (type === 'order')    return <ShoppingCart size={13} className="text-brand-accent" />;
        if (type === 'cart')     return <RefreshCcw size={13} className="text-brand-gold" />;
        if (type === 'message')  return <MessageCircle size={13} className="text-blue-400" />;
        return <Zap size={13} className="text-brand-muted" />;
    };

    const timeAgo = (iso) => {
        const d = Math.floor((Date.now() - new Date(iso)) / 1000);
        if (d < 60)   return isEn ? `${d}s ago` : `منذ ${d}ث`;
        if (d < 3600) return isEn ? `${Math.floor(d/60)}m ago` : `منذ ${Math.floor(d/60)}د`;
        return isEn ? `${Math.floor(d/3600)}h ago` : `منذ ${Math.floor(d/3600)}س`;
    };

    return (
        <div className="absolute top-full mt-2 right-0 w-80 glass rounded-2xl shadow-2xl z-50 overflow-hidden border border-brand-border/20 animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border/15">
                <div className="flex items-center gap-2">
                    <Bell size={14} className="text-brand-accent" />
                    <span className="text-[12px] font-black text-brand-egg">{isEn ? 'Notifications' : 'الإشعارات'}</span>
                    {unread > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-brand-accent text-brand-bg">{unread}</span>}
                </div>
                {notifications.length > 0 && (
                    <button onClick={onClear} className="text-[10px] text-brand-muted hover:text-brand-accent font-bold transition-colors">
                        {isEn ? 'Clear all' : 'مسح الكل'}
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-brand-border/10">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-brand-muted opacity-50">
                        <Bell size={28} className="mb-2 opacity-30" />
                        <p className="text-xs font-bold">{isEn ? 'All caught up!' : 'لا توجد إشعارات'}</p>
                    </div>
                ) : notifications.map(n => (
                    <div key={n.id} onClick={() => { onRead(n.id); onNavigate(n.tab); }}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.04] transition-colors ${!n.read ? 'bg-brand-accent/5' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${!n.read ? 'bg-brand-accent/15' : 'bg-brand-border/20'}`}>
                            {iconFor(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-brand-egg truncate">{n.title}</p>
                            <p className="text-[11px] text-brand-muted leading-relaxed mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-[9px] text-brand-muted/60 mt-1">{timeAgo(n.time)}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-brand-accent shrink-0 mt-1.5" />}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Global Search ─────────────────────────────────────────────────────────────
const GlobalSearch = ({ inbox, orders, quickReplies, navItems, onNavigate, onOpenChat, onClose, lang }) => {
    const isEn = lang === 'en';
    const [q, setQ] = React.useState('');
    const inputRef = React.useRef(null);

    React.useEffect(() => { inputRef.current?.focus(); }, []);

    // Keyboard: Escape to close
    React.useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    const results = React.useMemo(() => {
        if (!q.trim() || q.length < 2) return [];
        const ql = q.toLowerCase();
        const out = [];

        // Navigation
        navItems.filter(n => n.label.toLowerCase().includes(ql)).forEach(n => {
            out.push({ type: 'nav', icon: n.icon, title: n.label, sub: isEn ? 'Go to section' : 'اذهب إلى القسم', action: () => { onNavigate(n.id); onClose(); } });
        });

        // Chats
        (inbox || []).filter(c => c.name?.toLowerCase().includes(ql) || c.phone?.includes(ql)).slice(0,4).forEach(c => {
            const lastMsg = c.messages?.[c.messages.length-1]?.text || '';
            out.push({ type: 'chat', icon: MessageCircle, title: c.name || c.phone, sub: lastMsg || c.phone, action: () => { onOpenChat(c.phone); onNavigate('chat'); onClose(); } });
        });

        // Orders
        (orders || []).filter(o => {
            const name = `${o.customer?.first_name||''} ${o.customer?.last_name||''}`.toLowerCase();
            return name.includes(ql) || String(o.order_number||'').includes(ql) || String(o.id||'').includes(ql);
        }).slice(0,4).forEach(o => {
            const name = `${o.customer?.first_name||''} ${o.customer?.last_name||''}`.trim() || '—';
            out.push({ type: 'order', icon: ShoppingCart, title: `#${o.order_number || o.id}`, sub: `${name} · EGP ${o.total_price || 0}`, action: () => { onNavigate('shop'); onClose(); } });
        });

        // Quick Replies
        (quickReplies || []).filter(r => r.title?.toLowerCase().includes(ql) || r.text?.toLowerCase().includes(ql)).slice(0,3).forEach(r => {
            out.push({ type: 'reply', icon: MessageSquareQuote, title: `/${r.title}`, sub: r.text, action: () => { onNavigate('quick-replies'); onClose(); } });
        });

        return out;
    }, [q, inbox, orders, quickReplies, navItems, isEn]);

    const typeLabel = { nav: isEn?'Navigation':'تنقل', chat: isEn?'Chats':'محادثات', order: isEn?'Orders':'طلبات', reply: isEn?'Quick Replies':'ردود سريعة' };
    const typeColor = { nav: 'text-brand-accent', chat: 'text-blue-400', order: 'text-brand-gold', reply: 'text-purple-400' };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" style={{background:'rgba(0,0,0,0.6)'}} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-xl glass rounded-2xl shadow-2xl overflow-hidden border border-brand-border/20 animate-in slide-in-from-top-4 fade-in duration-200">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-brand-border/15">
                    <Search size={16} className="text-brand-accent shrink-0" />
                    <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
                        placeholder={isEn ? 'Search chats, orders, features...' : 'ابحث في المحادثات، الطلبات، المزايا...'}
                        className="flex-1 bg-transparent text-sm outline-none text-brand-egg placeholder-brand-muted/50" />
                    <kbd className="text-[10px] text-brand-muted font-mono bg-brand-border/20 px-1.5 py-0.5 rounded">ESC</kbd>
                </div>

                {/* Results */}
                {q.length >= 2 && (
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {results.length === 0 ? (
                            <div className="flex flex-col items-center py-10 text-brand-muted opacity-50">
                                <Search size={24} className="mb-2 opacity-30" />
                                <p className="text-sm font-bold">{isEn ? 'No results' : 'لا توجد نتائج'}</p>
                            </div>
                        ) : (() => {
                            const groups = {};
                            results.forEach(r => { if (!groups[r.type]) groups[r.type] = []; groups[r.type].push(r); });
                            return Object.entries(groups).map(([type, items]) => (
                                <div key={type}>
                                    <p className="text-[9px] font-black text-brand-muted tracking-widest uppercase px-4 py-2 border-b border-brand-border/10">{typeLabel[type]}</p>
                                    {items.map((item, i) => (
                                        <button key={i} onClick={item.action}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors text-left border-b border-brand-border/10 last:border-0">
                                            <div className={`w-7 h-7 rounded-lg glass flex items-center justify-center shrink-0 ${typeColor[type]}`}>
                                                <item.icon size={13} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[12px] font-bold ${typeColor[type]}`}>{item.title}</p>
                                                <p className="text-[11px] text-brand-muted truncate">{item.sub}</p>
                                            </div>
                                            <ChevronLeft size={13} className="text-brand-muted rotate-180 shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            ));
                        })()}
                    </div>
                )}

                {q.length < 2 && (
                    <div className="px-4 py-4 grid grid-cols-2 gap-2">
                        {[
                            { label: isEn?'Chats':'محادثات', id:'chat', icon: MessageCircle, color:'text-blue-400' },
                            { label: isEn?'Orders':'الطلبات', id:'shop', icon: ShoppingCart, color:'text-brand-gold' },
                            { label: isEn?'Broadcasts':'البث', id:'campaigns', icon: Megaphone, color:'text-brand-accent' },
                            { label: isEn?'Analytics':'التقارير', id:'logs', icon: Calendar, color:'text-purple-400' },
                        ].map(s => (
                            <button key={s.id} onClick={() => { onNavigate(s.id); onClose(); }}
                                className="flex items-center gap-2.5 px-3 py-2.5 glass-subtle rounded-xl text-[11px] font-bold text-brand-muted hover:text-brand-egg transition-colors border border-brand-border/15">
                                <s.icon size={13} className={s.color} />
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

function UpgradePrompt({ feature, minPlan, onUpgrade, isEn }) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
                <Zap size={32} className="text-brand-accent" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-black text-brand-egg">
                    {isEn ? `${feature} requires ${minPlan}` : `${feature} متاح من خطة ${minPlan}`}
                </h3>
                <p className="text-sm text-brand-muted">
                    {isEn ? 'Upgrade your plan to unlock this feature' : 'رقِّ خطتك للوصول لهذه الميزة'}
                </p>
            </div>
            <button onClick={onUpgrade}
                className="px-8 py-3 bg-brand-accent text-brand-bg rounded-xl font-black text-sm hover:opacity-90 transition-all">
                {isEn ? 'View Plans →' : 'عرض الخطط ←'}
            </button>
        </div>
    );
}

const App = () => {
    // ── Auth state ───────────────────────────────────────────────────────────
    const [authScreen, setAuthScreen] = useState(() => {
        const token = localStorage.getItem('omni_token');
        if (token) return null;
        // If Shopify just redirected with a token in the hash, don't show login screen yet
        if (window.location.hash.includes('shopify_token=')) return null;
        return 'login';
    });
    const [authTenant, setAuthTenant] = useState(() => {
        try { return JSON.parse(localStorage.getItem('omni_tenant') || 'null'); } catch { return null; }
    });
    const [showPricing, setShowPricing] = useState(false);

    const handleLogin = (token, tenant) => {
        localStorage.setItem('omni_token', token);
        localStorage.setItem('omni_tenant', JSON.stringify(tenant));
        setAuthTenant(tenant);
        setAuthScreen(null);
    };
    const handleLogout = () => {
        localStorage.removeItem('omni_token');
        localStorage.removeItem('omni_tenant');
        setAuthTenant(null);
        setAuthScreen('login');
    };

    // Inject auth token into all axios requests
    useEffect(() => {
        const id = axios.interceptors.request.use(cfg => {
            const t = localStorage.getItem('omni_token');
            if (t) cfg.headers.Authorization = `Bearer ${t}`;
            return cfg;
        });
        const rid = axios.interceptors.response.use(r => r, err => {
            if (err.response?.status === 402) {
                handleLogout();
                setAuthScreen('pricing');
            }
            return Promise.reject(err);
        });
        return () => { axios.interceptors.request.eject(id); axios.interceptors.response.eject(rid); };
    }, []);


    // Handle Shopify OAuth redirect — pick up JWT from URL hash
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash.includes('shopify_token=')) return;
        const params = new URLSearchParams(hash.slice(1));
        const token = params.get('shopify_token');
        if (!token) return;
        const planActivated = params.get('plan_activated');
        window.history.replaceState(null, '', window.location.pathname);
        axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => {
                handleLogin(token, r.data);
                if (planActivated) {
                    // Plan was just activated — close pricing overlay if open
                    setShowPricing(false);
                }
            })
            .catch(() => {});
    }, []);

    const [activeTab, setActiveTab] = useState('dash');
    const [orders, setOrders] = useState([]);
    const [inbox, setInbox] = useState([]);
    const [templates, setTemplates] = useState({});
    const [abandonedCarts, setAbandonedCarts] = useState([]);
    const [catalogId, setCatalogId] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [isConfigured, setIsConfigured] = useState(true);

    // ── Notifications + Search state ────────────────────────────────────────
    const [notifications, setNotifications] = React.useState([]);
    const [showNotifs, setShowNotifs] = React.useState(false);
    const [showSearch, setShowSearch] = React.useState(false);
    const [quickRepliesGlobal, setQuickRepliesGlobal] = React.useState([]);
    const prevInboxLen = React.useRef(0);
    const prevOrdersLen = React.useRef(0);
    const notifIdRef = React.useRef(0);

    const addNotif = React.useCallback((type, title, body, tab) => {
        const id = ++notifIdRef.current;
        setNotifications(p => [{ id, type, title, body, tab, time: new Date().toISOString(), read: false }, ...p].slice(0, 50));
        playNotifSound(type);
        if (Notification?.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
    }, []);

    // Global keyboard shortcut Ctrl+K / Cmd+K
    React.useEffect(() => {
        const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(p => !p); } };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);

    // Load quick replies for global search
    React.useEffect(() => {
        axios.get(`${API_URL}/quick-replies`).then(r => setQuickRepliesGlobal(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    }, []);

    // Request notification permission
    React.useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    }, []);


    const [branding, setBranding] = useState({ brand_color: '#d5aa65', logo_url: null });
    const [loading, setLoading] = useState(false);
    const [activeChatPhone, setActiveChatPhone] = useState(null);
    const [toast, setToast] = useState(null);
    const [lang, setLang] = useState(() => localStorage.getItem('omni_lang') || 'ar');
    const [theme, setTheme] = useState(() => localStorage.getItem('omni_theme') || 'dark');
    const [aiEnabled, setAiEnabled] = useState(true);

    const toggleAI = async () => {
        try {
            const next = !aiEnabled;
            setAiEnabled(next);
            await axios.post(`${API_URL}/settings/ai-toggle`, { enabled: next });
            showToast(lang === 'en' ? `AI Assistant ${next ? 'Enabled' : 'Disabled'}` : `تم ${next ? 'تفعيل' : 'تعطيل'} المساعد الذكي`);
        } catch (e) {
            showToast(lang === 'en' ? 'Failed to toggle AI' : 'فشل تغيير حالة المساعد', 'error');
        }
    };


    const showToast = (message, type = 'success') => {
        let safeMessage = message;
        if (typeof message === 'object' && message !== null) {
            safeMessage = message.error || message.message || JSON.stringify(message);
        }
        setToast({ message: String(safeMessage), type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleOpenChat = (phone) => {
        setActiveChatPhone(phone);
        setActiveTab('chat');
    };

    const navItems = [
        { id: 'dash', label: lang === 'en' ? 'Dashboard' : 'الرئيسية', icon: LayoutDashboard },
        { id: 'chat', label: lang === 'en' ? 'Chats' : 'المحادثات', icon: MessageCircle, badge: inbox.length },
        { id: 'shop', label: lang === 'en' ? 'Shopify Orders' : 'أوردرات شوبيفاي', icon: ShoppingCart },
        { id: 'abandoned', label: lang === 'en' ? 'Abandoned Carts' : 'السلات المتروكة', icon: Clock, badge: abandonedCarts.filter(c => !c.drip_sent).length || undefined },
        { id: 'catalog', label: lang === 'en' ? 'Send Product' : 'إرسال منتج', icon: Package },
        { id: 'campaigns', label: lang === 'en' ? 'Broadcasts' : 'حملات الترويج', icon: Megaphone },
        { id: 'automations', label: lang === 'en' ? 'Automations' : 'الأتمتة', icon: Zap },
        { id: 'quick-replies', label: lang === 'en' ? 'Quick Replies' : 'ردود سريعة', icon: MessageSquareQuote },
        { id: 'logs', label: lang === 'en' ? 'Analytics' : 'التقارير والإحصاء', icon: History },
        { id: 'settings', label: lang === 'en' ? 'Templates' : 'إدارة القوالب', icon: Settings },
        { id: 'config', label: lang === 'en' ? 'App Settings' : 'إعدادات التطبيق', icon: Cog },
    ];

    const [shopifyNotConnected, setShopifyNotConnected] = useState(false);
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/orders`);
            if (res.data?.error === 'shopify_not_connected') {
                setShopifyNotConnected(true);
                setOrders([]);
            } else {
                setShopifyNotConnected(false);
                setOrders(Array.isArray(res.data) ? res.data : (res.data?.orders || []));
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fetchInbox = async () => {
        try {
            const res = await axios.get(`${API_URL}/inbox`);
            setInbox(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); }
    };

    const fetchTemplates = async () => {
        try {
            const res = await axios.get(`${API_URL}/templates`);
            setTemplates(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); }
    };

    const fetchAbandonedCarts = async () => {
        try {
            const res = await axios.get(`${API_URL}/abandoned_carts`);
            setAbandonedCarts(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); }
    };

    const fetchCatalogConfig = async () => {
        try {
            const res = await axios.get(`${API_URL}/config/catalog`);
            if (res.data?.catalog_id) setCatalogId(res.data.catalog_id);
        } catch (e) { console.error(e); }
    };

    const fetchBusinessConfig = async () => {
        try {
            const res = await axios.get(`${API_URL}/config/setup`);
            if (res.data?.business_name) setBusinessName(res.data.business_name);
            setIsConfigured(res.data?.is_configured ?? true);
        } catch (e) { console.error(e); }
    };

    const fetchBranding = async () => {
        try {
            const res = await axios.get(`${API_URL}/config/branding`);
            setBranding(res.data);
        } catch (e) { console.error(e); }
    };

    const updateCatalogConfig = async (newId) => {
        setCatalogId(newId);
        try {
            await axios.post(`${API_URL}/config/catalog`, { catalog_id: newId });
            showToast(lang === 'en' ? 'Catalog ID saved successfully!' : 'تم تحديث وحفظ معرف الكتالوج بنجاح!', 'success');
        } catch (e) {
            showToast(lang === 'en' ? 'Failed to save Catalog ID' : 'فشل حفظ معرف الكتالوج في السيرفر', 'error');
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API_URL}/settings`);
            setAiEnabled(res.data.ai_enabled);
        } catch (e) {}
    };



    useEffect(() => {
        fetchOrders();
        fetchInbox();
        fetchTemplates();
        fetchAbandonedCarts();
        fetchCatalogConfig();
        fetchBusinessConfig();
        fetchBranding();
        fetchSettings();

        const interval = setInterval(async () => {
            const prevI = prevInboxLen.current;
            const prevO = prevOrdersLen.current;
            await fetchInbox();
            await fetchOrders();
            await fetchAbandonedCarts();
            // Detect new inbox messages
            setInbox(cur => {
                const newLen = cur.length;
                if (prevI > 0 && newLen > prevI) {
                    const newest = cur[0];
                    addNotif('message', newest?.name || newest?.phone || 'New message',
                        newest?.messages?.[newest.messages.length-1]?.text || '...', 'chat');
                }
                prevInboxLen.current = newLen;
                return cur;
            });
            setOrders(cur => {
                const newLen = cur.length;
                if (prevO > 0 && newLen > prevO) {
                    const newest = cur[0];
                    addNotif('order',
                        `New order #${newest?.order_number || newest?.id}`,
                        `${newest?.customer?.first_name || ''} · EGP ${newest?.total_price || 0}`, 'shop');
                }
                prevOrdersLen.current = newLen;
                return cur;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => { localStorage.setItem('omni_lang', lang); }, [lang]);
    useEffect(() => { localStorage.setItem('omni_theme', theme); }, [theme]);

    // Feature gate helpers
    const planLevel = { trial: 0, starter: 1, growth: 2, pro: 3, enterprise: 4 };
    const myPlan = authTenant?.plan || 'trial';
    const hasFeature = (minPlan) => (planLevel[myPlan] || 0) >= (planLevel[minPlan] || 0);
    const isEn = lang === 'en';

    // Auth gate
    if (authScreen === 'pricing') return <AuthPricingPage onSelectPlan={(plan) => setAuthScreen('register:' + plan)} onLogin={() => setAuthScreen('login')} />;
    if (authScreen === 'login') return <LoginPage onLogin={handleLogin} onRegister={() => setAuthScreen('pricing')} />;
    if (authScreen && authScreen.startsWith('register')) {
        const plan = authScreen.split(':')[1] || 'starter';
        return <RegisterPage plan={plan} onSuccess={handleLogin} onBack={() => setAuthScreen('pricing')} />;
    }

    // New users (no charge yet) must pick a plan before accessing the dashboard
    // Skip for admin and enterprise accounts
    const isAdminAccount = authTenant?.id === 'dev-admin-001' || authTenant?._id === 'dev-admin-001' || authTenant?.plan === 'enterprise';
    const needsPlan = authTenant && !authTenant.shopifyChargeId && !isAdminAccount;
    if (needsPlan || showPricing) return <PricingPage lang={isEn ? 'en' : 'ar'} onSkip={showPricing ? () => setShowPricing(false) : null} />;

    if (!isConfigured) {
        return <OnboardingScreen lang={lang} onLangChange={setLang} onComplete={(name) => { setBusinessName(name); setIsConfigured(true); }} />;
    }

    return (
        <div
            className={`flex h-screen bg-brand-bg overflow-hidden text-brand-text theme-${theme} ${lang === 'en' ? 'dir-ltr' : 'dir-rtl'} p-5 gap-3.5 relative`}
            dir={lang === 'en' ? 'ltr' : 'rtl'}
        >
            {/* Sidebar */}
            <aside className="w-[200px] rounded-2xl flex flex-col shrink-0 p-4" style={{background:'color-mix(in srgb, var(--color-brand-card) 80%, transparent)'}}>
                <div className={`${lang === 'en' ? 'pl-1' : 'pr-1'}`}>
                    {branding.logo_url ? (
                        <img src={`http://localhost:8765${branding.logo_url}`} alt="logo" className="h-5 w-auto object-contain mb-1" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <OmniFlowMark size={22} />
                            <span className="text-base font-bold tracking-tight text-brand-egg">
                                Omni<span className="font-light">Flow</span>
                            </span>
                        </div>
                    )}
                    <p className="text-[8px] text-brand-egg-mute uppercase tracking-[0.18em] mt-1" style={{ marginInlineStart: 30 }}>WHATSAPP CRM</p>
                </div>

                <nav className="flex-1 mt-5 flex flex-col gap-0.5 text-xs">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`nav-item w-full group ${isActive
                                        ? 'text-brand-egg font-semibold'
                                        : 'text-brand-egg-mute hover:text-brand-egg hover:bg-brand-green-soft/40'
                                    }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <item.icon size={14} className={isActive ? 'text-brand-accent' : 'text-brand-egg-mute'} />
                                    <span className="text-xs">{item.label}</span>
                                </div>
                                {item.badge > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono ${item.id === 'abandoned' ? 'bg-brand-gold text-brand-egg' : 'bg-brand-accent text-brand-bg'}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="pt-3 mt-auto border-t border-brand-egg/10 flex items-center justify-between text-[11px] text-brand-egg-mute">
                    <div className="flex items-center gap-1.5">
                        <span className="w-[7px] h-[7px] rounded-full bg-brand-accent shadow-[0_0_8px_#8CC850]"></span>
                        {lang === 'en' ? 'Online' : 'متصل'}
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="w-6 h-6 rounded-md glass-subtle flex items-center justify-center hover:bg-brand-egg/10 transition-all"
                        >
                            {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                        </button>
                        <button
                            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                            className="h-6 px-2 rounded-md glass-subtle flex items-center justify-center text-[10px] text-brand-egg-mute hover:bg-brand-egg/10 transition-all"
                        >
                            {lang === 'en' ? 'عربي' : 'EN'}
                        </button>
                        <button
                            onClick={handleLogout}
                            title={lang === 'en' ? 'Logout' : 'تسجيل خروج'}
                            className="w-6 h-6 rounded-md glass-subtle flex items-center justify-center hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all"
                        >
                            <LogOut size={12} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative min-w-0 gap-3">
                {/* TopBar */}
                <header className="flex items-center justify-between px-1">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">
                            {navItems.find(i => i.id === activeTab)?.label}
                        </h2>
                        <p className="text-[10px] text-brand-egg-mute tracking-[0.12em] font-mono uppercase mt-0.5">
                            {lang === 'en'
                                ? new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase() + ' · ' + new Date().toLocaleDateString('en-US', { month: 'long' }).toUpperCase() + ' ' + new Date().getDate() + ', ' + new Date().getFullYear()
                                : new Date().toLocaleDateString('ar-EG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Global Search trigger */}
                        <button onClick={() => setShowSearch(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl glass-subtle border border-brand-border/30 text-[11px] font-bold text-brand-muted hover:text-brand-egg hover:border-brand-accent/30 transition-all">
                            <Search size={13} className="text-brand-accent" />
                            <span className="hidden sm:inline">{lang === 'en' ? 'Search...' : 'بحث...'}</span>
                            <kbd className="hidden sm:inline text-[9px] font-mono bg-brand-border/30 px-1.5 py-0.5 rounded text-brand-muted/70">⌘K</kbd>
                        </button>

                        {/* Train assistant */}
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-subtle border border-brand-border/30 text-[11px] font-bold text-brand-egg-mute hover:border-brand-accent/30 transition-all">
                            <Brain size={13} className="text-brand-accent" />
                            {lang === 'en' ? 'Train assistant' : 'تدريب المساعد'}
                        </button>

                        {/* Notifications bell */}
                        <div className="relative">
                            <button onClick={() => setShowNotifs(p => !p)}
                                className="relative flex items-center justify-center w-9 h-9 rounded-xl glass-subtle border border-brand-border/30 hover:border-brand-accent/30 transition-all">
                                <Bell size={15} className={notifications.some(n=>!n.read) ? 'text-brand-accent' : 'text-brand-muted'} />
                                {notifications.filter(n=>!n.read).length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-accent text-[9px] font-black text-brand-bg flex items-center justify-center">
                                        {Math.min(notifications.filter(n=>!n.read).length, 9)}
                                    </span>
                                )}
                            </button>
                            {showNotifs && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                                    <div className="relative z-50">
                                        <NotificationCenter
                                            notifications={notifications}
                                            lang={lang}
                                            onRead={id => setNotifications(p => p.map(n => n.id===id ? {...n,read:true} : n))}
                                            onClear={() => { setNotifications([]); setShowNotifs(false); }}
                                            onNavigate={tab => { setActiveTab(tab); setShowNotifs(false); }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* AI toggle */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-subtle border border-brand-border/30">
                            <span className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-brand-accent shadow-[0_0_6px_#8CC850]' : 'bg-brand-muted'}`}></span>
                            <span className="text-[11px] font-bold text-brand-egg-mute">{lang === 'en' ? 'AI Auto-Reply' : 'الرد التلقائي'}</span>
                            <span className="text-[11px] font-bold text-brand-accent">·</span>
                            <span className={`text-[11px] font-bold ${aiEnabled ? 'text-brand-accent' : 'text-brand-muted'}`}>{aiEnabled ? (lang === 'en' ? 'ON' : 'مفعل') : (lang === 'en' ? 'OFF' : 'معطل')}</span>
                            <button onClick={toggleAI}
                                className={`w-9 h-[18px] rounded-full relative transition-all duration-300 ${aiEnabled ? 'bg-brand-accent shadow-[0_0_8px_rgba(140,200,80,0.35)]' : 'bg-brand-muted/30'}`}>
                                <div className={`absolute top-[3px] w-3 h-3 rounded-full bg-white transition-all duration-300 ${lang === 'en' ? (aiEnabled ? 'right-[3px]' : 'left-[3px]') : (aiEnabled ? 'left-[3px]' : 'right-[3px]')}`} />
                            </button>
                        </div>
                    </div>
                    {/* Global Search overlay */}
                    {showSearch && (
                        <GlobalSearch
                            inbox={inbox} orders={orders} quickReplies={quickRepliesGlobal}
                            navItems={navItems}
                            onNavigate={tab => setActiveTab(tab)}
                            onOpenChat={phone => { setActiveChatPhone(phone); setActiveTab('chat'); }}
                            onClose={() => setShowSearch(false)}
                            lang={lang}
                        />
                    )}
                </header>

                {/* Page Content */}
                {activeTab === 'chat' ? (
                    <ChatInterface inbox={inbox} orders={orders} activePhone={activeChatPhone} onSelectChat={setActiveChatPhone} refreshInbox={fetchInbox} templates={templates} showToast={showToast} lang={lang} />
                ) : (
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {activeTab === 'dash' && <Dashboard inbox={inbox} orders={orders} abandonedCarts={abandonedCarts} onOpenChat={handleOpenChat} setActiveTab={setActiveTab} lang={lang} aiEnabled={aiEnabled} />}
                    {activeTab === 'shop' && <ShopifyOrders orders={orders} refresh={fetchOrders} loading={loading} templates={templates} onOpenChat={handleOpenChat} showToast={showToast} lang={lang} shopifyNotConnected={shopifyNotConnected} />}
                    {activeTab === 'campaigns' && (
                        !hasFeature('growth') ? (
                            <UpgradePrompt feature="Broadcasts" minPlan="Growth" onUpgrade={() => setShowPricing(true)} isEn={isEn} />
                        ) : (
                            <CampaignsManager templates={templates} showToast={showToast} lang={lang} />
                        )
                    )}
                    {activeTab === 'automations' && (
                        !hasFeature('growth') ? (
                            <UpgradePrompt feature="Automations" minPlan="Growth" onUpgrade={() => setShowPricing(true)} isEn={isEn} />
                        ) : (
                            <AutomationsManager templates={templates} showToast={showToast} lang={lang} />
                        )
                    )}
                    {activeTab === 'quick-replies' && <QuickRepliesManager showToast={showToast} lang={lang} />}
                    {activeTab === 'settings' && <TemplatesManager templates={templates} fetchTemplates={fetchTemplates} showToast={showToast} lang={lang} />}
                    {activeTab === 'config' && (
                        !hasFeature('pro') ? (
                            <UpgradePrompt feature="AI Settings" minPlan="Pro" onUpgrade={() => setShowPricing(true)} isEn={isEn} />
                        ) : (
                            <SetupManager showToast={showToast} lang={lang} onSave={(name) => setBusinessName(name)} />
                        )
                    )}
                    {activeTab === 'abandoned' && <AbandonedCartsManager carts={abandonedCarts} refresh={fetchAbandonedCarts} showToast={showToast} lang={lang} />}
                    {activeTab === 'catalog' && <CatalogManager showToast={showToast} lang={lang} inbox={inbox} />}
                    {activeTab === 'logs' && <AnalyticsDashboard lang={lang} />}
                </div>
                )}

                {/* Global Toast Notification */}
                {toast && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-10 fade-in duration-300">
                        <div className={`px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-brand-accent text-brand-bg glow-salad'}`}>
                            {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                            {toast.message}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- Sub Components ---

const TemplatesManager = ({ templates, fetchTemplates, showToast, lang }) => {
    const isEn = lang === 'en';
    const isArabic = (s) => /[؀-ۿ]/.test(s || '');

    // Normalise templates object → array
    const tplArray = React.useMemo(() => {
        if (!templates || typeof templates !== 'object') return [];
        return Object.entries(templates).map(([key, t]) => {
            const hasAr = isArabic(t.preview || '') || isArabic(t.title || '');
            const langBadge = hasAr ? (t.preview && !isArabic(t.preview) ? 'AR + EN' : 'AR') : 'EN';
            const status = t.meta_name ? 'approved' : (t.under_review ? 'review' : 'draft');
            return {
                key,
                name: t.meta_name || key,
                title: t.title || key,
                preview: t.preview || '',
                category: t.category || 'UTILITY',
                lang: t.lang || langBadge,
                status,
                meta_name: t.meta_name || '',
                variables: t.variables || [],
                buttons: t.buttons || [],
                params_count: t.params_count || 0,
                has_header_image: !!t.has_header_image,
                approved_date: t.approved_date || null,
                used_count: t.used_count || 0,
                color: t.color || '8CC850',
            };
        });
    }, [templates]);

    const [filter, setFilter] = React.useState('all');
    const [selected, setSelected] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [showNew, setShowNew] = React.useState(false);
    const [newForm, setNewForm] = React.useState({ name: '', title: '', preview: '', category: 'UTILITY', lang: 'AR + EN' });

    const counts = React.useMemo(() => ({
        all: tplArray.length,
        approved: tplArray.filter(t => t.status === 'approved').length,
        review: tplArray.filter(t => t.status === 'review').length,
        draft: tplArray.filter(t => t.status === 'draft').length,
    }), [tplArray]);

    const filtered = filter === 'all' ? tplArray
        : tplArray.filter(t => t.status === filter);

    const selectedTpl = tplArray.find(t => t.key === selected) || filtered[0] || null;

    // Select first on load
    React.useEffect(() => {
        if (!selected && tplArray.length) setSelected(tplArray[0].key);
    }, [tplArray]);

    const handleSyncMeta = async () => {
        showToast(isEn ? 'Syncing from Meta...' : 'جاري المزامنة مع Meta...', 'info');
        try {
            await axios.post(`${API_URL}/templates/sync`);
            await fetchTemplates();
            showToast(isEn ? 'Synced!' : 'تمت المزامنة!');
        } catch { showToast(isEn ? 'Sync failed' : 'فشلت المزامنة', 'error'); }
    };

    const handleNewTemplate = async () => {
        if (!newForm.name.trim()) return showToast(isEn ? 'Name required' : 'الاسم مطلوب', 'error');
        setSaving(true);
        try {
            await axios.post(`${API_URL}/templates`, { [newForm.name]: { title: newForm.title, preview: newForm.preview, category: newForm.category, lang: newForm.lang } });
            await fetchTemplates();
            setShowNew(false);
            showToast(isEn ? 'Template created!' : 'تم إنشاء القالب!');
        } catch { showToast(isEn ? 'Failed' : 'فشل', 'error'); }
        setSaving(false);
    };

    const statusBadge = (status) => {
        if (status === 'approved') return <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full border" style={{background:'rgba(140,200,80,0.12)',color:'#8CC850',borderColor:'rgba(140,200,80,0.3)'}}>✓ {isEn ? 'Approved' : 'معتمد'}</span>;
        if (status === 'review')   return <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full border" style={{background:'rgba(255,107,53,0.12)',color:'#FF6B35',borderColor:'rgba(255,107,53,0.3)'}}>⊙ {isEn ? 'Under review' : 'قيد المراجعة'}</span>;
        return <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full border" style={{background:'rgba(100,100,100,0.12)',color:'#9CA3AF',borderColor:'rgba(100,100,100,0.3)'}}>○ {isEn ? 'Draft' : 'مسودة'}</span>;
    };

    return (
        <div className={`animate-in fade-in duration-500 ${isEn ? 'text-left' : 'text-right'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Templates' : 'القوالب'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5 uppercase">
                        {isEn
                            ? `META BUSINESS TEMPLATES · ${counts.approved} ACTIVE · ${counts.review} UNDER REVIEW`
                            : `قوالب Meta · ${counts.approved} نشط · ${counts.review} قيد المراجعة`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleSyncMeta}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold glass border border-brand-border/30 text-brand-muted hover:text-brand-egg transition-all">
                        <RefreshCcw size={12} /> {isEn ? 'Sync from Meta' : 'مزامنة Meta'}
                    </button>
                    <button onClick={() => setShowNew(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all"
                        style={{background:'#FF6B35',color:'#fff'}}>
                        <Plus size={13} /> {isEn ? 'New template' : 'قالب جديد'}
                    </button>
                </div>
            </div>

            {/* 4 stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="glass rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'Approved' : 'معتمد'}</p>
                    <p className="text-2xl font-black text-brand-egg mt-1">{counts.approved}</p>
                    <p className="text-[11px] text-brand-muted mt-1">{isEn ? 'ready to send' : 'جاهز للإرسال'}</p>
                </div>
                <div className="glass rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'Under Review' : 'قيد المراجعة'}</p>
                    <p className="text-2xl font-black text-brand-egg mt-1">{counts.review}</p>
                    <p className="text-[11px] text-brand-muted mt-1">{counts.review > 0 ? '~24h ETA' : (isEn ? 'none pending' : 'لا يوجد')}</p>
                </div>
                <div className="glass rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'Drafts' : 'مسودات'}</p>
                    <p className="text-2xl font-black text-brand-egg mt-1">{counts.draft}</p>
                    <p className="text-[11px] text-brand-muted mt-1">{isEn ? 'not submitted' : 'لم ترسل بعد'}</p>
                </div>
                <div className="glass rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'Total' : 'الإجمالي'}</p>
                    <p className="text-2xl font-black text-brand-egg mt-1">{counts.all}</p>
                    <p className="text-[11px] text-brand-muted mt-1">{isEn ? 'in library' : 'في المكتبة'}</p>
                </div>
            </div>

            {/* Main 2-column */}
            <div className="grid gap-3" style={{gridTemplateColumns:'1fr 340px'}}>

                {/* LEFT: Library */}
                <div className="glass rounded-2xl overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-brand-border/20 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-black text-brand-egg">{isEn ? 'Library' : 'المكتبة'}</span>
                            <span className="text-[10px] text-brand-muted font-bold uppercase ml-2">{isEn ? 'ALL TEMPLATES' : 'كل القوالب'}</span>
                        </div>
                        <div className="flex items-center gap-1 glass-subtle rounded-xl p-1 border border-brand-border/20">
                            {[
                                ['all',      `${isEn?'All':'الكل'}·${counts.all}`],
                                ['approved', `${isEn?'Approved':'معتمد'}·${counts.approved}`],
                                ['review',   `${isEn?'Review':'مراجعة'}·${counts.review}`],
                                ['draft',    `${isEn?'Draft':'مسودة'}·${counts.draft}`],
                            ].map(([v, label]) => (
                                <button key={v} onClick={() => setFilter(v)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${filter === v ? 'bg-brand-accent text-brand-bg' : 'text-brand-muted hover:text-brand-egg'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divide-y divide-brand-border/10 overflow-y-auto flex-1 custom-scrollbar" style={{maxHeight:480}}>
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-brand-muted">
                                <FileText size={36} className="mb-3 opacity-20" />
                                <p className="text-sm font-bold">{isEn ? 'No templates yet' : 'لا توجد قوالب بعد'}</p>
                                <button onClick={() => setShowNew(true)} className="mt-3 text-brand-accent text-xs font-bold hover:underline">
                                    + {isEn ? 'Create first template' : 'أنشئ أول قالب'}
                                </button>
                            </div>
                        ) : filtered.map(t => (
                            <div key={t.key} onClick={() => setSelected(t.key)}
                                className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors ${selected === t.key ? 'bg-brand-accent/5 border-l-2 border-brand-accent' : ''}`}>
                                {/* Name + preview */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[13px] font-black text-brand-accent">{t.name}</span>
                                    </div>
                                    <p className="text-[11px] text-brand-muted truncate">{t.preview || t.title}</p>
                                </div>
                                {/* Lang badge */}
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0" style={{background:'rgba(140,200,80,0.1)',color:'#8CC850',border:'1px solid rgba(140,200,80,0.2)'}}>{t.lang}</span>
                                {/* Category */}
                                <span className="text-[10px] font-bold text-brand-muted uppercase shrink-0 w-28 text-right">{t.category}</span>
                                {/* Status */}
                                <div className="shrink-0">{statusBadge(t.status)}</div>
                                {/* Usage */}
                                {t.used_count > 0 && <span className="text-[10px] text-brand-muted font-bold shrink-0">{t.used_count.toLocaleString()}×</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Preview panel */}
                <div className="glass rounded-2xl flex flex-col overflow-hidden self-start">
                    {selectedTpl ? (<>
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-brand-border/20">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[12px] font-black text-brand-egg">{isEn ? 'Preview' : 'معاينة'}</span>
                                <span className="text-brand-muted">·</span>
                                <span className="text-[12px] font-black text-brand-accent">{selectedTpl.name}</span>
                                <span className="text-brand-muted text-[10px]">· {selectedTpl.category} · {selectedTpl.lang}</span>
                            </div>
                            <div className="mt-1">{statusBadge(selectedTpl.status)}</div>
                        </div>

                        <div className="p-4 space-y-4 flex-1">
                            {/* Variables */}
                            {selectedTpl.params_count > 0 && (
                                <div>
                                    <p className="text-[9px] font-bold text-brand-muted tracking-widest uppercase mb-1">Variables</p>
                                    <p className="text-[12px] text-brand-egg">
                                        {Array.from({length: selectedTpl.params_count}, (_,i) =>
                                            <span key={i}>{i > 0 && ' · '}<span className="text-brand-accent">{`{{${i+1}}}`}</span></span>
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* Buttons */}
                            {selectedTpl.buttons?.length > 0 && (
                                <div>
                                    <p className="text-[9px] font-bold text-brand-muted tracking-widest uppercase mb-1">Buttons</p>
                                    <p className="text-[12px] text-brand-egg">{selectedTpl.buttons.join(' · ')}</p>
                                </div>
                            )}

                            {/* Approved date */}
                            {selectedTpl.status === 'approved' && selectedTpl.approved_date && (
                                <div>
                                    <p className="text-[9px] font-bold text-brand-muted tracking-widest uppercase mb-1">Approved</p>
                                    <p className="text-[12px] text-brand-egg">{selectedTpl.approved_date}</p>
                                </div>
                            )}

                            {/* WA Business Preview mockup */}
                            <div className="rounded-2xl overflow-hidden" style={{background:'#0a1f14',border:'1px solid rgba(140,200,80,0.15)'}}>
                                <div className="px-3 py-2 border-b border-brand-border/10 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-brand-muted tracking-widest uppercase">WA · BUSINESS PREVIEW</span>
                                    {selectedTpl.status === 'approved' && <span className="text-[9px] font-bold text-brand-accent">✓ approved</span>}
                                </div>
                                <div className="p-3">
                                    <div className="rounded-xl p-3" style={{background:'#fff',color:'#111'}}>
                                        {selectedTpl.has_header_image && (
                                            <div className="rounded-lg mb-2 h-16 flex items-center justify-center" style={{background:'#FF6400'}}>
                                                <span className="text-white font-black text-xs uppercase">{selectedTpl.title}</span>
                                            </div>
                                        )}
                                        <p className="text-[12px] leading-relaxed" style={{color:'#111'}}>
                                            {selectedTpl.preview || selectedTpl.title || (isEn ? 'Message preview...' : 'معاينة الرسالة...')}
                                        </p>
                                        {selectedTpl.buttons?.length > 0 && (
                                            <div className="mt-2 pt-2 space-y-1.5" style={{borderTop:'1px solid #e5e7eb'}}>
                                                {selectedTpl.buttons.map((btn, i) => (
                                                    <div key={i} className="text-center text-[12px] font-bold py-1" style={{color:'#00a884'}}>✓ {btn}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="px-4 py-3 border-t border-brand-border/20 flex items-center gap-2">
                            <button className="flex-1 py-2 rounded-xl text-[11px] font-bold glass border border-brand-border/30 text-brand-muted hover:text-brand-egg transition-all">
                                {isEn ? 'Duplicate' : 'نسخ'}
                            </button>
                            <button className="flex-1 py-2 rounded-xl text-[11px] font-bold glass border border-brand-border/30 text-brand-muted hover:text-brand-egg transition-all">
                                {isEn ? 'Edit copy' : 'تعديل'}
                            </button>
                            <button className="flex-1 py-2 rounded-xl text-[11px] font-bold text-brand-bg transition-all" style={{background:'#8CC850'}}>
                                {isEn ? 'Use in flow' : 'استخدم في flow'}
                            </button>
                        </div>
                    </>) : (
                        <div className="flex items-center justify-center h-64 text-brand-muted">
                            <p className="text-sm">{isEn ? 'Select a template' : 'اختر قالباً'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New template modal */}
            {showNew && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.7)'}}>
                    <div className="glass rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-brand-egg">{isEn ? 'New Template' : 'قالب جديد'}</h3>
                            <button onClick={() => setShowNew(false)} className="text-brand-muted hover:text-brand-egg">✕</button>
                        </div>
                        {[
                            ['name',     isEn ? 'Template key (snake_case)' : 'مفتاح القالب', 'text', 'ltr'],
                            ['title',    isEn ? 'Display title' : 'العنوان', 'text', ''],
                            ['preview',  isEn ? 'Message preview text' : 'نص المعاينة', 'text', ''],
                        ].map(([f, lbl, type, dir]) => (
                            <div key={f}>
                                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{lbl}</label>
                                <input value={newForm[f]} onChange={e => setNewForm(p => ({...p, [f]: e.target.value}))}
                                    type={type} dir={dir || undefined}
                                    className="w-full mt-1 bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-accent text-brand-egg" />
                            </div>
                        ))}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{isEn ? 'Category' : 'الفئة'}</label>
                                <select value={newForm.category} onChange={e => setNewForm(p => ({...p, category: e.target.value}))}
                                    className="w-full mt-1 bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2 text-xs outline-none text-brand-egg">
                                    {['UTILITY','MARKETING','AUTHENTICATION'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{isEn ? 'Language' : 'اللغة'}</label>
                                <select value={newForm.lang} onChange={e => setNewForm(p => ({...p, lang: e.target.value}))}
                                    className="w-full mt-1 bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2 text-xs outline-none text-brand-egg">
                                    {['AR + EN','EN','AR'].map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold glass border border-brand-border/30 text-brand-muted">{isEn ? 'Cancel' : 'إلغاء'}</button>
                            <button onClick={handleNewTemplate} disabled={saving}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-brand-bg disabled:opacity-50" style={{background:'#8CC850'}}>
                                {saving ? '...' : (isEn ? 'Create' : 'إنشاء')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ShopifyOrders = ({ orders, refresh, loading, templates, onOpenChat, showToast, lang, shopifyNotConnected }) => {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [lastUpdated, setLastUpdated] = useState(Date.now());
    const isEn = lang === 'en';

    const handleRefresh = async () => { await refresh(); setLastUpdated(Date.now()); };

    const getStatusInfo = (s) => {
        switch (s) {
            case 'confirmed':   return { label: isEn ? 'Confirmed'   : 'مؤكد',     color: 'bg-green-500/15 text-green-400 border-green-500/20',       dot: 'bg-green-400',    icon: CheckCircle2 };
            case 'shipped':     return { label: isEn ? 'Shipped'     : 'مشحون',    color: 'bg-blue-500/15 text-blue-400 border-blue-500/20',           dot: 'bg-blue-400',     icon: Truck };
            case 'pending':     return { label: isEn ? 'Pending'     : 'معلق',     color: 'bg-brand-gold/15 text-brand-gold border-brand-gold/20',     dot: 'bg-brand-gold',   icon: Clock };
            case 'cancelled':   return { label: isEn ? 'Cancelled'   : 'ملغى',     color: 'bg-red-500/15 text-red-400 border-red-500/20',             dot: 'bg-red-400',      icon: XCircle };
            case 'followed_up': return { label: isEn ? 'Followed Up' : 'تمت المتابعة', color: 'bg-brand-accent/15 text-brand-accent border-brand-accent/20', dot: 'bg-brand-accent', icon: CheckCheck };
            default:            return { label: isEn ? 'New'         : 'جديد',     color: 'bg-brand-accent/8 text-brand-accent/70 border-brand-accent/15', dot: 'bg-brand-accent/50', icon: Plus };
        }
    };

    const avatarColors = ['bg-teal-600','bg-blue-600','bg-purple-600','bg-pink-600','bg-orange-600','bg-emerald-600'];
    const getAvatarColor = (n) => avatarColors[Math.abs([...(n||'')].reduce((a,c)=>a+c.charCodeAt(0),0)) % avatarColors.length];
    const getInitials = (f,l) => ((f?.[0]||'')+(l?.[0]||'')).toUpperCase() || '??';

    const today = new Date().toDateString();
    const todayOrders  = orders.filter(o => new Date(o.created_at).toDateString() === today);
    const todayRevenue = todayOrders.reduce((s,o) => s + parseFloat(o.total_price||0), 0);
    const totalRevenue = orders.reduce((s,o) => s + parseFloat(o.total_price||0), 0);
    const avgValue     = orders.length ? Math.round(totalRevenue / orders.length) : 0;
    const pendingCount   = orders.filter(o => o.local_status === 'pending' || !o.local_status).length;
    const confirmedCount = orders.filter(o => o.local_status === 'confirmed').length;
    const shippedCount   = orders.filter(o => o.local_status === 'shipped').length;
    const cancelledCount = orders.filter(o => o.local_status === 'cancelled').length;

    const secAgo = Math.floor((Date.now() - lastUpdated) / 1000);
    const lastUpdatedText = secAgo < 60 ? `${secAgo} ${isEn?'SECONDS AGO':'ثانية'}` : `${Math.floor(secAgo/60)} ${isEn?'MIN AGO':'د'}`;

    const filtered = orders.filter(o => {
        if (statusFilter === 'confirmed') return o.local_status === 'confirmed';
        if (statusFilter === 'pending')   return o.local_status === 'pending' || !o.local_status;
        if (statusFilter === 'shipped')   return o.local_status === 'shipped';
        if (statusFilter === 'cancelled') return o.local_status === 'cancelled';
        return true;
    });

    const getWAStatus = (o) => {
        if (!o.last_whatsapp_action) return { text: 'queued', cls: 'text-brand-muted' };
        if (o.last_whatsapp_action === 'seen') {
            const t = o.last_whatsapp_time ? new Date(o.last_whatsapp_time).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit',hour12:false}) : '';
            return { text: `seen ${t}`, cls: 'text-brand-accent' };
        }
        if (o.last_whatsapp_action === 'delivered')   return { text: 'delivered',     cls: 'text-blue-400' };
        if (o.last_whatsapp_action === 'sent')        return { text: 'awaiting reply', cls: 'text-brand-gold' };
        if (o.last_whatsapp_action === 'failed')      return { text: 'declined',       cls: 'text-red-400' };
        return { text: o.last_whatsapp_action, cls: 'text-brand-muted' };
    };

    const handleConfirm = async (e, o) => {
        e.stopPropagation();
        try {
            const phone = o.shipping_address?.phone || o.customer?.phone || '';
            await axios.patch(`${API_URL}/orders/status`, { phone, orderId: String(o.id), status: 'confirmed' });
            await refresh();
            showToast(isEn ? `Order ${o.name} confirmed` : `تم تأكيد الطلب ${o.name}`);
        } catch { showToast(isEn ? 'Failed to confirm' : 'فشل التأكيد', 'error'); }
    };

    return (
        <div className={`space-y-4 ${isEn ? 'text-left' : 'text-right'}`}>
            {/* Shopify not connected banner */}
            {shopifyNotConnected && (
                <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-orange-500/30 bg-orange-500/10">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={18} className="text-orange-400 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-orange-300">{isEn ? 'Shopify store not connected' : 'متجر Shopify غير متصل'}</p>
                            <p className="text-xs text-brand-muted mt-0.5">{isEn ? 'Connect your store to see orders here.' : 'اربط متجرك لرؤية الطلبات هنا.'}</p>
                        </div>
                    </div>
                    <a href="/auth?shop=omniflow-yczzqs8t.myshopify.com" className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-400 transition-colors">
                        {isEn ? 'Connect Shopify' : 'ربط Shopify'}
                    </a>
                </div>
            )}
            {/* Subtitle + action buttons */}
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-brand-muted tracking-[0.15em] uppercase">
                    {isEn ? 'LIVE SYNC · LAST UPDATED' : 'مزامنة مباشرة ·'} {lastUpdatedText}
                </p>
                <div className="flex gap-2">
                    <button onClick={handleRefresh} disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass border border-brand-border/30 text-xs font-bold text-brand-egg hover:border-brand-accent/30 transition-all disabled:opacity-50">
                        <RefreshCcw size={13} className={loading ? 'animate-spin text-brand-accent' : ''} />
                        {isEn ? 'Sync now' : 'مزامنة'}
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all" style={{background:'#FF6400'}}>
                        <Send size={13} />
                        {isEn ? 'Send bulk update' : 'إرسال جماعي'}
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: isEn?'OPEN ORDERS':'الطلبات المفتوحة',         value: orders.length,                            sub: `+ ${todayOrders.length} ${isEn?'today':'اليوم'}`,         subCls:'text-brand-accent' },
                    { label: isEn?'AWAITING CONFIRMATION':'بانتظار التأكيد', value: pendingCount,                             sub: isEn?'WhatsApp queued':'في قائمة WhatsApp',                 subCls:'text-brand-gold' },
                    { label: isEn?"TODAY'S REVENUE":'إيرادات اليوم',         value: null, rev: todayRevenue,                  sub: '+18% '+( isEn?'vs y/day':'مقارنة بالأمس'),                  subCls:'text-brand-accent' },
                    { label: isEn?'AVG ORDER VALUE':'متوسط قيمة الطلب',      value: null, rev: avgValue,                      sub: '↑ EGP 22',                                                 subCls:'text-brand-accent' },
                ].map((c,i) => (
                    <div key={i} className="glass rounded-2xl p-5">
                        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-2">{c.label}</p>
                        {c.rev !== undefined
                            ? <h3 className="text-3xl font-bold text-brand-egg"><span className="text-sm text-brand-muted font-mono">EGP </span>{c.rev.toLocaleString()}</h3>
                            : <h3 className="text-3xl font-bold text-brand-egg">{c.value}</h3>
                        }
                        <p className={`text-[11px] font-mono mt-1 ${c.subCls}`}>{c.sub}</p>
                    </div>
                ))}
            </div>

            {/* Filter chips + sort */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1 overflow-x-auto">
                    {[
                        { id:'all',       label:isEn?'All':'الكل',         count:orders.length,  dot:null },
                        { id:'confirmed', label:isEn?'Confirmed':'مؤكد',   count:confirmedCount, dot:'bg-green-400' },
                        { id:'pending',   label:isEn?'Pending':'معلق',     count:pendingCount,   dot:'bg-brand-gold' },
                        { id:'shipped',   label:isEn?'Shipped':'مشحون',    count:shippedCount,   dot:'bg-blue-400' },
                        { id:'cancelled', label:isEn?'Cancelled':'ملغى',   count:cancelledCount, dot:'bg-red-400' },
                    ].map(f => (
                        <button key={f.id} onClick={() => setStatusFilter(f.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter===f.id ? 'bg-brand-accent text-brand-bg' : 'glass border border-brand-border/30 text-brand-muted hover:border-brand-accent/30'}`}>
                            {f.dot && <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`}></span>}
                            {f.label} · {f.count}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-brand-muted">
                    <span>{isEn?'Sort by':'ترتيب'}</span>
                    <span className="glass border border-brand-border/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                        {isEn?'Newest':'الأحدث'} <ChevronDown size={12} />
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="glass rounded-2xl overflow-hidden">
                <table className={`w-full ${isEn?'text-left':'text-right'}`}>
                    <thead>
                        <tr className="border-b border-brand-accent/10">
                            {[isEn?'ORDER':'الطلب', isEn?'CUSTOMER':'العميل', isEn?'ITEMS':'المنتجات', isEn?'TOTAL':'الإجمالي', isEn?'STATUS':'الحالة', isEn?'WHATSAPP':'واتساب', isEn?'DATE':'التاريخ', ''].map((h,i) => (
                                <th key={i} className="px-5 py-3.5 text-[10px] font-bold text-brand-muted uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-accent/5">
                        {filtered.map(o => {
                            const st = getStatusInfo(o.local_status);
                            const fn = o.customer?.first_name||'', ln = o.customer?.last_name||'';
                            const name = `${fn} ${ln}`.trim() || 'Unknown';
                            const itemCount = o.line_items?.reduce((s,i)=>s+(i.quantity||1),0) || 0;
                            const wa = getWAStatus(o);
                            const date = o.created_at ? new Date(o.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '';
                            return (
                                <tr key={o.id} onClick={() => setSelectedOrder(o)} className="hover:bg-brand-accent/5 transition-all cursor-pointer group">
                                    <td className="px-5 py-4">
                                        <span className="text-sm font-bold text-brand-accent font-mono">{o.name}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${getAvatarColor(name)}`}>{getInitials(fn,ln)}</div>
                                            <span className="font-bold text-sm">{name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-brand-muted">{itemCount} {isEn?(itemCount===1?'item':'items'):'منتج'}</td>
                                    <td className="px-5 py-4">
                                        <span className="text-[11px] text-brand-muted font-mono">EGP </span>
                                        <span className="font-bold text-sm">{parseFloat(o.total_price||0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${st.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                                            {st.label}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-xs font-mono">
                                        <span className={wa.cls}>{wa.text}</span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-brand-muted font-mono">{date}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={e => { e.stopPropagation(); const p=o.shipping_address?.phone||o.customer?.phone; if(p) onOpenChat(p); }}
                                                className="p-1.5 glass rounded-lg border border-brand-border/30 hover:border-brand-accent/30 transition-all">
                                                <MessageCircle size={13} className="text-brand-muted" />
                                            </button>
                                            <button onClick={e => handleConfirm(e,o)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-brand-accent/15 border border-brand-accent/25 text-brand-accent rounded-lg text-[11px] font-bold hover:bg-brand-accent hover:text-brand-bg transition-all whitespace-nowrap">
                                                <Check size={11} /> {isEn?'Confirm':'تأكيد'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr><td colSpan={8} className="px-5 py-12 text-center text-brand-muted text-sm">{isEn?'No orders found':'لا توجد طلبات'}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* CRM Drawer */}
            {selectedOrder && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300" onClick={() => setSelectedOrder(null)} />}
            <div className={`fixed ${isEn?'right-0':'left-0'} top-0 bottom-0 w-[420px] bg-brand-sidebar border-x border-brand-accent/10 transform transition-transform duration-300 z-50 flex flex-col shadow-2xl ${selectedOrder ? 'translate-x-0' : (isEn?'translate-x-full':'-translate-x-full')}`}>
                {selectedOrder && <CRMDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} templates={templates} onOpenChat={onOpenChat} refresh={refresh} getStatusInfo={getStatusInfo} showToast={showToast} lang={lang} />}
            </div>
        </div>
    );
};

const CRMDrawer = ({ order, onClose, templates, onOpenChat, refresh, getStatusInfo, showToast, lang }) => {
    const phone = order.shipping_address?.phone || order.customer?.phone || "";
    const customerName = `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim();
    const statusObj = getStatusInfo(order.local_status);
    const StatusIcon = statusObj.icon;
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const isEn = lang === 'en';

    const STATUS_OPTIONS = [
        { value: 'pending',     label: isEn ? 'New' : 'جديد',             color: 'text-brand-muted' },
        { value: 'followed_up', label: isEn ? 'Followed Up' : 'تمت المتابعة', color: 'text-brand-accent' },
        { value: 'confirmed',   label: isEn ? 'Confirmed' : 'تم التأكيد',   color: 'text-green-500' },
        { value: 'shipped',     label: isEn ? 'Shipped' : 'تم الشحن',       color: 'text-blue-500' },
        { value: 'cancelled',   label: isEn ? 'Cancelled' : 'ملغى',         color: 'text-red-500' },
    ];

    const handleDirectStatusChange = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            await axios.patch(`${API_URL}/orders/status`, {
                phone,
                orderId: String(order.id),
                status: newStatus
            });
            await refresh();
            showToast(isEn ? 'Status updated successfully' : 'تم تحديث الحالة بنجاح', 'success');
        } catch (e) {
            showToast(isEn ? 'Failed to update status' : 'فشل تحديث الحالة', 'error');
        }
        setUpdatingStatus(false);
    };

    const getOrderParams = (orderObj) => {
        const product = orderObj.line_items?.[0]?.title || (isEn ? 'Product' : 'منتج');
        const order_id = orderObj.name;
        const gw = (orderObj.gateway || '').toLowerCase();
        let payment = isEn ? 'Online Card' : 'بطاقة أون لاين';
        if (gw.includes('cash') || gw.includes('cod')) payment = isEn ? 'Cash on Delivery' : 'كاش عند الاستلام';
        else if (gw.includes('bank')) payment = isEn ? 'Bank Transfer' : 'تحويل بنكي';
        const address = `${orderObj.shipping_address?.address1 || ''}, ${orderObj.shipping_address?.city || ''}`.replace(/^,\s*|,\s*$/g, '');
        return [customerName, product, order_id, payment, address];
    };

    const handleSendTemplate = async (templateKey) => {
        if (!phone) return showToast(isEn ? 'No customer phone number available' : 'لا يوجد رقم هاتف متاح للعميل', 'error');
        const tpl = templates[templateKey];
        if (!tpl) return;

        let params = [customerName];
        let headerLink = undefined;

        // قالب المتابعة القديم كان يتطلب 5 بارامترات وملف
        if (templateKey === 'followup') {
            params = getOrderParams(order);
            headerLink = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        }

        setSending(true);
        try {
            if (templateKey === 'shipping') {
                const messageBody = (tpl.preview || (isEn ? `Hello [Name],\nYour order is on its way! ًںڑڑ` : `مرحباً [Name]،\nطلبك الآن في طريقه إليك! 🚚`)).replace('[Name]', customerName);
                await axios.post(`${API_URL}/whatsapp/send`, {
                    phone: phone,
                    textMsg: messageBody,
                    actionType: templateKey,
                    orderName: customerName,
                    orderId: order.id
                });

            } else {
                await axios.post(`${API_URL}/whatsapp/send`, {
                    phone: phone,
                    template: tpl.meta_name,
                    params: params,
                    headerLink: headerLink,
                    actionType: templateKey,
                    orderName: customerName,
                    orderId: order.id
                });

            }
            await refresh();
            showToast(isEn ? `Successfully sent ${tpl.title} to ${customerName}` : `تم إرسال ${tpl.title} بنجاح للعميل ${customerName}`);
        } catch (e) {
            console.error(e);
            showToast(isEn ? `Failed to send: ${e.response?.data?.error?.error?.message || e.message}` : `فشل الإرسال: ${e.response?.data?.error?.error?.message || e.message}`, 'error');
        }
        setSending(false);
    };

    const getColorClasses = (color) => {
        switch (color) {
            case 'brand-accent': return 'border-brand-accent/30 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-brand-bg';
            case 'green-500': return 'border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white';
            case 'blue-500': return 'border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white';
            case 'red-500': return 'border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white';
            default: return 'border-brand-muted/30 bg-brand-muted/10 text-brand-muted hover:bg-brand-muted hover:text-white';
        }
    };

    return (
        <div className={`flex-1 flex flex-col h-full animate-in slide-in-from-${isEn ? 'right' : 'left'} duration-300 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="p-6 border-b border-brand-accent/10 flex justify-between items-center bg-brand-card/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="text-brand-muted hover:text-brand-accent bg-brand-bg/50 p-2 rounded-xl transition-all"><X size={18} /></button>
                    <h3 className="font-bold text-lg">{isEn ? `Manage Order ${order.name}` : `إدارة الطلب ${order.name}`}</h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Status Badge + Direct Change */}
                <div className="flex flex-col items-center justify-center p-5 bg-brand-bg/30 rounded-2xl border border-brand-accent/5 space-y-4">
                    <div className="flex flex-col items-center">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 ${statusObj.color.split(' ')[0]}`}>
                            <StatusIcon size={26} className={statusObj.color.split(' ')[1]} />
                        </div>
                        <span className={`text-base font-bold ${statusObj.color.split(' ')[1]}`}>{statusObj.label}</span>
                    </div>
                    <div className="w-full border-t border-brand-accent/10 pt-3">
                        <p className="text-[10px] text-brand-muted text-center mb-2">{isEn ? 'Change status manually:' : 'تغيير الحالة يدوياً:'}</p>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            {STATUS_OPTIONS.map(s => (
                                <button
                                    key={s.value}
                                    onClick={() => handleDirectStatusChange(s.value)}
                                    disabled={updatingStatus || order.local_status === s.value}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed
                                        ${order.local_status === s.value
                                            ? 'bg-brand-accent/20 border-brand-accent text-brand-accent'
                                            : 'bg-brand-bg/50 border-brand-accent/20 hover:border-brand-accent/50 text-brand-muted hover:text-brand-text'
                                        }`}
                                >
                                    {updatingStatus ? '...' : s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-4">
                    <h4 className="font-bold text-brand-accent text-sm border-b border-brand-accent/10 pb-2">{isEn ? 'Customer Details' : 'تفاصيل العميل'}</h4>
                    <div className="space-y-3 text-sm bg-brand-bg/20 p-4 rounded-2xl">
                        <div className="flex justify-between"><span className="text-brand-muted">{isEn ? 'Name:' : 'الاسم:'}</span> <span className="font-bold">{customerName}</span></div>
                        <div className="flex justify-between items-center"><span className="text-brand-muted">{isEn ? 'Phone:' : 'الهاتف:'}</span> <span className="font-bold dir-ltr flex items-center gap-2"><Phone size={12} /> {phone || (isEn ? 'N/A' : 'غير متوفر')}</span></div>
                        <div className="flex justify-between"><span className="text-brand-muted">{isEn ? 'Product:' : 'المنتج:'}</span> <span className={`font-bold max-w-[200px] truncate ${isEn ? 'text-right' : 'text-left'}`}>{order.line_items?.[0]?.title}</span></div>
                        <div className="flex justify-between"><span className="text-brand-muted">{isEn ? 'Total:' : 'المبلغ:'}</span> <span className="font-bold">{order.total_price} {order.currency}</span></div>
                    </div>
                    <button onClick={() => { onClose(); onOpenChat(phone); }} className="w-full mt-4 py-3 bg-brand-accent/10 text-brand-accent rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-accent hover:text-brand-bg transition-all">
                        <MessageCircle size={16} /> {isEn ? 'Open Chat' : 'فتح المحادثة الحرة'}
                    </button>
                </div>

                {/* Template Actions */}
                <div className="space-y-4">
                    <h4 className="font-bold text-brand-accent text-sm border-b border-brand-accent/10 pb-2">{isEn ? 'Automated Actions' : 'إجراءات المتابعة التلقائية'}</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {Object.entries(templates).map(([key, tpl]) => (
                            <button
                                key={key}
                                onClick={() => handleSendTemplate(key)}
                                disabled={sending || !phone}
                                className={`relative overflow-hidden text-sm py-4 px-4 rounded-xl font-bold flex items-center justify-between transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${getColorClasses(tpl.color)} group`}
                            >
                                <span className="flex items-center gap-3">
                                    {sending ? <RefreshCcw size={16} className="animate-spin" /> : <Send size={16} className={`group-hover:-translate-y-1 ${isEn ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`} />}
                                    {isEn ? `Send ${tpl.title}` : `إرسال ${tpl.title}`}
                                </span>
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-brand-muted text-center mt-2">{isEn ? 'Order status will update automatically upon sending' : 'سيتم تحديث حالة الطلب تلقائياً عند الإرسال'}</p>
                </div>

                {/* Shipping Section */}
                <ShippingSection phone={phone} customerName={customerName} orderId={order.name} totalPrice={order.total_price} address={order.shipping_address} showToast={showToast} isEn={isEn} />

                {/* Loyalty Points */}
                <div className="border-t border-brand-accent/10 pt-4 mt-2">
                    <LoyaltyPanel phone={phone} isEn={isEn} showToast={showToast} />
                </div>
            </div>
        </div>
    );
};

const CHAT_LABELS = [
    { id: 'vip',      ar: 'VIP',             en: 'VIP',          dot: 'bg-yellow-400' },
    { id: 'hot',      ar: 'عميل ساخن',        en: 'Hot Lead',     dot: 'bg-red-500' },
    { id: 'followup', ar: 'يحتاج متابعة',      en: 'Follow Up',    dot: 'bg-orange-400' },
    { id: 'pending',  ar: 'معلق',             en: 'Pending',      dot: 'bg-blue-400' },
    { id: 'problem',  ar: 'مشكلة',            en: 'Problem',      dot: 'bg-purple-500' },
    { id: 'closed',   ar: 'مغلق',             en: 'Closed',       dot: 'bg-gray-500' },
    { id: 'new',      ar: 'جديد',             en: 'New',          dot: 'bg-green-400' },
];

const ChatInterface = ({ inbox, orders = [], activePhone, onSelectChat, refreshInbox, templates, showToast, lang }) => {
    const isEn = lang === 'en';

    // Construct dynamic display inbox to seamlessly support newly opened chats that have no prior history
    let displayInbox = [...inbox];
    if (activePhone && !inbox.some(c => c.phone === activePhone)) {
        const matchingOrder = orders.find(o =>
            o.shipping_address?.phone === activePhone ||
            o.customer?.phone === activePhone
        );
        let custName = activePhone;
        if (matchingOrder) {
            custName = `${matchingOrder.customer?.first_name || ''} ${matchingOrder.customer?.last_name || ''}`.trim() || activePhone;
        }
        displayInbox.unshift({
            name: custName,
            phone: activePhone,
            messages: [],
            lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
    }

    const activeChat = displayInbox.find(c => c.phone === activePhone) || null;
    const [msgText, setMsgText] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // AI features state
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [aiSummary, setAiSummary] = useState('');
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [sentiments, setSentiments] = useState({}); // phone → sentiment
    const [isTyping, setIsTyping] = useState(false);

    // Quick replies state
    const [quickReplies, setQuickReplies] = useState([]);
    const [showQR, setShowQR] = useState(false);
    const [qrFilter, setQrFilter] = useState('');

    useEffect(() => {
        axios.get(`${API_URL}/quick-replies`).then(r => setQuickReplies(r.data)).catch(() => {});
    }, []);
    const [lastMsgCount, setLastMsgCount] = useState(0);

    // نظام الإشعارات الصوتية
    const playNotification = () => {
        try {
            // الصوت المختار: Software interface start
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio blocked by browser'));
        } catch (e) {}
    };


    // طلب إذن الإشعارات
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // مراقبة الرسائل الجديدة للإشعارات
    useEffect(() => {
        const currentTotal = inbox.reduce((acc, chat) => acc + (chat.messages?.length || 0), 0);
        if (currentTotal > lastMsgCount && lastMsgCount !== 0) {
            playNotification();
            const latestChat = inbox[0];
            if (latestChat && Notification.permission === "granted") {
                new Notification(latestChat.name || latestChat.phone, {
                    body: latestChat.messages?.[latestChat.messages.length - 1]?.text || "رسالة جديدة",
                    icon: "/favicon.ico"
                });
            }
        }
        setLastMsgCount(currentTotal);
    }, [inbox]);

    const fetchSuggestions = async (chat) => {
        if (!chat?.messages?.length) return;
        setLoadingSuggestions(true);
        setAiSuggestions([]);
        try {
            const res = await axios.post(`${API_URL}/ai/suggest`, { messages: chat.messages, customerName: chat.name });
            setAiSuggestions(res.data.suggestions || []);
        } catch (e) { console.error('AI suggest:', e.message); }
        setLoadingSuggestions(false);
    };

    const fetchSummary = async (chat) => {
        if (!chat?.messages?.length) return;
        setLoadingSummary(true);
        setAiSummary('');
        try {
            const res = await axios.post(`${API_URL}/ai/summarize`, { messages: chat.messages, customerName: chat.name });
            setAiSummary(res.data.summary || '');
        } catch (e) { console.error('AI summarize:', e.message); }
        setLoadingSummary(false);
    };

    const fetchSentiment = async (chat) => {
        if (!chat?.phone || !chat?.messages?.length) return;
        if (sentiments[chat.phone]) return;
        try {
            const res = await axios.post(`${API_URL}/ai/sentiment`, { messages: chat.messages });
            setSentiments(p => ({ ...p, [chat.phone]: res.data.sentiment }));
        } catch (e) { /* silent */ }
    };

    useEffect(() => {
        if (activeChat) {
            setAiSuggestions([]);
            setAiSummary('');
            fetchSentiment(activeChat);
            
            // تمييز آخر رسالة كمقروءة تلقائياً عند فتح المحادثة
            const lastMsg = activeChat.messages?.slice().reverse().find(m => m.from !== 'agent' && m.wamid);
            if (lastMsg?.wamid) {
                axios.post(`${API_URL}/whatsapp/read`, { wamid: lastMsg.wamid }).catch(() => {});
            }
        }
    }, [activePhone]);


    // Team features state
    const [showTeamPanel, setShowTeamPanel] = useState(false);
    const [filterLabel, setFilterLabel] = useState('');
    const [filterAssignee, setFilterAssignee] = useState('');
    const [noteText, setNoteText] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [savingMeta, setSavingMeta] = useState(false);

    const handleToggleLabel = async (labelId) => {
        if (!activeChat) return;
        const current = activeChat.labels || [];
        const updated = current.includes(labelId) ? current.filter(l => l !== labelId) : [...current, labelId];
        setSavingMeta(true);
        try {
            await axios.patch(`${API_URL}/inbox/${activeChat.phone}/meta`, { labels: updated });
            refreshInbox();
        } catch (e) { showToast(isEn ? 'Failed to update label' : 'فشل تحديث التصنيف', 'error'); }
        setSavingMeta(false);
    };

    const handleAssign = async (agentName) => {
        if (!activeChat) return;
        try {
            await axios.patch(`${API_URL}/inbox/${activeChat.phone}/meta`, { assigned_to: agentName });
            refreshInbox();
        } catch (e) { showToast(isEn ? 'Failed to assign' : 'فشل التعيين', 'error'); }
    };

    const handleAddNote = async () => {
        if (!noteText.trim() || !activeChat) return;
        setSavingNote(true);
        try {
            await axios.post(`${API_URL}/inbox/${activeChat.phone}/note`, { text: noteText });
            setNoteText('');
            refreshInbox();
            showToast(isEn ? 'Note added' : 'تمت إضافة الملاحظة');
        } catch (e) { showToast(isEn ? 'Failed to add note' : 'فشل إضافة الملاحظة', 'error'); }
        setSavingNote(false);
    };

    const handleDeleteNote = async (noteId) => {
        if (!activeChat) return;
        try {
            await axios.delete(`${API_URL}/inbox/${activeChat.phone}/note/${noteId}`);
            refreshInbox();
        } catch (e) { showToast(isEn ? 'Failed to delete note' : 'فشل حذف الملاحظة', 'error'); }
    };

    const [chatSearch, setChatSearch] = useState('');
    const [chatFilter, setChatFilter] = useState('all');

    const filteredInbox = displayInbox.filter(chat => {
        if (filterLabel && !(chat.labels || []).includes(filterLabel)) return false;
        if (filterAssignee && !(chat.assigned_to || '').toLowerCase().includes(filterAssignee.toLowerCase())) return false;
        if (chatSearch) {
            const q = chatSearch.toLowerCase();
            if (!chat.name?.toLowerCase().includes(q) && !chat.phone?.includes(q)) return false;
        }
        if (chatFilter === 'live') {
            const lastMsg = chat.messages?.[chat.messages.length - 1];
            const mins = lastMsg?.time ? (Date.now() - new Date(lastMsg.time).getTime()) / 60000 : Infinity;
            if (mins > 30) return false;
        }
        if (chatFilter === 'cart') {
            if (!(chat.labels || []).includes('cart_abandoned')) return false;
        }
        if (chatFilter === 'mine') {
            if (!chat.assigned_to) return false;
        }
        return true;
    });

    const liveCount = displayInbox.filter(c => { const lm = c.messages?.[c.messages.length - 1]; return lm?.time && (Date.now() - new Date(lm.time).getTime()) / 60000 < 30; }).length;
    const cartCount = displayInbox.filter(c => (c.labels || []).includes('cart_abandoned')).length;
    const mineCount = displayInbox.filter(c => !!c.assigned_to).length;

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    const getTimeAgo = (timeStr) => {
        if (!timeStr) return '';
        const diff = Date.now() - new Date(timeStr.replace(' ', 'T')).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    };

    const avatarColors = ['bg-brand-accent', 'bg-brand-gold', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'];
    const getAvatarColor = (name) => avatarColors[Math.abs([...name || ''].reduce((a, c) => a + c.charCodeAt(0), 0)) % avatarColors.length];

    const matchedOrder = activeChat ? orders.find(o => o.shipping_address?.phone === activeChat.phone || o.customer?.phone === activeChat.phone) : null;
    const customerOrders = activeChat ? orders.filter(o => o.shipping_address?.phone === activeChat.phone || o.customer?.phone === activeChat.phone) : [];
    const customerLTV = customerOrders.reduce((s, o) => s + parseFloat(o.total_price || 0), 0);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            let type = "image";
            if (file.type.includes("pdf") || file.type.includes("document") || file.type.includes("msword")) type = "document";
            else if (file.type.includes("video")) type = "video";
            else if (file.type.includes("audio")) type = "audio";

            setSelectedImage({
                base64: result,
                name: file.name,
                type: type,
                mime: file.type
            });
        };
        reader.readAsDataURL(file);
    };


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeChat?.messages]);

    const handleSend = async (type = 'text', templateName = '') => {
        if (!activeChat) return;
        if (type === 'text' && !msgText.trim() && !selectedImage) return;

        setSending(true);
        setIsTyping(true);
        try {
            await axios.post(`${API_URL}/whatsapp/send`, {
                phone: activeChat.phone,
                textMsg: type === 'text' ? msgText : undefined,
                imageBase64: (type === 'text' && selectedImage?.type === 'image') ? selectedImage.base64 : undefined,
                fileBase64: (type === 'text' && selectedImage && selectedImage.type !== 'image') ? selectedImage.base64 : undefined,
                fileType: (type === 'text' && selectedImage) ? selectedImage.type : undefined,
                fileName: (type === 'text' && selectedImage) ? selectedImage.name : undefined,
                template: type === 'template' ? templateName : undefined,
                params: type === 'template' ? [activeChat.name] : undefined
            });
            if (type === 'text') {
                setMsgText('');
                setSelectedImage(null);
            }
            refreshInbox();
        } catch (e) {
            console.error(e);
            const errDetails = e.response?.data?.details || e.response?.data?.error || e.message;
            const safeMsg = typeof errDetails === 'object' ? JSON.stringify(errDetails) : JSON.stringify(errDetails);
            showToast(isEn ? `Error: ${safeMsg}` : `فشل الإرسال: ${safeMsg}`, 'error');
        }

        setSending(false);
        setIsTyping(false);
    };


    const maskedPhone = activeChat ? activeChat.phone.replace(/(\d{4})\d{3,}(\d{2})/, '$1 ··· $2') : '';

    return (
        <div className={`flex flex-1 min-h-0 gap-3 animate-in fade-in duration-500 ${isEn ? 'text-left' : 'text-right'}`}>
            {/* Chat List */}
            <div className="flex flex-col glass rounded-2xl overflow-hidden shrink-0" style={{width:272}}>
                <div className="p-4 border-b border-brand-accent/10 space-y-3">
                    <div>
                        <h3 className="font-bold text-lg">{isEn ? 'Inbox' : 'المحادثات'}</h3>
                        <p className="text-[10px] font-mono text-brand-muted tracking-wider uppercase">{isEn ? 'ALL CONVERSATIONS' : 'كل المحادثات'} · {displayInbox.length} {isEn ? 'OPEN' : 'مفتوحة'}</p>
                    </div>
                    <div className="flex gap-1">
                        {[
                            { id: 'all', label: isEn ? 'All' : 'الكل', count: displayInbox.length },
                            { id: 'live', label: isEn ? 'Live' : 'مباشر', count: liveCount, dot: 'bg-brand-accent' },
                            { id: 'cart', label: isEn ? 'Cart' : 'سلة', count: cartCount, dot: 'bg-brand-gold' },
                            { id: 'mine', label: isEn ? 'Mine' : 'لي', count: mineCount },
                        ].map(f => (
                            <button key={f.id} onClick={() => setChatFilter(f.id)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${chatFilter === f.id ? 'bg-brand-accent text-brand-bg' : 'bg-white/5 text-brand-muted hover:bg-brand-accent/10 border border-brand-border/20'}`}>
                                {f.dot && <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`}></span>}
                                {f.label} · {f.count}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search size={14} className={`absolute top-1/2 -translate-y-1/2 text-brand-muted ${isEn ? 'left-3' : 'right-3'}`} />
                        <input value={chatSearch} onChange={e => setChatSearch(e.target.value)}
                            placeholder={isEn ? 'Search conversations' : 'بحث في المحادثات'}
                            className={`w-full bg-brand-bg/60 border border-brand-accent/10 rounded-xl text-xs py-2.5 focus:outline-none focus:border-brand-accent/30 ${isEn ? 'pl-9 pr-3' : 'pr-9 pl-3'}`}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredInbox.map(chat => {
                        const lastMsg = chat.messages?.[chat.messages.length - 1];
                        const unread = chat.messages?.filter(m => m.from !== 'agent' && !m.seen).length || 0;
                        const isActive = activePhone === chat.phone;
                        const color = getAvatarColor(chat.name);
                        const isCartChat = (chat.labels || []).includes('cart_abandoned');
                        return (
                            <div
                                key={chat.phone}
                                onClick={() => onSelectChat(chat.phone)}
                                className={`px-3 py-3.5 cursor-pointer transition-all hover:bg-brand-accent/5 flex items-start gap-3 relative ${isActive ? 'bg-brand-accent/10' : ''}`}
                            >
                                {isActive && <span className={`absolute ${isEn ? 'left-0' : 'right-0'} top-2 bottom-2 w-0.5 rounded-full bg-brand-accent`}></span>}
                                <div className="relative shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${color}`}>
                                        {getInitials(chat.name)}
                                    </div>
                                    {(lastMsg?.time && (Date.now() - new Date(lastMsg.time.replace(' ', 'T')).getTime()) / 60000 < 30) && (
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-brand-sidebar ${isCartChat ? 'bg-brand-gold' : 'bg-brand-accent'}`}></span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-bold text-sm truncate text-brand-text">{chat.name}</span>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[10px] text-brand-muted">{getTimeAgo(chat.lastUpdated)}</span>
                                            {unread > 0 && <span className="w-5 h-5 rounded-full bg-brand-accent text-brand-bg text-[10px] font-bold flex items-center justify-center">{unread}</span>}
                                        </div>
                                    </div>
                                    <p className="text-xs text-brand-muted truncate">{lastMsg?.text || (isEn ? 'Start chat...' : 'بدء محادثة...')}</p>
                                </div>
                            </div>
                        )
                    })}
                    {filteredInbox.length === 0 && <div className="p-10 text-center text-brand-muted text-sm flex flex-col items-center gap-3"><MessageCircle size={30} className="opacity-20" /> {isEn ? 'No chats' : 'لا توجد محادثات'}</div>}
                </div>
            </div>

            {/* Active Chat */}
            <div className="flex-1 flex flex-col relative glass rounded-2xl overflow-hidden min-w-0">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8CC850 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-5 py-3 border-b border-brand-accent/10 bg-brand-card/60 flex justify-between items-center backdrop-blur-md z-10">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${getAvatarColor(activeChat.name)}`}>
                                    {getInitials(activeChat.name)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-brand-text">{activeChat.name}</h4>
                                    <p className="text-[10px] text-brand-muted dir-ltr flex items-center gap-1.5 font-mono">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                                        <span className="text-brand-accent">{isEn ? 'online' : 'متصل'}</span>
                                        <span>·</span>
                                        <span>{maskedPhone}</span>
                                        <span>···</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 items-center">
                                <button onClick={() => fetchSuggestions(activeChat)} disabled={loadingSuggestions}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-green-soft border border-brand-border/50 text-brand-egg text-xs font-bold hover:bg-brand-green-mid transition-all disabled:opacity-50">
                                    <Package size={14} /> {isEn ? 'Send Product' : 'إرسال منتج'}
                                </button>
                                <button onClick={() => setShowTeamPanel(p => !p)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${showTeamPanel ? 'bg-brand-accent text-brand-bg' : 'bg-brand-green-soft border border-brand-border/50 text-brand-egg hover:bg-brand-green-mid'}`}>
                                    <Star size={13} /> {isEn ? 'Tag VIP' : 'VIP'}
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar z-10">
                            {/* Date separator */}
                            {activeChat.messages?.length > 0 && (
                                <div className="flex items-center justify-center py-2">
                                    <span className="text-[10px] font-mono text-brand-muted tracking-wider uppercase">
                                        {isEn ? 'Today' : 'اليوم'} · {new Date().toLocaleDateString(isEn ? 'en-US' : 'ar-EG', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            )}
                            {activeChat.messages?.map((msg, idx) => {
                                const isAgent = msg.from === 'agent';
                                return (
                                    <div key={idx} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[65%] px-4 py-3 rounded-2xl relative ${isAgent
                                                ? 'bg-brand-bg text-brand-egg border border-brand-border/30'
                                                : 'glass border border-brand-accent/10'
                                            }`}>
                                            {msg.image && (
                                                <div className="mb-2">
                                                    {msg.image.toLowerCase().match(/\.(pdf|doc|docx|xls|xlsx|txt|zip|bin)$/) || msg.text?.includes('[مستند') ? (
                                                        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/20 cursor-pointer hover:bg-white/20 transition-all"
                                                            onClick={() => window.open(`${API_URL.replace('/api', '')}${msg.image}`, '_blank')}>
                                                            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400"><FileText size={20} /></div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-xs font-bold truncate">{isEn ? 'Document' : 'مستند'}</span>
                                                                <span className="text-[10px] opacity-60">PDF / Doc</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <img src={`${API_URL.replace('/api', '')}${msg.image}`} alt=""
                                                            className="max-w-[250px] w-full rounded-xl object-cover border border-brand-accent/20 cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => window.open(`${API_URL.replace('/api', '')}${msg.image}`, '_blank')} />
                                                    )}
                                                </div>
                                            )}
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                            <div className={`text-[9px] mt-1.5 flex items-center gap-1 ${isAgent ? 'text-brand-egg-mute justify-end' : 'text-brand-egg-mute justify-start'} dir-ltr`}>
                                                <span>{msg.time?.split(' ')[1]}</span>
                                                {isAgent && (
                                                    msg.status === 'seen' || msg.seen === true ? <CheckCheck size={13} className="text-sky-400 inline-block" />
                                                    : msg.status === 'delivered' || msg.delivered === true ? <CheckCheck size={13} className="opacity-60 inline-block" />
                                                    : <Check size={12} className="opacity-50 inline-block" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Smart Reply card */}
                            {aiSuggestions.length > 0 && (
                                <div className="border border-brand-accent/25 rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom-2" style={{background:'color-mix(in srgb, var(--color-brand-accent) 6%, var(--color-brand-card))'}}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-mono text-brand-accent tracking-wider uppercase font-bold">
                                            <Sparkles size={11} className="text-brand-accent" />
                                            {isEn ? 'AI · SMART REPLY' : 'ذكاء اصطناعي · رد ذكي'}
                                        </div>
                                        <span className="text-[10px] font-mono text-brand-muted">1.4s · 92% {isEn ? 'confidence' : 'دقة'}</span>
                                    </div>
                                    <p className="text-sm text-brand-text leading-relaxed font-medium">{aiSuggestions[0]}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setMsgText(aiSuggestions[0]); handleSend(); setAiSuggestions([]); }}
                                            className="px-4 py-2 bg-brand-accent text-brand-bg rounded-xl text-xs font-bold hover:bg-brand-salad-deep transition-all">{isEn ? 'Send' : 'إرسال'}</button>
                                        <button onClick={() => { setMsgText(aiSuggestions[0]); setAiSuggestions([]); }}
                                            className="px-4 py-2 glass-subtle rounded-xl text-xs font-bold text-brand-egg hover:bg-brand-egg/10 transition-all border border-brand-accent/15">{isEn ? 'Edit' : 'تعديل'}</button>
                                        <button onClick={() => fetchSuggestions(activeChat)}
                                            className="px-4 py-2 glass-subtle rounded-xl text-xs font-bold text-brand-egg hover:bg-brand-egg/10 transition-all border border-brand-accent/15">{isEn ? 'Regenerate' : 'إعادة'}</button>
                                    </div>
                                </div>
                            )}

                            {/* AI Summary */}
                            {aiSummary && (
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-3 flex items-start gap-2">
                                    <Sparkles size={14} className="text-purple-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-purple-300 leading-relaxed flex-1">{aiSummary}</p>
                                    <button onClick={() => setAiSummary('')} className="text-purple-400/50 hover:text-purple-400 transition-colors shrink-0"><X size={13} /></button>
                                </div>
                            )}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="rounded-2xl px-4 py-2 bg-brand-accent/5 border border-brand-accent/10">
                                        <div className="flex gap-1.5 items-center">
                                            <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* File preview */}
                        {selectedImage && (
                            <div className="px-6 py-3 bg-brand-accent/5 border-t border-brand-accent/10 flex items-center justify-between animate-in slide-in-from-bottom-2 z-10">
                                <div className="flex items-center gap-3">
                                    {selectedImage.type === 'image' ? (
                                        <img src={selectedImage.base64} className="w-12 h-12 rounded-lg object-cover border border-brand-accent/20" alt="" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-accent"><Paperclip size={20} /></div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold truncate max-w-[200px]">{selectedImage.name}</span>
                                        <span className="text-[10px] text-brand-muted uppercase">{selectedImage.type}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedImage(null)} className="p-1.5 hover:bg-brand-accent/10 rounded-full text-brand-muted hover:text-brand-accent transition-all"><X size={16} /></button>
                            </div>
                        )}

                        {/* Message Input */}
                        <div className="px-4 py-3 border-t border-brand-accent/10 bg-brand-card/60 backdrop-blur-xl z-10">
                            <div className="flex gap-2 items-center">
                                <button onClick={() => fileInputRef.current?.click()} className="text-brand-muted hover:text-brand-accent p-2 transition-all shrink-0">
                                    <Paperclip size={20} />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                                <div className="flex-1 relative">
                                    {showQR && quickReplies.length > 0 && (
                                        <div className="absolute bottom-full mb-2 left-0 right-0 bg-brand-card border border-brand-accent/20 rounded-2xl shadow-2xl z-50 max-h-52 overflow-y-auto custom-scrollbar">
                                            {quickReplies.filter(r => !qrFilter || r.title.toLowerCase().includes(qrFilter.toLowerCase()) || r.text.toLowerCase().includes(qrFilter.toLowerCase())).length === 0 ? (
                                                <div className="px-4 py-3 text-xs text-brand-muted">{isEn ? 'No quick replies found.' : 'مفيش ردود سريعة.'}</div>
                                            ) : quickReplies.filter(r => !qrFilter || r.title.toLowerCase().includes(qrFilter.toLowerCase()) || r.text.toLowerCase().includes(qrFilter.toLowerCase())).map(r => (
                                                <button key={r.id}
                                                    onMouseDown={e => { e.preventDefault(); setMsgText(r.text); setShowQR(false); setQrFilter(''); }}
                                                    className="w-full text-start px-4 py-3 hover:bg-brand-accent/10 transition-colors border-b border-brand-accent/5 last:border-0">
                                                    <p className="text-xs font-bold text-brand-accent">/{r.title}</p>
                                                    <p className="text-xs text-brand-muted mt-0.5 truncate">{r.text}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <input
                                        value={msgText}
                                        onChange={e => {
                                            const v = e.target.value;
                                            setMsgText(v);
                                            if (v.startsWith('/')) { setShowQR(true); setQrFilter(v.slice(1)); }
                                            else setShowQR(false);
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Escape') { setShowQR(false); setMsgText(''); return; }
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (showQR) {
                                                    const matches = quickReplies.filter(r => !qrFilter || r.title.toLowerCase().includes(qrFilter.toLowerCase()) || r.text.toLowerCase().includes(qrFilter.toLowerCase()));
                                                    if (matches.length > 0) { setMsgText(matches[0].text); setShowQR(false); setQrFilter(''); }
                                                } else { handleSend(); }
                                            }
                                        }}
                                        placeholder={isEn ? `Reply to ${activeChat.name}...` : `الرد على ${activeChat.name}...`}
                                        className={`w-full bg-brand-input/80 border border-brand-accent/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-accent/40 placeholder-brand-muted/50 transition-colors`}
                                    />
                                </div>
                                <button onClick={() => handleSend()} disabled={sending || (!msgText.trim() && !selectedImage)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-30 disabled:bg-brand-muted/20 shrink-0" style={{background:'#FF6400'}}>
                                    <Send size={18} className={sending ? 'animate-pulse' : ''} style={{ transform: `translateX(${isEn ? '1px' : '-1px'})` }} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-brand-muted opacity-40 z-10 select-none">
                        <div className="w-24 h-24 rounded-full bg-brand-accent/5 flex items-center justify-center mb-6">
                            <MessageCircle size={40} className="text-brand-accent" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{isEn ? 'Messaging Dashboard' : 'تطبيق المحادثات'}</h3>
                        <p className="text-sm">{isEn ? 'Select a conversation from the sidebar to start chatting' : 'اختر محادثة من القائمة الجانبية لعرض الرسائل'}</p>
                    </div>
                )}
            </div>

            {/* Customer Profile Panel */}
            {activeChat && (
                <div className={`w-72 flex flex-col glass rounded-2xl overflow-y-auto custom-scrollbar shrink-0`}>
                    {/* Profile header */}
                    <div className="p-6 flex flex-col items-center text-center border-b border-brand-accent/10">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3 ${getAvatarColor(activeChat.name)}`}>
                            {getInitials(activeChat.name)}
                        </div>
                        <h4 className="font-bold text-brand-text text-base">{activeChat.name}</h4>
                        <p className="text-[11px] text-brand-muted font-mono mt-1 dir-ltr">{maskedPhone}</p>
                        {customerOrders.length >= 2 && (
                            <span className="mt-2 px-3 py-1 rounded-full text-[10px] font-bold border border-brand-gold/30 text-brand-gold bg-brand-gold/10">VIP · Gold</span>
                        )}
                    </div>

                    {/* Customer stats */}
                    <div className="p-4 space-y-3 border-b border-brand-accent/10">
                        <div className="flex justify-between text-xs">
                            <span className="text-brand-muted">{isEn ? 'Orders' : 'الطلبات'}</span>
                            <span className="font-bold text-brand-text">{customerOrders.length} {isEn ? 'lifetime' : 'إجمالي'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-brand-muted">LTV</span>
                            <span className="font-bold text-brand-text">EGP {customerLTV.toLocaleString()}</span>
                        </div>
                        {customerOrders.length > 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-brand-muted">{isEn ? 'Last order' : 'آخر طلب'}</span>
                                <span className="font-bold text-brand-text">
                                    {new Date(customerOrders[0].created_at || Date.now()).toLocaleDateString(isEn ? 'en-US' : 'ar-EG', { month: 'short', day: 'numeric' })} · #{customerOrders[0].order_number || customerOrders[0].id}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs">
                            <span className="text-brand-muted">{isEn ? 'Loyalty pts' : 'نقاط الولاء'}</span>
                            <span className="font-bold text-brand-accent">{customerOrders.length > 0 ? Math.floor(customerLTV / 10).toLocaleString() : "—"}</span>
                        </div>
                    </div>

                    {/* Recent Items */}
                    {customerOrders.length > 0 && (
                        <div className="p-4 space-y-3">
                            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">{isEn ? 'RECENT ITEMS' : 'آخر المنتجات'}</p>
                            <div className="space-y-2">
                                {customerOrders.slice(0, 3).map((order, i) => {
                                    const productName = order.line_items?.[0]?.name || order.title || (isEn ? 'Order' : 'طلب');
                                    const qty = order.line_items?.[0]?.quantity || 1;
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-brand-green-soft border border-brand-border/50 flex items-center justify-center shrink-0">
                                                <Package size={14} className="text-brand-accent" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate text-brand-text">{productName}</p>
                                            </div>
                                            <span className="text-[10px] text-brand-muted font-bold shrink-0">×{qty}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Team panel toggle */}
                    {showTeamPanel && (
                        <>
                            {/* Labels */}
                            <div className="p-4 border-b border-brand-accent/5 space-y-2">
                                <p className="text-[11px] font-bold text-brand-muted flex items-center gap-1.5 uppercase tracking-wider">
                                    <Tag size={12} /> {isEn ? 'Labels' : 'التصنيفات'}
                                    {savingMeta && <RefreshCcw size={10} className="animate-spin text-brand-accent" />}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {CHAT_LABELS.map(l => {
                                        const active = (activeChat.labels || []).includes(l.id);
                                        return (
                                            <button key={l.id} onClick={() => handleToggleLabel(l.id)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${active ? 'border-transparent text-white ' + l.dot : 'border-brand-accent/20 text-brand-muted hover:border-brand-accent/40'}`}>
                                                <span className={`w-2 h-2 rounded-full ${l.dot} ${!active ? 'opacity-50' : ''}`} />
                                                {isEn ? l.en : l.ar}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Assign To */}
                            <div className="p-4 border-b border-brand-accent/5 space-y-2">
                                <p className="text-[11px] font-bold text-brand-muted flex items-center gap-1.5 uppercase tracking-wider">
                                    <UserCheck size={12} /> {isEn ? 'Assigned To' : 'مُعيَّن لـ'}
                                </p>
                                <input defaultValue={activeChat.assigned_to || ''} onBlur={e => handleAssign(e.target.value)}
                                    placeholder={isEn ? 'Agent name...' : 'اسم الموظف...'}
                                    className="w-full bg-brand-input border border-brand-border rounded-lg px-3 py-2 text-xs focus:border-brand-accent outline-none" />
                            </div>

                            {/* Notes */}
                            <div className="p-4 space-y-3 flex-1">
                                <p className="text-[11px] font-bold text-brand-muted flex items-center gap-1.5 uppercase tracking-wider">
                                    <StickyNote size={12} /> {isEn ? 'Internal Notes' : 'الملاحظات الداخلية'}
                                </p>
                                <div className="space-y-2">
                                    {(activeChat.notes || []).length === 0 && (
                                        <p className="text-[11px] text-brand-muted opacity-60 text-center py-3">{isEn ? 'No notes yet.' : 'لا توجد ملاحظات بعد.'}</p>
                                    )}
                                    {(activeChat.notes || []).map(note => (
                                        <div key={note.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 group relative">
                                            <p className="text-xs text-brand-text leading-relaxed">{note.text}</p>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <span className="text-[10px] text-brand-muted">{note.author} · {new Date(note.created_at).toLocaleDateString(isEn ? 'en-US' : 'ar-EG')}</span>
                                                <button onClick={() => handleDeleteNote(note.id)}
                                                    className="text-red-400/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2 pt-1">
                                    <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                                        placeholder={isEn ? 'Add internal note...' : 'أضف ملاحظة داخلية...'}
                                        rows={3}
                                        className="w-full bg-brand-input border border-brand-border rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none resize-none custom-scrollbar" />
                                    <button onClick={handleAddNote} disabled={!noteText.trim() || savingNote}
                                        className="w-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 py-2 rounded-xl text-xs font-bold hover:bg-yellow-500/30 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                                        {savingNote ? <RefreshCcw size={12} className="animate-spin" /> : <Plus size={12} />}
                                        {isEn ? 'Add Note' : 'إضافة ملاحظة'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Recent items from orders */}
                    {customerOrders.length > 0 && (
                        <div className="p-4 space-y-3">
                            <p className="text-[10px] font-bold text-brand-muted tracking-widest uppercase mb-1">{isEn ? 'RECENT ITEMS' : 'آخر المنتجات'}</p>
                            {customerOrders.slice(0, 3).map((o, i) => (
                                <div key={i} className="flex items-center gap-3 py-2.5">
                                    <div className="w-9 h-9 rounded-xl glass border border-brand-border/30 flex items-center justify-center shrink-0">
                                        <Package size={14} className="text-brand-accent" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-bold text-brand-egg truncate">{o.line_items?.[0]?.name || `Order #${o.order_number || o.id}`}</p>
                                    </div>
                                    <span className="text-[10px] text-brand-muted font-bold shrink-0">×{o.line_items?.[0]?.quantity || 1}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Dashboard = ({ inbox, orders = [], abandonedCarts = [], onOpenChat, setActiveTab, lang, aiEnabled }) => {

    const confirmedCount = orders.filter(o => o.local_status === 'confirmed').length;
    const shippedCount = orders.filter(o => o.local_status === 'shipped').length;
    const followedUpCount = orders.filter(o => o.local_status === 'followed_up').length;
    const cancelledCount = orders.filter(o => o.local_status === 'cancelled').length;
    const newCount = orders.filter(o => !o.local_status || o.local_status === 'new').length;
    const isEn = lang === 'en';

    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
    const recoveredCarts = abandonedCarts.filter(c => c.drip_sent);
    const recoveredValue = recoveredCarts.reduce((sum, c) => sum + parseFloat(c.total_price || 0), 0);
    const pendingCarts = abandonedCarts.filter(c => !c.drip_sent).length;
    const fulfillmentPct = Math.round(((confirmedCount + shippedCount) / (orders.length || 1)) * 100);

    return (
        <div className={`space-y-8 animate-in fade-in duration-700 pb-12 ${isEn ? 'text-left' : 'text-right'}`}>
            {/* Top row stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title={isEn ? "Total Revenue" : "إجمالي الإيرادات"} value={`EGP ${totalRevenue.toLocaleString()}`} color="text-brand-gold" icon={ShoppingCart} badge={orders.length > 0 ? `+${((totalRevenue / (orders.length || 1)) * 0.184).toFixed(1)}%` : undefined} badgeColor="text-brand-accent" />
                <StatCard title={isEn ? "Total Orders" : "إجمالي الطلبات"} value={orders.length.toLocaleString()} color="text-brand-egg" icon={LayoutDashboard} badge={newCount > 0 ? `+${newCount}` : undefined} badgeColor="text-brand-accent" />
                <StatCard title={isEn ? "Active Chats" : "محادثات نشطة"} value={inbox.length} color="text-brand-accent" icon={MessageCircle} badge={inbox.length > 0 ? (isEn ? 'Live' : 'مباشر') : undefined} badgeColor="text-brand-accent" badgeDot />
                <StatCard title={isEn ? "Recovered Carts" : "سلات مستردة"} value={recoveredCarts.length} color="text-brand-egg" icon={RefreshCcw} subtitle={`EGP ${recoveredValue.toLocaleString()}`} />
            </div>

            {/* Analytics charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Orders Distribution Chart */}
                <div className="glass rounded-2xl p-8 lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-bold flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent shrink-0"></span>
                            {isEn ? 'Orders Status Distribution' : 'توزيع حالات الطلبات'}
                            <span className="text-[10px] font-mono text-brand-muted tracking-wider uppercase">{isEn ? 'CRM ANALYTICS' : 'تحليلات CRM'}</span>
                        </h3>
                        <span className="flex items-center gap-1.5 text-[10px] text-brand-muted font-mono tracking-wider uppercase shrink-0">
                            <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
                            REAL-TIME
                        </span>
                    </div>

                    <div className="space-y-4">
                        <StatusBar label={isEn ? "Confirmed" : "تم التأكيد"} count={confirmedCount} total={orders.length || 1} color="bg-brand-accent" />
                        <StatusBar label={isEn ? "Shipped" : "تم الشحن"} count={shippedCount} total={orders.length || 1} color="bg-brand-accent" />
                        <StatusBar label={isEn ? "Followed Up" : "تمت المتابعة"} count={followedUpCount} total={orders.length || 1} color="bg-blue-500" />
                        <StatusBar label={isEn ? "New Orders" : "طلبات جديدة"} count={newCount} total={orders.length || 1} color="bg-brand-gold" />
                        <StatusBar label={isEn ? "Cancelled" : "ملغى"} count={cancelledCount} total={orders.length || 1} color="bg-brand-gold" />
                    </div>

                    {/* Fulfillment & Confirmation */}
                    <div className="pt-4 border-t border-brand-accent/10">
                        <p className="text-[10px] font-mono text-brand-muted tracking-wider uppercase mb-1">{isEn ? 'FULFILLMENT & CONFIRMATION' : 'نسبة إتمام الشحن والتأكيد'}</p>
                        <div className="flex items-end gap-4">
                            <span className="text-3xl font-bold text-brand-egg">{fulfillmentPct}%</span>
                            <FulfillmentSparkline pct={fulfillmentPct} />
                        </div>
                    </div>
                </div>

                {/* Broadcast recommendations */}
                <div className="rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden glass" style={{borderColor:'color-mix(in srgb, var(--color-brand-gold) 20%, transparent)'}}>
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{background:'radial-gradient(circle,color-mix(in srgb, var(--color-brand-gold) 12%, transparent) 0%,transparent 70%)'}}></div>
                    <div className="space-y-4 relative z-10">
                        <div className="w-12 h-12 bg-brand-gold rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(255,100,0,0.4)]">
                            <Megaphone className="text-white" size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-brand-egg">{isEn ? "Smart Broadcast Tip" : "توصيات البث الذكي"}</h3>
                        <p className="text-sm text-brand-muted leading-relaxed">
                            {isEn ? (
                                <><span className="text-brand-gold font-bold">{pendingCarts}</span> carts waiting for engagement. Send a recovery blast — predicted recovery + <span className="text-brand-accent font-bold">EGP {(pendingCarts * 300).toLocaleString()}</span>.</>
                            ) : (
                                <><span className="text-brand-gold font-bold">{pendingCarts}</span> سلة في انتظار التفاعل. أرسل حملة استرداد — الاسترداد المتوقع + <span className="text-brand-accent font-bold">EGP {(pendingCarts * 300).toLocaleString()}</span>.</>
                            )}
                        </p>
                    </div>
                    <div className="pt-6 relative z-10 space-y-2">
                        <button onClick={() => setActiveTab('campaigns')} className="w-full py-3.5 bg-brand-gold text-brand-egg rounded-xl font-bold text-sm hover:opacity-90 transition-all glow-pumpkin flex items-center justify-center gap-2">
                            {isEn ? "Launch Promo Campaign" : "إطلاق حملة ترويجية الآن"}
                            <span>{isEn ? '→' : '←'}</span>
                        </button>
                        <button onClick={() => setActiveTab('shop')} className="w-full py-3.5 glass-subtle text-brand-egg rounded-xl font-bold text-sm hover:bg-brand-egg/10 transition-all">
                            {isEn ? "View Orders List" : "عرض قائمة الطلبات"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent messages and AI context block */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-8">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <MessageCircle size={20} className="text-brand-accent" />
                        {isEn ? "Recent Chats" : "المحادثات الأخيرة"}
                    </h3>
                    <div className="space-y-4">
                        {inbox.slice(0, 5).map((chat, i) => {
                            const lastMsg = chat.messages?.[chat.messages.length - 1];
                            return (
                                <div key={i} onClick={() => onOpenChat(chat.phone)} className="flex justify-between items-center p-4 rounded-2xl bg-brand-bg/50 border border-brand-accent/5 group cursor-pointer hover:bg-brand-accent/5 transition-all">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold">{chat.name}</p>
                                        <p className="text-xs text-brand-muted truncate max-w-[200px]">{lastMsg?.text}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className="text-[10px] text-brand-muted">{chat.lastUpdated?.split(' ')[1]}</span>
                                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-brand-accent transition-all">{isEn ? "Open Chat →" : "فتح المحادثة ←"}</span>
                                    </div>
                                </div>
                            )
                        })}
                        {inbox.length === 0 && <p className="text-center text-brand-muted py-10">{isEn ? "No active chats" : "لا توجد محادثات"}</p>}
                    </div>
                </div>

                <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="w-20 h-20 bg-brand-accent/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(140,200,80,0.15)]">
                        <Sparkles size={36} className="text-brand-accent" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-brand-egg">{isEn ? "Smart Assistant (AI Tools)" : "المساعد الذكي (أدوات الـ AI)"}</h3>
                    <p className="text-brand-muted text-sm px-10 leading-relaxed mb-6">
                        {isEn ? "AI Summary & Suggestions are active. Automatic Auto-reply is currently under training." : "أدوات التلخيص والاقتراحات مفعلة حالياً. الرد التلقائي الذكي قيد التدريب والمراجعة."}
                    </p>
                    <div className={`inline-flex items-center gap-2 ${aiEnabled ? 'bg-brand-accent/10 border border-brand-accent/20 text-brand-accent' : 'bg-brand-gold/10 border border-brand-gold/20 text-brand-gold'} px-4 py-2 rounded-full text-xs font-bold`}>
                        <span className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-brand-accent animate-pulse' : 'bg-brand-gold'}`}></span>
                        {aiEnabled ? (isEn ? "Auto-reply Active" : "الرد التلقائي مفعل") : (isEn ? "Manual Tools Only" : "الأدوات اليدوية فقط")}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FulfillmentSparkline = ({ pct }) => {
    const h = 40, w = 120, base = h - 2;
    const target = base - (pct / 100) * (h - 6);
    const steps = 12;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const y = base - (base - target) * progress + (pct > 0 ? Math.sin(progress * Math.PI * 3) * 2.5 * (1 - progress) : 0);
        pts.push(`${(i / steps) * w},${Math.max(2, Math.min(base, y)).toFixed(1)}`);
    }
    const line = pts.join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-10 flex-1 max-w-[200px]">
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-accent)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--color-brand-accent)" stopOpacity="0" />
            </linearGradient>
            <polygon fill="url(#sparkFill)" points={`${line} ${w},${h} 0,${h}`} />
            <polyline fill="none" stroke="var(--color-brand-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={line} />
        </svg>
    );
};

const StatusBar = ({ label, count, total, color }) => {
    const percentage = Math.round((count / total) * 100) || 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
                <span className="text-brand-text">{label}</span>
                <span className="text-brand-muted">{count} ({percentage}%)</span>
            </div>
            <div className="w-full bg-brand-bg rounded-full h-2 overflow-hidden border border-brand-accent/5">
                <div className={`${color} h-full rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, color, icon: Icon, badge, badgeColor = 'text-brand-accent', badgeDot, subtitle }) => (
    <div className="glass p-5 rounded-2xl group hover:border-brand-accent/30 transition-all cursor-default relative flex flex-col gap-3">
        <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-brand-green-soft border border-brand-border/50">
                <Icon size={20} className="text-brand-accent" />
            </div>
            {badge && (
                <span className={`text-[10px] font-bold font-mono ${badgeColor} flex items-center gap-1`}>
                    {badgeDot && <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse"></span>}
                    {badge}
                </span>
            )}
        </div>
        <div>
            <p className="text-[11px] text-brand-muted font-bold uppercase tracking-wide">{title}</p>
            <h4 className={`text-3xl font-bold mt-0.5 ${color}`}>{value}</h4>
            {subtitle && <p className="text-[11px] text-brand-muted font-mono mt-1">{subtitle}</p>}
        </div>
    </div>
);

const CampaignsManager = ({ templates, showToast, lang }) => {
    const [customers, setCustomers] = useState([]);
    const [selectedPhones, setSelectedPhones] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [campaignType, setCampaignType] = useState('template');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [messageText, setMessageText] = useState('');
    const [templateImageUrl, setTemplateImageUrl] = useState('');
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(null);
    const [selectedTag, setSelectedTag] = useState('all');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleName, setScheduleName] = useState('');
    const [scheduling, setScheduling] = useState(false);
    const [scheduledList, setScheduledList] = useState([]);
    const [campaignFilter, setCampaignFilter] = useState('all');
    const [showScheduler, setShowScheduler] = useState(false);
    const fileInputRef = useRef(null);
    const isEn = lang === 'en';

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await axios.get(`${API_URL}/customers`);
                const cust = Array.isArray(res.data) ? res.data : [];
                setCustomers(cust);
                setSelectedPhones(new Set(cust.map(c => c.phone)));
            } catch (e) {
                showToast(isEn ? "Failed to fetch customer numbers" : "فشل جلب أرقام العملاء", "error");
            }
            setLoading(false);
        };
        fetchCustomers();
        axios.get(`${API_URL}/broadcasts`).then(r => setScheduledList(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    }, []);

    const handleSchedule = async () => {
        if (!scheduleDate) return showToast(isEn ? 'Pick a date/time first' : 'اختر موعد الإرسال أولاً', 'error');
        if (campaignType === 'template' && !selectedTemplate) return showToast(isEn ? 'Select a template' : 'اختر قالب', 'error');
        if (campaignType === 'text' && !messageText.trim()) return showToast(isEn ? 'Write the message text' : 'اكتب نص الرسالة', 'error');
        setScheduling(true);
        try {
            const res = await axios.post(`${API_URL}/broadcasts`, {
                name: scheduleName || (isEn ? 'Scheduled Broadcast' : 'حملة مجدولة'),
                scheduled_at: new Date(scheduleDate).toISOString(),
                campaign_type: campaignType,
                template_id: selectedTemplate || null,
                message_text: messageText,
                template_image_url: templateImageUrl,
                target_tag: selectedTag
            });
            setScheduledList(p => [...p, res.data]);
            setScheduleName('');
            setScheduleDate('');
            showToast(isEn ? 'Broadcast scheduled!' : 'تم جدولة الحملة!');
        } catch (e) { showToast(e.response?.data?.error || (isEn ? 'Failed to schedule' : 'فشل الجدولة'), 'error'); }
        setScheduling(false);
    };

    const cancelBroadcast = async (id) => {
        try {
            await axios.delete(`${API_URL}/broadcasts/${id}`);
            setScheduledList(p => p.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
            showToast(isEn ? 'Broadcast cancelled' : 'تم إلغاء الحملة');
        } catch (e) { showToast(isEn ? 'Failed to cancel' : 'فشل الإلغاء', 'error'); }
    };

    const filteredCustomers = customers.filter(c => {
        if (selectedTag === 'all') return true;
        if (selectedTag === 'vip') return c.tag?.includes('VIP');
        if (selectedTag === 'buyer') return c.tag?.includes('مشتري فعلي');
        if (selectedTag === 'chat') return c.tag?.includes('محادثة');
        return true;
    });

    const toggleCustomer = (phone) => {
        const newSet = new Set(selectedPhones);
        if (newSet.has(phone)) newSet.delete(phone);
        else newSet.add(phone);
        setSelectedPhones(newSet);
    };

    const toggleAll = () => {
        const filteredPhones = filteredCustomers.map(c => c.phone);
        const allSelected = filteredPhones.every(p => selectedPhones.has(p));
        const newSet = new Set(selectedPhones);
        if (allSelected) {
            filteredPhones.forEach(p => newSet.delete(p));
        } else {
            filteredPhones.forEach(p => newSet.add(p));
        }
        setSelectedPhones(newSet);
    };

    const startCampaign = async () => {
        if (selectedPhones.size === 0) return showToast(isEn ? "Select at least one customer" : "الرجاء تحديد عميل واحد على الأقل", "error");
        if (campaignType === 'template' && !selectedTemplate) return showToast(isEn ? "Select a template" : "الرجاء اختيار قالب", "error");
        if (campaignType === 'template' && templates[selectedTemplate]?.has_header_image && !templateImageUrl.trim()) return showToast(isEn ? "Enter the header image URL" : "الرجاء إدخال رابط صورة الهيدر", "error");
        if (campaignType === 'text' && !messageText.trim()) return showToast(isEn ? "Type a message" : "الرجاء كتابة رسالة", "error");

        const targets = customers.filter(c => selectedPhones.has(c.phone));
        setSending(true);
        setProgress({ current: 0, total: targets.length });

        let successCount = 0;
        let lastError = null;

        for (let i = 0; i < targets.length; i++) {
            const customer = targets[i];
            try {
                if (campaignType === 'template') {
                    const tpl = templates[selectedTemplate];
                    await axios.post(`${API_URL}/whatsapp/send`, {
                        phone: customer.phone,
                        template: tpl.meta_name,
                        templateLanguage: tpl.language || 'en',
                        params: tpl.params_count > 0 ? [customer.name] : undefined,
                        templateImageUrl: tpl.has_header_image ? templateImageUrl : undefined,
                        templateButtons: tpl.buttons?.length > 0 ? tpl.buttons : undefined,
                        actionType: 'campaign',
                        orderName: customer.name
                    });
                } else {
                    await axios.post(`${API_URL}/whatsapp/send`, {
                        phone: customer.phone,
                        textMsg: messageText.replace('[Name]', customer.name),
                        actionType: 'campaign',
                        orderName: customer.name
                    });
                }
                successCount++;
            } catch (e) {
                lastError = `${customer.name}: ${e.response?.data?.error || e.message}`;
            }
            setProgress({ current: i + 1, total: targets.length });
            if (i < targets.length - 1) await new Promise(r => setTimeout(r, 2000));
        }

        setSending(false);
        const failed = targets.length - successCount;
        if (successCount === 0) showToast((isEn ? "All sends failed! " : "فشل الإرسال! ") + (lastError || ''), "error");
        else if (failed > 0) showToast(isEn ? `Done: ${successCount} sent, ${failed} failed` : `تم: ${successCount} نجح، ${failed} فشل`, "error");
        else showToast(isEn ? `Campaign complete! ${successCount} sent.` : `تمت الحملة! ${successCount} رسالة.`, "success");
    };

    const [selectedCamp, setSelectedCamp] = React.useState(null);

    const colorPalette = ['#FF6400','#8CC850','#2D5A3D','#C4A882','#FF9B7A','#88B8B0','#A78BFA','#34D399','#F59E0B','#60A5FA'];
    const colorFor = (str) => colorPalette[(str||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % colorPalette.length];

    const allCamps = scheduledList.map(b => {
        const dt = new Date(b.scheduled_at);
        const now = new Date();
        const diffH = (now - dt) / 3600000;
        let date;
        if (b.status === 'running') date = isEn ? `Now · ${Math.round(diffH)}h running` : `الآن · منذ ${Math.round(diffH)} ساعات`;
        else if (dt > now) date = dt.toLocaleDateString(isEn?'en-US':'ar-EG',{month:'short',day:'numeric'}) + ' · ' + dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
        else if (diffH < 48) date = isEn ? 'Yesterday' : 'أمس';
        else date = dt.toLocaleDateString(isEn?'en-US':'ar-EG',{month:'short',day:'numeric'});
        const status = b.status === 'running' ? 'live' : b.status === 'pending' ? 'scheduled' : b.status === 'done' ? 'done' : 'paused';
        return { id: b.id, name: b.name, date, sent: b.sent||0, open: b.open_rate||0, reply: b.reply_rate||0, revenue: b.revenue||0, status, color: colorFor(b.name), tpl: b.template_id||'—', tplMsg: b.message_text||'' };
    });

    const liveCamps     = allCamps.filter(c => c.status === 'live');
    const pausedCamps   = allCamps.filter(c => c.status === 'paused' || c.status === 'done');
    const scheduledCamps= allCamps.filter(c => c.status === 'scheduled');
    const displayCamps  = campaignFilter === 'live' ? liveCamps : campaignFilter === 'paused' ? pausedCamps : campaignFilter === 'draft' ? scheduledCamps : allCamps;

    const totalSent    = allCamps.reduce((s,c) => s + c.sent, 0);
    const avgOpen      = allCamps.length ? (allCamps.reduce((s,c) => s + parseFloat(c.open||0), 0) / allCamps.length).toFixed(1) : '0';
    const avgReply     = allCamps.length ? (allCamps.reduce((s,c) => s + parseFloat(c.reply||0), 0) / allCamps.length).toFixed(1) : '0';
    const totalRevenue = allCamps.reduce((s,c) => s + c.revenue, 0);
    const previewCamp  = selectedCamp || allCamps[0] || null;

    return (
        <div className={`flex flex-col gap-4 animate-in fade-in duration-500 ${isEn ? 'text-left' : 'text-right'}`}>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-brand-egg">{isEn ? 'Broadcasts' : 'الحملات'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5">
                        {liveCamps.length} {isEn ? 'ACTIVE · OFFICIAL META CLOUD API' : 'نشطة · واجهة Meta Cloud الرسمية'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass-subtle border border-brand-border/30 text-xs font-bold text-brand-egg-mute hover:border-brand-accent/30 transition-all">
                        <FileText size={13} /> {isEn ? 'Templates' : 'القوالب'}
                    </button>
                    <button onClick={() => setShowScheduler(s => !s)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all" style={{background:'#FF6400',color:'white'}}>
                        <Zap size={13} /> {isEn ? 'New Broadcast' : 'حملة جديدة'}
                    </button>
                </div>
            </div>

            {/* 4 stat cards */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: isEn ? 'SENT · 30D'         : 'المُرسَل · 30 يوم', value: totalSent.toLocaleString(),                                   sub: isEn ? `${allCamps.length} campaigns` : `${allCamps.length} حملة`,  subC:'text-brand-muted' },
                    { label: isEn ? 'OPEN RATE'          : 'معدل الفتح',         value: avgOpen + '%',                                                sub: isEn ? (allCamps.length ? 'avg across campaigns' : 'no data yet') : (allCamps.length ? 'متوسط الحملات' : 'لا بيانات بعد'), subC:'text-brand-muted' },
                    { label: isEn ? 'REPLY RATE'         : 'معدل الرد',          value: avgReply + '%',                                               sub: isEn ? (allCamps.length ? 'avg across campaigns' : 'no data yet') : (allCamps.length ? 'متوسط الحملات' : 'لا بيانات بعد'), subC:'text-brand-muted' },
                    { label: isEn ? 'REVENUE ATTRIBUTED' : 'الإيرادات المحققة',  value: totalRevenue > 0 ? 'EGP ' + totalRevenue.toLocaleString() : 'EGP 0', sub: isEn ? (totalRevenue > 0 ? 'from broadcasts' : 'no revenue yet') : (totalRevenue > 0 ? 'من الحملات' : 'لا إيرادات بعد'), subC:'text-brand-muted', gold: totalRevenue > 0 },
                ].map((s,i) => (
                    <div key={i} className="glass rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-brand-muted tracking-wider">{s.label}</p>
                        <p className={`text-2xl font-black mt-1 leading-tight ${s.gold ? 'text-brand-gold' : 'text-brand-egg'}`}>{s.value}</p>
                        <p className={`text-[11px] font-bold mt-1.5 ${s.subC}`}>{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Main grid */}
            <div className="grid gap-3" style={{gridTemplateColumns:'1fr 340px'}}>

                {/* Campaigns table */}
                <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{minHeight:'400px'}}>
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border/20 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-brand-egg">{isEn ? 'Campaigns' : 'الحملات'}</span>
                            <span className="text-[10px] font-bold text-brand-muted">{isEn ? 'ALL TIME' : 'كل الوقت'}</span>
                        </div>
                        <div className="flex gap-1.5">
                            {[
                                { k:'all',    label: isEn?'All':'الكل',     count: allCamps.length },
                                { k:'live',   label: isEn?'Live':'نشط',     count: liveCamps.length,      dot:true },
                                { k:'paused', label: isEn?'Paused':'موقوف', count: pausedCamps.length },
                                { k:'draft',  label: isEn?'Draft':'مسودة',  count: scheduledCamps.length },
                            ].map(f => (
                                <button key={f.k} onClick={() => setCampaignFilter(f.k)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${campaignFilter===f.k ? 'bg-brand-accent text-brand-bg' : 'glass-subtle text-brand-muted hover:text-brand-egg'}`}>
                                    {f.dot && <span className={`w-1.5 h-1.5 rounded-full ${campaignFilter===f.k ? 'bg-brand-bg animate-pulse' : 'bg-green-400'}`}></span>}
                                    {f.label}
                                    <span className={`text-[10px] ${campaignFilter===f.k?'opacity-70':'opacity-50'}`}>· {f.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Column headers */}
                    <div className="grid px-5 py-2 border-b border-brand-border/10 shrink-0"
                         style={{gridTemplateColumns:'minmax(0,2fr) 80px 64px 64px minmax(110px,1fr) 80px'}}>
                        {[isEn?'CAMPAIGN':'الحملة','SENT',isEn?'OPEN':'الفتح',isEn?'REPLY':'الرد',isEn?'REVENUE':'الإيرادات',''].map((h,i)=>(
                            <p key={i} className={`text-[10px] font-bold text-brand-muted tracking-wider ${i>0?'text-right':''}`}>{h}</p>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-brand-border/10 overflow-y-auto custom-scrollbar flex-1">
                        {displayCamps.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3 text-brand-muted">
                                <Megaphone size={36} className="opacity-20" />
                                <p className="text-sm font-bold">{allCamps.length === 0 ? (isEn ? 'No broadcasts yet' : 'لا توجد حملات بعد') : (isEn ? 'No campaigns match this filter' : 'لا توجد حملات بهذا الفلتر')}</p>
                                {allCamps.length === 0 && <button onClick={() => setShowScheduler(true)} className="text-xs font-bold text-brand-accent hover:underline">{isEn ? '+ Create your first broadcast' : '+ أنشئ أول حملة'}</button>}
                            </div>
                        ) : displayCamps.map(c => {
                            const isSelected = previewCamp?.id === c.id;
                            const isLive = c.status === 'live' || c.status === 'running';
                            return (
                                <div key={c.id} onClick={() => setSelectedCamp(c)}
                                     className={`grid items-center px-5 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.03] ${isSelected ? 'bg-brand-accent/5 border-l-2 border-brand-accent' : ''}`}
                                     style={{gridTemplateColumns:'minmax(0,2fr) 80px 64px 64px minmax(110px,1fr) 80px'}}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-xl shrink-0 flex-none" style={{background: c.color||'#8CC850'}}></div>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-brand-egg leading-tight truncate">{c.name}</p>
                                            <p className="text-[11px] text-brand-muted">{c.date}</p>
                                        </div>
                                    </div>
                                    <p className="text-right text-[13px] font-bold text-brand-egg">{(c.sent||0).toLocaleString()}</p>
                                    <p className={`text-right text-[13px] font-bold ${parseFloat(c.open||0)>=80?'text-brand-accent':parseFloat(c.open||0)>=60?'text-brand-gold':'text-brand-muted'}`}>{c.open}%</p>
                                    <p className={`text-right text-[13px] font-bold ${parseFloat(c.reply||0)>=30?'text-brand-accent':parseFloat(c.reply||0)>=15?'text-brand-gold':'text-brand-muted'}`}>{c.reply}%</p>
                                    <p className="text-right text-[13px] font-bold text-brand-gold">EGP {(c.revenue||0).toLocaleString()}</p>
                                    <div className="flex justify-end">
                                        {isLive ? (
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 whitespace-nowrap">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0"></span>
                                                {isEn ? 'Live' : 'نشط'}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-border/20 text-brand-muted border border-brand-border/30 whitespace-nowrap">
                                                ❚❚ {isEn ? 'Paused' : 'موقوف'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Composer preview panel */}
                <div className="glass rounded-2xl flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-brand-border/20 shrink-0 flex items-center justify-between">
                        <span className="text-[12px] font-black text-brand-egg">{isEn ? 'Composer preview' : 'معاينة الحملة'}</span>
                        <span className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">
                            {previewCamp ? ((previewCamp.status==='scheduled'?(isEn?'DRAFT':'مسودة'):(isEn?'SENT':'أُرسلت')) + ' · ' + previewCamp.name.slice(0,14)) : (isEn?'NO CAMPAIGN':'لا توجد حملة')}
                        </span>
                    </div>

                    {!previewCamp ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-brand-muted p-6 text-center">
                            <Megaphone size={40} className="opacity-20" />
                            <p className="text-sm font-bold">{isEn ? 'Create a broadcast to see the preview' : 'أنشئ حملة لترى المعاينة'}</p>
                            <button onClick={() => setShowScheduler(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-brand-bg transition-all" style={{background:'#FF6400'}}>
                                <Zap size={12} className="inline mr-1" />{isEn ? 'New Broadcast' : 'حملة جديدة'}
                            </button>
                        </div>
                    ) : (<>
                    <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                        <div className="rounded-2xl overflow-hidden border border-brand-border/20" style={{background:'#081A10'}}>
                            {/* WA business header */}
                            <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-brand-border/10">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0"
                                     style={{background: previewCamp?.color||'#FF6400'}}>LH</div>
                                <div>
                                    <p className="text-[12px] font-bold text-brand-egg">{isEn ? 'Linenhouse Cairo' : 'لينن هاوس القاهرة'}</p>
                                    <p className="text-[10px] text-brand-muted">{isEn ? 'business · verified ✓' : 'نشاط تجاري · موثق ✓'}</p>
                                </div>
                            </div>
                            {/* Message bubble */}
                            <div className="p-3">
                                <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                                    <div className="w-full h-28 flex items-end p-3 relative" style={{background: previewCamp?.color||'#FF6400'}}>
                                        <p className="text-white font-black text-sm tracking-wider leading-tight opacity-95">
                                            {(previewCamp?.name||'').toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="px-3 py-2.5">
                                        <p className="text-[12px] text-brand-egg leading-relaxed whitespace-pre-line">
                                            {previewCamp?.tplMsg || previewCamp?.name || ''}
                                        </p>
                                        <p className="text-[10px] text-brand-muted text-right mt-1.5">14:02 ✓✓</p>
                                    </div>
                                    <div className="border-t border-brand-border/20 divide-y divide-brand-border/15">
                                        <button className="w-full py-2.5 text-[12px] font-bold text-brand-accent hover:bg-brand-accent/5 transition-colors">
                                            {previewCamp?.btn1||'—'}
                                        </button>
                                        <button className="w-full py-2.5 text-[12px] font-bold text-brand-accent hover:bg-brand-accent/5 transition-colors">
                                            {previewCamp?.btn2||'—'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-brand-border/20 shrink-0">
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {[
                                { label: isEn?'Audience':'الجمهور', value: (previewCamp?.sent||0).toLocaleString() },
                                { label: isEn?'Template':'القالب',  value: previewCamp?.tpl||'—' },
                                { label: isEn?'Cost':'التكلفة',    value: '$'+Math.round((previewCamp?.sent||0)*0.014) },
                            ].map((f,i) => (
                                <div key={i} className="glass-subtle rounded-xl p-2.5 text-center">
                                    <p className="text-[10px] text-brand-muted font-bold">{f.label}</p>
                                    <p className="text-[12px] font-black text-brand-egg mt-0.5 truncate">{f.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSchedule} disabled={scheduling}
                                className="flex-1 py-2.5 rounded-xl border border-brand-border/30 text-[12px] font-bold text-brand-muted hover:text-brand-egg hover:border-brand-accent/30 transition-all">
                                {scheduling ? '...' : (isEn ? 'Save draft' : 'حفظ مسودة')}
                            </button>
                            <button onClick={startCampaign} disabled={sending}
                                className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                                style={{background:'#FF6400'}}>
                                <Zap size={12} />
                                {sending ? (isEn ? 'Sending...' : 'جاري...') : (isEn ? 'Schedule blast' : 'جدولة الحملة')}
                            </button>
                        </div>
                    </div>
                    </>)}
                </div>
            </div>
        </div>
    );
};


const QuickRepliesManager = ({ showToast, lang }) => {
    const isEn = lang === 'en';
    const [list, setList] = React.useState([]);
    const [selectedGroup, setSelectedGroup] = React.useState('__all__');
    const [langFilter, setLangFilter] = React.useState('all');
    const [selectedSnippet, setSelectedSnippet] = React.useState(null);
    const [form, setForm] = React.useState({ shortcut: '', name: '', text: '', group: '' });
    const [saving, setSaving] = React.useState(false);
    const [showNewGroupInput, setShowNewGroupInput] = React.useState(false);
    const [newGroupName, setNewGroupName] = React.useState('');

    const isArabic = (str) => /[؀-ۿ]/.test(str || '');

    useEffect(() => {
        axios.get(`${API_URL}/quick-replies`)
            .then(r => setList(Array.isArray(r.data) ? r.data : []))
            .catch(() => {});
    }, []);

    // Derive groups from real data
    const groups = React.useMemo(() => {
        const map = {};
        list.forEach(r => {
            const g = r.group || (isEn ? 'General' : 'عام');
            map[g] = (map[g] || 0) + 1;
        });
        return Object.entries(map).map(([label, count]) => ({ label, count }));
    }, [list, isEn]);

    const filtered = React.useMemo(() => {
        return list.filter(r => {
            const groupMatch = selectedGroup === '__all__' || (r.group || (isEn ? 'General' : 'عام')) === selectedGroup;
            const ar = isArabic(r.text);
            const langMatch = langFilter === 'all' || (langFilter === 'ar' ? ar : !ar);
            return groupMatch && langMatch;
        });
    }, [list, selectedGroup, langFilter, isEn]);

    const handleSelect = (r) => {
        setSelectedSnippet(r.id);
        setForm({ shortcut: r.shortcut || r.title || '', name: r.name || r.title || '', text: r.text || '', group: r.group || '' });
    };

    const handleNew = () => {
        setSelectedSnippet(null);
        setForm({ shortcut: '', name: '', text: '', group: selectedGroup === '__all__' ? '' : selectedGroup });
    };

    const handleSave = async () => {
        if (!form.shortcut.trim() || !form.text.trim()) return showToast(isEn ? 'Shortcut and message are required' : 'الاختصار والرسالة مطلوبان', 'error');
        setSaving(true);
        try {
            const payload = { title: form.shortcut.trim(), name: form.name.trim() || form.shortcut.trim(), text: form.text, group: form.group };
            if (selectedSnippet) {
                const res = await axios.put(`${API_URL}/quick-replies/${selectedSnippet}`, payload);
                setList(p => p.map(r => r.id === selectedSnippet ? { ...r, ...res.data } : r));
                showToast(isEn ? 'Updated!' : 'تم التحديث!');
            } else {
                const res = await axios.post(`${API_URL}/quick-replies`, payload);
                setList(p => [...p, res.data]);
                setSelectedSnippet(res.data.id);
                showToast(isEn ? 'Snippet saved!' : 'تم حفظ الرد!');
            }
        } catch (e) { showToast(e.response?.data?.error || (isEn ? 'Failed to save' : 'فشل الحفظ'), 'error'); }
        setSaving(false);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await axios.delete(`${API_URL}/quick-replies/${id}`);
            setList(p => p.filter(r => r.id !== id));
            if (selectedSnippet === id) { setSelectedSnippet(null); setForm({ shortcut: '', name: '', text: '', group: '' }); }
            showToast(isEn ? 'Deleted' : 'تم الحذف');
        } catch { showToast(isEn ? 'Delete failed' : 'فشل الحذف', 'error'); }
    };

    const handleAddGroup = () => {
        if (!newGroupName.trim()) return;
        setSelectedGroup(newGroupName.trim());
        setShowNewGroupInput(false);
        setNewGroupName('');
    };

    const varChips = ['{name}', '{order_id}', '{total}', '{tracking_url}', '{shop_name}'];

    const activeSnippet = list.find(r => r.id === selectedSnippet);

    return (
        <div className={`animate-in fade-in duration-500 ${isEn ? 'text-left' : 'text-right'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Quick Replies' : 'الردود السريعة'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5 uppercase">
                        {list.length} {isEn ? 'SNIPPETS · BILINGUAL · KEYBOARD SHORTCUTS' : 'رد · ثنائي اللغة · اختصارات'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold glass border border-brand-border/30 text-brand-muted hover:text-brand-egg transition-all">
                        <Sparkles size={12} /> {isEn ? 'AI-suggest new' : 'اقتراح AI'}
                    </button>
                    <button onClick={handleNew}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{background:'#FF6B35',color:'#fff'}}>
                        <Plus size={13} /> {isEn ? 'New snippet' : 'رد جديد'}
                    </button>
                </div>
            </div>

            {/* 3-column grid */}
            <div className="grid gap-3" style={{gridTemplateColumns:'200px 1fr 320px', minHeight:'520px'}}>

                {/* LEFT: Groups */}
                <div className="flex flex-col gap-2">
                    <div className="glass rounded-2xl p-3 space-y-0.5 flex-1">
                        <p className="text-[10px] font-bold text-brand-muted tracking-wider px-2 pb-2 uppercase">{isEn ? 'Groups' : 'المجموعات'}</p>

                        <button onClick={() => setSelectedGroup('__all__')}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-bold transition-all ${selectedGroup === '__all__' ? 'bg-brand-accent/15 text-brand-accent' : 'text-brand-muted hover:text-brand-egg hover:bg-white/5'}`}>
                            <span>{isEn ? 'All snippets' : 'الكل'}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedGroup === '__all__' ? 'bg-brand-accent/20 text-brand-accent' : 'bg-brand-border/30 text-brand-muted'}`}>{list.length}</span>
                        </button>

                        {groups.map(g => (
                            <button key={g.label} onClick={() => setSelectedGroup(g.label)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-bold transition-all ${selectedGroup === g.label ? 'bg-brand-accent/15 text-brand-accent' : 'text-brand-muted hover:text-brand-egg hover:bg-white/5'}`}>
                                <span className="truncate text-left">{g.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${selectedGroup === g.label ? 'bg-brand-accent/20 text-brand-accent' : 'bg-brand-border/30 text-brand-muted'}`}>{g.count}</span>
                            </button>
                        ))}

                        <div className="border-t border-brand-border/20 pt-2 mt-2">
                            {showNewGroupInput ? (
                                <div className="flex gap-1 px-2">
                                    <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                                        placeholder={isEn ? 'Group name' : 'اسم المجموعة'}
                                        className="flex-1 bg-brand-input border border-brand-border/30 rounded-lg px-2 py-1 text-[11px] outline-none text-brand-egg" autoFocus />
                                    <button onClick={handleAddGroup} className="text-brand-accent text-[11px] font-bold px-1">+</button>
                                </div>
                            ) : (
                                <button onClick={() => setShowNewGroupInput(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-brand-muted hover:text-brand-accent transition-all">
                                    <Plus size={12} /> {isEn ? 'New Group' : 'مجموعة جديدة'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tip box */}
                    <div className="glass rounded-2xl p-3 border border-brand-accent/10">
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[9px] font-black tracking-widest text-brand-accent uppercase px-1.5 py-0.5 rounded-md" style={{background:'rgba(140,200,80,0.15)'}}>TIP</span>
                        </div>
                        <p className="text-[11px] text-brand-muted leading-relaxed">
                            {isEn ? 'Type / in any chat to quickly insert a saved snippet.' : 'اكتب / في أي محادثة لإدراج رد سريع محفوظ.'}
                        </p>
                    </div>
                </div>

                {/* MIDDLE: Snippets list */}
                <div className="glass rounded-2xl overflow-hidden flex flex-col">
                    {/* Middle header */}
                    <div className="px-4 py-3 border-b border-brand-border/20 flex items-center justify-between gap-3">
                        <div>
                            <span className="text-[13px] font-black text-brand-egg">
                                {selectedGroup === '__all__' ? (isEn ? 'All snippets' : 'الكل') : selectedGroup}
                                {' '}
                                <span className="text-brand-muted font-bold">· {filtered.length}</span>
                            </span>
                            <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase mt-0.5">{isEn ? 'MOST USED FIRST' : 'الأكثر استخداماً'}</p>
                        </div>
                        <div className="flex items-center gap-1 glass-subtle rounded-xl p-1 border border-brand-border/20">
                            {[['all', 'All'], ['en', 'EN'], ['ar', 'عربي']].map(([v, label]) => (
                                <button key={v} onClick={() => setLangFilter(v)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${langFilter === v ? 'bg-brand-accent text-brand-bg' : 'text-brand-muted hover:text-brand-egg'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Snippet rows */}
                    <div className="divide-y divide-brand-border/10 overflow-y-auto flex-1 custom-scrollbar">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-brand-muted">
                                <MessageSquareQuote size={36} className="mb-3 opacity-20" />
                                <p className="text-sm font-bold">{isEn ? 'No snippets yet' : 'لا توجد ردود بعد'}</p>
                                <button onClick={handleNew} className="mt-3 text-brand-accent text-xs font-bold hover:underline">
                                    + {isEn ? 'Create first snippet' : 'أنشئ أول رد'}
                                </button>
                            </div>
                        ) : filtered.map(r => {
                            const ar = isArabic(r.text);
                            const shortcut = r.shortcut || r.title || '';
                            const displayName = r.name || r.title || shortcut;
                            const isSelected = selectedSnippet === r.id;
                            return (
                                <div key={r.id} onClick={() => handleSelect(r)}
                                    className={`flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer ${isSelected ? 'bg-brand-accent/5 border-l-2 border-brand-accent' : ''}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[12px] font-black text-brand-accent">/{shortcut}</span>
                                            <span className="text-[13px] font-bold text-brand-egg truncate">{displayName}</span>
                                            {ar && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{background:'rgba(255,107,53,0.15)',color:'#FF6B35'}}>AR</span>}
                                        </div>
                                        <p className="text-[11px] text-brand-muted leading-relaxed line-clamp-2" dir={ar ? 'rtl' : 'ltr'}>{r.text}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                                        {(r.used_count > 0) && <span className="text-[10px] text-brand-muted font-bold">{r.used_count}× used</span>}
                                        <button onClick={e => handleDelete(r.id, e)}
                                            className="text-brand-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: Edit panel */}
                <div className="glass rounded-2xl flex flex-col overflow-hidden self-start">
                    <div className="px-4 py-3 border-b border-brand-border/20 flex items-center justify-between">
                        <span className="text-[13px] font-black text-brand-egg">
                            {selectedSnippet
                                ? <>{isEn ? 'Edit snippet' : 'تعديل الرد'} <span className="text-brand-accent">/{form.shortcut}</span></>
                                : (isEn ? 'New snippet' : 'رد جديد')}
                        </span>
                        {selectedSnippet && (
                            <button onClick={() => { setSelectedSnippet(null); setForm({ shortcut: '', name: '', text: '', group: '' }); }}
                                className="text-brand-muted hover:text-brand-egg text-xs transition-colors">✕</button>
                        )}
                    </div>

                    <div className="p-4 space-y-4 flex-1">
                        {/* Shortcut */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'Shortcut' : 'الاختصار'}</label>
                            <div className="flex items-center gap-2 bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2">
                                <span className="text-brand-accent font-black text-sm shrink-0">/</span>
                                <input value={form.shortcut} onChange={e => setForm(p => ({ ...p, shortcut: e.target.value.replace(/\s/g,'') }))}
                                    placeholder="confirmed"
                                    className="flex-1 bg-transparent text-xs outline-none text-brand-egg" dir="ltr" />
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'Title' : 'العنوان'}</label>
                            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder={isEn ? 'Order confirmed' : 'تأكيد الطلب'}
                                className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none text-brand-egg" />
                        </div>

                        {/* Group */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'Group' : 'المجموعة'}</label>
                            <input value={form.group} onChange={e => setForm(p => ({ ...p, group: e.target.value }))}
                                list="group-suggestions"
                                placeholder={isEn ? 'e.g. Order status' : 'مثال: حالة الطلب'}
                                className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none text-brand-egg" />
                            <datalist id="group-suggestions">
                                {groups.map(g => <option key={g.label} value={g.label} />)}
                            </datalist>
                        </div>

                        {/* Message */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'Message' : 'الرسالة'}</label>
                            <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                                placeholder={isEn ? 'Hi {name}! Your order #{order_id} is confirmed...' : 'مرحباً {name}! تم تأكيد طلبك...'}
                                rows={5} className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2.5 text-xs focus:border-brand-accent outline-none resize-none custom-scrollbar text-brand-egg" />
                        </div>

                        {/* Variable chips */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'Insert variable' : 'إدراج متغير'}</label>
                            <div className="flex flex-wrap gap-1.5">
                                {varChips.map(chip => (
                                    <button key={chip} onClick={() => setForm(p => ({ ...p, text: p.text + chip }))}
                                        className="px-2.5 py-1 rounded-lg glass-subtle border border-brand-accent/20 text-[11px] font-bold text-brand-accent hover:bg-brand-accent/10 transition-all">
                                        + {chip}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-brand-border/20 flex items-center justify-between gap-2">
                        {activeSnippet?.used_count > 0 ? (
                            <span className="text-[10px] text-brand-muted font-bold uppercase">USED {activeSnippet.used_count}× · LAST 30d</span>
                        ) : <span />}
                        <button onClick={handleSave} disabled={saving}
                            className="px-5 py-2 rounded-xl text-[12px] font-bold text-brand-bg transition-all disabled:opacity-50"
                            style={{background:'#8CC850'}}>
                            {saving ? '...' : (isEn ? 'Save' : 'حفظ')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TRIGGER_TYPES = [
    { value: 'order_created', label: 'طلب جديد (شوبيفاي)', labelEn: 'New Order Created' },
    { value: 'order_status_changed', label: 'تغيير حالة الطلب', labelEn: 'Order Status Changed' },
    { value: 'keyword_received', label: 'كلمة مفتاحية واردة', labelEn: 'Keyword Received' },
    { value: 'new_message', label: 'أي رسالة جديدة', labelEn: 'Any New Message' },
];

const STATUS_VALUES = [
    { value: 'followed_up', label: 'تمت المتابعة', labelEn: 'Followed Up' },
    { value: 'confirmed', label: 'تم التأكيد', labelEn: 'Confirmed' },
    { value: 'shipped', label: 'تم الشحن', labelEn: 'Shipped' },
    { value: 'cancelled', label: 'ملغى', labelEn: 'Cancelled' },
];

const emptyAuto = () => ({
    name: '',
    trigger: { type: 'order_status_changed', value: 'shipped' },
    steps: [{ wait_hours: 0, action: 'send_text', text: 'مرحباً {{customer_name}}، ' }],
});


const AutomationsManager = ({ templates, showToast, lang }) => {
    const isEn = lang === 'en';
    const [automations, setAutomations] = useState([]);
    const [queue, setQueue] = useState([]);
    const [saving, setSaving] = useState(false);
    const [selectedFlow, setSelectedFlow] = React.useState(null);
    const [selectedStep, setSelectedStep] = React.useState(null);
    const [showNewModal, setShowNewModal] = React.useState(false);
    const [newForm, setNewForm] = React.useState({ name: '', trigger: 'order_created' });

    const fetchData = async () => {
        try {
            const [ar, qr] = await Promise.all([
                axios.get(`${API_URL}/automations`),
                axios.get(`${API_URL}/automations/queue`)
            ]);
            setAutomations(Array.isArray(ar.data) ? ar.data : []);
            setQueue(Array.isArray(qr.data) ? qr.data : []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleToggle = async (id) => {
        try {
            await axios.patch(`${API_URL}/automations/${id}/toggle`);
            await fetchData();
        } catch (e) { showToast(isEn ? 'Toggle failed' : 'فشل التبديل', 'error'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(isEn ? 'Delete this flow?' : 'حذف هذا الفلو؟')) return;
        try {
            await axios.delete(`${API_URL}/automations/${id}`);
            if (selectedFlow?.id === id) setSelectedFlow(null);
            await fetchData();
            showToast(isEn ? 'Deleted' : 'تم الحذف');
        } catch (e) { showToast(isEn ? 'Delete failed' : 'فشل الحذف', 'error'); }
    };

    const handleCreate = async () => {
        if (!newForm.name.trim()) return showToast(isEn ? 'Name required' : 'الاسم مطلوب', 'error');
        setSaving(true);
        try {
            await axios.post(`${API_URL}/automations`, {
                name: newForm.name,
                trigger: { type: newForm.trigger, value: '' },
                steps: [{ wait_hours: 0, action: 'send_text', text: '' }]
            });
            await fetchData();
            setShowNewModal(false);
            setNewForm({ name: '', trigger: 'order_created' });
            showToast(isEn ? 'Flow created!' : 'تم إنشاء الفلو!');
        } catch (e) { showToast(isEn ? 'Failed to create' : 'فشل الإنشاء', 'error'); }
        setSaving(false);
    };

    // Build flow steps based on trigger type (for visual canvas)
    const getFlowSteps = (auto) => {
        const trig = auto?.trigger?.type || 'order_created';
        if (trig === 'order_created' || trig === 'order_status_changed') return [
            { id:'s1', type:'TRIGGER', icon:'⚡', color:'#FF6400', title: isEn?'Trigger':'المشغّل',        sub: isEn?'New Shopify order':'طلب شوبيفاي جديد',      tpl:null,          lang:null,  vars:null,        btns:null,        sendAt:null, delivered:null, seen:null },
            { id:'s2', type:'ACTION',  icon:'💬', color:'#8CC850', title: isEn?'Send WA':'إرسال WA',        sub: isEn?'Template · t_confirm_25 with buttons':'قالب · t_confirm_25 مع أزرار', tpl:'t_confirm_25', lang:'ar + en', vars:'{name} · {order_id} · {total}', btns:'2 quick-reply', sendAt:isEn?'Immediately':'فوراً', delivered:'99.4%', seen:'84%' },
            { id:'s3', type:'BRANCH',  icon:'🔀', color:'#60A5FA', title: isEn?'Wait for reply':'انتظر رد', sub: isEn?'If confirmed · 24h':'إذا أُكد · 24 ساعة',  tpl:null,          lang:null,  vars:null,        btns:null,        sendAt:null, delivered:'91%', seen:null },
            { id:'s4', type:'ACTION',  icon:'✅', color:'#8CC850', title: isEn?'Mark confirmed':'تأكيد الطلب', sub: isEn?'Update Shopify status · Tag VIP':'تحديث حالة شوبيفاي · وسم VIP', tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:null, seen:null },
            { id:'s5', type:'ACTION',  icon:'⭐', color:'#F59E0B', title: isEn?'Award loyalty':'نقاط ولاء',  sub: isEn?'+ {total /10} points':'+ {total /10} نقطة', tpl:null,          lang:null,  vars:null,        btns:null,        sendAt:null, delivered:null, seen:null },
            { id:'s6', type:'ACTION',  icon:'🚚', color:'#8CC850', title: isEn?'Trigger ship flow':'تشغيل فلو الشحن', sub: isEn?'Hand off to fulfilment':'تحويل للتوصيل', tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:null, seen:null },
        ];
        if (trig === 'keyword_received') return [
            { id:'s1', type:'TRIGGER', icon:'⚡', color:'#FF6400', title: isEn?'Trigger':'المشغّل',          sub: isEn?'Keyword received':'كلمة مفتاحية',          tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:null, seen:null },
            { id:'s2', type:'ACTION',  icon:'💬', color:'#8CC850', title: isEn?'Send WA reply':'إرسال رد WA',  sub: isEn?'Auto-reply template':'قالب رد تلقائي',     tpl:'t_keyword_01', lang:'ar + en', vars:'{name}', btns:'1 quick-reply', sendAt:isEn?'Immediately':'فوراً', delivered:'97%', seen:'79%' },
            { id:'s3', type:'ACTION',  icon:'🏷️', color:'#A78BFA', title: isEn?'Tag contact':'وسم جهة الاتصال', sub: isEn?'Tag: interested':'وسم: مهتم',           tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:null, seen:null },
        ];
        return [
            { id:'s1', type:'TRIGGER', icon:'⚡', color:'#FF6400', title: isEn?'Trigger':'المشغّل',          sub: isEn?'New message received':'رسالة جديدة',        tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:null, seen:null },
            { id:'s2', type:'ACTION',  icon:'🧠', color:'#8CC850', title: isEn?'Classify intent':'تصنيف النية', sub: isEn?'AI intent detection':'كشف النية بالذكاء', tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:'95%', seen:null },
            { id:'s3', type:'ACTION',  icon:'👤', color:'#34D399', title: isEn?'Route to agent':'توجيه لموظف', sub: isEn?'Assign to available agent':'توجيه لموظف متاح', tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:null, seen:null },
        ];
    };

    const liveFlows   = automations.filter(a => a.enabled);
    const flowSteps   = selectedFlow ? getFlowSteps(selectedFlow) : [];
    const activeStep  = selectedStep || (flowSteps[1] || null);
    const stepIndex   = flowSteps.findIndex(s => s.id === activeStep?.id);
    const triggerLabels = {
        order_created:        isEn ? 'ORDER PLACED → CONFIRM → SHIP → FOLLOW UP' : 'طلب → تأكيد → شحن → متابعة',
        order_status_changed: isEn ? 'STATUS CHANGE → NOTIFY → TAG → FOLLOW UP'  : 'تغيير حالة → إشعار → وسم → متابعة',
        keyword_received:     isEn ? 'KEYWORD → REPLY → TAG → QUALIFY'            : 'كلمة مفتاحية → رد → وسم → تأهيل',
        new_message:          isEn ? 'MESSAGE → CLASSIFY → ROUTE → RESPOND'       : 'رسالة → تصنيف → توجيه → رد',
    };
    const flowBreadcrumb = selectedFlow
        ? (triggerLabels[selectedFlow.trigger?.type] || triggerLabels.order_created)
        : '';
    const runCount = (a) => queue.filter(q => q.automation_id === a.id).length || a.runs || 0;

    return (
        <div className={`flex flex-col gap-3 animate-in fade-in duration-500 ${isEn ? 'text-left' : 'text-right'}`} style={{height:'calc(100vh - 120px)'}}>

            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-brand-egg">{isEn ? 'Automations' : 'الأتمتة'}</h2>
                    <p className="text-[11px] font-bold tracking-wider mt-0.5" style={{color:'#8CC850'}}>
                        {flowBreadcrumb || (isEn ? 'SELECT A FLOW TO VIEW CANVAS' : 'اختر فلو لعرض اللوحة')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        {liveFlows.length} {isEn ? 'active' : 'نشط'}
                    </span>
                    <button onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{background:'#FF6400', color:'white'}}>
                        <Zap size={13} /> {isEn ? 'New flow' : 'فلو جديد'}
                    </button>
                </div>
            </div>

            {/* 3-column layout */}
            <div className="grid flex-1 gap-3 min-h-0" style={{gridTemplateColumns:'220px 1fr 300px'}}>

                {/* ── Left: Flows list ── */}
                <div className="glass rounded-2xl flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-brand-border/20 shrink-0">
                        <span className="text-sm font-black text-brand-egg">{isEn ? 'Flows' : 'الفلوز'} </span>
                        <span className="text-[11px] text-brand-muted font-bold">{liveFlows.length} / {automations.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-brand-border/10">
                        {automations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center text-brand-muted">
                                <Zap size={32} className="opacity-20" />
                                <p className="text-xs font-bold">{isEn ? 'No flows yet' : 'لا توجد فلوز بعد'}</p>
                                <button onClick={() => setShowNewModal(true)}
                                    className="text-xs font-bold text-brand-accent hover:underline">
                                    + {isEn ? 'Create first flow' : 'أنشئ أول فلو'}
                                </button>
                            </div>
                        ) : automations.map(a => {
                            const isSelected = selectedFlow?.id === a.id;
                            const runs = runCount(a);
                            return (
                                <div key={a.id} onClick={() => { setSelectedFlow(a); setSelectedStep(null); }}
                                     className={`px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors ${isSelected ? 'bg-brand-accent/5 border-l-2 border-brand-accent' : ''}`}>
                                    <div className="flex items-start justify-between gap-1">
                                        <p className={`text-[13px] font-bold leading-tight ${isSelected ? 'text-brand-egg' : 'text-brand-egg-mute'}`}>{a.name}</p>
                                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${a.enabled ? 'bg-green-400' : 'bg-brand-border'}`}></span>
                                    </div>
                                    <p className="text-[11px] text-brand-muted mt-0.5">{runs.toLocaleString()} {isEn ? 'runs · 30d' : 'تشغيل · 30 يوم'}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Middle: Visual canvas ── */}
                <div className="glass rounded-2xl flex flex-col overflow-hidden">
                    {selectedFlow ? (<>
                        {/* Canvas header */}
                        <div className="px-5 py-3 border-b border-brand-border/20 shrink-0 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-brand-muted tracking-wider">
                                    {selectedFlow.name.toUpperCase()} · v1 · {selectedFlow.enabled ? (isEn?'LIVE':'مباشر') : (isEn?'PAUSED':'موقوف')}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleToggle(selectedFlow.id)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${selectedFlow.enabled ? 'border-brand-gold/40 text-brand-gold bg-brand-gold/10' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
                                    {selectedFlow.enabled ? (isEn?'Pause':'إيقاف') : (isEn?'Activate':'تفعيل')}
                                </button>
                                <button onClick={() => handleDelete(selectedFlow.id)}
                                    className="px-3 py-1 rounded-full text-[11px] font-bold border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
                                    {isEn?'Delete':'حذف'}
                                </button>
                            </div>
                        </div>

                        {/* Flow canvas */}
                        <div className="flex-1 overflow-auto custom-scrollbar p-6" style={{background:'rgba(0,0,0,0.15)'}}>
                            {/* Row 1: steps 1-3 */}
                            <div className="flex items-center gap-0 mb-8">
                                {flowSteps.slice(0, 3).map((step, idx) => (
                                    <React.Fragment key={step.id}>
                                        {idx > 0 && (
                                            <div className="flex items-center shrink-0 px-1">
                                                <div className="flex items-center gap-0.5 text-brand-muted text-[11px]">
                                                    <span style={{letterSpacing:'-2px'}}>·····</span>
                                                    <span>→</span>
                                                </div>
                                            </div>
                                        )}
                                        <div onClick={() => setSelectedStep(step)}
                                             className={`cursor-pointer rounded-2xl p-4 transition-all shrink-0 w-[155px] ${activeStep?.id === step.id ? 'ring-2 ring-brand-accent' : 'hover:bg-white/5'}`}
                                             style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)'}}>
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded"
                                                      style={{background: step.color + '22', color: step.color}}>
                                                    {step.type}
                                                </span>
                                            </div>
                                            <p className="text-xs font-black text-brand-egg leading-tight">{step.title}</p>
                                            <p className="text-[11px] text-brand-muted mt-1 leading-snug">{step.sub}</p>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Branch arrow down */}
                            {flowSteps.length > 3 && (
                                <div className="flex ml-[77px] mb-3">
                                    <div className="flex flex-col items-center text-brand-muted text-[11px]">
                                        <span>·</span><span>·</span><span>·</span>
                                        <span>↓</span>
                                    </div>
                                </div>
                            )}

                            {/* Row 2: steps 4-6 */}
                            {flowSteps.length > 3 && (
                                <div className="flex items-center gap-0 ml-[40px]">
                                    {flowSteps.slice(3).map((step, idx) => (
                                        <React.Fragment key={step.id}>
                                            {idx > 0 && (
                                                <div className="flex items-center shrink-0 px-1">
                                                    <div className="flex items-center gap-0.5 text-brand-muted text-[11px]">
                                                        <span style={{letterSpacing:'-2px'}}>·····</span>
                                                        <span>→</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div onClick={() => setSelectedStep(step)}
                                                 className={`cursor-pointer rounded-2xl p-4 transition-all shrink-0 w-[155px] ${activeStep?.id === step.id ? 'ring-2 ring-brand-accent' : 'hover:bg-white/5'}`}
                                                 style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)'}}>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded"
                                                          style={{background: step.color + '22', color: step.color}}>
                                                        {step.type}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-black text-brand-egg leading-tight">{step.title}</p>
                                                <p className="text-[11px] text-brand-muted mt-1 leading-snug">{step.sub}</p>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-brand-muted p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-2">
                                <Zap size={28} className="opacity-30" />
                            </div>
                            <p className="text-sm font-bold text-brand-egg-mute">{isEn ? 'Select a flow to view its canvas' : 'اختر فلو لعرض لوحته'}</p>
                            <p className="text-xs">{isEn ? 'Or create a new flow to get started.' : 'أو أنشئ فلو جديد للبدء.'}</p>
                        </div>
                    )}
                </div>

                {/* ── Right: Step properties ── */}
                <div className="glass rounded-2xl flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-brand-border/20 shrink-0">
                        <span className="text-[12px] font-black text-brand-egg">{isEn ? 'Step properties' : 'خصائص الخطوة'} </span>
                        {activeStep && <span className="text-[10px] font-bold text-brand-muted">{stepIndex + 1} {isEn ? 'OF' : 'من'} {flowSteps.length}</span>}
                    </div>

                    {activeStep ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                            <div>
                                <p className="text-[11px] font-black text-brand-egg">{isEn ? 'Send WhatsApp template' : 'إرسال قالب واتساب'}</p>
                            </div>
                            {[
                                { label: isEn?'TEMPLATE':'القالب',  value: activeStep.tpl },
                                { label: isEn?'LANGUAGE':'اللغة',   value: activeStep.lang },
                                { label: isEn?'VARIABLES':'المتغيرات', value: activeStep.vars },
                                { label: isEn?'BUTTONS':'الأزرار',  value: activeStep.btns },
                                { label: isEn?'SEND AT':'الإرسال في', value: activeStep.sendAt },
                            ].filter(f => f.value).map((f,i) => (
                                <div key={i}>
                                    <p className="text-[9px] font-bold text-brand-muted tracking-wider mb-1">{f.label}</p>
                                    <div className="px-3 py-2 rounded-xl text-[12px] font-bold text-brand-egg"
                                         style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)'}}>
                                        {f.value}
                                    </div>
                                </div>
                            ))}

                            {(activeStep.delivered || activeStep.seen) && (
                                <div>
                                    <p className="text-[9px] font-bold text-brand-muted tracking-wider mb-2">{isEn ? 'STEP STATS · 30D' : 'إحصائيات الخطوة · 30 يوم'}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeStep.delivered && (
                                            <div className="glass-subtle rounded-xl p-3 text-center">
                                                <p className="text-[9px] font-bold text-brand-muted mb-1">{isEn?'DELIVERED':'تم الإرسال'}</p>
                                                <p className="text-xl font-black text-brand-egg">{activeStep.delivered}</p>
                                            </div>
                                        )}
                                        {activeStep.seen && (
                                            <div className="glass-subtle rounded-xl p-3 text-center">
                                                <p className="text-[9px] font-bold text-brand-muted mb-1">{isEn?'SEEN':'شُوهد'}</p>
                                                <p className="text-xl font-black text-brand-egg">{activeStep.seen}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-1">
                                <button className="flex-1 py-2 rounded-xl border border-brand-border/30 text-[12px] font-bold text-brand-muted hover:text-brand-egg hover:border-brand-accent/30 transition-all">
                                    {isEn ? 'Test step' : 'اختبار'}
                                </button>
                                <button className="flex-1 py-2 rounded-xl text-[12px] font-bold text-brand-bg transition-all"
                                        style={{background:'#8CC850'}}>
                                    {isEn ? 'Save' : 'حفظ'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-brand-muted p-4 text-center">
                            <p className="text-xs font-bold">{selectedFlow ? (isEn?'Click a node to see its properties':'اضغط على خطوة لعرض خصائصها') : (isEn?'Select a flow first':'اختر فلو أولاً')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New flow modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowNewModal(false)}>
                    <div className="glass rounded-2xl p-6 w-80 space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-black text-brand-egg">{isEn ? 'New Flow' : 'فلو جديد'}</h3>
                        <div>
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider">{isEn?'FLOW NAME':'اسم الفلو'}</label>
                            <input value={newForm.name} onChange={e => setNewForm(p=>({...p,name:e.target.value}))}
                                placeholder={isEn?'e.g. Order confirmation':'مثال: تأكيد الطلب'}
                                className="w-full mt-1 bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-accent text-brand-egg" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider">{isEn?'TRIGGER':'المشغّل'}</label>
                            <select value={newForm.trigger} onChange={e => setNewForm(p=>({...p,trigger:e.target.value}))}
                                className="w-full mt-1 bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2 text-sm outline-none text-brand-egg">
                                <option value="order_created">{isEn?'New Order Created':'طلب جديد'}</option>
                                <option value="order_status_changed">{isEn?'Order Status Changed':'تغيير حالة الطلب'}</option>
                                <option value="keyword_received">{isEn?'Keyword Received':'كلمة مفتاحية'}</option>
                                <option value="new_message">{isEn?'Any New Message':'أي رسالة جديدة'}</option>
                            </select>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowNewModal(false)}
                                className="flex-1 py-2 rounded-xl border border-brand-border/30 text-sm font-bold text-brand-muted">
                                {isEn?'Cancel':'إلغاء'}
                            </button>
                            <button onClick={handleCreate} disabled={saving}
                                className="flex-1 py-2 rounded-xl text-sm font-bold text-brand-bg disabled:opacity-50"
                                style={{background:'#FF6400'}}>
                                {saving ? '...' : (isEn?'Create':'إنشاء')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AbandonedCartsManager = ({ carts, refresh, showToast, lang }) => {
    const [sendingPhone, setSendingPhone] = useState(null);
    const [heatFilter, setHeatFilter] = useState('all');
    const isEn = lang === 'en';

    const triggerRecovery = async (cart) => {
        setSendingPhone(cart.clean_phone);
        try {
            await axios.post(`${API_URL}/abandoned_carts/trigger`, {
                phone: cart.clean_phone,
                customerName: cart.customer?.first_name || (isEn ? 'Customer' : 'عميل'),
                checkoutUrl: cart.abandoned_checkout_url,
            });
            showToast(isEn ? 'Recovery message sent!' : 'تم إرسال رسالة الاسترجاع!', 'success');
            refresh();
        } catch (e) {
            showToast(e.response?.data?.error || (isEn ? 'Failed to send' : 'فشل الإرسال'), 'error');
        }
        setSendingPhone(null);
    };

    const triggerAll = async () => {
        const active = carts.filter(c => c.local_status !== 'confirmed' && c.local_status !== 'shipped');
        for (const cart of active) await triggerRecovery(cart);
    };

    const getHeat = (cart) => {
        if (cart.local_status === 'confirmed' || cart.local_status === 'shipped') return 'recovered';
        const mins = cart.created_at ? (Date.now() - new Date(cart.created_at).getTime()) / 60000 : Infinity;
        if (mins < 120) return 'hot';
        if (mins < 1440) return 'cooling';
        return 'cold';
    };

    const getHeatInfo = (heat) => {
        switch (heat) {
            case 'hot':       return { label:'HOT',       badge:'bg-brand-gold/15 text-brand-gold border-brand-gold/30',       bar:'bg-brand-gold',    pct: 86 };
            case 'cooling':   return { label:'COOLING',   badge:'bg-blue-500/15 text-blue-400 border-blue-500/25',             bar:'bg-blue-400',      pct: 72 };
            case 'cold':      return { label:'COLD',      badge:'bg-brand-muted/15 text-brand-muted border-brand-muted/20',    bar:'bg-brand-muted/50',pct: 41 };
            case 'recovered': return { label:'RECOVERED', badge:'bg-green-500/15 text-green-400 border-green-500/25',          bar:'bg-brand-accent',  pct: 100 };
            default:          return { label:'COLD',      badge:'bg-brand-muted/15 text-brand-muted border-brand-muted/20',    bar:'bg-brand-muted/50',pct: 30 };
        }
    };

    const avatarColors = ['bg-teal-600','bg-blue-600','bg-purple-600','bg-emerald-600','bg-pink-600','bg-orange-600'];
    const getAvatarColor = (n) => avatarColors[Math.abs([...(n||'')].reduce((a,c)=>a+c.charCodeAt(0),0))%avatarColors.length];
    const getInitials = (name) => { const p=(name||'').trim().split(/\s+/); return p.length>=2?(p[0][0]+p[1][0]).toUpperCase():name.slice(0,2).toUpperCase(); };
    const timeAgo = (d) => { if(!d) return ''; const m=Math.floor((Date.now()-new Date(d).getTime())/60000); if(m<60) return `${m}m ago`; if(m<1440) return `${Math.floor(m/60)}h ago`; return `${Math.floor(m/1440)}d ago`; };

    const recoveredCarts = carts.filter(c => c.local_status==='confirmed'||c.local_status==='shipped');
    const hotCarts       = carts.filter(c => getHeat(c)==='hot');
    const coolingCarts   = carts.filter(c => getHeat(c)==='cooling');
    const coldCarts      = carts.filter(c => getHeat(c)==='cold');
    const activeCarts    = carts.filter(c => c.local_status!=='confirmed'&&c.local_status!=='shipped');
    const atRisk         = activeCarts.reduce((s,c)=>s+parseFloat(c.total_price||0),0);
    const recoveredVal   = recoveredCarts.reduce((s,c)=>s+parseFloat(c.total_price||0),0);
    const recoveryRate   = carts.length ? Math.round((recoveredCarts.length/carts.length)*100) : 0;

    const filtered = heatFilter==='all' ? carts : carts.filter(c=>getHeat(c)===heatFilter);

    const playbook = [
        { step:1, title: isEn?'Friendly nudge':'تذكير ودي',   time:'0h',  preview: isEn?'Hi {name}! Noticed you left some items behind...':'مرحباً {name}! لاحظنا أنك تركت بعض المنتجات...' },
        { step:2, title: isEn?'Soft offer':'عرض لطيف',        time:'1h',  preview: isEn?'Free shipping if you complete now → {link}':'شحن مجاني إذا أكملت الآن → {link}' },
        { step:3, title: isEn?'Discount nudge':'خصم تحفيزي',  time:'24h', preview: isEn?'Here\'s 10% off — code FLOW10. Only for you.':'خصم 10% — كود FLOW10. خصيصاً لك.' },
        { step:4, title: isEn?'Final reminder':'تذكير أخير',  time:'72h', preview: isEn?'Last chance — your cart expires soon.':'فرصة أخيرة — سلتك ستنتهي قريباً.' },
    ];

    return (
        <div className={`space-y-4 animate-in fade-in duration-500 ${isEn?'text-left':'text-right'}`}>
            {/* Subtitle + header buttons */}
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-brand-muted tracking-[0.15em] uppercase">
                    {isEn?'HUNTER ACTIVE':'هانتر نشط'} · {activeCarts.length} {isEn?'IN RECOVERY':'في الاسترجاع'} · EGP {recoveredVal.toLocaleString()} {isEn?'RECOVERED THIS WEEK':'مسترجع الأسبوع'}
                </p>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-brand-accent/25 text-xs font-bold text-brand-accent">
                        <span className="w-2 h-2 rounded-full bg-brand-accent shadow-[0_0_6px_#8CC850]"></span>
                        {isEn?'Hunter ON':'هانتر مفعل'}
                    </span>
                    <button onClick={triggerAll} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all" style={{background:'#FF6400'}}>
                        <Zap size={13} /> {isEn?`Recover all · ${activeCarts.length}`:`استرجاع الكل · ${activeCarts.length}`}
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label:isEn?'ACTIVE CARTS':'السلات النشطة',          val:activeCarts.length, sub:`EGP ${atRisk.toLocaleString()} ${isEn?'at risk':'في خطر'}`,         subCls:'text-brand-gold' },
                    { label:isEn?'RECOVERY RATE':'معدل الاسترجاع',        val:`${recoveryRate}%`, sub:isEn?'last 30 days':'آخر 30 يوم',                                    subCls:'text-brand-muted' },
                    { label:isEn?'RECOVERED THIS WEEK':'مسترجع الأسبوع',  val:null, rev:recoveredVal, sub:`+38% ${isEn?'vs prev.':'مقارنة بالسابق'}`,                     subCls:'text-brand-accent' },
                    { label:isEn?'HOT LEADS':'عملاء ساخنون',              val:hotCarts.length,    sub:`${isEn?'probability':'احتمالية'} > 80%`,                            subCls:'text-brand-gold' },
                ].map((c,i)=>(
                    <div key={i} className="glass rounded-2xl p-5">
                        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-2">{c.label}</p>
                        {c.rev!==undefined
                            ? <h3 className="text-3xl font-bold text-brand-egg"><span className="text-sm text-brand-muted font-mono">EGP </span>{c.rev.toLocaleString()}</h3>
                            : <h3 className="text-3xl font-bold text-brand-egg">{c.val}</h3>
                        }
                        <p className={`text-[11px] font-mono mt-1 ${c.subCls}`}>{c.sub}</p>
                    </div>
                ))}
            </div>

            {/* Main two-column layout */}
            <div className="grid grid-cols-[1fr_320px] gap-3">
                {/* Cart pipeline */}
                <div className="glass rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-egg">{isEn?'Cart pipeline':'خط أنابيب السلات'}</span>
                            <span className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">{isEn?'REAL-TIME':'فوري'}</span>
                        </div>
                        <div className="flex gap-1.5">
                            {[
                                { id:'all',      label:isEn?'All':'الكل',           dot:null,           count:carts.length },
                                { id:'hot',      label:isEn?'Hot':'ساخن',           dot:'bg-brand-gold', count:hotCarts.length },
                                { id:'cooling',  label:isEn?'Cooling':'يبرد',       dot:'bg-blue-400',   count:coolingCarts.length },
                                { id:'cold',     label:isEn?'Cold':'بارد',          dot:'bg-brand-muted',count:coldCarts.length },
                            ].map(f=>(
                                <button key={f.id} onClick={()=>setHeatFilter(f.id)}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${heatFilter===f.id?'bg-brand-accent text-brand-bg':'glass border border-brand-border/30 text-brand-muted hover:border-brand-accent/30'}`}>
                                    {f.dot && <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`}></span>}
                                    {f.label} · {f.count}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        {filtered.map((cart, i) => {
                            const heat = getHeat(cart);
                            const hi   = getHeatInfo(heat);
                            const name = `${cart.customer?.first_name||''} ${cart.customer?.last_name||''}`.trim() || 'Unknown';
                            const items = cart.line_items || [];
                            const firstItem = items[0]?.title || (isEn?'Product':'منتج');
                            const extraItems = items.length > 1 ? ` +${items.length-1}` : '';
                            const secondItem = items[1]?.title ? ` · ${items[1].title}` : '';
                            const preview = firstItem + (items.length>1 ? secondItem + (items.length>2 ? ` +${items.length-2}` : '') : '');
                            const isRecovered = heat === 'recovered';
                            return (
                                <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isRecovered?'bg-brand-accent/5 border-brand-accent/15':'glass-subtle border-brand-border/20 hover:border-brand-accent/20'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${getAvatarColor(name)}`}>
                                        {getInitials(name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-brand-egg">{name}</p>
                                        <p className="text-[11px] text-brand-muted truncate">{preview}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="font-bold text-sm text-brand-egg">{cart.total_price ? `EGP ${parseFloat(cart.total_price).toLocaleString()}` : '—'}</p>
                                        <p className="text-[11px] text-brand-muted">{items.length} {isEn?(items.length===1?'item':'items'):'منتج'}</p>
                                    </div>
                                    <div className="w-28 shrink-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex-1 h-1.5 bg-brand-muted/20 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${hi.bar}`} style={{width:`${hi.pct}%`}}></div>
                                            </div>
                                            <span className="text-[10px] font-mono text-brand-muted">{hi.pct}%</span>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${hi.badge}`}>
                                            {isRecovered && <Check size={9} />}
                                            {hi.label}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-brand-muted font-mono shrink-0 w-16 text-center">{timeAgo(cart.created_at)}</span>
                                    {!isRecovered ? (
                                        <button onClick={()=>triggerRecovery(cart)} disabled={sendingPhone===cart.clean_phone}
                                            className="px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-50 shrink-0" style={{background:'#FF6400'}}>
                                            {sendingPhone===cart.clean_phone ? <RefreshCcw size={13} className="animate-spin"/> : (isEn?'Send':'إرسال')}
                                        </button>
                                    ) : <div className="w-16 shrink-0"></div>}
                                </div>
                            );
                        })}
                        {filtered.length===0 && (
                            <div className="py-10 text-center text-brand-muted text-sm">{isEn?'No carts found':'لا توجد سلات'}</div>
                        )}
                    </div>
                </div>

                {/* Recovery Playbook */}
                <div className="glass rounded-2xl p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="font-bold text-brand-egg">{isEn?'Recovery Playbook':'خطة الاسترجاع'}</span>
                        <span className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">{isEn?'AUTOMATED':'تلقائي'}</span>
                    </div>
                    <div className="space-y-3 flex-1">
                        {playbook.map((step, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="w-7 h-7 rounded-full bg-brand-accent/15 border border-brand-accent/25 flex items-center justify-center text-[11px] font-bold text-brand-accent">
                                        {step.step}
                                    </div>
                                    {i < playbook.length-1 && <div className="w-px flex-1 bg-brand-accent/10 my-1"></div>}
                                </div>
                                <div className="flex-1 pb-3">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-sm font-bold text-brand-egg">{step.title}</span>
                                        <span className="text-[10px] font-mono text-brand-muted">{step.time}</span>
                                    </div>
                                    <p className="text-[11px] text-brand-muted leading-relaxed line-clamp-2">{step.preview}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Projected recovery */}
                    <div className="mt-4 pt-4 border-t border-brand-accent/10">
                        <p className="text-[9px] font-mono text-brand-muted uppercase tracking-wider mb-1">{isEn?'PROJECTED RECOVERY THIS WEEK':'الاسترجاع المتوقع هذا الأسبوع'}</p>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-brand-accent">+ EGP {Math.round(atRisk * 0.38).toLocaleString()}</span>
                            <svg viewBox="0 0 60 24" className="w-14 h-6 opacity-70">
                                <polyline points="0,20 10,16 20,14 30,10 40,8 50,5 60,3" fill="none" stroke="#8CC850" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Product Sender (Shopify Products → WhatsApp) ---
const CatalogManager = ({ showToast, lang, inbox = [] }) => {
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [productFilter, setProductFilter] = useState('all');
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    const [customNote, setCustomNote] = useState('');
    const [sending, setSending] = useState(false);
    const isEn = lang === 'en';

    useEffect(() => {
        axios.get(`${API_URL}/shopify/products`)
            .then(r => setProducts(r.data.products || []))
            .catch(err => showToast(err.response?.data?.error || (isEn ? 'Failed to load products' : 'فشل تحميل المنتجات'), 'error'))
            .finally(() => setLoadingProducts(false));
    }, []);

    const filtered = products.filter(p => {
        const q = search.toLowerCase();
        const matchSearch = !search || p.title.toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q);
        if (!matchSearch) return false;
        if (productFilter === 'bestseller') return p.tags?.includes('bestseller') || p.position <= 3;
        if (productFilter === 'new')        return p.tags?.includes('new') || (p.created_at && (Date.now()-new Date(p.created_at).getTime()) < 30*86400000);
        if (productFilter === 'low_stock')  return p.inventory_quantity !== undefined && p.inventory_quantity < 5;
        return true;
    });

    const buildMessage = (p) => {
        const name = p.title;
        const sku = p.sku || '';
        const price = parseFloat(p.price||0).toLocaleString();
        const note = customNote || `Here's the ${name} ًں–¤ In stock and ready to ship.`;
        return `${note} {order_link}`;
    };

    const handleSend = async () => {
        if (!selected || selectedRecipients.length === 0) {
            showToast(isEn ? 'Select a product and at least one recipient' : 'اختار منتج ومستلم واحد على الأقل', 'error');
            return;
        }
        setSending(true);
        try {
            for (const phone of selectedRecipients) {
                await axios.post(`${API_URL}/whatsapp/send`, { phone, textMsg: buildMessage(selected) });
            }
            showToast(isEn ? `Product sent to ${selectedRecipients.length} chat(s)!` : `تم الإرسال لـ ${selectedRecipients.length} محادثة!`, 'success');
            setSelectedRecipients([]);
            setCustomNote('');
        } catch (err) {
            showToast(err.response?.data?.error || (isEn ? 'Send failed' : 'فشل الإرسال'), 'error');
        }
        setSending(false);
    };

    const toggleRecipient = (phone) => setSelectedRecipients(p => p.includes(phone) ? p.filter(x=>x!==phone) : [...p, phone]);

    const avatarColors = ['bg-teal-600','bg-blue-600','bg-purple-600','bg-pink-600','bg-orange-600','bg-emerald-600'];
    const getAvatarColor = (n) => avatarColors[Math.abs([...(n||'')].reduce((a,c)=>a+c.charCodeAt(0),0))%avatarColors.length];
    const getInitials = (name) => { const p=(name||'').trim().split(/\s+/); return p.length>=2?(p[0][0]+p[1][0]).toUpperCase():(name||'??').slice(0,2).toUpperCase(); };
    const timeAgo = (t) => { if(!t) return ''; const m=Math.floor((Date.now()-new Date(t.replace(' ','T')).getTime())/60000); return m<60?`${m}m`:`${Math.floor(m/60)}h`; };

    const recipients = inbox.slice(0, 8);

    return (
        <div className={`space-y-3 animate-in fade-in duration-500 ${isEn?'text-left':'text-right'}`}>
            {/* Subtitle row */}
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono text-brand-muted tracking-[0.15em] uppercase">{isEn?'DROP A PRODUCT CARD INTO ANY CHAT':'أرسل بطاقة منتج لأي محادثة'}</p>
                <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-brand-border/30 text-xs font-bold text-brand-egg hover:border-brand-accent/30 transition-all">
                        <LayoutDashboard size={13} /> {isEn?'Switch view':'تغيير العرض'}
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-brand-border/30 text-xs font-bold text-brand-egg hover:border-brand-accent/30 transition-all">
                        <Link2 size={13} /> {isEn?'Get catalogue QR':'رمز الكتالوج'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-[1fr_340px] gap-3 h-[calc(100vh-14rem)]">
                {/* Catalogue panel */}
                <div className="glass rounded-2xl p-5 flex flex-col overflow-hidden">
                    {/* Panel header */}
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-egg">{isEn?'Catalogue':'الكتالوج'}</span>
                            <span className="text-[10px] font-mono text-brand-muted uppercase">{products.length} {isEn?'ACTIVE · SYNCED FROM SHOPIFY':'نشط · متزامن مع شوبيفاي'}</span>
                        </div>
                        <div className="relative">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                            <input value={search} onChange={e =>setSearch(e.target.value)}
                                placeholder={isEn?'Search...':'بحث...'}
                                className="bg-brand-bg/50 border border-brand-border/30 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-brand-accent/40 w-36" />
                        </div>
                    </div>
                    {/* Filter chips */}
                    <div className="flex gap-1.5 mb-4 shrink-0">
                        {[
                            {id:'all',        label:isEn?'All':'الكل',           dot:null },
                            {id:'bestseller', label:isEn?'Bestsellers':'الأكثر مبيعاً', dot:null },
                            {id:'new',        label:isEn?'New':'جديد',           dot:null },
                            {id:'low_stock',  label:isEn?'Low stock':'مخزون منخفض', dot:'bg-brand-gold' },
                        ].map(f=>(
                            <button key={f.id} onClick={()=>setProductFilter(f.id)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${productFilter===f.id?'bg-brand-accent text-brand-bg':'glass border border-brand-border/30 text-brand-muted hover:border-brand-accent/30'}`}>
                                {f.dot && <span className={`w-1.5 h-1.5 rounded-full ${f.dot}`}></span>}
                                {f.label}
                            </button>
                        ))}
                    </div>
                    {/* Product grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loadingProducts ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-brand-muted">
                                <Package size={36} className="opacity-20 mb-3"/>
                                <p className="text-sm">{isEn?'No products. Connect Shopify in Settings.':'لا توجد منتجات. اربط شوبيفاي من الإعدادات.'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3 pb-2">
                                {filtered.map(p => {
                                    const isBestseller = p.tags?.includes('bestseller') || p.position <= 3;
                                    const isNew = p.tags?.includes('new');
                                    const isLow = p.inventory_quantity !== undefined && p.inventory_quantity < 5;
                                    const isSelected = selected?.id === p.id;
                                    return (
                                        <div key={p.id} onClick={()=>setSelected(p)}
                                            className={`rounded-2xl overflow-hidden border cursor-pointer transition-all group ${isSelected?'border-brand-accent shadow-[0_0_0_2px_rgba(140,200,80,0.3)]':'border-brand-border/20 hover:border-brand-accent/30'}`}>
                                            {/* Image */}
                                            <div className="relative bg-brand-green-soft aspect-[4/3]">
                                                {p.image
                                                    ? <img src={p.image} alt={p.title} className="w-full h-full object-cover"/>
                                                    : <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-brand-accent/30"/></div>
                                                }
                                                {isBestseller && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-accent text-brand-bg">BESTSELLER</span>}
                                                {isNew && !isBestseller && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-accent text-brand-bg">NEW</span>}
                                                {isLow && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{background:'#FF6400',color:'white'}}>LOW STOCK</span>}
                                            </div>
                                            {/* Info */}
                                            <div className="p-3">
                                                <p className="font-bold text-sm text-brand-egg truncate">{p.title}</p>
                                                {p.sku && <p className="text-[10px] text-brand-muted font-mono mt-0.5 truncate">{p.sku}</p>}
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-brand-accent font-bold text-sm">EGP {parseFloat(p.price||0).toLocaleString()}</span>
                                                    <button onClick={e=>{e.stopPropagation();setSelected(p);}}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white hover:opacity-90 transition-all" style={{background:'#FF6400'}}>
                                                        <Send size={11}/> {isEn?'Send':'إرسال'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Share panel */}
                <div className="glass rounded-2xl p-5 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 shrink-0">
                        <span className="font-bold text-brand-egg">{isEn?'Share to':'مشاركة مع'}</span>
                        <span className="text-[10px] font-mono text-brand-accent uppercase tracking-wider">WHATSAPP</span>
                    </div>

                    {/* Selected product */}
                    {selected ? (
                        <div className="flex items-center gap-3 p-3 glass-subtle rounded-xl border border-brand-accent/20 mb-4 shrink-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand-green-soft shrink-0">
                                {selected.image ? <img src={selected.image} alt={selected.title} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-brand-accent/40"/></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-brand-egg truncate">{selected.title}</p>
                                {selected.sku && <p className="text-[10px] text-brand-muted font-mono">{selected.sku}</p>}
                                <p className="text-sm font-bold text-brand-gold mt-0.5">EGP {parseFloat(selected.price||0).toLocaleString()}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 glass-subtle rounded-xl border border-dashed border-brand-border/40 text-center text-xs text-brand-muted mb-4 shrink-0">
                            {isEn?'← Select a product':'← اختر منتجاً'}
                        </div>
                    )}

                    {/* Recipients */}
                    <div className="mb-3 shrink-0">
                        <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider mb-2">{isEn?'RECIPIENTS':'المستلمون'}</p>
                        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                            {recipients.length === 0 ? (
                                <p className="text-xs text-brand-muted py-2">{isEn?'No active chats':'لا توجد محادثات'}</p>
                            ) : recipients.map((chat, i) => {
                                const isChecked = selectedRecipients.includes(chat.phone);
                                const lastMsg = chat.messages?.[chat.messages.length-1];
                                const ago = timeAgo(chat.lastUpdated);
                                return (
                                    <div key={i} onClick={()=>toggleRecipient(chat.phone)}
                                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${isChecked?'bg-brand-accent/10 border border-brand-accent/20':'hover:bg-brand-accent/5 border border-transparent'}`}>
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isChecked?'bg-brand-accent border-brand-accent':'border-brand-border/40'}`}>
                                            {isChecked && <Check size={11} className="text-brand-bg" strokeWidth={3}/>}
                                        </div>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${getAvatarColor(chat.name)}`}>
                                            {getInitials(chat.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-brand-egg truncate">{chat.name}</p>
                                            <p className="text-[10px] text-brand-muted truncate">{lastMsg?.text || (isEn?'Active chat':'محادثة نشطة')} · {ago}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Message */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider mb-2 shrink-0">{isEn?'MESSAGE':'الرسالة'}</p>
                        <textarea
                            value={customNote || (selected ? buildMessage(selected) : '')}
                            onChange={e=>setCustomNote(e.target.value)}
                            placeholder={isEn?'Message will appear here after selecting a product...':'ستظهر الرسالة هنا بعد اختيار المنتج...'}
                            className="flex-1 bg-brand-bg/40 border border-brand-border/30 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-accent/40 resize-none custom-scrollbar min-h-[80px]"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 shrink-0">
                        <button className="flex-1 py-2.5 glass border border-brand-border/30 rounded-xl text-xs font-bold text-brand-egg hover:border-brand-accent/30 transition-all">
                            {isEn?'Preview':'معاينة'}
                        </button>
                        <button onClick={handleSend} disabled={sending||!selected||selectedRecipients.length===0}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-40" style={{background:'#FF6400'}}>
                            {sending ? <RefreshCcw size={13} className="animate-spin"/> : <><Send size={13}/> {isEn?`Send to ${selectedRecipients.length} chat`:`إرسال لـ ${selectedRecipients.length}`}</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
//  Onboarding Screen
// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const OnboardingScreen = ({ lang, onLangChange, onComplete }) => {
    const isEn = lang === 'en';

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4" dir={isEn ? 'ltr' : 'rtl'}>
            <div className="w-full max-w-md space-y-5">

                {/* Header */}
                <div className="text-center space-y-3 relative">
                    <button onClick={() => onLangChange(isEn ? 'ar' : 'en')}
                        className="absolute top-0 left-0 px-3 py-1.5 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-bold hover:bg-brand-accent/20 transition-all">
                        {isEn ? 'عربي' : 'English'}
                    </button>
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <OmniFlowMark size={36} />
                        <h1 className="text-2xl font-bold text-brand-egg">Omni<span className="font-light">Flow</span></h1>
                    </div>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl overflow-hidden border border-brand-border/20">
                    <div className="p-8 space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center mx-auto border border-brand-accent/20">
                                    <ShieldCheck size={28} className="text-brand-accent" />
                                </div>
                                <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Welcome to OmniFlow!' : 'أهلاً بك في OmniFlow!'}</h2>
                                <p className="text-sm text-brand-muted">{isEn ? 'Your Shopify store is connected. You\'re ready to go.' : 'تم ربط متجر Shopify بنجاح. أنت جاهز للبدء.'}</p>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { icon: '✅', text: isEn ? 'Shopify store connected' : 'تم ربط متجر Shopify' },
                                    { icon: '💬', text: isEn ? 'WhatsApp configured by our team' : 'تم إعداد واتساب من قِبَل فريقنا' },
                                    { icon: '🚀', text: isEn ? 'Ready to receive orders & messages' : 'جاهز لاستقبال الطلبات والرسائل' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-brand-accent/5 border border-brand-accent/15">
                                        <span className="text-lg">{item.icon}</span>
                                        <p className="text-sm font-bold text-brand-egg">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => onComplete('')}
                                className="w-full bg-brand-accent text-brand-bg py-3 rounded-xl font-black hover:opacity-90 transition-all text-sm">
                                {isEn ? 'Go to Dashboard →' : 'الذهاب للوحة التحكم ←'}
                            </button>
                        </div>
                </div>
            </div>
        </div>
    );
};


const SHIPPING_PROVIDERS = [
    { id: 'bosta',  name: 'Bosta',       flag: 'ًںں ', region: 'مصر' },
    { id: 'jt',     name: 'J&T Express', flag: 'ًں"´', region: 'مصر' },
    { id: 'aramex', name: 'Aramex',      flag: 'ًںں،', region: 'دولي' },
    { id: 'dhl',    name: 'DHL',         flag: 'ًںں،', region: 'دولي' },
    { id: 'fedex',  name: 'FedEx',       flag: 'ًںں£', region: 'دولي' },
];

const PROVIDER_FIELDS = {
    bosta:  [{ k: 'api_key', label: 'API Key', placeholder: 'Bearer ey...' }],
    jt:     [{ k: 'api_key', label: 'API Key', placeholder: 'jt_api_...' }, { k: 'customer_code', label: 'Customer Code', placeholder: 'CUST001' }],
    aramex: [{ k: 'username', label: 'Username', placeholder: 'aramex_user' }, { k: 'password', label: 'Password', placeholder: 'â€¢â€¢â€¢â€¢', secret: true }, { k: 'account_number', label: 'Account Number', placeholder: '12345' }],
    dhl:    [{ k: 'api_key', label: 'API Key', placeholder: 'dhl_api_...' }, { k: 'account_number', label: 'Account Number', placeholder: '123456789' }],
    fedex:  [{ k: 'api_key', label: 'API Key', placeholder: 'fedex_api_...' }, { k: 'account_number', label: 'Account Number', placeholder: '123456789' }],
};

const ShippingSettings = ({ isEn, showToast }) => {
    const [configs, setConfigs] = useState({});
    const [expanded, setExpanded] = useState(null);
    const [saving, setSaving] = useState(null);
    const [show, setShow] = useState({});

    useEffect(() => {
        axios.get(`${API_URL}/shipping/config`).then(r => setConfigs(r.data.config || {})).catch(() => {});
    }, []);

    const handleSave = async (providerId) => {
        setSaving(providerId);
        try {
            await axios.post(`${API_URL}/shipping/config`, { provider: providerId, ...configs[providerId] });
            showToast(isEn ? `${providerId} saved!` : `تم حفظ إعدادات ${providerId}!`);
        } catch (e) { showToast(isEn ? 'Save failed' : 'فشل الحفظ', 'error'); }
        setSaving(null);
    };

    const set = (provider, k, v) => setConfigs(p => ({ ...p, [provider]: { ...(p[provider] || {}), [k]: v } }));

    return (
        <div className="glass p-6 rounded-2xl space-y-4">
            <h4 className="font-bold text-brand-accent border-b border-brand-accent/10 pb-2 flex items-center gap-2">
                <Truck size={16} /> {isEn ? 'Shipping Providers' : 'شركات الشحن'}
            </h4>
            <div className="space-y-2">
                {SHIPPING_PROVIDERS.map(p => {
                    const isConfigured = !!(configs[p.id]?.api_key || configs[p.id]?.username);
                    const isOpen = expanded === p.id;
                    return (
                        <div key={p.id} className={`rounded-xl border transition-all overflow-hidden ${isOpen ? 'border-brand-accent/30 bg-brand-accent/5' : 'border-brand-accent/10 bg-brand-bg/40'}`}>
                            <button onClick={() => setExpanded(isOpen ? null : p.id)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-accent/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-base leading-none">{p.flag}</span>
                                    <span className="font-bold text-sm text-brand-text">{p.name}</span>
                                    <span className="text-[11px] text-brand-muted">{p.region}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isConfigured ? 'bg-green-500/20 text-green-400' : 'bg-brand-muted/10 text-brand-muted'}`}>
                                        {isConfigured ? (isEn ? 'Configured' : 'مُفعَّل') : (isEn ? 'Not set' : 'غير مُهيَّأ')}
                                    </span>
                                </div>
                                <ChevronDown size={15} className={`text-brand-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isOpen && (
                                <div className="px-4 pb-4 pt-1 space-y-4 border-t border-brand-accent/10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                        {(PROVIDER_FIELDS[p.id] || []).map(f => (
                                            <div key={f.k} className="space-y-1.5">
                                                <label className="text-xs font-bold text-brand-muted">{f.label}</label>
                                                <div className="relative">
                                                    <input
                                                        type={f.secret && !show[`${p.id}_${f.k}`] ? 'password' : 'text'}
                                                        value={configs[p.id]?.[f.k] || ''}
                                                        onChange={e => set(p.id, f.k, e.target.value)}
                                                        placeholder={f.placeholder}
                                                        className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-2.5 text-xs focus:border-brand-accent outline-none pr-8"
                                                    />
                                                    {f.secret && (
                                                        <button type="button" onClick={() => setShow(s => ({ ...s, [`${p.id}_${f.k}`]: !s[`${p.id}_${f.k}`] }))}
                                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-accent">
                                                            {show[`${p.id}_${f.k}`] ? <EyeOff size={13} /> : <Eye size={13} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => handleSave(p.id)} disabled={saving === p.id}
                                        className="bg-brand-accent text-brand-bg px-5 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50">
                                        {saving === p.id ? (isEn ? 'Saving...' : 'جاري الحفظ...') : (isEn ? 'Save' : 'حفظ')}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ShippingSection = ({ phone, customerName, orderId, totalPrice, address, showToast, isEn }) => {
    const [shipments, setShipments] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [tracking, setTracking] = useState({});
    const [form, setForm] = useState({
        provider: 'bosta',
        address: address?.address1 || '',
        city: address?.city || '',
        cod: totalPrice || '0',
        notes: ''
    });

    useEffect(() => {
        axios.get(`${API_URL}/shipping/config`).then(r => {
            const all = r.data.shipments || [];
            const cleanPhone = String(phone).replace(/[^\d]/g, '');
            setShipments(all.filter(s => s.phone === cleanPhone || s.order_id === orderId));
        }).catch(() => {});
    }, [phone, orderId]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const res = await axios.post(`${API_URL}/shipping/create`, { ...form, phone, customer_name: customerName, order_id: orderId });
            setShipments(p => [...p, res.data.shipment]);
            setShowForm(false);
            showToast(isEn ? `Shipment created! AWB: ${res.data.awb}` : `تم إنشاء الشحنة! رقم التتبع: ${res.data.awb}`);
        } catch (e) { showToast(e.response?.data?.error || (isEn ? 'Failed to create shipment' : 'فشل إنشاء الشحنة'), 'error'); }
        setCreating(false);
    };

    const handleTrack = async (provider, awb) => {
        setTracking(p => ({ ...p, [awb]: 'loading' }));
        try {
            const res = await axios.get(`${API_URL}/shipping/track/${provider}/${awb}`);
            setTracking(p => ({ ...p, [awb]: res.data.status }));
            setShipments(p => p.map(s => s.awb === awb ? { ...s, status: res.data.status } : s));
        } catch (e) { setTracking(p => ({ ...p, [awb]: isEn ? 'Error' : 'خطأ في التتبع' })); }
    };

    const providerLabel = (id) => SHIPPING_PROVIDERS.find(p => p.id === id)?.name || id;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-brand-accent/10 pb-2">
                <h4 className="font-bold text-brand-accent text-sm flex items-center gap-2"><Truck size={15} /> {isEn ? 'Shipments' : 'الشحنات'}</h4>
                <button onClick={() => setShowForm(!showForm)}
                    className="text-xs bg-brand-accent/10 text-brand-accent px-3 py-1.5 rounded-lg hover:bg-brand-accent/20 transition-colors font-bold flex items-center gap-1.5">
                    <Plus size={13} /> {isEn ? 'New Shipment' : 'شحنة جديدة'}
                </button>
            </div>

            {shipments.length > 0 && (
                <div className="space-y-2">
                    {shipments.map(s => (
                        <div key={s.id} className="bg-brand-bg/30 border border-brand-accent/10 rounded-xl p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-brand-text">{providerLabel(s.provider)}</span>
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">{s.status}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-brand-muted font-mono" dir="ltr">{s.awb}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => navigator.clipboard?.writeText(s.awb)}
                                        className="text-[10px] text-brand-muted hover:text-brand-accent transition-colors">{isEn ? 'Copy' : 'نسخ'}</button>
                                    <button onClick={() => handleTrack(s.provider, s.awb)}
                                        disabled={tracking[s.awb] === 'loading'}
                                        className="text-[10px] text-brand-accent hover:underline transition-colors flex items-center gap-1">
                                        {tracking[s.awb] === 'loading' ? <RefreshCcw size={10} className="animate-spin" /> : null}
                                        {isEn ? 'Track' : 'تتبع'}
                                    </button>
                                </div>
                            </div>
                            {tracking[s.awb] && tracking[s.awb] !== 'loading' && (
                                <p className="text-[10px] text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">{tracking[s.awb]}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="bg-brand-bg/40 border border-brand-accent/20 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1 col-span-2">
                            <label className="text-[11px] text-brand-muted font-bold">{isEn ? 'Provider' : 'شركة الشحن'}</label>
                            <select value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
                                className="w-full bg-brand-input border border-brand-border rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none">
                                {SHIPPING_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.flag} {p.name} — {p.region}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1 col-span-2">
                            <label className="text-[11px] text-brand-muted font-bold">{isEn ? 'Street Address' : 'العنوان'}</label>
                            <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                                className="w-full bg-brand-input border border-brand-border rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] text-brand-muted font-bold">{isEn ? 'City' : 'المدينة'}</label>
                            <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                                placeholder="Cairo" dir="ltr"
                                className="w-full bg-brand-input border border-brand-border rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] text-brand-muted font-bold">{isEn ? 'COD Amount' : 'مبلغ الاستلام (COD)'}</label>
                            <input type="number" value={form.cod} onChange={e => setForm(p => ({ ...p, cod: e.target.value }))}
                                className="w-full bg-brand-input border border-brand-border rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none" />
                        </div>
                        <div className="space-y-1 col-span-2">
                            <label className="text-[11px] text-brand-muted font-bold">{isEn ? 'Notes (optional)' : 'ملاحظات'}</label>
                            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                placeholder={isEn ? 'Fragile, handle with care' : 'هش، يُعامل بحذر'}
                                className="w-full bg-brand-input border border-brand-border rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none" />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button onClick={() => setShowForm(false)}
                            className="flex-1 border border-brand-accent/20 text-brand-muted py-2 rounded-xl text-xs font-bold hover:bg-brand-accent/5 transition-all">
                            {isEn ? 'Cancel' : 'إلغاء'}
                        </button>
                        <button onClick={handleCreate} disabled={creating}
                            className="flex-1 bg-brand-accent text-brand-bg py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {creating ? <RefreshCcw size={13} className="animate-spin" /> : <Truck size={13} />}
                            {creating ? (isEn ? 'Creating...' : 'جاري الإنشاء...') : (isEn ? 'Create Shipment' : 'إنشاء الشحنة')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

// ── App Settings ─────────────────────────────────────────────────────────────
const SetupManager = ({ showToast, lang, onSave }) => {
    const isEn = lang === 'en';
    const [section, setSection] = React.useState('workspace');
    const [saving, setSaving] = React.useState(false);

    // ── Data state ──────────────────────────────────────────────────────────
    const [ws, setWs] = React.useState({
        brand_name: '', region: '', language: 'ar+en', currency: 'EGP',
        wa_phone: '', wa_token: '', wa_phone_id: '', wa_business_id: '',
        shopify_store: '', shopify_key: '', shopify_secret: '', shopify_webhook: '',
        ai_enabled: false, ai_instruction: '',
        ai_auto_reply: true, ai_draft_mode: false, ai_auto_tag_vip: false,
        ai_send_recovery: false, ai_escalate_negative: false,
    });
    const [branding, setBranding] = React.useState({ brand_color: '#8CC850', logo_url: null });
    const [team, setTeam] = React.useState([]);
    const [integrations, setIntegrations] = React.useState({ wa: null, shopify: null, ai: null });
    const [showSecrets, setShowSecrets] = React.useState({});
    const logoRef = React.useRef(null);

    // ── Load ────────────────────────────────────────────────────────────────
    React.useEffect(() => {
        axios.get(`${API_URL}/config/setup`).then(r => {
            if (r.data && typeof r.data === 'object') {
                setWs(p => ({
                    ...p,
                    ...r.data,
                    shopify_store: r.data.shopify_url || p.shopify_store || '',
                    shopify_key: r.data.shopify_access_token || p.shopify_key || '',
                }));
            }
        }).catch(() => {});
        axios.get(`${API_URL}/config/branding`).then(r => {
            if (r.data) setBranding(r.data);
        }).catch(() => {});
        axios.get(`${API_URL}/settings`).then(r => {
            if (r.data) setWs(p => ({
                ...p,
                ai_instruction: r.data.ai_instruction || '',
                ai_enabled: !!r.data.ai_enabled,
                ai_auto_reply: r.data.ai_auto_reply !== false,
                ai_draft_mode: !!r.data.ai_draft_mode,
                ai_auto_tag_vip: !!r.data.ai_auto_tag_vip,
                ai_send_recovery: !!r.data.ai_send_recovery,
                ai_escalate_negative: !!r.data.ai_escalate_negative,
            }));
        }).catch(() => {});
        axios.get(`${API_URL}/team`).then(r => {
            if (Array.isArray(r.data)) setTeam(r.data);
        }).catch(() => {});
        axios.get(`${API_URL}/integrations/status`).then(r => {
            if (r.data) setIntegrations(r.data);
        }).catch(() => {});
    }, []);

    // ── Save ────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            // Map frontend field names → backend field names before saving
            const payload = {
                ...ws,
                shopify_url: ws.shopify_store || ws.shopify_url || '',
                shopify_access_token: ws.shopify_key || ws.shopify_access_token || '',
            };
            await axios.post(`${API_URL}/config/setup`, payload);
            await axios.post(`${API_URL}/settings`, {
                ai_instruction: ws.ai_instruction,
                ai_enabled: ws.ai_enabled,
                ai_auto_reply: ws.ai_auto_reply,
                ai_draft_mode: ws.ai_draft_mode,
                ai_auto_tag_vip: ws.ai_auto_tag_vip,
                ai_draft_mode: ws.ai_draft_mode,
                ai_auto_tag_vip: ws.ai_auto_tag_vip,
                ai_send_recovery: ws.ai_send_recovery,
                ai_escalate_negative: ws.ai_escalate_negative,
            });
            if (ws.brand_name) onSave?.(ws.brand_name);
            showToast(isEn ? 'Settings saved!' : 'تم حفظ الإعدادات!');
        } catch (e) {
            showToast(isEn ? 'Failed to save' : 'فشل الحفظ', 'error');
        }
        setSaving(false);
    };

    const set = (k, v) => setWs(p => ({ ...p, [k]: v }));
    const toggle = (k) => setWs(p => ({ ...p, [k]: !p[k] }));
    const toggleSecret = (k) => setShowSecrets(p => ({ ...p, [k]: !p[k] }));

    // ── Helpers ─────────────────────────────────────────────────────────────
    const renderField = ({ label, field, placeholder = '', type = 'text', secret = false }) => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{label}</label>
            <div className="relative" dir="ltr">
                <input
                    type={secret && !showSecrets[field] ? 'password' : type}
                    value={ws[field] || ''}
                    onChange={e => set(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2.5 text-xs focus:border-brand-accent outline-none text-brand-egg text-left"
                />
                {secret && (
                    <button onClick={() => toggleSecret(field)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-egg" type="button">
                        {showSecrets[field] ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                )}
            </div>
        </div>
    );

    const renderToggle = ({ label, field, description }) => (
        <div key={field} className="flex items-center justify-between py-2.5 border-b border-brand-border/10 last:border-0">
            <div>
                <p className="text-[12px] font-semibold text-brand-egg">{label}</p>
                {description && <p className="text-[10px] text-brand-muted mt-0.5">{description}</p>}
            </div>
            <button onClick={() => toggle(field)} className={`relative w-10 h-5 rounded-full transition-colors ${ws[field] ? 'bg-brand-accent' : 'bg-brand-border/40'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${ws[field] ? 'left-5' : 'left-0.5'}`} />
            </button>
        </div>
    );

    const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const avatarColors = ['#8CC850', '#FF6B35', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];
    const avatarColor = (name) => avatarColors[name?.charCodeAt(0) % avatarColors.length] || '#8CC850';

    // ── Integration status card ──────────────────────────────────────────────
    const renderIntCard = ({ icon: Icon, iconBg, name, subtitle, stat, connectedAt, status }) => (
        <div className="glass rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: iconBg}}>
                        <Icon size={18} color="#fff" />
                    </div>
                    <div>
                        <p className="text-[13px] font-black text-brand-egg">{name}</p>
                        <p className="text-[10px] text-brand-muted truncate max-w-[120px]">{subtitle}</p>
                    </div>
                </div>
                <span className={`text-[9px] font-black px-2 py-1 rounded-full tracking-wider ${
                    status === 'connected' ? 'text-brand-accent' :
                    status === 'synced'    ? 'text-blue-400' :
                    status === 'active'    ? 'text-orange-400' : 'text-brand-muted'
                }`} style={{background: status === 'connected' ? 'rgba(140,200,80,0.12)' : status === 'synced' ? 'rgba(59,130,246,0.12)' : status === 'active' ? 'rgba(255,107,53,0.12)' : 'rgba(100,100,100,0.12)'}}>
                    ● {status?.toUpperCase() || 'NOT SET'}
                </span>
            </div>
            {stat && <p className="text-[11px] text-brand-muted">{stat}</p>}
            {connectedAt && <p className="text-[10px] text-brand-muted/60">{isEn ? 'Connected' : 'متصل'} · {connectedAt}</p>}
        </div>
    );

    // ── Sidebar items ────────────────────────────────────────────────────────
    const sideItems = [
        { id: 'workspace',  icon: Globe,        label: isEn ? 'Workspace'          : 'مساحة العمل' },
        { id: 'whatsapp',   icon: MessageCircle, label: isEn ? 'WhatsApp Cloud'    : 'واتساب Cloud' },
        { id: 'shopify',    icon: ShoppingCart,  label: isEn ? 'Shopify integration': 'ربط شوبيفاي' },
        { id: 'ai',         icon: Sparkles,      label: isEn ? 'AI assistant'       : 'مساعد AI' },
        { id: 'team',       icon: Users,         label: isEn ? 'Team & roles'       : 'الفريق' },
        { id: 'loyalty',    icon: Star,          label: isEn ? 'Loyalty program'    : 'برنامج الولاء' },
        { id: 'appearance', icon: Palette,       label: isEn ? 'Appearance'         : 'المظهر' },
    ];

    const waConnected   = !!(ws.wa_token && ws.wa_phone_id);
    const shopConnected = !!(ws.shopify_store && ws.shopify_key);
    const aiActive      = ws.ai_enabled;

    // ── Section content ──────────────────────────────────────────────────────
    const renderSection = () => {
        switch (section) {

        case 'workspace': return (
            <div className="space-y-4">
                {/* Workspace form */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black" style={{background: branding.brand_color || '#8CC850', color: '#001A11'}}>
                            {ws.brand_name ? initials(ws.brand_name) : 'WS'}
                        </div>
                        <div>
                            <p className="text-[13px] font-black text-brand-egg">{isEn ? 'Workspace' : 'مساحة العمل'}</p>
                            <p className="text-[11px] text-brand-muted uppercase tracking-wider">{ws.brand_name || (isEn ? 'YOUR BRAND' : 'علامتك التجارية')}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {renderField({label:(isEn ? 'Brand Name' : 'اسم العلامة التجارية'), field:"brand_name", placeholder:"Linenhouse Cairo"})}
                        {renderField({label:(isEn ? 'Region' : 'المنطقة'), field:"region", placeholder:"EG · Africa/Cairo (UTC+2)"})}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'Default Language' : 'اللغة الافتراضية'}</label>
                            <select value={ws.language || 'ar+en'} onChange={e => set('language', e.target.value)}
                                className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2.5 text-xs focus:border-brand-accent outline-none text-brand-egg">
                                <option value="ar+en">عربي + English</option>
                                <option value="en">English</option>
                                <option value="ar">عربي</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'Currency' : 'العملة'}</label>
                            <select value={ws.currency || 'EGP'} onChange={e => set('currency', e.target.value)}
                                className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2.5 text-xs focus:border-brand-accent outline-none text-brand-egg">
                                <option value="EGP">EGP · Egyptian Pound</option>
                                <option value="USD">USD · US Dollar</option>
                                <option value="SAR">SAR · Saudi Riyal</option>
                                <option value="AED">AED · UAE Dirham</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 3 integration status cards */}
                <div className="grid grid-cols-3 gap-3">
                    {renderIntCard({ icon:MessageCircle, iconBg:"#25D366", name:"WhatsApp Cloud", subtitle:ws.wa_phone||(isEn?'Not connected':'غير متصل'), stat:waConnected?(isEn?'Official Meta API connected':'Meta API متصل'):(isEn?'Add credentials to connect':'أضف بيانات الاتصال'), connectedAt:integrations.wa?.connected_at||null, status:waConnected?'connected':'disconnected' })}
                    {renderIntCard({ icon:ShoppingCart, iconBg:"#96BF48", name:"Shopify", subtitle:ws.shopify_store||(isEn?'Not connected':'غير متصل'), stat:integrations.shopify?`${integrations.shopify.products||0} ${isEn?'products':'منتج'} · ${integrations.shopify.orders||0} ${isEn?'orders':'طلب'}`:(isEn?'Add store URL to connect':'أضف رابط المتجر'), connectedAt:integrations.shopify?.connected_at||null, status:shopConnected?'synced':'disconnected' })}
                    {renderIntCard({ icon:Sparkles, iconBg:"#FF6B35", name:"AI Assistant", stat:aiActive?(isEn?'AI assistant active':'مساعد AI نشط'):(isEn?'AI assistant disabled':'مساعد AI معطل'), connectedAt:integrations.ai?.connected_at||null, status:aiActive?'active':'disconnected' })}
                </div>

                {/* Team & AI side by side */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Team */}
                    <div className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[13px] font-black text-brand-egg">{isEn ? 'Team & roles' : 'الفريق'}</p>
                                <p className="text-[10px] text-brand-muted uppercase tracking-wider mt-0.5">
                                    {team.length} {isEn ? 'SEATS' : 'مقاعد'}
                                    {team.filter(m => m.role === 'owner').length > 0 && ` · ${team.filter(m => m.role === 'owner').length} ${isEn ? 'OWNER' : 'مالك'}`}
                                    {team.filter(m => m.role === 'agent').length > 0 && ` · ${team.filter(m => m.role === 'agent').length} ${isEn ? 'AGENTS' : 'وكيل'}`}
                                </p>
                            </div>
                            <button onClick={() => setSection('team')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold glass border border-brand-border/30 text-brand-muted hover:text-brand-egg transition-all">
                                <UserPlus size={12} /> {isEn ? 'Invite' : 'دعوة'}
                            </button>
                        </div>
                        {team.length === 0 ? (
                            <p className="text-center text-brand-muted text-xs py-4 opacity-50">{isEn ? 'No team members yet' : 'لا يوجد أعضاء بعد'}</p>
                        ) : (
                            <div className="space-y-2.5">
                                {team.slice(0,4).map((m, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0" style={{background: avatarColor(m.name), color: '#001A11'}}>
                                            {initials(m.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-bold text-brand-egg truncate">{m.name}</p>
                                            <p className="text-[10px] text-brand-muted capitalize">{m.role} · {m.status || 'offline'}</p>
                                        </div>
                                        <button className="text-[10px] font-bold glass border border-brand-border/30 text-brand-muted px-2.5 py-1 rounded-lg hover:text-brand-egg transition-all">
                                            {isEn ? 'Edit' : 'تعديل'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* AI Assistant */}
                    <div className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[13px] font-black text-brand-egg">{isEn ? 'AI Assistant' : 'مساعد AI'}</p>
                                <p className="text-[10px] text-brand-muted uppercase tracking-wider mt-0.5">POWERED BY GROQ</p>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-full ${aiActive ? 'text-brand-accent' : 'text-brand-muted'}`}
                                style={{background: aiActive ? 'rgba(140,200,80,0.12)' : 'rgba(100,100,100,0.1)'}}>
                                ● {aiActive ? (isEn ? 'Active' : 'نشط') : (isEn ? 'Inactive' : 'معطل')}
                            </span>
                        </div>
                        <div>
                            {renderToggle({label:isEn?'Auto-reply unknown questions':'رد تلقائي على الأسئلة', field:"ai_auto_reply"})}
                            {renderToggle({label:isEn?'Draft replies for agent approval':'مسودة ردود للموافقة', field:"ai_draft_mode"})}
                            {renderToggle({label:isEn?'Auto-tag VIP customers':'تصنيف VIP تلقائي', field:"ai_auto_tag_vip"})}
                            {renderToggle({label:isEn?'Send recovery messages':'إرسال رسائل استرداد', field:"ai_send_recovery"})}
                            {renderToggle({label:isEn?'Escalate negative sentiment':'تصعيد المشاعر السلبية', field:"ai_escalate_negative"})}
                        </div>
                        <button onClick={() => setSection('ai')} className="mt-3 w-full py-2 rounded-xl text-[10px] font-black text-brand-muted glass border border-brand-border/20 hover:text-brand-accent tracking-widest uppercase">
                            ⚙ {isEn ? 'Safety & advanced' : 'الأمان والمتقدم'}
                        </button>
                    </div>
                </div>
            </div>
        );

        case 'whatsapp': return (
            <div className="glass rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-brand-border/20">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'#25D366'}}>
                        <MessageCircle size={18} color="#fff" />
                    </div>
                    <div>
                        <p className="text-[14px] font-black text-brand-egg">WhatsApp Cloud API</p>
                        <p className="text-[10px] text-brand-muted">META BUSINESS · OFFICIAL API</p>
                    </div>
                    <span className={`ml-auto text-[9px] font-black px-2 py-1 rounded-full ${waConnected ? 'text-brand-accent' : 'text-brand-muted'}`}
                        style={{background: waConnected ? 'rgba(140,200,80,0.12)' : 'rgba(100,100,100,0.1)'}}>
                        ● {waConnected ? 'CONNECTED' : 'NOT SET'}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {renderField({label:(isEn ? 'Phone Number' : 'رقم الهاتف'), field:"wa_phone", placeholder:"+20 100 000 0000", dir:"ltr"})}
                    {renderField({label:(isEn ? 'Phone Number ID' : 'معرف رقم الهاتف'), field:"wa_phone_id", placeholder:"123456789", dir:"ltr", secret:true})}
                    {renderField({label:(isEn ? 'Business Account ID' : 'معرف حساب الأعمال'), field:"wa_business_id", placeholder:"987654321", dir:"ltr", secret:true})}
                    {renderField({label:(isEn ? 'Permanent Access Token' : 'رمز الوصول الدائم'), field:"wa_token", placeholder:"EAAxxxxxxxx...", dir:"ltr", secret:true})}
                </div>
                <div className="p-3 rounded-xl text-[11px] text-brand-muted" style={{background:'rgba(140,200,80,0.05)',border:'1px solid rgba(140,200,80,0.1)'}}>
                    {isEn ? 'Find these values in Meta Business Suite → WhatsApp → API Setup' : 'ستجد هذه القيم في Meta Business Suite → WhatsApp → API Setup'}
                </div>
            </div>
        );

        case 'shopify': return (
            <div className="glass rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-brand-border/20">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'#96BF48'}}>
                        <ShoppingCart size={18} color="#fff" />
                    </div>
                    <div>
                        <p className="text-[14px] font-black text-brand-egg">Shopify Integration</p>
                        <p className="text-[10px] text-brand-muted">ADMIN API · WEBHOOKS · PRODUCT SYNC</p>
                    </div>
                    <span className={`ml-auto text-[9px] font-black px-2 py-1 rounded-full ${shopConnected ? 'text-blue-400' : 'text-brand-muted'}`}
                        style={{background: shopConnected ? 'rgba(59,130,246,0.12)' : 'rgba(100,100,100,0.1)'}}>
                        ● {shopConnected ? 'SYNCED' : 'NOT SET'}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {renderField({label:(isEn ? 'Store URL' : 'رابط المتجر'), field:"shopify_store", placeholder:"yourstore.myshopify.com", dir:"ltr"})}
                    {renderField({label:(isEn ? 'Admin API Key' : 'مفتاح Admin API'), field:"shopify_key", placeholder:"shpat_xxxxxxxx", dir:"ltr", secret:true})}
                </div>
                {/* OAuth connect button */}
                <div className="flex items-center gap-3 pt-1">
                    <button
                        onClick={() => {
                            const shop = (ws.shopify_store || '').replace(/https?:\/\//, '').replace(/\/$/, '');
                            if (!shop) return showToast(isEn ? 'Enter store URL first' : 'أدخل رابط المتجر أولاً', 'error');
                            window.location.href = `/auth?shop=${shop}`;
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{background:'#96BF48'}}>
                        <ShoppingCart size={14} />
                        {isEn ? 'Connect via Shopify OAuth (Recommended)' : 'ربط عبر Shopify OAuth (موصى به)'}
                    </button>
                    <p className="text-[10px] text-brand-muted">{isEn ? 'Gets a permanent token automatically' : 'يحصل على توكن دائم تلقائياً'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {renderField({label:(isEn ? 'API Secret' : 'API Secret'), field:"shopify_secret", placeholder:"shpss_xxxxxxxx", dir:"ltr", secret:true})}
                    {renderField({label:(isEn ? 'Webhook Secret' : 'Webhook Secret'), field:"shopify_webhook", placeholder:"whsec_xxxxxxxx", dir:"ltr", secret:true})}
                </div>
                {shopConnected && integrations.shopify && (
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            [isEn ? 'Products' : 'منتجات', integrations.shopify.products || 0],
                            [isEn ? 'Orders synced' : 'طلبات', integrations.shopify.orders || 0],
                            [isEn ? 'Abandoned carts' : 'سلات متروكة', integrations.shopify.abandoned || 0],
                        ].map(([lbl, val]) => (
                            <div key={lbl} className="glass-subtle rounded-xl p-3 text-center">
                                <p className="text-xl font-black text-brand-egg">{val.toLocaleString()}</p>
                                <p className="text-[10px] text-brand-muted mt-0.5">{lbl}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );

        case 'ai': return (
            <div className="space-y-4">
                <div className="glass rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-brand-border/20">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'#FF6B35'}}>
                            <Sparkles size={18} color="#fff" />
                        </div>
                        <div>
                            <p className="text-[14px] font-black text-brand-egg">AI Assistant</p>
                            <p className="text-[10px] text-brand-muted uppercase">POWERED BY GROQ</p>
                        </div>
                        <div className="ml-auto">
                            {renderToggle({label:"", field:"ai_enabled"})}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'System Instruction' : 'تعليمات النظام'}</label>
                        <textarea value={ws.ai_instruction} onChange={e => set('ai_instruction', e.target.value)}
                            rows={5} placeholder={isEn ? 'You are a helpful assistant for...' : 'أنت مساعد مفيد لـ...'}
                            className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2.5 text-xs focus:border-brand-accent outline-none resize-none text-brand-egg" />
                    </div>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-[13px] font-black text-brand-egg mb-4">{isEn ? 'Behaviour toggles' : 'إعدادات السلوك'}</p>
                    {renderToggle({label:isEn?'Auto-reply unknown questions':'رد تلقائي على الأسئلة المجهولة', field:"ai_auto_reply", description:isEn?'AI answers questions it recognises':'يجيب AI على الأسئلة التي يعرفها'})}
                    {renderToggle({label:isEn?'Draft replies for agent approval':'مسودة ردود للموافقة البشرية', field:"ai_draft_mode", description:isEn?'Show AI reply as draft before sending':'عرض رد AI كمسودة قبل الإرسال'})}
                    {renderToggle({label:isEn?'Auto-tag VIP customers':'تصنيف عملاء VIP تلقائياً', field:"ai_auto_tag_vip", description:isEn?'Tag high-value customers automatically':'يصنف العملاء ذوي القيمة تلقائياً'})}
                    {renderToggle({label:isEn?'Send recovery messages':'إرسال رسائل استرداد السلة', field:"ai_send_recovery", description:isEn?'Auto-send cart recovery on trigger':'إرسال استرداد السلة تلقائياً'})}
                    {renderToggle({label:isEn?'Escalate negative sentiment':'تصعيد المشاعر السلبية', field:"ai_escalate_negative", description:isEn?'Route angry/upset customers to human':'توجيه العملاء الغاضبين للبشر'})}
                </div>
            </div>
        );

        case 'team': return (
            <div className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-brand-border/20">
                    <div>
                        <p className="text-[14px] font-black text-brand-egg">{isEn ? 'Team & roles' : 'الفريق والأدوار'}</p>
                        <p className="text-[10px] text-brand-muted uppercase tracking-wider">{team.length} {isEn ? 'MEMBERS' : 'عضو'}</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold glass border border-brand-border/30 text-brand-muted hover:text-brand-egg transition-all">
                        <UserPlus size={13} /> {isEn ? 'Invite member' : 'دعوة عضو'}
                    </button>
                </div>
                {team.length === 0 ? (
                    <div className="text-center py-12 text-brand-muted">
                        <Users size={36} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-bold">{isEn ? 'No team members yet' : 'لا يوجد أعضاء بعد'}</p>
                        <p className="text-xs mt-1 opacity-60">{isEn ? 'Invite your first team member above.' : 'أضف أول عضو في فريقك.'}</p>
                    </div>
                ) : team.map((m, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 border-b border-brand-border/10 last:border-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-black shrink-0" style={{background: avatarColor(m.name), color:'#001A11'}}>
                            {initials(m.name)}
                        </div>
                        <div className="flex-1">
                            <p className="text-[13px] font-bold text-brand-egg">{m.name}</p>
                            <p className="text-[11px] text-brand-muted capitalize">{m.role} · {m.status || 'offline'}</p>
                        </div>
                        <button className="text-[11px] font-bold glass border border-brand-border/30 text-brand-muted px-3 py-1.5 rounded-xl hover:text-brand-egg transition-all">
                            {isEn ? 'Edit' : 'تعديل'}
                        </button>
                    </div>
                ))}
            </div>
        );

        case 'loyalty': return (
            <div className="glass rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-brand-border/20">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'#F59E0B'}}>
                        <Star size={18} color="#fff" />
                    </div>
                    <div>
                        <p className="text-[14px] font-black text-brand-egg">{isEn ? 'Loyalty Program' : 'برنامج الولاء'}</p>
                        <p className="text-[10px] text-brand-muted uppercase">POINTS · REWARDS · TIERS</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {renderField({label:(isEn ? 'Points per EGP spent' : 'نقاط لكل جنيه'), field:"loyalty_rate", placeholder:"1"})}
                    {renderField({label:(isEn ? 'Min points to redeem' : 'الحد الأدنى للاسترداد'), field:"loyalty_min", placeholder:"100"})}
                    {renderField({label:(isEn ? 'Point value (EGP)' : 'قيمة النقطة (جنيه)'), field:"loyalty_value", placeholder:"0.5"})}
                    {renderField({label:(isEn ? 'Expiry (days)' : 'انتهاء الصلاحية (يوم)'), field:"loyalty_expiry", placeholder:"365"})}
                </div>
            </div>
        );

        case 'appearance': return (
            <div className="glass rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-brand-border/20">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'#8B5CF6'}}>
                        <Palette size={18} color="#fff" />
                    </div>
                    <div>
                        <p className="text-[14px] font-black text-brand-egg">{isEn ? 'Appearance' : 'المظهر'}</p>
                        <p className="text-[10px] text-brand-muted uppercase">BRAND · COLORS · LOGO</p>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'Brand Color' : 'لون العلامة'}</label>
                    <div className="flex items-center gap-3">
                        <input type="color" value={branding.brand_color || '#8CC850'}
                            onChange={e => setBranding(p => ({...p, brand_color: e.target.value}))}
                            className="w-10 h-10 rounded-xl border-0 cursor-pointer bg-transparent" />
                        <span className="text-sm font-bold text-brand-egg">{branding.brand_color || '#8CC850'}</span>
                    </div>
                </div>
            </div>
        );

        default: return null;
        }
    };

    return (
        <div className={`animate-in fade-in duration-500 ${isEn ? 'text-left' : 'text-right'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-black text-brand-egg">{isEn ? 'App Settings' : 'إعدادات التطبيق'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5 uppercase">
                        {isEn ? `WORKSPACE · ${ws.brand_name || 'YOUR BRAND'}` : `مساحة العمل · ${ws.brand_name || 'علامتك'}`}
                    </p>
                </div>
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-50"
                    style={{background:'#FF6B35',color:'#fff'}}>
                    {saving ? <RefreshCcw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    {saving ? (isEn ? 'Saving...' : 'جاري الحفظ...') : (isEn ? 'Save changes' : 'حفظ التغييرات')}
                </button>
            </div>

            {/* Body: sidebar + content */}
            <div className="flex gap-3" style={{minHeight: 540}}>
                {/* Left sidebar */}
                <div className="glass rounded-2xl p-2 flex flex-col gap-0.5 self-start" style={{minWidth: 180}}>
                    {sideItems.map(({ id, icon: Icon, label }) => (
                        <button key={id} onClick={() => setSection(id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all text-left ${section === id ? 'bg-brand-accent/15 text-brand-accent' : 'text-brand-muted hover:text-brand-egg hover:bg-white/5'}`}>
                            <Icon size={14} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    {renderSection()}
                </div>
            </div>
        </div>
    );
};

const Sparkline = ({ values = [], color = '#8CC850', width = 64, height = 28 }) => {
    const pts = values.length < 2 ? Array(7).fill(0) : values;
    const max = Math.max(...pts, 1);
    const step = width / (pts.length - 1);
    const toY = v => height - (v / max) * height * 0.85 - 2;
    const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * step},${toY(v)}`).join(' ');
    return (
        <svg width={width} height={height} style={{ overflow: 'visible' }}>
            <polyline points={pts.map((v, i) => `${i * step},${toY(v)}`).join(' ')}
                fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        </svg>
    );
};

const StackedBarChart = ({ data = [], isEn = true }) => {
    const display = data.length > 0 ? data : Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i));
        return { label: `${d.getDate()}/${d.getMonth()+1}`, carts: 0, broadcasts: 0, direct: 0 };
    });
    const maxVal = Math.max(...display.map(d => (d.carts||0)+(d.broadcasts||0)+(d.direct||0)), 1);
    const h = 160;
    return (
        <svg width="100%" height={h + 20} style={{ display: 'block' }}>
            {display.map((d, i) => {
                const total = (d.carts||0)+(d.broadcasts||0)+(d.direct||0);
                const pct = total / maxVal;
                const barH = Math.max(pct * h, total > 0 ? 2 : 1);
                const x = `${(i / display.length) * 100}%`;
                const w = `${(1 / display.length) * 100 * 0.7}%`;
                const y = h - barH;
                const c1H = (d.carts||0)/Math.max(total,1)*barH;
                const c2H = (d.broadcasts||0)/Math.max(total,1)*barH;
                const c3H = barH - c1H - c2H;
                return (
                    <g key={i}>
                        <rect x={x} y={h - c1H} width={w} height={Math.max(c1H,0)} fill="#8CC850" opacity={total>0?0.9:0.12} rx="1" />
                        <rect x={x} y={h - c1H - c2H} width={w} height={Math.max(c2H,0)} fill="#FF6B35" opacity={total>0?0.9:0.12} rx="1" />
                        <rect x={x} y={y} width={w} height={Math.max(c3H,0)} fill="#93C5FD" opacity={total>0?0.9:0.12} rx="1" />
                    </g>
                );
            })}
            <line x1="0" y1={h} x2="100%" y2={h} stroke="#ffffff10" strokeWidth="1" />
        </svg>
    );
};

const DonutChart = ({ segments = [], total = 0, size = 130 }) => {
    const r = size / 2 - 12;
    const cx = size / 2, cy = size / 2;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    const arcs = segments.map(seg => {
        const pct = total > 0 ? seg.value / total : 0;
        const arc = { ...seg, pct, offset, dash: pct * circumference, gap: (1 - pct) * circumference };
        offset += pct * circumference;
        return arc;
    });
    return (
        <svg width={size} height={size}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff08" strokeWidth="18" />
            {total === 0 ? (
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff10" strokeWidth="18"
                    strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
                    strokeDashoffset="0" strokeLinecap="round" />
            ) : arcs.filter(a => a.pct > 0).map((a, i) => (
                <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth="18"
                    strokeDasharray={`${a.dash} ${a.gap}`}
                    strokeDashoffset={-a.offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${cx} ${cy})`} />
            ))}
            <text x={cx} y={cy - 6} textAnchor="middle" fill="#e8f0e0" fontSize="20" fontWeight="900">{total > 0 ? total.toLocaleString() : '0'}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7a6b" fontSize="9" fontWeight="700">TOTAL</text>
        </svg>
    );
};

const AnalyticsDashboard = ({ lang }) => {
    const isEn = lang === 'en';
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [period, setPeriod] = React.useState('30d');

    useEffect(() => {
        axios.get(`${API_URL}/analytics`)
            .then(r => setData(r.data && typeof r.data === 'object' ? r.data : {}))
            .catch(() => setData({}))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
        </div>
    );

    const { messages = {}, funnel = {}, autoStats = {}, topCustomers = [], daily = [], revenue = {} } = data || {};

    // Stat card values — real data only
    const totalRevenue = revenue.total || 0;
    const totalOrders = Object.values(funnel).reduce((s, v) => s + (Number(v) || 0), 0);
    const replyRate = Number(messages.responseRate) || 0;
    const autoTotal = (autoStats.done || 0) + (autoStats.failed || 0) + (autoStats.pending || 0) + (autoStats.cancelled || 0);
    const aiHandledPct = autoTotal > 0 ? Math.round((autoStats.done / autoTotal) * 100) : 0;

    // Sparkline values from daily array
    const sparkOut = daily.map(d => d.out || 0);
    const sparkIn  = daily.map(d => d.in  || 0);

    // Stacked bar chart data — map daily to revenue sources if available, else message counts
    const barData = daily.map(d => ({
        label: d.label || '',
        carts: d.carts || 0,
        broadcasts: d.broadcasts || 0,
        direct: d.direct || (d.out || 0),
    }));

    // Donut segments
    const aiReplied = autoStats.done || 0;
    const agentHandled = Math.max((messages.conversations || 0) - aiReplied, 0);
    const escalated = autoStats.failed || 0;
    const closed = Math.max((messages.totalInbound || 0) - (messages.conversations || 0), 0);
    const totalChats = aiReplied + agentHandled + escalated + closed;
    const donutSegments = [
        { label: isEn ? 'AI auto-replied' : 'رد AI تلقائي', value: aiReplied, color: '#8CC850' },
        { label: isEn ? 'Agent handled' : 'معالجة بشرية', value: agentHandled, color: '#93C5FD' },
        { label: isEn ? 'Escalated to human' : 'تصعيد للإنسان', value: escalated, color: '#FF6B35' },
        { label: isEn ? 'Closed without reply' : 'أُغلق بدون رد', value: closed, color: '#6B7280' },
    ];

    const now = new Date();
    const dateStr = `${now.toLocaleString('en', { month: 'short' }).toUpperCase()} ${now.getDate()} ROLLING`;

    return (
        <div className={`animate-in fade-in duration-500 ${isEn ? 'text-left' : 'text-right'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Analytics' : 'التقارير'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5 uppercase">
                        {isEn ? `LAST ${period.replace('d','')} DAYS · ${dateStr}` : `آخر ${period.replace('d','')} يوم`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 glass rounded-xl p-1 border border-brand-border/20">
                        {['7d','30d','90d'].map(p => (
                            <button key={p} onClick={() => setPeriod(p)}
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${period === p ? 'bg-brand-accent text-brand-bg' : 'text-brand-muted hover:text-brand-egg'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                    <a href={`${API_URL}/export/orders`} download
                        className="flex items-center gap-1.5 text-[11px] glass border border-brand-border/30 text-brand-muted px-3 py-1.5 rounded-xl font-bold hover:text-brand-egg transition-colors">
                        <Download size={12} /> {isEn ? 'Export' : 'تصدير'}
                    </a>
                </div>
            </div>

            {/* 4 stat cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                    {
                        label: isEn ? 'REVENUE · 30D' : 'الإيرادات',
                        value: `EGP ${totalRevenue.toLocaleString()}`,
                        spark: sparkOut,
                        sparkColor: '#8CC850',
                        change: revenue.change || null,
                    },
                    {
                        label: isEn ? 'ORDERS' : 'الطلبات',
                        value: totalOrders.toLocaleString(),
                        spark: sparkIn,
                        sparkColor: '#8CC850',
                        change: null,
                    },
                    {
                        label: isEn ? 'REPLY RATE' : 'معدل الرد',
                        value: `${replyRate}%`,
                        spark: sparkOut.map(v => v > 0 ? replyRate : 0),
                        sparkColor: '#8CC850',
                        change: null,
                    },
                    {
                        label: isEn ? 'AI AUTO-HANDLED' : 'معالجة AI',
                        value: `${aiHandledPct}%`,
                        spark: sparkOut.map(v => v > 0 ? aiHandledPct : 0),
                        sparkColor: '#FF6B35',
                        change: null,
                    },
                ].map((card, i) => (
                    <div key={i} className="glass rounded-2xl p-4 flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                            <p className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{card.label}</p>
                            <Sparkline values={card.spark} color={card.sparkColor} width={64} height={28} />
                        </div>
                        <p className="text-2xl font-black text-brand-egg leading-none">{card.value}</p>
                        {card.change != null && (
                            <p className="text-[11px] font-bold text-brand-accent">↑ {card.change}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Main 2-column section */}
            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 320px' }}>

                {/* LEFT: Stacked bar chart */}
                <div className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="font-black text-[13px] text-brand-egg">
                                {isEn ? 'Message activity · last 30 days' : 'نشاط الرسائل · آخر 30 يوم'}
                            </h3>
                            <p className="text-[9px] font-bold text-brand-muted tracking-wider uppercase mt-0.5">
                                {isEn ? 'ATTRIBUTED TO OMNIFLOW' : 'عبر OmniFlow'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-brand-muted">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:'#8CC850'}} />{isEn ? 'Recovered carts' : 'سلات مستردة'}</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:'#FF6B35'}} />{isEn ? 'Broadcasts' : 'إرسال جماعي'}</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:'#93C5FD'}} />{isEn ? 'Direct chat' : 'دردشة مباشرة'}</span>
                        </div>
                    </div>
                    <StackedBarChart data={barData} isEn={isEn} />
                </div>

                {/* RIGHT: Donut + breakdown */}
                <div className="glass rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-[13px] text-brand-egg">{isEn ? 'Conversation breakdown' : 'توزيع المحادثات'}</h3>
                        <span className="text-[9px] font-bold text-brand-muted tracking-wider uppercase">LAST 30 DAYS</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <DonutChart segments={donutSegments} total={totalChats} size={130} />
                        {totalChats > 0 && (
                            <div>
                                <p className="text-[11px] text-brand-muted text-center">AI-assisted volume</p>
                                <p className="text-[12px] font-black text-brand-accent text-center">
                                    {aiHandledPct > 0 ? `+ ${aiHandledPct}%` : '—'} vs pre-OmniFlow
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2.5 border-t border-brand-border/10 pt-3">
                        {donutSegments.map((seg, i) => {
                            const pct = totalChats > 0 ? Math.round((seg.value / totalChats) * 100) : 0;
                            return (
                                <div key={i} className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{background: seg.color}} />
                                        <span className="text-brand-muted font-medium">{seg.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-brand-muted font-bold">{seg.value.toLocaleString()}</span>
                                        <span className="font-black w-8 text-right" style={{color: seg.color}}>{pct}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
