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
    Download
} from 'lucide-react';

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

const App = () => {
    const [activeTab, setActiveTab] = useState('dash');
    const [orders, setOrders] = useState([]);
    const [inbox, setInbox] = useState([]);
    const [templates, setTemplates] = useState({});
    const [abandonedCarts, setAbandonedCarts] = useState([]);
    const [catalogId, setCatalogId] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [isConfigured, setIsConfigured] = useState(true);
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

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/orders`);
            setOrders(Array.isArray(res.data) ? res.data : []);
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

        const interval = setInterval(() => {
            fetchInbox();
            fetchOrders();
            fetchAbandonedCarts();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => { localStorage.setItem('omni_lang', lang); }, [lang]);
    useEffect(() => { localStorage.setItem('omni_theme', theme); }, [theme]);

    if (!isConfigured) {
        return <OnboardingScreen lang={lang} onLangChange={setLang} onComplete={(name) => { setBusinessName(name); setIsConfigured(true); }} />;
    }

    return (
        <div
            className={`flex h-screen bg-brand-bg overflow-hidden text-brand-text theme-${theme} ${lang === 'en' ? 'dir-ltr' : 'dir-rtl'} p-5 gap-3.5 relative`}
            dir={lang === 'en' ? 'ltr' : 'rtl'}
        >
            {/* Sidebar */}
            <aside className="w-[200px] glass-subtle rounded-2xl flex flex-col shrink-0 p-4">
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
                                        ? 'glass-strong text-brand-egg font-semibold'
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
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl glass-subtle">
                            <span className="text-[11px] font-bold text-brand-egg-mute tracking-wide">{lang === 'en' ? 'AI Auto-Reply' : 'الرد التلقائي'}</span>
                            <span className={`text-[10px] font-bold ${aiEnabled ? 'text-brand-accent' : 'text-brand-gold'}`}>{aiEnabled ? (lang === 'en' ? 'ON' : 'مفعل') : (lang === 'en' ? 'OFF' : 'معطل')}</span>
                            <button
                                onClick={toggleAI}
                                className={`w-10 h-5 rounded-full relative transition-all duration-300 ${aiEnabled ? 'bg-brand-accent shadow-[0_0_10px_rgba(140,200,80,0.3)]' : 'bg-brand-muted/30'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${lang === 'en' ? (aiEnabled ? 'right-1' : 'left-1') : (aiEnabled ? 'left-1' : 'right-1')}`}></div>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {activeTab === 'dash' && <Dashboard inbox={inbox} orders={orders} abandonedCarts={abandonedCarts} onOpenChat={handleOpenChat} setActiveTab={setActiveTab} lang={lang} aiEnabled={aiEnabled} />}

                    {activeTab === 'shop' && <ShopifyOrders orders={orders} refresh={fetchOrders} loading={loading} templates={templates} onOpenChat={handleOpenChat} showToast={showToast} lang={lang} />}
                    {activeTab === 'chat' && <ChatInterface inbox={inbox} orders={orders} activePhone={activeChatPhone} onSelectChat={setActiveChatPhone} refreshInbox={fetchInbox} templates={templates} showToast={showToast} lang={lang} />}
                    {activeTab === 'campaigns' && <CampaignsManager templates={templates} showToast={showToast} lang={lang} />}
                    {activeTab === 'automations' && <AutomationsManager templates={templates} showToast={showToast} lang={lang} />}
                    {activeTab === 'quick-replies' && <QuickRepliesManager showToast={showToast} lang={lang} />}
                    {activeTab === 'settings' && <TemplatesManager templates={templates} fetchTemplates={fetchTemplates} showToast={showToast} lang={lang} />}
                    {activeTab === 'config' && <SetupManager showToast={showToast} lang={lang} onSave={(name) => setBusinessName(name)} />}
                    {activeTab === 'abandoned' && <AbandonedCartsManager carts={abandonedCarts} refresh={fetchAbandonedCarts} showToast={showToast} lang={lang} />}
                    {activeTab === 'catalog' && <CatalogManager showToast={showToast} lang={lang} />}
                    {activeTab === 'logs' && <AnalyticsDashboard lang={lang} />}
                </div>

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
    const [localTemplates, setLocalTemplates] = useState({});
    const [saving, setSaving] = useState(false);
    const isEn = lang === 'en';

    useEffect(() => {
        setLocalTemplates(templates);
    }, [templates]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post(`${API_URL}/templates`, localTemplates);
            await fetchTemplates();
            showToast(isEn ? 'Templates saved successfully' : 'تم حفظ القوالب بنجاح');
        } catch (e) {
            showToast(isEn ? 'Error saving templates' : 'حدث خطأ أثناء حفظ القوالب', 'error');
        }
        setSaving(false);
    };

    const updateTemplate = (key, field, value) => {
        setLocalTemplates(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="glass p-8 rounded-2xl space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-brand-accent">{isEn ? 'Meta Verified Templates Management' : 'إدارة قوالب Meta المعتمدة'}</h3>
                        <p className="text-sm text-brand-muted mt-1">{isEn ? 'Link approved Facebook template names to the CRM system.' : 'اربط أسماء القوالب المعتمدة في فيسبوك بنظام الـ CRM.'}</p>
                    </div>
                    <button onClick={handleSave} disabled={saving} className="bg-brand-accent text-brand-bg px-6 py-3 rounded-xl font-bold hover:bg-brand-salad-deep transition-all">
                        {saving ? (isEn ? 'Saving...' : 'جاري الحفظ...') : (isEn ? 'Save Changes' : 'حفظ التعديلات')}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(localTemplates).map(([key, tpl]) => (
                        <div key={key} className={`bg-brand-bg/50 border border-brand-accent/10 p-6 rounded-2xl space-y-4 ${isEn ? 'text-left' : 'text-right'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-3 h-3 rounded-full bg-${tpl.color}`}></div>
                                <h4 className="font-bold">{tpl.title}</h4>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-brand-muted">{key === 'shipping' ? (isEn ? 'Template Name in Meta (Unused for shipping)' : 'اسم القالب في Meta (غير مستخدم للشحن)') : (isEn ? 'Template Name in Meta' : 'اسم القالب في Meta (Template Name)')}</label>
                                <input
                                    value={tpl.meta_name || ''}
                                    onChange={e => updateTemplate(key, 'meta_name', e.target.value)}
                                    className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2 text-sm focus:border-brand-accent/50 outline-none disabled:opacity-50"
                                    dir="ltr"
                                    disabled={key === 'shipping'}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-brand-muted">{key === 'shipping' ? (isEn ? 'Direct message body (Use [Name] for client name)' : 'نص الرسالة المباشرة (استخدم [Name] لاسم العميل)') : (isEn ? 'Message preview text' : 'معاينة نص الرسالة')}</label>
                                <textarea
                                    value={tpl.preview || ''}
                                    onChange={e => updateTemplate(key, 'preview', e.target.value)}
                                    className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2 text-sm h-20 focus:border-brand-accent/50 outline-none resize-none custom-scrollbar"
                                />
                            </div>
                            <div className="flex items-center gap-4 pt-1">
                                <div className="space-y-1 flex-1">
                                    <label className="text-xs text-brand-muted">{isEn ? 'Body params count ({{1}}, {{2}}...)' : 'عدد المتغيرات في النص ({{1}}, {{2}}...)'}</label>
                                    <input
                                        type="number"
                                        min="0" max="5"
                                        value={tpl.params_count ?? 0}
                                        onChange={e => updateTemplate(key, 'params_count', parseInt(e.target.value) || 0)}
                                        className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2 text-sm focus:border-brand-accent/50 outline-none"
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-brand-muted">{isEn ? 'Image header?' : 'يحتوي على صورة Header؟'}</label>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            id={`hdr-${key}`}
                                            checked={!!tpl.has_header_image}
                                            onChange={e => updateTemplate(key, 'has_header_image', e.target.checked)}
                                            className="w-4 h-4 accent-brand-accent"
                                        />
                                        <label htmlFor={`hdr-${key}`} className="text-xs text-brand-muted cursor-pointer">{isEn ? 'Yes' : 'نعم'}</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ShopifyOrders = ({ orders, refresh, loading, templates, onOpenChat, showToast, lang }) => {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const isEn = lang === 'en';

    const getStatusInfo = (localStatus) => {
        switch (localStatus) {
            case 'followed_up': return { label: isEn ? 'Followed Up' : 'تمت المتابعة', color: 'bg-brand-accent/20 text-brand-accent', icon: Clock };
            case 'confirmed': return { label: isEn ? 'Confirmed' : 'تم التأكيد', color: 'bg-green-500/20 text-green-500', icon: CheckCircle2 };
            case 'shipped': return { label: isEn ? 'Shipped' : 'تم الشحن', color: 'bg-blue-500/20 text-blue-500', icon: Truck };
            case 'cancelled': return { label: isEn ? 'Cancelled' : 'ملغى', color: 'bg-red-500/20 text-red-500', icon: XCircle };
            default: return { label: isEn ? 'New' : 'جديد', color: 'bg-brand-muted/20 text-brand-muted', icon: LayoutDashboard };
        }
    };

    return (
        <div className={`relative h-full ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
                        <input
                            type="text"
                            placeholder={isEn ? "Search orders..." : "بحث في الطلبات..."}
                            className="w-full bg-brand-card/50 border border-brand-accent/10 rounded-2xl py-3 pr-12 pl-4 text-sm focus:outline-none focus:border-brand-accent/40 transition-all"
                        />
                    </div>
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="bg-brand-accent text-brand-bg px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
                    >
                        <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                        {loading ? (isEn ? "Updating..." : "جاري التحديث...") : (isEn ? "Refresh Orders" : "تحديث الطلبات")}
                    </button>
                </div>

                <div className="glass rounded-2xl overflow-hidden animate-in fade-in">
                    <table className={`w-full ${isEn ? 'text-left' : 'text-right'}`}>
                        <thead>
                            <tr className="bg-brand-sidebar/50 text-brand-muted text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold">{isEn ? "Order ID" : "رقم الطلب"}</th>
                                <th className="px-6 py-4 font-bold">{isEn ? "Customer" : "العميل"}</th>
                                <th className="px-6 py-4 font-bold">{isEn ? "Product" : "المنتج"}</th>
                                <th className="px-6 py-4 font-bold">{isEn ? "Status (CRM)" : "الحالة (CRM)"}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-accent/5">
                            {orders.map(o => {
                                const statusObj = getStatusInfo(o.local_status);
                                const StatusIcon = statusObj.icon;
                                return (
                                    <tr key={o.id} onClick={() => setSelectedOrder(o)} className="hover:bg-brand-accent/10 transition-all cursor-pointer group">
                                        <td className="px-6 py-4 font-mono text-sm">{o.name}</td>
                                        <td className="px-6 py-4 font-bold text-sm">{o.customer?.first_name} {o.customer?.last_name}</td>
                                        <td className="px-6 py-4 text-brand-muted text-sm font-bold truncate max-w-[200px]">{o.line_items?.[0]?.title}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusObj.color}`}>
                                                <StatusIcon size={14} />
                                                {statusObj.label}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CRM Drawer Overlay */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                    onClick={() => setSelectedOrder(null)}
                ></div>
            )}
            <div className={`fixed ${isEn ? 'right-0' : 'left-0'} top-0 bottom-0 w-[420px] bg-brand-sidebar border-x border-brand-accent/10 transform transition-transform duration-300 z-50 flex flex-col shadow-2xl ${selectedOrder ? 'translate-x-0' : (isEn ? 'translate-x-full' : '-translate-x-full')}`}>
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
                const messageBody = (tpl.preview || (isEn ? `Hello [Name],\nYour order is on its way! 🚚` : `مرحباً [Name]،\nطلبك الآن في طريقه إليك! 🚚`)).replace('[Name]', customerName);
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
        <div className={`flex h-[calc(100vh-10rem)] bg-brand-card/30 border border-brand-accent/10 rounded-2xl overflow-hidden glass animate-in fade-in duration-500 shadow-2xl ${isEn ? 'text-left' : 'text-right'}`}>
            {/* Chat List */}
            <div className={`w-80 border-${isEn ? 'r' : 'l'} border-brand-accent/10 flex flex-col bg-brand-sidebar/80`}>
                <div className="p-4 border-b border-brand-accent/10 space-y-3">
                    <div>
                        <h3 className="font-bold text-lg">{isEn ? 'Inbox' : 'المحادثات'}</h3>
                        <p className="text-[10px] font-mono text-brand-muted tracking-wider uppercase">{isEn ? 'ALL CONVERSATIONS' : 'كل المحادثات'} · {displayInbox.length} {isEn ? 'OPEN' : 'مفتوحة'}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {[
                            { id: 'all', label: isEn ? 'All' : 'الكل', count: displayInbox.length },
                            { id: 'live', label: isEn ? 'Live' : 'مباشر', count: liveCount, dot: 'bg-brand-accent' },
                            { id: 'cart', label: isEn ? 'Cart' : 'سلة', count: cartCount, dot: 'bg-brand-gold' },
                            { id: 'mine', label: isEn ? 'Mine' : 'لي', count: mineCount },
                        ].map(f => (
                            <button key={f.id} onClick={() => setChatFilter(f.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${chatFilter === f.id ? 'bg-brand-accent text-brand-bg' : 'bg-brand-bg/60 text-brand-muted hover:bg-brand-accent/10 border border-brand-accent/10'}`}>
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
                                className={`px-3 py-3.5 cursor-pointer transition-all hover:bg-brand-accent/5 flex items-start gap-3 ${isActive ? 'bg-brand-accent/10' : ''}`}
                            >
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
            <div className="flex-1 flex flex-col relative bg-brand-bg/40">
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
                                    <Tag size={14} /> {isEn ? 'Tag VIP' : 'تصنيف'}
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
                                                ? 'bg-brand-green-soft border border-brand-border/50'
                                                : 'glass-subtle'
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
                                <div className="bg-brand-green-soft/50 border border-brand-accent/20 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-brand-muted tracking-wider uppercase">
                                        <Sparkles size={12} className="text-brand-accent" />
                                        SMART REPLY · DRAFTED
                                    </div>
                                    <p className="text-sm text-brand-text leading-relaxed">{aiSuggestions[0]}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setMsgText(aiSuggestions[0]); handleSend(); setAiSuggestions([]); }}
                                            className="px-4 py-2 bg-brand-accent text-brand-bg rounded-xl text-xs font-bold hover:bg-brand-salad-deep transition-all">{isEn ? 'Send' : 'إرسال'}</button>
                                        <button onClick={() => { setMsgText(aiSuggestions[0]); setAiSuggestions([]); }}
                                            className="px-4 py-2 glass-subtle rounded-xl text-xs font-bold text-brand-egg hover:bg-brand-egg/10 transition-all">{isEn ? 'Edit' : 'تعديل'}</button>
                                        <button onClick={() => setAiSuggestions([])}
                                            className="px-4 py-2 text-xs font-bold text-brand-muted hover:text-brand-text transition-all">{isEn ? 'Dismiss' : 'تجاهل'}</button>
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
                                    className="bg-brand-gold text-white w-10 h-10 rounded-xl flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-30 disabled:bg-brand-muted/20 shrink-0">
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
                <div className={`w-72 border-${isEn ? 'l' : 'r'} border-brand-accent/10 flex flex-col bg-brand-sidebar/90 overflow-y-auto custom-scrollbar`}>
                    {/* Profile header */}
                    <div className="p-6 flex flex-col items-center text-center border-b border-brand-accent/10">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3 ${getAvatarColor(activeChat.name)}`}>
                            {getInitials(activeChat.name)}
                        </div>
                        <h4 className="font-bold text-brand-text text-base">{activeChat.name}</h4>
                        <p className="text-[11px] text-brand-muted font-mono mt-1 dir-ltr">{maskedPhone}</p>
                        {customerOrders.length >= 3 && (
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
                                <span className="font-bold text-brand-text">#{customerOrders[0].order_number || customerOrders[0].id}</span>
                            </div>
                        )}
                    </div>

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
                    {customerOrders.length > 0 && !showTeamPanel && (
                        <div className="p-4 space-y-3">
                            <p className="text-[10px] font-mono text-brand-muted tracking-wider uppercase">{isEn ? 'RECENT ITEMS' : 'العناصر الأخيرة'}</p>
                            {customerOrders.slice(0, 3).map((o, i) => (
                                <div key={i} className="flex items-center gap-3 py-2">
                                    <div className="w-10 h-10 rounded-lg bg-brand-green-soft border border-brand-border/50 flex items-center justify-center shrink-0">
                                        <Package size={16} className="text-brand-accent" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-brand-text truncate">{o.line_items?.[0]?.name || `Order #${o.order_number || o.id}`}</p>
                                    </div>
                                    <span className="text-[10px] text-brand-muted shrink-0">×{o.line_items?.[0]?.quantity || 1}</span>
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
                <div className="glass rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-2xl group-hover:opacity-90/10 transition-all"></div>
                    <div className="space-y-4 relative z-10">
                        <div className="w-12 h-12 bg-brand-gold/10 rounded-2xl flex items-center justify-center border border-brand-gold/20">
                            <Megaphone className="text-brand-gold" size={24} />
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
    <div className="glass p-5 rounded-2xl group hover:border-brand-accent/30 transition-all cursor-default relative">
        <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-brand-green-soft border border-brand-border/50">
                <Icon size={20} className="text-brand-accent" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-brand-muted font-bold">{title}</p>
                <h4 className={`text-2xl font-bold ${color}`}>{value}</h4>
                {subtitle && <p className="text-[10px] text-brand-muted font-mono mt-0.5">{subtitle}</p>}
            </div>
        </div>
        {badge && (
            <span className={`absolute top-4 end-4 text-[10px] font-bold font-mono ${badgeColor} flex items-center gap-1`}>
                {badgeDot && <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse"></span>}
                {badge}
            </span>
        )}
    </div>
);

const CampaignsManager = ({ templates, showToast, lang }) => {
    const [customers, setCustomers] = useState([]);
    const [selectedPhones, setSelectedPhones] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [campaignType, setCampaignType] = useState('template');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [messageText, setMessageText] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [templateImageUrl, setTemplateImageUrl] = useState('');
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(null);
    const [selectedTag, setSelectedTag] = useState('all');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleName, setScheduleName] = useState('');
    const [scheduling, setScheduling] = useState(false);
    const [scheduledList, setScheduledList] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productSearch, setProductSearch] = useState('');
    const [customProductNote, setCustomProductNote] = useState('');
    const [campaignHeader, setCampaignHeader] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');
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
        axios.get(`${API_URL}/broadcasts`).then(r => setScheduledList(r.data)).catch(() => {});
        axios.get(`${API_URL}/shopify/products`).then(r => setProducts(r.data.products || [])).catch(() => {});
    }, []);

    const buildProductMsg = (p, name = '[Name]') => {
        const lines = [];
        if (campaignHeader) {
            lines.push(`🎉 *${campaignHeader}*`);
            lines.push('');
        }
        lines.push(`🛍️ *${p.title}*`);
        lines.push('');
        const orig = parseFloat(originalPrice);
        const sale = parseFloat(p.price);
        if (originalPrice && orig > sale) {
            const pct = Math.round(((orig - sale) / orig) * 100);
            lines.push(`~${isEn ? 'Was' : 'كان'}: ${orig.toFixed(0)} EGP~`);
            lines.push(`✅ *${isEn ? 'Now' : 'الآن'}: ${sale.toFixed(0)} EGP*`);
            lines.push(`🔥 ${isEn ? `You save ${pct}%!` : `وفّر ${pct}%!`}`);
        } else {
            lines.push(`💰 ${isEn ? 'Price' : 'السعر'}: ${p.price} EGP`);
        }
        if (p.sku) lines.push(`📦 SKU: ${p.sku}`);
        if (customProductNote) { lines.push(''); lines.push(customProductNote); }
        lines.push('');
        lines.push(`🔗 ${p.url}`);
        return lines.join('\n').replace('[Name]', name);
    };

    const handleSchedule = async () => {
        if (!scheduleDate) return showToast(isEn ? 'Pick a date/time first' : 'اختر موعد الإرسال أولاً', 'error');
        if (campaignType === 'template' && !selectedTemplate) return showToast(isEn ? 'Select a template' : 'اختر قالب', 'error');
        if (campaignType === 'text' && !messageText.trim()) return showToast(isEn ? 'Write the message text' : 'اكتب نص الرسالة', 'error');
        if (campaignType === 'product' && !selectedProduct) return showToast(isEn ? 'Select a product first' : 'اختر منتجاً أولاً', 'error');
        setScheduling(true);
        try {
            const res = await axios.post(`${API_URL}/broadcasts`, {
                name: scheduleName || (isEn ? 'Scheduled Broadcast' : 'حملة مجدولة'),
                scheduled_at: new Date(scheduleDate).toISOString(),
                campaign_type: campaignType === 'product' ? 'text' : campaignType,
                template_id: selectedTemplate || null,
                message_text: campaignType === 'product' ? buildProductMsg(selectedProduct) : messageText,
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

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setSelectedImage(reader.result);
        reader.readAsDataURL(file);
    };

    const startCampaign = async () => {
        if (selectedPhones.size === 0) return showToast(isEn ? "Please select at least one customer" : "الرجاء تحديد عميل واحد على الأقل", "error");
        if (campaignType === 'template' && !selectedTemplate) return showToast(isEn ? "Please select a template" : "الرجاء اختيار قالب", "error");
        if (campaignType === 'template' && templates[selectedTemplate]?.has_header_image && !templateImageUrl.trim()) return showToast(isEn ? "Please enter the header image URL for this template" : "الرجاء إدخال رابط صورة الهيدر لهذا القالب", "error");
        if (campaignType === 'text' && !messageText.trim() && !selectedImage) return showToast(isEn ? "Please type a message or select an image" : "الرجاء كتابة رسالة أو اختيار صورة", "error");
        if (campaignType === 'product' && !selectedProduct) return showToast(isEn ? "Please select a product" : "الرجاء اختيار منتج", "error");

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
                } else if (campaignType === 'product') {
                    await axios.post(`${API_URL}/whatsapp/send`, {
                        phone: customer.phone,
                        textMsg: buildProductMsg(selectedProduct, customer.name),
                        actionType: 'campaign',
                        orderName: customer.name
                    });
                } else {
                    const msg = messageText.replace('[Name]', customer.name);
                    await axios.post(`${API_URL}/whatsapp/send`, {
                        phone: customer.phone,
                        textMsg: msg,
                        imageBase64: selectedImage,
                        actionType: 'campaign',
                        orderName: customer.name
                    });
                }
                successCount++;
            } catch (e) {
                const errMsg = e.response?.data?.error || e.message || (isEn ? 'Unknown error' : 'خطأ غير معروف');
                lastError = `${customer.name}: ${errMsg}`;
                console.error(`Failed to send to ${customer.phone}:`, errMsg);
            }

            setProgress({ current: i + 1, total: targets.length });
            if (i < targets.length - 1) await new Promise(resolve => setTimeout(resolve, 2000));
        }

        setSending(false);
        const failed = targets.length - successCount;
        if (successCount === 0) {
            showToast((isEn ? "All sends failed! " : "فشل الإرسال! ") + (lastError || ''), "error");
        } else if (failed > 0) {
            showToast(isEn ? `Done: ${successCount} sent, ${failed} failed. Last error: ${lastError}` : `تم: ${successCount} نجح، ${failed} فشل. آخر خطأ: ${lastError}`, "error");
        } else {
            showToast(isEn ? `Campaign complete! ${successCount}/${targets.length} sent successfully.` : `تمت الحملة! تم إرسال ${successCount}/${targets.length} بنجاح.`, "success");
        }
    };

    return (
        <div className={`space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500 pb-20 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="flex justify-between items-center bg-brand-card/60 backdrop-blur-xl p-6 rounded-2xl border border-brand-accent/10">
                <div>
                    <h2 className="text-2xl font-bold text-brand-accent flex items-center gap-2">
                        <Megaphone size={28} className="shrink-0" />
                        {isEn ? "Mass Broadcast Campaigns" : "حملات الترويج الشاملة (Broadcast)"}
                    </h2>
                    <p className="text-sm text-brand-muted mt-2">{isEn ? "Safely broadcast offers and real-time alerts to your segmented customer audience with one click." : "أرسل عروضك وتحديثاتك لجميع عملائك بضغطة زر وبطريقة آمنة."}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Campaign Composer */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass p-6 rounded-2xl space-y-6">
                        <h3 className="font-bold text-lg border-b border-brand-accent/10 pb-3">{isEn ? "Campaign Content" : "محتوى الحملة"}</h3>

                        <div className="space-y-3">
                            <label className="text-sm text-brand-muted block">{isEn ? "Broadcast Type" : "نوع الإرسال"}</label>
                            <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-accent/20">
                                <button onClick={() => setCampaignType('template')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${campaignType === 'template' ? 'bg-brand-accent text-brand-bg shadow-md' : 'text-brand-muted hover:text-brand-accent'}`}>{isEn ? "Template" : "قالب"}</button>
                                <button onClick={() => setCampaignType('text')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${campaignType === 'text' ? 'bg-brand-accent text-brand-bg shadow-md' : 'text-brand-muted hover:text-brand-accent'}`}>{isEn ? "Free Text" : "رسالة حرة"}</button>
                                <button onClick={() => setCampaignType('product')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${campaignType === 'product' ? 'bg-brand-accent text-brand-bg shadow-md' : 'text-brand-muted hover:text-brand-accent'}`}>{isEn ? "Product" : "منتج"}</button>
                            </div>
                            {campaignType === 'text' && (
                                <p className="text-[10px] text-red-400 bg-red-400/10 p-2 rounded-lg">{isEn ? "Note: Free text messages might fail if it's been more than 24h since the customer's last incoming message per Meta policy." : "تنبيه: الرسائل الحرة قد تفشل إذا مر أكثر من 24 ساعة على آخر تواصل مع العميل حسب سياسة Meta."}</p>
                            )}
                        </div>

                        {campaignType === 'template' ? (
                            <div className="space-y-3">
                                <label className="text-sm text-brand-muted block">{isEn ? "Select Template" : "اختر القالب"}</label>
                                <select
                                    value={selectedTemplate}
                                    onChange={e => setSelectedTemplate(e.target.value)}
                                    className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-3 text-sm focus:border-brand-accent outline-none"
                                >
                                    <option value="">{isEn ? "-- Select Marketing Template --" : "-- اختر قالب التسويق --"}</option>
                                    {Object.entries(templates).map(([k, t]) => (
                                        <option key={k} value={k}>{t.title} ({t.meta_name})</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm text-brand-muted block">{isEn ? "Message Body (Use [Name] as placeholder)" : "النص (استخدم [Name] لذكر الاسم)"}</label>
                                <textarea
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                    placeholder={isEn ? "Hello [Name], we have a special offer for you..." : "مرحباً [Name]، لدينا عرض خاص لك..."}
                                    className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-3 text-sm focus:border-brand-accent outline-none min-h-[120px] resize-none"
                                />
                            </div>
                        )}

                        {campaignType === 'product' && (
                            <div className="space-y-3">
                                {/* Header */}
                                <div>
                                    <label className="text-xs font-bold text-brand-text block mb-1.5">{isEn ? '🎉 Campaign Header' : '🎉 عنوان الحملة الجذاب'}</label>
                                    <input
                                        type="text"
                                        placeholder={isEn ? 'e.g. Limited offer — today only!' : 'مثال: عرض محدود — اليوم فقط!'}
                                        value={campaignHeader}
                                        onChange={e => setCampaignHeader(e.target.value)}
                                        className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-2.5 text-xs focus:border-brand-accent outline-none"
                                        dir={isEn ? 'ltr' : 'rtl'}
                                    />
                                </div>

                                {/* Product Search */}
                                <div>
                                    <label className="text-xs font-bold text-brand-text block mb-1.5">{isEn ? 'Select Product' : 'اختر المنتج'}</label>
                                    <input
                                        type="text"
                                        placeholder={isEn ? 'Search products...' : 'ابحث عن منتج...'}
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                        className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-2.5 text-xs focus:border-brand-accent outline-none"
                                    />
                                </div>
                                {products.length === 0 ? (
                                    <p className="text-xs text-brand-muted text-center py-4">{isEn ? 'No products. Check Shopify connection.' : 'لا توجد منتجات. تحقق من ربط شوبيفاي.'}</p>
                                ) : (
                                    <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                        {products.filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => setSelectedProduct(p)}
                                                className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                    selectedProduct?.id === p.id
                                                        ? 'border-brand-accent bg-brand-accent/10'
                                                        : 'border-brand-accent/10 bg-brand-bg/30 hover:border-brand-accent/30'
                                                }`}
                                            >
                                                {p.image
                                                    ? <img src={p.image} alt={p.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                                                    : <div className="w-9 h-9 rounded-lg bg-brand-accent/10 flex items-center justify-center shrink-0"><Package size={14} className="text-brand-accent/50" /></div>
                                                }
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold truncate">{p.title}</p>
                                                    <p className="text-[11px] text-brand-accent">{p.price} EGP</p>
                                                </div>
                                                {selectedProduct?.id === p.id && <CheckCircle2 size={14} className="text-brand-accent shrink-0" />}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Discount */}
                                <div>
                                    <label className="text-xs font-bold text-brand-text block mb-1.5">{isEn ? '🔥 Original Price (before discount)' : '🔥 السعر الأصلي قبل الخصم'}</label>
                                    <input
                                        type="number"
                                        placeholder={isEn ? 'e.g. 350 — leave empty if no discount' : 'مثال: 350 — اتركه فاضي لو مفيش خصم'}
                                        value={originalPrice}
                                        onChange={e => setOriginalPrice(e.target.value)}
                                        className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-2.5 text-xs focus:border-brand-accent outline-none"
                                        dir="ltr"
                                        min="0"
                                    />
                                    {selectedProduct && originalPrice && parseFloat(originalPrice) > parseFloat(selectedProduct.price) && (
                                        <p className="text-[11px] text-green-400 mt-1 font-bold">
                                            🏷️ {isEn ? `Discount: ${Math.round(((parseFloat(originalPrice) - parseFloat(selectedProduct.price)) / parseFloat(originalPrice)) * 100)}% OFF` : `خصم: ${Math.round(((parseFloat(originalPrice) - parseFloat(selectedProduct.price)) / parseFloat(originalPrice)) * 100)}%`}
                                        </p>
                                    )}
                                </div>

                                {/* Extra Note */}
                                <div>
                                    <label className="text-xs font-bold text-brand-text block mb-1.5">{isEn ? 'Extra note (optional, use [Name])' : 'ملاحظة إضافية (اختياري، استخدم [Name])'}</label>
                                    <textarea
                                        value={customProductNote}
                                        onChange={e => setCustomProductNote(e.target.value)}
                                        placeholder={isEn ? 'e.g. Special offer just for you [Name]!' : 'مثال: عرض خاص عليك انت يا [Name]!'}
                                        rows={2}
                                        className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-2.5 text-xs focus:border-brand-accent outline-none resize-none"
                                        dir={isEn ? 'ltr' : 'rtl'}
                                    />
                                </div>

                                {/* Preview */}
                                {selectedProduct && (
                                    <div className="bg-brand-bg/60 rounded-xl p-3 border border-brand-accent/10">
                                        <p className="text-[10px] text-brand-muted mb-1.5 font-bold">{isEn ? '👁 Message Preview:' : '👁 معاينة الرسالة:'}</p>
                                        <pre className="text-[10px] text-brand-text whitespace-pre-wrap font-sans leading-relaxed" dir="ltr">{buildProductMsg(selectedProduct, 'محمد')}</pre>
                                    </div>
                                )}
                            </div>
                        )}

                        {campaignType === 'template' && selectedTemplate && templates[selectedTemplate]?.has_header_image ? (
                            <div className="space-y-2 pt-2 border-t border-brand-accent/10">
                                <label className="text-sm text-brand-muted block">{isEn ? "Header Image URL (required for this template)" : "رابط صورة الهيدر (مطلوب لهذا القالب)"}</label>
                                <input
                                    type="url"
                                    value={templateImageUrl}
                                    onChange={e => setTemplateImageUrl(e.target.value)}
                                    placeholder="https://cdn.example.com/image.jpg"
                                    dir="ltr"
                                    className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-3 text-sm focus:border-brand-accent outline-none"
                                />
                                <p className="text-[10px] text-brand-muted">{isEn ? "Paste a public image URL (Shopify CDN, Google Drive, etc.)" : "الصق رابط صورة عام (Shopify CDN أو أي رابط مباشر للصورة)"}</p>
                                {templateImageUrl && <img src={templateImageUrl} alt="preview" className="h-20 rounded-lg border border-brand-accent/20 object-cover shadow-sm mt-1" onError={e => e.target.style.display='none'} />}
                            </div>
                        ) : campaignType === 'text' ? (
                            <div className="space-y-2 pt-2 border-t border-brand-accent/10">
                                <label className="text-sm text-brand-muted block">{isEn ? "Attach Image (Optional)" : "إرفاق صورة (اختياري)"}</label>
                                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-brand-bg border border-brand-accent/20 border-dashed rounded-xl py-4 flex flex-col items-center justify-center text-brand-muted hover:text-brand-accent hover:border-brand-accent transition-colors">
                                    <ImageIcon size={24} className="mb-2" />
                                    <span className="text-xs">{isEn ? "Choose image from device" : "اختر صورة من جهازك"}</span>
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                                {selectedImage && (
                                    <div className="relative mt-2 inline-block">
                                        <img src={selectedImage} alt="preview" className="h-20 rounded-lg border border-brand-accent/20 object-cover shadow-sm" />
                                        <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12} /></button>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        <div className="pt-4 border-t border-brand-accent/10 space-y-3">
                            <button
                                onClick={startCampaign}
                                disabled={sending || selectedPhones.size === 0}
                                className="w-full bg-brand-gold text-brand-egg py-4 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 glow-pumpkin"
                            >
                                <Send size={20} className="shrink-0" />
                                {sending ? (isEn ? "Broadcasting..." : "جاري الإرسال...") : (isEn ? `Broadcast Now (${selectedPhones.size})` : `إرسال الآن (${selectedPhones.size})`)}
                            </button>

                            {/* Scheduled Broadcast */}
                            <div className="bg-brand-bg/60 rounded-xl p-4 border border-brand-accent/10 space-y-3">
                                <p className="text-xs font-bold text-brand-muted flex items-center gap-1.5"><Calendar size={13} /> {isEn ? 'Schedule for later' : 'جدولة لوقت لاحق'}</p>
                                <input
                                    type="text"
                                    value={scheduleName}
                                    onChange={e => setScheduleName(e.target.value)}
                                    placeholder={isEn ? 'Broadcast name (optional)' : 'اسم الحملة (اختياري)'}
                                    className="w-full bg-brand-input border border-brand-accent/20 rounded-lg px-3 py-2 text-xs focus:border-brand-accent outline-none"
                                />
                                <input
                                    type="datetime-local"
                                    value={scheduleDate}
                                    onChange={e => setScheduleDate(e.target.value)}
                                    className="w-full bg-brand-input border border-brand-accent/20 rounded-lg px-3 py-2 text-xs focus:border-brand-accent outline-none"
                                />
                                <button onClick={handleSchedule} disabled={scheduling || !scheduleDate}
                                    className="w-full bg-brand-accent/10 text-brand-accent py-2.5 rounded-xl font-bold text-sm hover:bg-brand-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    <Calendar size={16} />
                                    {scheduling ? (isEn ? 'Scheduling...' : 'جاري الجدولة...') : (isEn ? 'Schedule Broadcast' : 'جدولة الحملة')}
                                </button>
                            </div>
                        </div>

                        {progress && (
                            <div className="space-y-2 bg-brand-bg p-4 rounded-xl border border-brand-accent/10">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-brand-accent">{isEn ? "Campaign Progress" : "تقدم الحملة"}</span>
                                    <span>{progress.current} / {progress.total}</span>
                                </div>
                                <div className="w-full bg-brand-card rounded-full h-2 overflow-hidden">
                                    <div className="bg-brand-gold h-2 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Target Audience List */}
                <div className="lg:col-span-2">
                    <div className="glass p-6 rounded-2xl h-[600px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">{isEn ? `Target Audience (${filteredCustomers.length})` : `الجمهور المستهدف (${filteredCustomers.length})`}</h3>
                            <button onClick={toggleAll} className="text-sm bg-brand-accent/10 text-brand-accent px-4 py-2 rounded-lg hover:bg-brand-accent/20 transition-colors font-bold shrink-0">
                                {filteredCustomers.length > 0 && filteredCustomers.every(c => selectedPhones.has(c.phone)) ? (isEn ? "Deselect All" : "إلغاء تحديد الفئة") : (isEn ? "Select All" : "تحديد الفئة")}
                            </button>
                        </div>

                        {/* Tag Filters */}
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar shrink-0 border-b border-brand-accent/5">
                            <button onClick={() => setSelectedTag('all')} className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${selectedTag === 'all' ? 'bg-brand-accent text-brand-bg shadow-md' : 'bg-brand-bg/60 text-brand-muted hover:text-brand-text'}`}>{isEn ? `All (${customers.length})` : `الكل (${customers.length})`}</button>
                            <button onClick={() => setSelectedTag('vip')} className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${selectedTag === 'vip' ? 'bg-brand-accent text-brand-bg shadow-md' : 'bg-brand-bg/60 text-brand-muted hover:text-brand-text'}`}>👑 {isEn ? "VIP Clients" : "عملاء VIP"}</button>
                            <button onClick={() => setSelectedTag('buyer')} className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${selectedTag === 'buyer' ? 'bg-brand-accent text-brand-bg shadow-md' : 'bg-brand-bg/60 text-brand-muted hover:text-brand-text'}`}>🛍️ {isEn ? "Verified Buyers" : "مشترين"}</button>
                            <button onClick={() => setSelectedTag('chat')} className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${selectedTag === 'chat' ? 'bg-brand-accent text-brand-bg shadow-md' : 'bg-brand-bg/60 text-brand-muted hover:text-brand-text'}`}>💬 {isEn ? "Active Chats" : "متفاعلين"}</button>
                        </div>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                {filteredCustomers.map((c, i) => (
                                    <div key={i} onClick={() => toggleCustomer(c.phone)} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedPhones.has(c.phone) ? 'bg-brand-accent/5 border-brand-accent/50' : 'bg-brand-bg/50 border-brand-accent/10 hover:border-brand-accent/30'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${selectedPhones.has(c.phone) ? 'bg-brand-accent border-brand-accent text-brand-bg' : 'border-brand-muted'}`}>
                                                {selectedPhones.has(c.phone) && <CheckCircle2 size={14} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">{c.name}</h4>
                                                <p className={`text-xs text-brand-muted mt-0.5 ${isEn ? 'text-left' : 'text-right'}`} dir="ltr">{c.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {c.tag && <span className="text-[10px] bg-brand-card/80 border border-brand-accent/10 px-2 py-1 rounded font-bold text-brand-accent">{c.tag}</span>}
                                            <span className="text-[10px] bg-brand-bg px-2 py-1 rounded text-brand-muted">{c.source}</span>
                                        </div>
                                    </div>
                                ))}
                                {customers.length === 0 && (
                                    <div className="text-center py-10 text-brand-muted">{isEn ? "No target clients available." : "لا يوجد عملاء متاحين."}</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Scheduled Broadcasts List */}
            {scheduledList.length > 0 && (
                <div className="glass p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-brand-accent flex items-center gap-2">
                        <Calendar size={18} /> {isEn ? 'Scheduled Broadcasts' : 'الحملات المجدولة'}
                    </h3>
                    <div className="space-y-3">
                        {[...scheduledList].reverse().map(b => (
                            <div key={b.id} className="flex items-center justify-between bg-brand-bg/60 rounded-xl p-4 border border-brand-accent/10">
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-brand-text truncate">{b.name}</p>
                                    <p className="text-xs text-brand-muted mt-0.5">
                                        {new Date(b.scheduled_at).toLocaleString(isEn ? 'en-US' : 'ar-EG')} · {b.campaign_type === 'template' ? (isEn ? 'Template' : 'قالب') : (isEn ? 'Text' : 'نص')}
                                    </p>
                                    {b.status === 'done' && (
                                        <p className="text-xs text-green-400 mt-0.5">✓ {isEn ? `Sent: ${b.sent}, Failed: ${b.failed}` : `أُرسل: ${b.sent}، فشل: ${b.failed}`}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                        b.status === 'pending' ? 'bg-blue-500/20 text-blue-400' :
                                        b.status === 'done' ? 'bg-green-500/20 text-green-400' :
                                        b.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                        {b.status === 'pending' ? (isEn ? 'Pending' : 'منتظر') :
                                         b.status === 'done' ? (isEn ? 'Done' : 'منتهي') :
                                         b.status === 'running' ? (isEn ? 'Running' : 'جاري') :
                                         (isEn ? 'Cancelled' : 'ملغى')}
                                    </span>
                                    {b.status === 'pending' && (
                                        <button onClick={() => cancelBroadcast(b.id)}
                                            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────
//  Quick Replies Manager
// ─────────────────────────────────────────────
const QuickRepliesManager = ({ showToast, lang }) => {
    const isEn = lang === 'en';
    const [list, setList] = useState([]);
    const [form, setForm] = useState({ title: '', text: '' });
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        axios.get(`${API_URL}/quick-replies`).then(r => setList(r.data)).catch(() => {});
    }, []);

    const handleSave = async () => {
        if (!form.title.trim() || !form.text.trim()) return showToast(isEn ? 'Title and message are required' : 'العنوان والرسالة مطلوبان', 'error');
        setSaving(true);
        try {
            if (editing) {
                const res = await axios.put(`${API_URL}/quick-replies/${editing}`, form);
                setList(p => p.map(r => r.id === editing ? res.data : r));
                showToast(isEn ? 'Updated!' : 'تم التحديث!');
            } else {
                const res = await axios.post(`${API_URL}/quick-replies`, form);
                setList(p => [...p, res.data]);
                showToast(isEn ? 'Quick reply added!' : 'تمت إضافة الرد السريع!');
            }
            setForm({ title: '', text: '' });
            setEditing(null);
        } catch (e) { showToast(e.response?.data?.error || (isEn ? 'Failed to save' : 'فشل الحفظ'), 'error'); }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/quick-replies/${id}`);
            setList(p => p.filter(r => r.id !== id));
            showToast(isEn ? 'Deleted' : 'تم الحذف');
        } catch { showToast(isEn ? 'Delete failed' : 'فشل الحذف', 'error'); }
    };

    const handleEdit = (r) => { setEditing(r.id); setForm({ title: r.title, text: r.text }); };
    const handleCancel = () => { setEditing(null); setForm({ title: '', text: '' }); };

    const filtered = list.filter(r =>
        !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.text.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={`space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 pb-20 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="bg-brand-card/60 backdrop-blur-xl p-6 rounded-2xl border border-brand-accent/10">
                <h2 className="text-2xl font-bold text-brand-accent flex items-center gap-2">
                    <MessageSquareQuote size={26} /> {isEn ? 'Quick Replies' : 'الردود السريعة'}
                </h2>
                <p className="text-sm text-brand-muted mt-1">
                    {isEn ? 'Save common responses. Type / in any chat to quickly insert them.' : 'احفظ الردود الشائعة. اكتب / في أي محادثة لإدراجها بسرعة.'}
                </p>
            </div>

            {/* Add/Edit Form */}
            <div className="glass p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-brand-text">{editing ? (isEn ? 'Edit Reply' : 'تعديل الرد') : (isEn ? 'New Quick Reply' : 'رد سريع جديد')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-brand-muted">{isEn ? 'Shortcut (e.g. hello)' : 'الاختصار (مثال: مرحبا)'}</label>
                        <div className="relative">
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-accent font-bold text-sm">/</span>
                            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                placeholder={isEn ? 'hello' : 'مرحبا'}
                                className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none pr-7" dir="ltr" />
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-brand-muted">{isEn ? 'Message Text' : 'نص الرسالة'}</label>
                        <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                            placeholder={isEn ? 'Hello! Thanks for reaching out, how can we help you today?' : 'مرحباً! شكراً لتواصلك معنا، كيف يمكننا مساعدتك؟'}
                            rows={3} className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none resize-none" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleSave} disabled={saving}
                        className="bg-brand-accent text-brand-bg px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
                        {saving ? (isEn ? 'Saving...' : 'جاري الحفظ...') : (editing ? (isEn ? 'Update' : 'تحديث') : (isEn ? 'Add Reply' : 'إضافة الرد'))}
                    </button>
                    {editing && (
                        <button onClick={handleCancel} className="text-brand-muted hover:text-brand-text px-4 py-2.5 rounded-xl text-sm border border-brand-accent/20 transition-colors">
                            {isEn ? 'Cancel' : 'إلغاء'}
                        </button>
                    )}
                </div>
            </div>

            {/* Search & List */}
            <div className="glass p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder={isEn ? 'Search replies...' : 'ابحث في الردود...'}
                            className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none pr-9" />
                    </div>
                    <span className="text-xs text-brand-muted font-bold shrink-0">{list.length} {isEn ? 'replies' : 'رد'}</span>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-brand-muted">
                        <MessageSquareQuote size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">{isEn ? 'No quick replies yet. Add your first one above.' : 'لا توجد ردود سريعة بعد. أضف أول رد من الأعلى.'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(r => (
                            <div key={r.id} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${editing === r.id ? 'border-brand-accent/50 bg-brand-accent/5' : 'border-brand-accent/10 bg-brand-bg/60'}`}>
                                <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center shrink-0">
                                    <span className="text-brand-accent font-bold text-sm">/</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-brand-accent">/{r.title}</p>
                                    <p className="text-sm text-brand-muted mt-1 leading-relaxed">{r.text}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => handleEdit(r)}
                                        className="text-brand-muted hover:text-brand-accent p-2 rounded-lg hover:bg-brand-accent/10 transition-colors">
                                        <Eye size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(r.id)}
                                        className="text-brand-muted hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Automations Manager
// ─────────────────────────────────────────────
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
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null); // null = new, else existing item
    const [form, setForm] = useState(emptyAuto());
    const [saving, setSaving] = useState(false);
    const [showQueue, setShowQueue] = useState(false);

    const fetch = async () => {
        try {
            const [ar, qr] = await Promise.all([
                axios.get(`${API_URL}/automations`),
                axios.get(`${API_URL}/automations/queue`)
            ]);
            setAutomations(Array.isArray(ar.data) ? ar.data : []);
            setQueue(Array.isArray(qr.data) ? qr.data : []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetch(); }, []);

    const openNew = () => { setEditing(null); setForm(emptyAuto()); setShowModal(true); };
    const openEdit = (a) => { setEditing(a); setForm(JSON.parse(JSON.stringify(a))); setShowModal(true); };

    const handleSave = async () => {
        if (!form.name.trim()) return showToast(isEn ? 'Name is required' : 'الاسم مطلوب', 'error');
        setSaving(true);
        try {
            if (editing) {
                await axios.put(`${API_URL}/automations/${editing.id}`, form);
            } else {
                await axios.post(`${API_URL}/automations`, form);
            }
            await fetch();
            setShowModal(false);
            showToast(isEn ? 'Automation saved!' : 'تم حفظ الأتمتة!');
        } catch (e) { showToast(isEn ? 'Save failed' : 'فشل الحفظ', 'error'); }
        setSaving(false);
    };

    const handleToggle = async (id) => {
        try {
            await axios.patch(`${API_URL}/automations/${id}/toggle`);
            await fetch();
        } catch (e) { showToast(isEn ? 'Toggle failed' : 'فشل التبديل', 'error'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(isEn ? 'Delete this automation?' : 'حذف هذه الأتمتة؟')) return;
        try {
            await axios.delete(`${API_URL}/automations/${id}`);
            await fetch();
            showToast(isEn ? 'Deleted' : 'تم الحذف');
        } catch (e) { showToast(isEn ? 'Delete failed' : 'فشل الحذف', 'error'); }
    };

    const setTrigger = (k, v) => setForm(p => ({ ...p, trigger: { ...p.trigger, [k]: v } }));
    const addStep = () => setForm(p => ({ ...p, steps: [...p.steps, { wait_hours: 24, action: 'send_text', text: '' }] }));
    const removeStep = (i) => setForm(p => ({ ...p, steps: p.steps.filter((_, idx) => idx !== i) }));
    const setStep = (i, k, v) => setForm(p => {
        const steps = [...p.steps];
        steps[i] = { ...steps[i], [k]: v };
        return { ...p, steps };
    });

    const triggerLabel = (a) => {
        const t = TRIGGER_TYPES.find(x => x.value === a.trigger?.type);
        const tLabel = isEn ? t?.labelEn : t?.label;
        if (a.trigger?.type === 'order_status_changed') {
            const s = STATUS_VALUES.find(x => x.value === a.trigger?.value);
            return `${tLabel}: ${isEn ? s?.labelEn : s?.label}`;
        }
        if (a.trigger?.type === 'keyword_received') return `${tLabel}: "${a.trigger?.value}"`;
        return tLabel || a.trigger?.type;
    };

    const triggerColor = (type) => {
        if (type === 'order_status_changed') return 'bg-blue-500/20 text-blue-400';
        if (type === 'keyword_received') return 'bg-purple-500/20 text-purple-400';
        return 'bg-green-500/20 text-green-400';
    };

    const pendingCount = queue.filter(q => q.status === 'pending').length;

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-brand-accent flex items-center gap-2">
                        <Zap size={22} /> {isEn ? 'Automation Engine' : 'محرك الأتمتة'}
                    </h2>
                    <p className="text-sm text-brand-muted mt-1">
                        {isEn ? 'Trigger → Wait → Act automatically on any event.' : 'شغّل رسائل تلقائية بناءً على أي حدث — بدون تدخل يدوي.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => axios.post(`${API_URL}/automations/run-now`).then(() => { showToast(isEn ? 'Queue cycle triggered!' : 'تم تشغيل دورة المعالجة!'); fetch(); }).catch(() => {})}
                        className="px-4 py-2.5 rounded-xl border border-brand-accent/20 text-brand-muted hover:text-brand-accent hover:border-brand-accent/40 text-sm font-bold flex items-center gap-2 transition-all"
                        title={isEn ? 'Run queue check now' : 'شغّل فحص الـ queue الآن'}>
                        <RefreshCcw size={15} /> {isEn ? 'Run Now' : 'شغّل الآن'}
                    </button>
                    <button onClick={() => { setShowQueue(!showQueue); fetch(); }}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all ${showQueue ? 'bg-brand-accent/20 border-brand-accent text-brand-accent' : 'border-brand-accent/20 text-brand-muted hover:border-brand-accent/40'}`}>
                        <Clock size={16} />
                        {isEn ? `Queue (${pendingCount})` : `طابور الانتظار (${pendingCount})`}
                    </button>
                    <button onClick={openNew}
                        className="bg-brand-accent text-brand-bg px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all">
                        <Plus size={18} /> {isEn ? 'New Automation' : 'أتمتة جديدة'}
                    </button>
                </div>
            </div>

            {/* Queue Panel */}
            {showQueue && (
                <div className="glass p-5 rounded-2xl space-y-3">
                    <h3 className="font-bold text-sm text-brand-muted uppercase tracking-wider">{isEn ? 'Pending Queue' : 'الرسائل المجدولة'}</h3>
                    {queue.filter(q => q.status === 'pending').length === 0 ? (
                        <p className="text-brand-muted text-sm py-4 text-center">{isEn ? 'No pending messages.' : 'لا توجد رسائل في الانتظار.'}</p>
                    ) : (
                        <div className="space-y-2">
                            {queue.filter(q => q.status === 'pending').map((q, i) => (
                                <div key={i} className="flex items-center justify-between bg-brand-bg/40 border border-brand-accent/10 rounded-xl px-4 py-3 text-sm">
                                    <div>
                                        <span className="font-bold text-brand-text">{q.automation_name}</span>
                                        <span className="text-brand-muted mx-2">→</span>
                                        <span className="text-brand-muted">{q.customer_name}</span>
                                    </div>
                                    <div className="text-xs text-brand-muted" dir="ltr">
                                        {isEn ? 'Step' : 'خطوة'} {q.step_index + 1} — {new Date(q.fire_at).toLocaleString(isEn ? 'en-US' : 'ar-EG')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Automations List */}
            {automations.length === 0 ? (
                <div className="glass rounded-2xl p-16 flex flex-col items-center gap-4 text-brand-muted">
                    <Zap size={48} className="opacity-20" />
                    <p className="font-bold text-lg opacity-50">{isEn ? 'No automations yet' : 'لا توجد أتمتة بعد'}</p>
                    <p className="text-sm opacity-40 text-center max-w-sm">{isEn ? 'Create your first automation to send messages automatically based on events.' : 'أنشئ أولى أتمتاتك لإرسال رسائل تلقائية بناءً على الأحداث.'}</p>
                    <button onClick={openNew} className="mt-2 bg-brand-accent text-brand-bg px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2">
                        <Plus size={18} /> {isEn ? 'Create First Automation' : 'إنشاء أول أتمتة'}
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {automations.map(a => (
                        <div key={a.id} className={`glass rounded-2xl p-5 flex items-center justify-between gap-4 transition-all ${!a.active ? 'opacity-50' : ''}`}>
                            <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.active ? 'bg-brand-accent/20' : 'bg-brand-muted/10'}`}>
                                    <Zap size={20} className={a.active ? 'text-brand-accent' : 'text-brand-muted'} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-brand-text">{a.name}</h3>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${triggerColor(a.trigger?.type)}`}>
                                            {triggerLabel(a)}
                                        </span>
                                        <span className="text-[11px] text-brand-muted">
                                            {a.steps?.length} {isEn ? 'step(s)' : 'خطوة'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => handleToggle(a.id)} title={a.active ? (isEn ? 'Disable' : 'إيقاف') : (isEn ? 'Enable' : 'تفعيل')}
                                    className="text-brand-muted hover:text-brand-accent transition-colors">
                                    {a.active ? <ToggleRight size={28} className="text-brand-accent" /> : <ToggleLeft size={28} />}
                                </button>
                                <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-brand-accent/10 text-brand-muted hover:text-brand-accent transition-all">
                                    <Cog size={16} />
                                </button>
                                <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="bg-brand-sidebar border border-brand-accent/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl"
                        dir={isEn ? 'ltr' : 'rtl'}>
                        <div className="p-6 border-b border-brand-accent/10 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-brand-accent">
                                {editing ? (isEn ? 'Edit Automation' : 'تعديل الأتمتة') : (isEn ? 'New Automation' : 'أتمتة جديدة')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-brand-text p-1"><X size={20} /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-brand-muted">{isEn ? 'Automation Name' : 'اسم الأتمتة'}</label>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder={isEn ? 'e.g. Post-Ship Review Request' : 'مثال: طلب تقييم بعد الشحن'}
                                    className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-accent outline-none" />
                            </div>

                            {/* Trigger */}
                            <div className="space-y-3 p-4 bg-brand-bg/40 rounded-2xl border border-brand-accent/10">
                                <h3 className="font-bold text-sm text-brand-accent flex items-center gap-2">
                                    <Zap size={15} /> {isEn ? 'Trigger — When does this fire?' : 'المشغّل — متى تبدأ؟'}
                                </h3>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-brand-muted">{isEn ? 'Event type' : 'نوع الحدث'}</label>
                                    <select value={form.trigger.type} onChange={e => setTrigger('type', e.target.value)}
                                        className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none">
                                        {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{isEn ? t.labelEn : t.label}</option>)}
                                    </select>
                                </div>
                                {form.trigger.type === 'order_status_changed' && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-brand-muted">{isEn ? 'When status becomes' : 'عندما تصبح الحالة'}</label>
                                        <select value={form.trigger.value || ''} onChange={e => setTrigger('value', e.target.value)}
                                            className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none">
                                            {STATUS_VALUES.map(s => <option key={s.value} value={s.value}>{isEn ? s.labelEn : s.label}</option>)}
                                        </select>
                                    </div>
                                )}
                                {form.trigger.type === 'keyword_received' && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-brand-muted">{isEn ? 'Keyword (message contains)' : 'الكلمة المفتاحية (الرسالة تحتوي على)'}</label>
                                        <input value={form.trigger.value || ''} onChange={e => setTrigger('value', e.target.value)}
                                            placeholder={isEn ? 'e.g. price' : 'مثال: سعر'}
                                            className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none" />
                                    </div>
                                )}
                            </div>

                            {/* Steps */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-sm text-brand-accent flex items-center gap-2">
                                    <ChevronDown size={15} /> {isEn ? 'Steps — What happens?' : 'الخطوات — ماذا يحدث؟'}
                                </h3>
                                {form.steps.map((step, i) => (
                                    <div key={i} className="p-4 bg-brand-bg/40 rounded-2xl border border-brand-accent/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-brand-muted">{isEn ? `Step ${i + 1}` : `الخطوة ${i + 1}`}</span>
                                            {form.steps.length > 1 && (
                                                <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-300 transition-colors p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs text-brand-muted">{isEn ? 'Wait (hours before this step)' : 'انتظر (ساعات قبل التنفيذ)'}</label>
                                                <input type="number" min="0" max="8760" value={step.wait_hours}
                                                    onChange={e => setStep(i, 'wait_hours', parseInt(e.target.value) || 0)}
                                                    className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none" dir="ltr" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs text-brand-muted">{isEn ? 'Action' : 'الإجراء'}</label>
                                                <select value={step.action} onChange={e => setStep(i, 'action', e.target.value)}
                                                    className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none">
                                                    <option value="send_text">{isEn ? 'Send Text Message' : 'إرسال رسالة نصية'}</option>
                                                    <option value="send_template">{isEn ? 'Send WhatsApp Template' : 'إرسال قالب WhatsApp'}</option>
                                                </select>
                                            </div>
                                        </div>
                                        {step.action === 'send_text' && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs text-brand-muted">{isEn ? 'Message text (use {{customer_name}} for name)' : 'نص الرسالة (استخدم {{customer_name}} للاسم)'}</label>
                                                <textarea value={step.text || ''} onChange={e => setStep(i, 'text', e.target.value)}
                                                    placeholder={isEn ? 'Hello {{customer_name}}, ...' : 'مرحباً {{customer_name}}، ...'}
                                                    rows={3}
                                                    className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none resize-none custom-scrollbar" />
                                            </div>
                                        )}
                                        {step.action === 'send_template' && (
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs text-brand-muted">{isEn ? 'Template' : 'القالب'}</label>
                                                    <select value={step.template_id || ''} onChange={e => {
                                                        const tpl = templates[e.target.value];
                                                        setStep(i, 'template_id', e.target.value);
                                                        // reset params to match new template's count
                                                        if (tpl?.params_count > 0) setStep(i, 'params', Array(tpl.params_count).fill('{{customer_name}}'));
                                                        else setStep(i, 'params', []);
                                                    }}
                                                        className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none">
                                                        <option value="">{isEn ? '— Select template —' : '— اختر قالباً —'}</option>
                                                        {Object.entries(templates).map(([k, t]) => (
                                                            <option key={k} value={k}>{t.title} ({t.meta_name})</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Params inputs — shown only if template has params */}
                                                {step.template_id && templates[step.template_id]?.params_count > 0 && (
                                                    <div className="space-y-2 p-3 bg-brand-accent/5 rounded-xl border border-brand-accent/15">
                                                        <p className="text-[11px] font-bold text-brand-accent">
                                                            {isEn ? `Template Variables (${templates[step.template_id].params_count} required)` : `متغيرات القالب (${templates[step.template_id].params_count} مطلوب)`}
                                                        </p>
                                                        <p className="text-[10px] text-brand-muted">{isEn ? 'Use {{customer_name}} to insert the customer name.' : 'استخدم {{customer_name}} لإدراج اسم العميل.'}</p>
                                                        {Array(templates[step.template_id].params_count).fill(0).map((_, pi) => (
                                                            <div key={pi} className="flex items-center gap-2">
                                                                <span className="text-[11px] text-brand-muted shrink-0">{'{{' + (pi + 1) + '}}'}</span>
                                                                <input
                                                                    value={(step.params || [])[pi] || ''}
                                                                    onChange={e => {
                                                                        const params = [...(step.params || Array(templates[step.template_id].params_count).fill(''))];
                                                                        params[pi] = e.target.value;
                                                                        setStep(i, 'params', params);
                                                                    }}
                                                                    placeholder={pi === 0 ? '{{customer_name}}' : `${isEn ? 'Value' : 'قيمة'} ${pi + 1}`}
                                                                    className="flex-1 bg-brand-input border border-brand-border rounded-lg px-3 py-1.5 text-xs focus:border-brand-accent outline-none"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Header image URL for templates with image header */}
                                                {step.template_id && templates[step.template_id]?.has_header_image && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs text-brand-muted">{isEn ? 'Header Image URL' : 'رابط صورة الهيدر'}</label>
                                                        <input value={step.template_image_url || ''} onChange={e => setStep(i, 'template_image_url', e.target.value)}
                                                            placeholder="https://cdn.example.com/image.jpg"
                                                            dir="ltr"
                                                            className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-xs focus:border-brand-accent outline-none" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addStep}
                                    className="w-full border-2 border-dashed border-brand-accent/20 hover:border-brand-accent/50 text-brand-muted hover:text-brand-accent rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all">
                                    <Plus size={16} /> {isEn ? 'Add Step' : 'إضافة خطوة'}
                                </button>
                            </div>
                        </div>

                        <div className="p-6 border-t border-brand-accent/10 flex gap-3">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 border border-brand-accent/30 text-brand-muted py-3 rounded-xl font-bold hover:bg-brand-accent/5 transition-all">
                                {isEn ? 'Cancel' : 'إلغاء'}
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 bg-brand-accent text-brand-bg py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50">
                                {saving ? (isEn ? 'Saving...' : 'جاري الحفظ...') : (isEn ? 'Save Automation' : 'حفظ الأتمتة')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Abandoned Carts Manager (Phase 3) ---
const AbandonedCartsManager = ({ carts, refresh, showToast, lang }) => {
    const [search, setSearch] = useState('');
    const [sendingPhone, setSendingPhone] = useState(null);
    const [customMessages, setCustomMessages] = useState({});
    const isEn = lang === 'en';

    const handleCustomMsgChange = (phone, text) => {
        setCustomMessages(prev => ({ ...prev, [phone]: text }));
    };

    const triggerRecovery = async (cart) => {
        setSendingPhone(cart.clean_phone);
        try {
            await axios.post(`${API_URL}/abandoned_carts/trigger`, {
                phone: cart.clean_phone,
                customerName: cart.customer?.first_name || (isEn ? 'Customer' : 'عميل'),
                checkoutUrl: cart.abandoned_checkout_url,
                customMsg: customMessages[cart.clean_phone] || ''
            });
            showToast(isEn ? "Recovery message sent successfully!" : "تم إرسال رسالة استرجاع السلة بنجاح!", "success");
            refresh();
        } catch (e) {
            showToast(e.response?.data?.error || (isEn ? "Failed to send message" : "فشل إرسال الرسالة"), "error");
        }
        setSendingPhone(null);
    };

    const filtered = carts.filter(c => {
        const term = search.toLowerCase();
        const name = (c.customer?.first_name || '').toLowerCase();
        const phone = c.clean_phone || '';
        return name.includes(term) || phone.includes(term);
    });

    const recoveredCount = carts.filter(c => c.local_status === 'confirmed' || c.local_status === 'shipped').length;
    const followedCount = carts.filter(c => c.drip_sent || c.local_status === 'followed_up').length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Top Dashboard KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-brand-gold/10">
                        <Clock size={22} className="text-brand-gold" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-brand-gold">{carts.length}</h3>
                        <p className="text-[11px] font-bold text-brand-muted mt-0.5">{isEn ? 'Total Abandoned Carts' : 'إجمالي السلات المتروكة'}</p>
                    </div>
                </div>

                <div className="glass p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10">
                        <Send size={22} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-blue-400">{followedCount}</h3>
                        <p className="text-[11px] font-bold text-brand-muted mt-0.5">{isEn ? 'Followed-up Automatically' : 'تمت المتابعة التلقائية'}</p>
                    </div>
                </div>

                <div className="glass p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-brand-accent/10">
                        <CheckCircle2 size={22} className="text-brand-accent" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-brand-accent">{recoveredCount}</h3>
                        <p className="text-[11px] font-bold text-brand-muted mt-0.5">{isEn ? 'Recovered Successfully' : 'تم الاسترجاع بنجاح'}</p>
                    </div>
                </div>
            </div>

            {/* Carts Table Panel */}
            <div className="glass p-8 rounded-2xl space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold">{isEn ? 'Abandoned Carts Management' : 'إدارة حملات استرجاع السلات (Abandoned Carts)'}</h3>
                        <p className="text-xs text-brand-muted mt-1">{isEn ? 'Track clients who left checkout page and broadcast personalized recovery links' : 'تتبع العملاء الذين غادروا صفحة الدفع وأرسل لهم عروض استرجاع مخصصة'}</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                            <input
                                type="text"
                                placeholder={isEn ? "Search name or phone..." : "بحث بالاسم أو الهاتف..."}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-brand-bg/50 border border-brand-accent/10 rounded-xl pr-10 pl-4 py-2.5 text-xs focus:outline-none focus:border-brand-accent transition-all"
                            />
                        </div>
                        <button onClick={refresh} className="p-2.5 bg-brand-bg/50 border border-brand-accent/10 rounded-xl hover:bg-brand-card transition-colors text-brand-muted hover:text-brand-text">
                            <RefreshCcw size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-brand-accent/5 text-brand-muted">
                                <tr className="hidden"></tr>
                                <th className="p-4 text-right font-bold">{isEn ? 'Customer' : 'العميل'}</th>
                                <th className="p-4 text-right font-bold">{isEn ? 'Phone Number' : 'رقم الهاتف'}</th>
                                <th className="p-4 text-right font-bold">{isEn ? 'Cart Value' : 'قيمة السلة'}</th>
                                <th className="p-4 text-right font-bold">{isEn ? 'Status' : 'الحالة'}</th>
                                <th className="p-4 text-right font-bold">{isEn ? 'Custom Message (Optional)' : 'تخصيص الرسالة (اختياري)'}</th>
                                <th className="p-4 text-center font-bold">{isEn ? 'Direct Action' : 'إجراء مباشر'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-accent/5">
                            {filtered.map((cart, idx) => (
                                <tr key={idx} className="hover:bg-brand-bg/30 transition-colors group">
                                    <td className="p-4 text-right font-bold">
                                        {cart.customer?.first_name || (isEn ? 'Unregistered Client' : 'عميل غير مسجل')}
                                    </td>
                                    <td className="p-4 text-right font-mono text-brand-muted" dir="ltr">
                                        {cart.clean_phone}
                                    </td>
                                    <td className="p-4 text-right font-bold text-brand-gold">
                                        {cart.total_price ? `${parseFloat(cart.total_price).toLocaleString()} EGP` : (isEn ? 'N/A' : 'غير محدد')}
                                    </td>
                                    <td className="p-4 text-right">
                                        {cart.local_status === 'confirmed' || cart.local_status === 'shipped' ? (
                                            <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-1 rounded-full font-bold text-[10px]">{isEn ? 'Recovered' : 'تم الاسترجاع'}</span>
                                        ) : cart.drip_sent ? (
                                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold text-[10px]">{isEn ? 'Messaged' : 'تم المراسلة'}</span>
                                        ) : (
                                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold text-[10px]">{isEn ? 'Abandoned' : 'متروكة'}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <input
                                            type="text"
                                            placeholder={isEn ? "Alternative personalized override..." : "رسالة مخصصة بديلة..."}
                                            value={customMessages[cart.clean_phone] ?? ''}
                                            onChange={e => handleCustomMsgChange(cart.clean_phone, e.target.value)}
                                            className="w-full bg-brand-bg/40 border border-brand-accent/10 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:border-brand-accent"
                                        />
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => triggerRecovery(cart)}
                                            disabled={sendingPhone === cart.clean_phone}
                                            className={`px-4 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 mx-auto ${cart.drip_sent
                                                    ? 'bg-brand-bg text-brand-muted hover:text-brand-text border border-brand-accent/10'
                                                    : 'bg-brand-accent text-brand-bg hover:shadow-lg hover:shadow-brand-accent/20'
                                                }`}
                                        >
                                            {sendingPhone === cart.clean_phone ? (
                                                <div className="w-3.5 h-3.5 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <Send size={12} />
                                                    <span>{cart.drip_sent ? (isEn ? 'Resend' : 'إعادة الإرسال') : (isEn ? 'Recover' : 'إرسال الاسترجاع')}</span>
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-brand-muted">
                                        {isEn ? 'No matching abandoned carts found.' : 'لا توجد سلات متروكة مطابقة للبحث حالياً.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Product Sender (Shopify Products → WhatsApp) ---
const CatalogManager = ({ showToast, lang }) => {
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [targetPhone, setTargetPhone] = useState('');
    const [customNote, setCustomNote] = useState('');
    const [msgHeader, setMsgHeader] = useState('');
    const [origPrice, setOrigPrice] = useState('');
    const [sending, setSending] = useState(false);
    const isEn = lang === 'en';

    useEffect(() => {
        axios.get(`${API_URL}/shopify/products`)
            .then(r => setProducts(r.data.products || []))
            .catch(err => showToast(err.response?.data?.error || (isEn ? 'Failed to load products' : 'فشل تحميل المنتجات'), 'error'))
            .finally(() => setLoadingProducts(false));
    }, []);

    const filtered = products.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(search.toLowerCase())
    );

    const buildMessage = (p) => {
        const lines = [];
        if (msgHeader) { lines.push(`🎉 *${msgHeader}*`); lines.push(''); }
        lines.push(`🛍️ *${p.title}*`);
        lines.push('');
        const orig = parseFloat(origPrice);
        const sale = parseFloat(p.price);
        if (origPrice && orig > sale) {
            const pct = Math.round(((orig - sale) / orig) * 100);
            lines.push(`~${isEn ? 'Was' : 'كان'}: ${orig.toFixed(0)} EGP~`);
            lines.push(`✅ *${isEn ? 'Now' : 'الآن'}: ${sale.toFixed(0)} EGP*`);
            lines.push(`🔥 ${isEn ? `You save ${pct}%!` : `وفّر ${pct}%!`}`);
        } else {
            lines.push(`💰 ${isEn ? 'Price' : 'السعر'}: ${p.price} EGP`);
        }
        if (p.sku) lines.push(`📦 SKU: ${p.sku}`);
        if (customNote) { lines.push(''); lines.push(customNote); }
        lines.push('');
        lines.push(`🔗 ${p.url}`);
        return lines.join('\n');
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!selected || !targetPhone) {
            showToast(isEn ? 'Select a product and enter phone number' : 'اختار منتج وادخل رقم الهاتف', 'error');
            return;
        }
        setSending(true);
        try {
            await axios.post(`${API_URL}/whatsapp/send`, {
                phone: targetPhone,
                textMsg: buildMessage(selected)
            });
            showToast(isEn ? 'Product sent successfully!' : 'تم إرسال المنتج بنجاح!', 'success');
            setTargetPhone('');
            setCustomNote('');
        } catch (err) {
            showToast(err.response?.data?.error || (isEn ? 'Send failed' : 'فشل الإرسال'), 'error');
        }
        setSending(false);
    };

    return (
        <div className={`space-y-6 animate-in fade-in duration-500 ${isEn ? 'text-left' : 'text-right'}`}>
            {/* Header */}
            <div className="glass p-6 rounded-2xl flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold">{isEn ? 'Send Product to Customer' : 'إرسال منتج لعميل'}</h2>
                    <p className="text-xs text-brand-muted mt-1">{isEn ? 'Pick a product from your Shopify store and send it directly via WhatsApp.' : 'اختار منتج من متجرك على شوبيفاي وابعته للعميل على واتساب مباشرةً'}</p>
                </div>
                <span className="bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-[10px] font-bold px-3 py-1 rounded-full shrink-0">Shopify</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product List */}
                <div className="lg:col-span-2 glass p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder={isEn ? 'Search products...' : 'ابحث عن منتج...'}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 bg-brand-bg/50 border border-brand-accent/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-brand-accent"
                            dir={isEn ? 'ltr' : 'rtl'}
                        />
                        <span className="text-xs text-brand-muted shrink-0">{filtered.length} {isEn ? 'items' : 'منتج'}</span>
                    </div>

                    {loadingProducts ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-brand-muted">
                            <Package size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">{isEn ? 'No products found. Make sure Shopify is connected in Settings.' : 'لا توجد منتجات. تأكد من ربط شوبيفاي في الإعدادات.'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                            {filtered.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelected(p)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                        selected?.id === p.id
                                            ? 'border-brand-accent bg-brand-accent/10'
                                            : 'border-brand-accent/10 bg-brand-bg/30 hover:border-brand-accent/30'
                                    }`}
                                >
                                    {p.image ? (
                                        <img src={p.image} alt={p.title} className="w-12 h-12 rounded-lg object-cover shrink-0 bg-brand-bg/50" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-brand-accent/10 flex items-center justify-center shrink-0">
                                            <Package size={20} className="text-brand-accent/50" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold truncate">{p.title}</p>
                                        <p className="text-xs text-brand-accent font-mono mt-0.5">{p.price} EGP</p>
                                        {p.sku && <p className="text-[10px] text-brand-muted font-mono truncate">{p.sku}</p>}
                                    </div>
                                    {selected?.id === p.id && <CheckCircle2 size={16} className="text-brand-accent shrink-0 ml-auto" />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Send Form */}
                <div className="glass p-6 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold border-b border-brand-accent/10 pb-3">{isEn ? 'Send to Customer' : 'إرسال للعميل'}</h3>

                    {selected ? (
                        <div className="flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 rounded-xl p-3">
                            {selected.image
                                ? <img src={selected.image} alt={selected.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                : <div className="w-10 h-10 rounded-lg bg-brand-accent/20 flex items-center justify-center shrink-0"><Package size={16} className="text-brand-accent" /></div>
                            }
                            <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{selected.title}</p>
                                <p className="text-xs text-brand-accent">{selected.price} EGP</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-brand-bg/40 border border-dashed border-brand-accent/20 rounded-xl p-4 text-center text-xs text-brand-muted">
                            {isEn ? '← Select a product first' : 'اختار منتجاً أولاً ←'}
                        </div>
                    )}

                    <form onSubmit={handleSend} className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold mb-1.5">{isEn ? '🎉 Message Header (optional)' : '🎉 عنوان الرسالة الجذاب (اختياري)'}</label>
                            <input
                                type="text"
                                placeholder={isEn ? 'e.g. Exclusive offer just for you!' : 'مثال: عرض حصري خاص بيك!'}
                                value={msgHeader}
                                onChange={e => setMsgHeader(e.target.value)}
                                className="w-full bg-brand-bg/50 border border-brand-accent/20 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-accent"
                                dir={isEn ? 'ltr' : 'rtl'}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1.5">{isEn ? '🔥 Original Price before discount (optional)' : '🔥 السعر الأصلي قبل الخصم (اختياري)'}</label>
                            <input
                                type="number"
                                placeholder={isEn ? 'e.g. 350 — leave empty if no discount' : 'مثال: 350 — اتركه فاضي لو مفيش خصم'}
                                value={origPrice}
                                onChange={e => setOrigPrice(e.target.value)}
                                className="w-full bg-brand-bg/50 border border-brand-accent/20 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-accent"
                                dir="ltr"
                                min="0"
                            />
                            {selected && origPrice && parseFloat(origPrice) > parseFloat(selected.price) && (
                                <p className="text-[11px] text-green-400 mt-1 font-bold">
                                    🏷️ {isEn
                                        ? `Discount: ${Math.round(((parseFloat(origPrice) - parseFloat(selected.price)) / parseFloat(origPrice)) * 100)}% OFF`
                                        : `خصم: ${Math.round(((parseFloat(origPrice) - parseFloat(selected.price)) / parseFloat(origPrice)) * 100)}%`
                                    }
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1.5">{isEn ? 'Customer Phone *' : 'رقم الهاتف *'}</label>
                            <input
                                type="text"
                                placeholder="e.g. 2010xxxxxxxx"
                                value={targetPhone}
                                onChange={e => setTargetPhone(e.target.value)}
                                className="w-full bg-brand-bg/50 border border-brand-accent/20 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-accent"
                                dir="ltr"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1.5">{isEn ? 'Additional Note (optional)' : 'ملاحظة إضافية (اختياري)'}</label>
                            <textarea
                                placeholder={isEn ? 'e.g. Limited stock, order now!' : 'مثال: كمية محدودة، اطلب دلوقتي!'}
                                rows={2}
                                value={customNote}
                                onChange={e => setCustomNote(e.target.value)}
                                className="w-full bg-brand-bg/50 border border-brand-accent/20 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-accent custom-scrollbar resize-none"
                                dir={isEn ? 'ltr' : 'rtl'}
                            />
                        </div>

                        {selected && (
                            <div className="bg-brand-bg/40 rounded-xl p-3 border border-brand-accent/10">
                                <p className="text-[10px] text-brand-muted mb-1 font-bold">{isEn ? 'Message Preview:' : 'معاينة الرسالة:'}</p>
                                <pre className="text-[10px] text-brand-text whitespace-pre-wrap font-sans leading-relaxed" dir="ltr">{buildMessage(selected)}</pre>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={sending || !selected}
                            className="w-full bg-brand-accent text-brand-bg font-bold py-3 rounded-xl hover:shadow-xl hover:shadow-brand-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending
                                ? <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
                                : <><Send size={14} /><span>{isEn ? 'Send via WhatsApp' : 'إرسال عبر واتساب'}</span></>
                            }
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Onboarding Screen
// ─────────────────────────────────────────────
const OnboardingScreen = ({ lang, onLangChange, onComplete }) => {
    const isEn = lang === 'en';
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        business_name: '', access_token: '', phone_number_id: '',
        verify_token: '', shopify_url: '', shopify_access_token: '',
        gemini_api_key: '', catalog_id: '', server_url: ''
    });
    const [show, setShow] = useState({});

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const toggleShow = (k) => setShow(p => ({ ...p, [k]: !p[k] }));

    const handleSave = async () => {
        if (!form.business_name || !form.access_token || !form.phone_number_id || !form.verify_token)
            return alert(isEn ? 'Please fill in the required fields.' : 'يرجى تعبئة الحقول المطلوبة.');
        setSaving(true);
        try {
            await axios.post(`${API_URL}/config/setup`, form);
            onComplete(form.business_name);
        } catch (e) { alert(isEn ? 'Save failed!' : 'فشل الحفظ!'); }
        setSaving(false);
    };

    const Field = ({ label, k, placeholder, required, hint }) => (
        <div className="space-y-1.5">
            <label className="text-sm font-bold text-brand-text flex items-center gap-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            {hint && <p className="text-[11px] text-brand-muted">{hint}</p>}
            <div className="relative">
                <input
                    type={show[k] ? 'text' : (k.includes('token') || k.includes('key') ? 'password' : 'text')}
                    value={form[k]}
                    onChange={e => set(k, e.target.value)}
                    placeholder={placeholder}
                    dir="ltr"
                    className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-3 text-sm focus:border-brand-accent outline-none pr-10"
                />
                {(k.includes('token') || k.includes('key')) && (
                    <button type="button" onClick={() => toggleShow(k)} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-accent">
                        {show[k] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6" dir={isEn ? 'ltr' : 'rtl'}>
            <div className="w-full max-w-xl space-y-6">
                <div className="text-center space-y-2 relative">
                    <button
                        onClick={() => onLangChange(isEn ? 'ar' : 'en')}
                        className="absolute top-0 left-0 px-3 py-1.5 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent hover:bg-brand-accent/20 transition-all text-xs font-bold"
                    >
                        {isEn ? 'عربي' : 'English'}
                    </button>
                    <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center mx-auto border border-brand-accent/20">
                        <ShieldCheck size={32} className="text-brand-accent" />
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <OmniFlowMark size={40} />
                        <h1 className="text-3xl font-bold text-brand-egg tracking-tight">Omni<span className="font-light">Flow</span></h1>
                    </div>
                    <p className="text-brand-muted text-sm">{isEn ? 'WhatsApp CRM — Initial Setup' : 'WhatsApp CRM — الإعداد الأولي'}</p>
                </div>

                <div className="glass p-8 rounded-2xl space-y-5">
                    {step === 1 && (
                        <>
                            <h3 className="font-bold text-lg text-brand-text border-b border-brand-accent/10 pb-3">
                                {isEn ? '1 / 2 — Business & WhatsApp' : '١ / ٢ — بيانات البيزنس وواتساب'}
                            </h3>
                            <Field k="business_name" label={isEn ? 'Business Name' : 'اسم البيزنس'} placeholder="My Store" required
                                hint={isEn ? 'Will appear in the app and messages' : 'هيظهر في التطبيق وفي الرسائل'} />
                            <Field k="access_token" label={isEn ? 'Meta Access Token' : 'Meta Access Token'} placeholder="EAAVXdh..." required
                                hint={isEn ? 'From Meta Business > WhatsApp > API Setup' : 'من Meta Business > WhatsApp > API Setup'} />
                            <Field k="phone_number_id" label={isEn ? 'Phone Number ID' : 'Phone Number ID'} placeholder="1032753703264445" required
                                hint={isEn ? 'From Meta Business > WhatsApp > API Setup' : 'من نفس الصفحة'} />
                            <Field k="verify_token" label={isEn ? 'Webhook Verify Token' : 'Webhook Verify Token'} placeholder="my_secret_2025" required
                                hint={isEn ? 'A secret string you choose (used to verify your webhook URL)' : 'كلمة سر تختارها أنت لتحقق الـ webhook'} />
                            <button onClick={() => setStep(2)} className="w-full bg-brand-accent text-brand-bg py-3 rounded-xl font-bold hover:opacity-90 transition-all">
                                {isEn ? 'Next →' : 'التالي ←'}
                            </button>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <h3 className="font-bold text-lg text-brand-text border-b border-brand-accent/10 pb-3">
                                {isEn ? '2 / 2 — Shopify & Optional Services' : '٢ / ٢ — شوبيفاي والخدمات الاختيارية'}
                            </h3>
                            <Field k="shopify_url" label={isEn ? 'Shopify Store URL' : 'رابط متجر شوبيفاي'} placeholder="my-store.myshopify.com"
                                hint={isEn ? 'Optional — Required for Shopify orders integration' : 'اختياري — مطلوب لربط طلبات شوبيفاي'} />
                            <Field k="shopify_access_token" label="Shopify Access Token" placeholder="shpat_..."
                                hint={isEn ? 'From Shopify Admin > Apps > Private apps' : 'من Shopify Admin > Apps > Private apps'} />
                            <Field k="gemini_api_key" label={isEn ? 'Gemini AI Key (Auto-reply)' : 'Gemini AI Key (الرد الآلي)'} placeholder="AIza..."
                                hint={isEn ? 'Optional — Enables AI auto-replies to customer messages' : 'اختياري — يفعّل الرد الآلي بالذكاء الاصطناعي'} />
                            <Field k="server_url" label={isEn ? 'Public Server URL' : 'الرابط العام للسيرفر'} placeholder="https://my-app.ngrok.io"
                                hint={isEn ? 'Optional — Required to send image headers in campaigns' : 'اختياري — مطلوب لإرسال صور الهيدر في الحملات'} />
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setStep(1)} className="flex-1 border border-brand-accent/30 text-brand-accent py-3 rounded-xl font-bold hover:bg-brand-accent/10 transition-all">
                                    {isEn ? '← Back' : '→ رجوع'}
                                </button>
                                <button onClick={handleSave} disabled={saving} className="flex-1 bg-brand-accent text-brand-bg py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50">
                                    {saving ? (isEn ? 'Saving...' : 'جاري الحفظ...') : (isEn ? 'Launch App ✓' : 'تشغيل التطبيق ✓')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
                <p className="text-center text-[11px] text-brand-muted">{isEn ? 'Settings are saved to .env on your server' : 'الإعدادات تُحفظ في ملف .env على السيرفر'}</p>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Shipping Components
// ─────────────────────────────────────────────
const SHIPPING_PROVIDERS = [
    { id: 'bosta',  name: 'Bosta',       flag: '🟠', region: 'مصر' },
    { id: 'jt',     name: 'J&T Express', flag: '🔴', region: 'مصر' },
    { id: 'aramex', name: 'Aramex',      flag: '🟡', region: 'دولي' },
    { id: 'dhl',    name: 'DHL',         flag: '🟡', region: 'دولي' },
    { id: 'fedex',  name: 'FedEx',       flag: '🟣', region: 'دولي' },
];

const PROVIDER_FIELDS = {
    bosta:  [{ k: 'api_key', label: 'API Key', placeholder: 'Bearer ey...' }],
    jt:     [{ k: 'api_key', label: 'API Key', placeholder: 'jt_api_...' }, { k: 'customer_code', label: 'Customer Code', placeholder: 'CUST001' }],
    aramex: [{ k: 'username', label: 'Username', placeholder: 'aramex_user' }, { k: 'password', label: 'Password', placeholder: '••••', secret: true }, { k: 'account_number', label: 'Account Number', placeholder: '12345' }],
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
                                                        dir="ltr"
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
                                dir="ltr"
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

// ─────────────────────────────────────────────
//  Setup Manager (In-App Settings Page)
// ─────────────────────────────────────────────
const SetupManager = ({ showToast, lang, onSave }) => {
    const isEn = lang === 'en';
    const [form, setForm] = useState(null);
    const [branding, setBrandingLocal] = useState({ brand_color: '#d5aa65', logo_url: null });
    const [logoPreview, setLogoPreview] = useState(null);
    const [savingBranding, setSavingBranding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [aiInstruction, setAiInstruction] = useState('');
    const [testingWebhook, setTestingWebhook] = useState(false);
    const [testingWoo, setTestingWoo] = useState(false);

    const [show, setShow] = useState({});
    const logoInputRef = useRef(null);

    useEffect(() => {
        axios.get(`${API_URL}/config/setup`).then(r => setForm(r.data)).catch(() => {});
        axios.get(`${API_URL}/config/branding`).then(r => { setBrandingLocal(r.data); }).catch(() => {});
        axios.get(`${API_URL}/settings`).then(r => { setAiInstruction(r.data.ai_instruction || ''); }).catch(() => {});
    }, []);


    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const toggleShow = (k) => setShow(p => ({ ...p, [k]: !p[k] }));

    const handleLogoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setLogoPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSaveBranding = async () => {
        setSavingBranding(true);
        try {
            await axios.post(`${API_URL}/config/branding`, {
                brand_color: branding.brand_color,
                logo_base64: logoPreview || undefined
            });
            showToast(isEn ? 'Branding saved! Refresh to apply.' : 'تم حفظ الهوية! أعد تحميل الصفحة لتطبيقها.');
        } catch (e) { showToast(isEn ? 'Failed to save branding' : 'فشل حفظ الهوية', 'error'); }
        setSavingBranding(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post(`${API_URL}/config/setup`, form);
            await axios.post(`${API_URL}/settings/ai-toggle`, { ai_instruction: aiInstruction });
            onSave(form.business_name);
            showToast(isEn ? 'Settings saved successfully!' : 'تم حفظ الإعدادات بنجاح!');
        } catch (e) { showToast(isEn ? 'Save failed!' : 'فشل الحفظ!', 'error'); }
        setSaving(false);
    };

    const handleTestWebhook = async () => {
        setTestingWebhook(true);
        try {
            await axios.post(`${API_URL}/webhooks/test`);
            showToast(isEn ? 'Test event sent successfully!' : 'تم إرسال الحدث التجريبي بنجاح!');
        } catch (e) { showToast(e.response?.data?.error || (isEn ? 'Webhook test failed' : 'فشل اختبار الـ Webhook'), 'error'); }
        setTestingWebhook(false);
    };

    const handleTestWoo = async () => {
        setTestingWoo(true);
        try {
            await axios.get(`${API_URL}/woo/orders`);
            showToast(isEn ? 'WooCommerce connected!' : 'تم الاتصال بـ WooCommerce بنجاح!');
        } catch (e) { showToast(e.response?.data?.error || (isEn ? 'Connection failed' : 'فشل الاتصال'), 'error'); }
        setTestingWoo(false);
    };

    if (!form) return <div className="flex items-center justify-center h-64 text-brand-muted">{isEn ? 'Loading...' : 'جاري التحميل...'}</div>;

    const Field = ({ label, k, placeholder, hint, secret }) => (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-muted">{label}</label>
            {hint && <p className="text-[10px] text-brand-muted/70">{hint}</p>}
            <div className="relative">
                <input
                    type={secret && !show[k] ? 'password' : 'text'}
                    value={form[k] || ''}
                    onChange={e => set(k, e.target.value)}
                    placeholder={placeholder}
                    dir="ltr"
                    className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none pr-10"
                />
                {secret && (
                    <button type="button" onClick={() => toggleShow(k)} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-accent">
                        {show[k] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                )}
            </div>
        </div>
    );

    const Section = ({ title, children }) => (
        <div className="glass p-6 rounded-2xl space-y-4">
            <h4 className="font-bold text-brand-accent border-b border-brand-accent/10 pb-2">{title}</h4>
            {children}
        </div>
    );

    return (
        <div className={`space-y-6 max-w-3xl mx-auto animate-in fade-in duration-500 pb-20 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="flex justify-between items-center bg-brand-card/60 backdrop-blur-xl p-6 rounded-2xl border border-brand-accent/10">
                <div>
                    <h2 className="text-2xl font-bold text-brand-accent flex items-center gap-2"><Cog size={26} /> {isEn ? 'App Settings' : 'إعدادات التطبيق'}</h2>
                    <p className="text-sm text-brand-muted mt-1">{isEn ? 'Changes are saved directly to the server .env file.' : 'التغييرات تُحفظ مباشرةً في ملف .env على السيرفر.'}</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="bg-brand-accent text-brand-bg px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
                    <ShieldCheck size={16} />
                    {saving ? (isEn ? 'Saving...' : 'جاري الحفظ...') : (isEn ? 'Save All' : 'حفظ الكل')}
                </button>
            </div>

            <Section title={isEn ? 'Business Identity' : 'هوية البيزنس'}>
                <Field k="business_name" label={isEn ? 'Business Name' : 'اسم البيزنس'} placeholder="My Store" />
            </Section>

            <Section title={isEn ? 'Visual Identity' : 'الهوية البصرية'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-brand-muted">{isEn ? 'Brand Logo' : 'لوجو البراند'}</label>
                        <div
                            onClick={() => logoInputRef.current?.click()}
                            className="w-full h-28 bg-brand-input border-2 border-dashed border-brand-accent/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-accent/50 transition-all"
                        >
                            {logoPreview || branding.logo_url ? (
                                <img
                                    src={logoPreview || `http://localhost:8765${branding.logo_url}`}
                                    alt="logo"
                                    className="h-16 object-contain"
                                />
                            ) : (
                                <>
                                    <ImageIcon size={24} className="text-brand-muted mb-1" />
                                    <span className="text-xs text-brand-muted">{isEn ? 'Click to upload logo' : 'اضغط لرفع اللوجو'}</span>
                                    <span className="text-[10px] text-brand-muted/60">{isEn ? 'PNG or JPG recommended' : 'يُفضل PNG أو JPG'}</span>
                                </>
                            )}
                        </div>
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                        {(logoPreview || branding.logo_url) && (
                            <button onClick={() => { setLogoPreview(null); setBrandingLocal(p => ({ ...p, logo_url: null })); }} className="text-xs text-red-400 hover:text-red-300">
                                {isEn ? 'Remove logo' : 'حذف اللوجو'}
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-brand-muted">{isEn ? 'Brand Color' : 'لون البراند'}</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={branding.brand_color}
                                onChange={e => setBrandingLocal(p => ({ ...p, brand_color: e.target.value }))}
                                className="w-14 h-14 rounded-xl border border-brand-accent/20 cursor-pointer bg-transparent"
                            />
                            <div>
                                <p className="text-sm font-bold" style={{ color: branding.brand_color }}>{branding.brand_color}</p>
                                <p className="text-[11px] text-brand-muted mt-1">{isEn ? 'Used for buttons, accents & highlights' : 'يُستخدم في الأزرار والتفاصيل'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap pt-1">
                            {['#d5aa65','#6366f1','#10b981','#ef4444','#f59e0b','#3b82f6','#ec4899','#8b5cf6'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setBrandingLocal(p => ({ ...p, brand_color: c }))}
                                    className={`w-7 h-7 rounded-lg border-2 transition-all ${branding.brand_color === c ? 'border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSaveBranding}
                    disabled={savingBranding}
                    className="mt-2 bg-brand-accent text-brand-bg px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {savingBranding ? (isEn ? 'Saving...' : 'جاري الحفظ...') : (isEn ? 'Save Visual Identity' : 'حفظ الهوية البصرية')}
                </button>
            </Section>

            <Section title={isEn ? 'WhatsApp / Meta' : 'WhatsApp / Meta'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field k="access_token" label="Meta Access Token" placeholder="EAAVXdh..." secret hint={isEn ? 'Masked for security' : 'مخفي للأمان'} />
                    <Field k="phone_number_id" label="Phone Number ID" placeholder="103275370326..." />
                    <Field k="verify_token" label="Webhook Verify Token" placeholder="my_secret" secret />
                    <Field k="api_version" label="API Version" placeholder="v25.0" />
                </div>
            </Section>

            <Section title="Shopify">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field k="shopify_url" label="Store URL" placeholder="my-store.myshopify.com" />
                    <Field k="shopify_access_token" label="Access Token" placeholder="shpat_..." secret />
                    <Field k="catalog_id" label="Catalog ID" placeholder="987654321012345" />
                </div>
            </Section>

            <Section title={isEn ? 'AI Provider' : 'مزود الذكاء الاصطناعي'}>
                <p className="text-xs text-brand-muted mb-3">
                    {isEn
                        ? 'Groq is recommended — free, fast, high limits (14,400 req/day). Get key at console.groq.com. Gemini is used as fallback.'
                        : 'Groq موصى به — مجاني، سريع، حد عالي (14,400 طلب/يوم). احصل على مفتاحك من console.groq.com. Gemini يُستخدم كبديل تلقائي.'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field k="groq_api_key" label="Groq API Key ⚡ (Recommended)" placeholder="gsk_..." secret
                        hint={isEn ? 'Free · LLaMA 3.3 70B · 14,400 req/day' : 'مجاني · LLaMA 3.3 70B · 14,400 طلب/يوم'} />
                    <Field k="groq_model" label={isEn ? 'Groq Model' : 'نموذج Groq'} placeholder="llama-3.3-70b-versatile"
                        hint={isEn ? 'llama-3.3-70b-versatile (best) or llama-3.1-8b-instant (fastest)' : 'llama-3.3-70b-versatile (أفضل) أو llama-3.1-8b-instant (أسرع)'} />
                    <Field k="gemini_api_key" label="Gemini AI Key (Fallback)" placeholder="AIza..." secret
                        hint={isEn ? 'Used only if Groq key is not set' : 'يُستخدم فقط لو مفيش Groq key'} />
                    <Field k="server_url" label={isEn ? 'Public Server URL' : 'الرابط العام للسيرفر'} placeholder="https://my-app.ngrok.io"
                        hint={isEn ? 'For campaign image headers' : 'لصور الهيدر في الحملات'} />
                </div>

                <div className="mt-6 pt-6 border-t border-brand-accent/10 space-y-3">
                    <label className="text-xs font-bold text-brand-text flex items-center gap-2">
                        <Sparkles size={14} className="text-brand-accent" />
                        {isEn ? 'AI Instructions & Personality' : 'تعليمات المساعد الذكي (البرومبت)'}
                    </label>
                    <p className="text-[11px] text-brand-muted">
                        {isEn 
                            ? 'Explain how the AI should talk (e.g., "Talk like a Egyptian seller, be very funny, focus on discount codes...").' 
                            : 'اشرح هنا كيف تريد للمساعد أن يتحدث مع عملائك (مثلاً: "اتكلم زي البياعين المصريين الشطار، استخدم فكاهة، ركز على كوبونات الخصم...").'}
                    </p>
                    <textarea
                        value={aiInstruction}
                        onChange={e => setAiInstruction(e.target.value)}
                        placeholder={isEn ? "Example: You are a professional sales assistant at Art Edges. Speak in Egyptian dialect, be very helpful, and always try to upsell related products..." : "مثال: أنت مساعد مبيعات محترف في آرت إيدج. اتكلم بالعامية المصرية اللبقة، خليك خدوم جداً، وحاول دايماً تقترح منتجات تانية للعميل..."}
                        rows={5}
                        className="w-full bg-brand-input border border-brand-accent/20 rounded-xl p-4 text-sm focus:border-brand-accent outline-none custom-scrollbar"
                    />
                </div>
            </Section>


            <ShippingSettings isEn={isEn} showToast={showToast} />

            <Section title="WooCommerce">
                <p className="text-xs text-brand-muted mb-3">
                    {isEn ? 'Connect your WooCommerce store as an alternative or in addition to Shopify.' : 'اربط متجر WooCommerce كبديل أو إضافة لشوبيفاي.'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field k="woo_url" label={isEn ? 'Store Domain' : 'دومين المتجر'} placeholder="mystore.com"
                        hint={isEn ? 'Without https://' : 'بدون https://'} />
                    <Field k="woo_consumer_key" label="Consumer Key" placeholder="ck_..." secret />
                    <Field k="woo_consumer_secret" label="Consumer Secret" placeholder="cs_..." secret />
                </div>
                <button onClick={handleTestWoo} disabled={testingWoo}
                    className="mt-1 text-xs bg-brand-accent/10 text-brand-accent px-4 py-2 rounded-lg hover:bg-brand-accent/20 font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors">
                    <Globe size={13} /> {testingWoo ? (isEn ? 'Connecting...' : 'جاري الاتصال...') : (isEn ? 'Test Connection' : 'اختبر الاتصال')}
                </button>
            </Section>

            <Section title={isEn ? 'Outbound Webhooks' : 'Webhooks الخارجية'}>
                <p className="text-xs text-brand-muted mb-3">
                    {isEn
                        ? 'Send events to Zapier, Make, or any custom endpoint when orders are confirmed, messages are received, and more.'
                        : 'أرسل أحداث لـ Zapier أو Make أو أي رابط خارجي عند تأكيد الطلبات أو استقبال رسائل.'}
                </p>
                <Field k="webhook_url" label={isEn ? 'Webhook URL' : 'رابط الـ Webhook'}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    hint={isEn ? 'Events: order_status_changed, test' : 'الأحداث: order_status_changed, test'} />
                <button onClick={handleTestWebhook} disabled={testingWebhook}
                    className="mt-1 text-xs bg-brand-accent/10 text-brand-accent px-4 py-2 rounded-lg hover:bg-brand-accent/20 font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors">
                    <Link2 size={13} /> {testingWebhook ? (isEn ? 'Sending...' : 'جاري الإرسال...') : (isEn ? 'Send Test Event' : 'إرسال حدث تجريبي')}
                </button>
            </Section>

            <Section title={isEn ? 'Loyalty Points' : 'نقاط الولاء'}>
                <p className="text-xs text-brand-muted mb-2">
                    {isEn
                        ? 'Customers earn points automatically when their orders are confirmed. View and manage points in any chat.'
                        : 'العملاء يكسبون نقاط تلقائياً عند تأكيد طلباتهم. يمكنك عرض وإدارة النقاط من داخل أي محادثة.'}
                </p>
                <div className="max-w-xs">
                    <Field k="loyalty_points" label={isEn ? 'Points per confirmed order' : 'نقاط لكل طلب مؤكد'} placeholder="10" />
                </div>
            </Section>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Loyalty Points Panel (CRM sidebar)
// ─────────────────────────────────────────────
const LoyaltyPanel = ({ phone, isEn, showToast }) => {
    const [data, setData] = useState(null);
    const [awardPoints, setAwardPoints] = useState('');
    const [awarding, setAwarding] = useState(false);

    useEffect(() => {
        if (!phone) return;
        axios.get(`${API_URL}/loyalty/${phone}`).then(r => setData(r.data)).catch(() => {});
    }, [phone]);

    const handleAward = async () => {
        const pts = parseInt(awardPoints);
        if (!pts || isNaN(pts)) return;
        setAwarding(true);
        try {
            const res = await axios.post(`${API_URL}/loyalty/award`, { phone, points: pts, reason: 'Manual award from dashboard' });
            setData(p => ({ ...p, points: res.data.points }));
            setAwardPoints('');
            showToast(isEn ? `Awarded ${pts} points!` : `تم منح ${pts} نقطة!`);
        } catch (e) { showToast(isEn ? 'Failed to award points' : 'فشل منح النقاط', 'error'); }
        setAwarding(false);
    };

    if (!data) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-brand-accent/10 pb-2">
                <h4 className="font-bold text-brand-accent text-sm flex items-center gap-2">
                    <Gift size={15} /> {isEn ? 'Loyalty Points' : 'نقاط الولاء'}
                </h4>
                <span className="text-xl font-bold text-brand-accent">{data.points || 0}
                    <span className="text-xs font-normal text-brand-muted ml-1">pts</span>
                </span>
            </div>

            {data.history?.length > 0 && (
                <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                    {[...data.history].reverse().slice(0, 5).map((h, i) => (
                        <div key={i} className="flex justify-between text-[11px] text-brand-muted">
                            <span className="truncate">{h.reason}</span>
                            <span className={`shrink-0 font-bold ml-2 ${h.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {h.points > 0 ? '+' : ''}{h.points}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-2">
                <input
                    type="number"
                    value={awardPoints}
                    onChange={e => setAwardPoints(e.target.value)}
                    placeholder={isEn ? 'Points to award' : 'نقاط للمنح'}
                    className="flex-1 bg-brand-input border border-brand-border rounded-lg px-3 py-1.5 text-xs focus:border-brand-accent outline-none"
                />
                <button onClick={handleAward} disabled={awarding || !awardPoints}
                    className="bg-brand-accent/20 text-brand-accent px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-accent/30 disabled:opacity-50 transition-colors">
                    {isEn ? 'Award' : 'منح'}
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
//  Analytics Dashboard
// ─────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color = 'text-brand-accent', icon: Icon }) => (
    <div className="glass p-5 rounded-2xl flex items-center gap-4">
        {Icon && (
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-brand-accent/10">
                <Icon size={22} className={color} />
            </div>
        )}
        <div>
            <p className="text-2xl font-bold text-brand-text">{value}</p>
            <p className="text-xs text-brand-muted font-bold mt-0.5">{label}</p>
            {sub && <p className="text-[11px] text-brand-muted opacity-70 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const BarChart = ({ data, isEn }) => {
    const max = Math.max(...data.map(d => Math.max(d.out, d.in)), 1);
    return (
        <div className="flex items-end gap-2 h-32 mt-4">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: '96px' }}>
                        <div className="flex-1 bg-brand-accent/70 rounded-t transition-all"
                            style={{ height: `${(d.out / max) * 96}px`, minHeight: d.out > 0 ? 4 : 0 }}
                            title={`${isEn ? 'Sent' : 'مرسل'}: ${d.out}`} />
                        <div className="flex-1 bg-green-500/50 rounded-t transition-all"
                            style={{ height: `${(d.in / max) * 96}px`, minHeight: d.in > 0 ? 4 : 0 }}
                            title={`${isEn ? 'Received' : 'مستلم'}: ${d.in}`} />
                    </div>
                    <span className="text-[9px] text-brand-muted text-center leading-tight">{d.label}</span>
                </div>
            ))}
        </div>
    );
};

const FunnelBar = ({ label, value, max, color }) => {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-brand-text">{label}</span>
                <span className="font-bold text-brand-muted">{value} <span className="text-[11px]">({pct}%)</span></span>
            </div>
            <div className="w-full bg-brand-card rounded-full h-2.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

const AnalyticsDashboard = ({ lang }) => {
    const isEn = lang === 'en';
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${API_URL}/analytics`);
                setData(res.data && typeof res.data === 'object' ? res.data : {});
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        load();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
        </div>
    );

    if (!data) return (
        <div className="flex items-center justify-center h-64 text-brand-muted">
            {isEn ? 'Failed to load analytics.' : 'فشل تحميل التقارير.'}
        </div>
    );

    const { messages, funnel, autoStats, topCustomers, daily } = data;
    const totalOrders = Object.values(funnel).reduce((s, v) => s + v, 0);
    const conversionRate = totalOrders > 0 ? Math.round((funnel.confirmed / totalOrders) * 100) : 0;

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-brand-accent flex items-center gap-2">
                        <History size={22} /> {isEn ? 'Analytics & Reports' : 'التقارير والإحصاء'}
                    </h2>
                    <p className="text-sm text-brand-muted mt-1">{isEn ? 'Real-time overview of all system activity.' : 'نظرة شاملة على نشاط النظام.'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <a href={`${API_URL}/export/contacts`} download
                        className="flex items-center gap-1.5 text-xs bg-brand-accent/10 text-brand-accent px-4 py-2.5 rounded-xl font-bold hover:bg-brand-accent/20 transition-colors border border-brand-accent/20">
                        <Download size={13} /> {isEn ? 'Contacts CSV' : 'تصدير جهات الاتصال'}
                    </a>
                    <a href={`${API_URL}/export/orders`} download
                        className="flex items-center gap-1.5 text-xs bg-brand-accent/10 text-brand-accent px-4 py-2.5 rounded-xl font-bold hover:bg-brand-accent/20 transition-colors border border-brand-accent/20">
                        <Download size={13} /> {isEn ? 'Orders CSV' : 'تصدير الطلبات'}
                    </a>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={MessageCircle} label={isEn ? 'Messages Sent' : 'رسائل مرسلة'} value={messages.totalOutbound}
                    sub={isEn ? `${messages.seenCount} seen` : `${messages.seenCount} مقروءة`} />
                <KpiCard icon={MessageCircle} label={isEn ? 'Messages Received' : 'رسائل واردة'} value={messages.totalInbound}
                    color="text-green-400"
                    sub={isEn ? `${messages.conversations} conversations` : `${messages.conversations} محادثة`} />
                <KpiCard icon={CheckCircle2} label={isEn ? 'Response Rate' : 'معدل الرد'} value={`${messages.responseRate}%`}
                    color="text-blue-400"
                    sub={isEn ? 'Customers who replied' : 'عملاء ردوا على الأقل مرة'} />
                <KpiCard icon={ShoppingCart} label={isEn ? 'Conversion Rate' : 'معدل التحويل'} value={`${conversionRate}%`}
                    color="text-brand-gold"
                    sub={isEn ? 'Orders confirmed' : 'طلبات تم تأكيدها'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Funnel */}
                <div className="glass p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-brand-accent">{isEn ? 'Order Funnel' : 'قمع الطلبات'}</h3>
                    <div className="space-y-3">
                        <FunnelBar label={isEn ? 'New / Pending' : 'جديد / معلق'} value={funnel.new} max={totalOrders} color="bg-brand-muted/50" />
                        <FunnelBar label={isEn ? 'Followed Up' : 'تمت المتابعة'} value={funnel.followed_up} max={totalOrders} color="bg-brand-accent/70" />
                        <FunnelBar label={isEn ? 'Confirmed' : 'تم التأكيد'} value={funnel.confirmed} max={totalOrders} color="bg-green-500/80" />
                        <FunnelBar label={isEn ? 'Shipped' : 'تم الشحن'} value={funnel.shipped} max={totalOrders} color="bg-blue-500/80" />
                        <FunnelBar label={isEn ? 'Cancelled' : 'ملغى'} value={funnel.cancelled} max={totalOrders} color="bg-red-500/60" />
                    </div>
                    <p className="text-xs text-brand-muted pt-1 border-t border-brand-accent/5">
                        {isEn ? `Total tracked orders: ${totalOrders}` : `إجمالي الطلبات المتتبعة: ${totalOrders}`}
                    </p>
                </div>

                {/* Automation Stats */}
                <div className="glass p-6 rounded-2xl space-y-4">
                    <h3 className="font-bold text-brand-accent">{isEn ? 'Automation Engine' : 'محرك الأتمتة'}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: isEn ? 'Pending' : 'قيد الانتظار', value: autoStats.pending, color: 'bg-brand-accent/20 text-brand-accent' },
                            { label: isEn ? 'Executed' : 'نُفِّذ', value: autoStats.done, color: 'bg-green-500/20 text-green-400' },
                            { label: isEn ? 'Failed' : 'فشل', value: autoStats.failed, color: 'bg-red-500/20 text-red-400' },
                            { label: isEn ? 'Cancelled' : 'ألغي', value: autoStats.cancelled, color: 'bg-brand-muted/20 text-brand-muted' },
                        ].map(s => (
                            <div key={s.label} className={`rounded-2xl p-4 text-center ${s.color.split(' ')[0]}`}>
                                <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
                                <p className="text-xs font-bold mt-1 opacity-80">{s.label}</p>
                            </div>
                        ))}
                    </div>
                    {/* Message read breakdown */}
                    <div className="pt-3 border-t border-brand-accent/5 space-y-2">
                        <p className="text-xs font-bold text-brand-muted uppercase tracking-wider">{isEn ? 'Message Status Breakdown' : 'توزيع حالات الرسائل'}</p>
                        <div className="flex gap-3 text-xs">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-accent inline-block" />{isEn ? 'Seen' : 'مقروء'}: {messages.seenCount}</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />{isEn ? 'Delivered' : 'تم التسليم'}: {messages.deliveredCount}</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-muted inline-block" />{isEn ? 'Sent' : 'مرسل'}: {messages.totalOutbound - messages.seenCount - messages.deliveredCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Volume Chart */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="font-bold text-brand-accent">{isEn ? 'Message Volume (Last 7 Days)' : 'حجم الرسائل (آخر 7 أيام)'}</h3>
                    <div className="flex gap-4 mt-2 text-xs text-brand-muted">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-accent/70 inline-block" />{isEn ? 'Outbound' : 'صادرة'}</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/50 inline-block" />{isEn ? 'Inbound' : 'واردة'}</span>
                    </div>
                    <BarChart data={daily} isEn={isEn} />
                </div>

                {/* Top Customers */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="font-bold text-brand-accent mb-4">{isEn ? 'Most Active Customers' : 'أكثر العملاء تفاعلاً'}</h3>
                    {topCustomers.length === 0 ? (
                        <p className="text-brand-muted text-sm text-center py-8">{isEn ? 'No data yet.' : 'لا توجد بيانات بعد.'}</p>
                    ) : (
                        <div className="space-y-3">
                            {topCustomers.map((c, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-brand-accent/20 flex items-center justify-center text-xs font-bold text-brand-accent shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-brand-text truncate">{c.name}</p>
                                        <p className="text-[11px] text-brand-muted" dir="ltr">{c.phone}</p>
                                    </div>
                                    <span className="text-xs font-bold text-brand-accent shrink-0">{c.count} {isEn ? 'msgs' : 'رسالة'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
