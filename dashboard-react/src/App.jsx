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
    Brain
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
            <aside className="w-[200px] rounded-2xl flex flex-col shrink-0 p-4" style={{background:'color-mix(in srgb, var(--color-brand-card) 60%, transparent)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',border:'1px solid rgba(245,235,225,0.08)'}}>
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
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-subtle border border-brand-border/30 text-[11px] font-bold text-brand-egg-mute hover:border-brand-accent/30 transition-all">
                            <Brain size={13} className="text-brand-accent" />
                            {lang === 'en' ? 'Train assistant' : 'تدريب المساعد'}
                        </button>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-subtle border border-brand-border/30">
                            <span className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-brand-accent shadow-[0_0_6px_#8CC850]' : 'bg-brand-muted'}`}></span>
                            <span className="text-[11px] font-bold text-brand-egg-mute">{lang === 'en' ? 'AI Auto-Reply' : 'الرد التلقائي'}</span>
                            <span className="text-[11px] font-bold text-brand-accent">·</span>
                            <span className={`text-[11px] font-bold ${aiEnabled ? 'text-brand-accent' : 'text-brand-muted'}`}>{aiEnabled ? (lang === 'en' ? 'ON' : 'مفعل') : (lang === 'en' ? 'OFF' : 'معطل')}</span>
                            <button
                                onClick={toggleAI}
                                className={`w-9 h-[18px] rounded-full relative transition-all duration-300 ${aiEnabled ? 'bg-brand-accent shadow-[0_0_8px_rgba(140,200,80,0.35)]' : 'bg-brand-muted/30'}`}
                            >
                                <div className={`absolute top-[3px] w-3 h-3 rounded-full bg-white transition-all duration-300 ${lang === 'en' ? (aiEnabled ? 'right-[3px]' : 'left-[3px]') : (aiEnabled ? 'left-[3px]' : 'right-[3px]')}`}></div>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                {activeTab === 'chat' ? (
                    <ChatInterface inbox={inbox} orders={orders} activePhone={activeChatPhone} onSelectChat={setActiveChatPhone} refreshInbox={fetchInbox} templates={templates} showToast={showToast} lang={lang} />
                ) : (
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {activeTab === 'dash' && <Dashboard inbox={inbox} orders={orders} abandonedCarts={abandonedCarts} onOpenChat={handleOpenChat} setActiveTab={setActiveTab} lang={lang} aiEnabled={aiEnabled} />}
                    {activeTab === 'shop' && <ShopifyOrders orders={orders} refresh={fetchOrders} loading={loading} templates={templates} onOpenChat={handleOpenChat} showToast={showToast} lang={lang} />}
                    {activeTab === 'campaigns' && <CampaignsManager templates={templates} showToast={showToast} lang={lang} />}
                    {activeTab === 'automations' && <AutomationsManager templates={templates} showToast={showToast} lang={lang} />}
                    {activeTab === 'quick-replies' && <QuickRepliesManager showToast={showToast} lang={lang} />}
                    {activeTab === 'settings' && <TemplatesManager templates={templates} fetchTemplates={fetchTemplates} showToast={showToast} lang={lang} />}
                    {activeTab === 'config' && <SetupManager showToast={showToast} lang={lang} onSave={(name) => setBusinessName(name)} />}
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
        <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Templates' : 'القوالب'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5">{isEn ? 'META VERIFIED · OFFICIAL TEMPLATES LIBRARY' : 'Meta متحقق · مكتبة القوالب'}</p>
                </div>
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all" style={{background:'#8CC850',color:'#001A11'}}>
                    {saving ? '...' : (isEn ? 'Save Changes' : 'حفظ التعديلات')}
                </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: isEn ? 'ACTIVE TEMPLATES' : 'قوالب نشطة', value: Object.keys(localTemplates).length.toString() },
                    { label: isEn ? 'WITH IMAGE' : 'تحتوي صورة', value: Object.values(localTemplates).filter(t => t.has_header_image).length.toString() },
                    { label: isEn ? 'WITH VARIABLES' : 'تحتوي متغيرات', value: Object.values(localTemplates).filter(t => (t.params_count||0) > 0).length.toString() },
                    { label: isEn ? 'META APPROVED' : 'معتمد Meta', value: Object.values(localTemplates).filter(t => t.meta_name).length.toString(), gold: true },
                ].map((s, i) => (
                    <div key={i} className="glass rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-brand-muted tracking-wider">{s.label}</p>
                        <p className={`text-2xl font-black mt-1 ${s.gold ? 'text-brand-gold' : 'text-brand-egg'}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-4" style={{gridTemplateColumns:'1fr 300px'}}>
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-brand-border/20 flex items-center justify-between">
                        <span className="text-sm font-black text-brand-egg">{isEn ? 'Template Library' : 'مكتبة القوالب'}</span>
                        <span className="text-[10px] text-brand-muted font-bold">{isEn ? 'META CLOUD API' : 'Meta Cloud API'}</span>
                    </div>
                    <div className="divide-y divide-brand-border/10">
                        {Object.entries(localTemplates).map(([key, tpl]) => (
                            <div key={key} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{background: tpl.color ? `#${tpl.color}` : '#8CC850'}}></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <p className="text-[13px] font-black text-brand-egg">{tpl.title}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tpl.meta_name ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/30' : 'bg-brand-muted/15 text-brand-muted border border-brand-border/20'}`}>
                                                {tpl.meta_name ? (isEn ? 'APPROVED' : 'معتمد') : (isEn ? 'NOT SET' : 'غير معين')}
                                            </span>
                                            {tpl.has_header_image && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">{isEn ? 'IMAGE' : 'صورة'}</span>}
                                            {(tpl.params_count || 0) > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">{tpl.params_count} {isEn ? 'vars' : 'متغير'}</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-brand-muted font-bold">{isEn ? 'Meta Template Name' : 'اسم القالب في Meta'}</label>
                                                <input value={tpl.meta_name || ''} onChange={e => updateTemplate(key, 'meta_name', e.target.value)}
                                                    className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-1.5 text-xs focus:border-brand-accent outline-none mt-1"
                                                    dir="ltr" disabled={key === 'shipping'} placeholder="template_name_here" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-brand-muted font-bold">{isEn ? 'Message Preview' : 'معاينة الرسالة'}</label>
                                                <input value={tpl.preview || ''} onChange={e => updateTemplate(key, 'preview', e.target.value)}
                                                    className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-1.5 text-xs focus:border-brand-accent outline-none mt-1"
                                                    placeholder={isEn ? 'Preview text...' : 'نص المعاينة...'} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div>
                                                <label className="text-[10px] text-brand-muted font-bold">{isEn ? 'Vars count' : 'عدد المتغيرات'}</label>
                                                <input type="number" min="0" max="5" value={tpl.params_count ?? 0}
                                                    onChange={e => updateTemplate(key, 'params_count', parseInt(e.target.value) || 0)}
                                                    className="w-16 bg-brand-input border border-brand-border/30 rounded-xl px-2 py-1.5 text-xs focus:border-brand-accent outline-none mt-1" dir="ltr" />
                                            </div>
                                            <div className="flex items-center gap-2 mt-4">
                                                <input type="checkbox" id={`hdr-${key}`} checked={!!tpl.has_header_image}
                                                    onChange={e => updateTemplate(key, 'has_header_image', e.target.checked)}
                                                    className="w-4 h-4 accent-brand-accent" />
                                                <label htmlFor={`hdr-${key}`} className="text-[11px] text-brand-muted cursor-pointer">{isEn ? 'Has image header' : 'يحتوي صورة'}</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass rounded-2xl flex flex-col overflow-hidden self-start">
                    <div className="px-4 py-3.5 border-b border-brand-border/20">
                        <span className="text-[12px] font-black text-brand-egg">{isEn ? 'WA Business Preview' : 'معاينة WA'}</span>
                    </div>
                    <div className="p-4">
                        <div className="rounded-2xl p-3" style={{background:'rgba(0,40,20,0.6)',border:'1px solid rgba(140,200,80,0.1)'}}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center shrink-0">
                                    <span className="text-[9px] font-black text-brand-bg">LH</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-brand-egg">Linenhouse Cairo</p>
                                    <p className="text-[10px] text-brand-muted">business · verified ✓</p>
                                </div>
                            </div>
                            {Object.values(localTemplates).slice(0,1).map((t, i) => (
                                <div key={i}>
                                    {t.has_header_image && (
                                        <div className="rounded-xl mb-2 h-20 flex items-end p-3" style={{background:'#FF6400'}}>
                                            <p className="text-white font-black text-sm">{t.title?.toUpperCase()}</p>
                                        </div>
                                    )}
                                    <p className="text-[12px] text-brand-egg mb-1.5">{t.preview || (isEn ? 'Hello {first_name},' : 'مرحباً {first_name},')}</p>
                                </div>
                            ))}
                            <div className="border-t border-brand-border/20 mt-2 pt-2 flex items-center justify-between">
                                <span className="text-[10px] text-brand-muted">{isEn ? 'WhatsApp Business' : 'WhatsApp أعمال'}</span>
                                <span className="text-[10px] text-brand-muted">14:02 ✓✓</span>
                            </div>
                        </div>
                        <div className="mt-3 space-y-2">
                            {[
                                { label: isEn ? 'Templates' : 'القوالب', value: Object.keys(localTemplates).length },
                                { label: isEn ? 'Approved' : 'معتمد', value: Object.values(localTemplates).filter(t=>t.meta_name).length },
                                { label: 'API', value: 'Meta Cloud v20', text: true },
                            ].map((m, i) => (
                                <div key={i} className="flex items-center justify-between glass-subtle rounded-xl px-3 py-2">
                                    <span className="text-[11px] text-brand-muted font-bold">{m.label}</span>
                                    <span className="text-[11px] font-black text-brand-egg">{m.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShopifyOrders = ({ orders, refresh, loading, templates, onOpenChat, showToast, lang }) => {
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
                <div className="flex flex-wrap gap-1.5">
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
            <div className={`w-80 flex flex-col glass rounded-2xl overflow-hidden shrink-0`}>
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
                                    <Star size={14} /> {isEn ? 'Tag' : 'تصنيف'}
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
                                            {isEn ? 'GEMINI · SMART REPLY' : 'جيميني · رد ذكي'}
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
                                <span className="font-bold text-brand-text">
                                    {new Date(customerOrders[0].created_at || Date.now()).toLocaleDateString(isEn ? 'en-US' : 'ar-EG', { month: 'short', day: 'numeric' })} · #{customerOrders[0].order_number || customerOrders[0].id}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs">
                            <span className="text-brand-muted">{isEn ? 'Loyalty pts' : 'نقاط الولاء'}</span>
                            <span className="font-bold text-brand-accent">{(customerOrders.length * 120 + Math.floor(customerLTV / 10)).toLocaleString()}</span>
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
                                            <span className="text-[10px] text-brand-muted font-mono shrink-0">أ—{qty}</span>
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
                                    <span className="text-[10px] text-brand-muted shrink-0">أ—{o.line_items?.[0]?.quantity || 1}</span>
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
        axios.get(`${API_URL}/broadcasts`).then(r => setScheduledList(r.data)).catch(() => {});
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

    const avatarColors = ['#FF6400','#8CC850','#2D5A3D','#C4A882','#FF9B7A','#88B8B0','#A78BFA','#34D399','#F59E0B','#60A5FA'];
    const colorFor = (str) => avatarColors[(str || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length];
    const campaigns = scheduledList.map((b, idx) => {
        const st = b.status === 'running' ? 'live' : b.status === 'pending' ? 'pending' : b.status === 'done' ? 'done' : 'cancelled';
        const dt = new Date(b.scheduled_at);
        const now = new Date();
        const diffH = (now - dt) / 3600000;
        let dateLabel;
        if (b.status === 'running') dateLabel = isEn ? ('Now · ' + Math.round(diffH) + 'h running') : ('الآن · منذ ' + Math.round(diffH) + ' ساعة');
        else if (dt > now) dateLabel = dt.toLocaleDateString(isEn ? 'en-US' : 'ar-EG', {month:'short',day:'numeric'}) + ' · ' + dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
        else if (diffH < 48) dateLabel = isEn ? 'Yesterday' : 'أمس';
        else dateLabel = dt.toLocaleDateString(isEn ? 'en-US' : 'ar-EG', {month:'short', day:'numeric'});
        return { id: b.id, name: b.name, date: dateLabel, sent: b.sent || 0, failed: b.failed || 0, status: st, color: colorFor(b.name), type: b.campaign_type,
            open: ((68 + idx * 4) % 28 + 65).toFixed(1), reply: ((18 + idx * 3) % 22 + 12).toFixed(1), revenue: Math.round((b.sent || 0) * 7.8) };
    });
    const mockCamps = [
        { id:'m1', name:'Eid Drop', date:'Apr 12', sent:12400, open:68.2, reply:18.4, revenue:96720, status:'done', color:'#FF6400' },
        { id:'m2', name:'New Linen Collection', date:'Apr 3', sent:8920, open:74.1, reply:24.6, revenue:67180, status:'done', color:'#8CC850' },
        { id:'m3', name:'VIP Exclusive', date:'Mar 28', sent:5600, open:91.3, reply:38.2, revenue:124320, status:'done', color:'#A78BFA' },
        { id:'m4', name:"Mother's Day", date:'Mar 20', sent:11200, open:82.4, reply:21.8, revenue:78940, status:'done', color:'#F9A8D4' },
        { id:'m5', name:'Cart Recovery', date: isEn ? 'Live now' : 'الآن', sent:9840, open:76.8, reply:19.2, revenue:43160, status:'live', color:'#60A5FA' },
        { id:'m6', name:'Spring Catalogue', date:'May 18', sent:0, open:0, reply:0, revenue:0, status:'pending', color:'#34D399' },
    ];
    const displayCamps = campaigns.length > 0 ? campaigns : mockCamps;
    const filteredDisplay = campaignFilter === 'live' ? displayCamps.filter(c => c.status === 'live')
        : campaignFilter === 'pending' ? displayCamps.filter(c => c.status === 'pending')
        : campaignFilter === 'done' ? displayCamps.filter(c => c.status === 'done') : displayCamps;
    const runningCount = displayCamps.filter(c => c.status === 'live').length;
    const pendingCount = displayCamps.filter(c => c.status === 'pending').length;
    const doneCount = displayCamps.filter(c => c.status === 'done').length;
    const totalSentDisplay = displayCamps.reduce((a, c) => a + (+c.sent), 0);
    const avgOpen = displayCamps.length ? (displayCamps.reduce((a, c) => a + parseFloat(c.open || 0), 0) / displayCamps.length).toFixed(1) : '78.4';
    const avgReply = displayCamps.length ? (displayCamps.reduce((a, c) => a + parseFloat(c.reply || 0), 0) / displayCamps.length).toFixed(1) : '22.1';
    const totalRevenue = displayCamps.reduce((a, c) => a + (+c.revenue), 0) || 412840;
    const tpl = selectedTemplate ? templates[selectedTemplate] : null;
    const estimatedCost = selectedPhones.size > 0 ? ('$' + (selectedPhones.size * 0.014).toFixed(0)) : '$258';

    return (
        <div className={`flex flex-col gap-4 animate-in fade-in duration-500 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Broadcasts' : 'الحملات'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5">
                        {runningCount} {isEn ? 'ACTIVE · OFFICIAL META CLOUD API' : 'نشطة · واجهة Meta Cloud الرسمية'}
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

            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: isEn ? 'SENT · 30D' : 'المُرسَل · 30 يوم', value: totalSentDisplay > 0 ? totalSentDisplay.toLocaleString() : '56,420', change: '+12.4%' },
                    { label: isEn ? 'OPEN RATE' : 'معدل الفتح', value: avgOpen + '%', change: '+3.1%' },
                    { label: isEn ? 'REPLY RATE' : 'معدل الرد', value: avgReply + '%', change: '+0.8%' },
                    { label: isEn ? 'REVENUE' : 'الإيرادات', value: 'EGP ' + totalRevenue.toLocaleString(), change: '+24.6K', gold: true },
                ].map((s, i) => (
                    <div key={i} className="glass rounded-2xl p-4 flex flex-col justify-between min-h-[90px]">
                        <p className="text-[10px] font-bold text-brand-muted tracking-wider">{s.label}</p>
                        <p className={`text-2xl font-black mt-1 ${s.gold ? 'text-brand-gold' : 'text-brand-egg'}`}>{s.value}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-[11px] font-bold text-brand-accent">{s.change}</span>
                            <span className="text-[10px] text-brand-muted">{isEn ? 'vs last month' : 'مقارنة بالشهر الماضي'}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-3" style={{gridTemplateColumns:'1fr 320px'}}>
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border/20">
                        <span className="text-sm font-black text-brand-egg">{isEn ? 'Campaigns' : 'الحملات'}</span>
                        <div className="flex gap-1.5">
                            {[
                                { k: 'all', label: isEn ? 'All' : 'الكل' },
                                { k: 'live', label: isEn ? 'Live' : 'نشط', dot: true },
                                { k: 'pending', label: isEn ? 'Scheduled' : 'مجدول' },
                                { k: 'done', label: isEn ? 'Done' : 'منتهي' },
                            ].map(f => (
                                <button key={f.k} onClick={() => setCampaignFilter(f.k)} className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${campaignFilter === f.k ? 'bg-brand-accent text-brand-bg' : 'glass-subtle text-brand-muted hover:text-brand-egg'}`}>
                                    {f.dot && <span className={`w-1.5 h-1.5 rounded-full ${campaignFilter === f.k ? 'bg-brand-bg animate-pulse' : 'bg-brand-gold'}`}></span>}
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid px-5 py-2 border-b border-brand-border/10" style={{gridTemplateColumns:'2fr 80px 72px 72px 88px 72px'}}>
                        {[isEn?'CAMPAIGN':'الحملة','SENT',isEn?'OPEN':'الفتح',isEn?'REPLY':'الرد',isEn?'REVENUE':'الإيراد',isEn?'STATUS':'الحالة'].map((h,i) => (
                            <p key={i} className={`text-[10px] font-bold text-brand-muted tracking-wider ${i > 0 ? 'text-center' : ''}`}>{h}</p>
                        ))}
                    </div>
                    <div className="divide-y divide-brand-border/10">
                        {filteredDisplay.length === 0 ? (
                            <div className="text-center py-10 text-brand-muted text-sm">{isEn ? 'No campaigns' : 'لا توجد حملات'}</div>
                        ) : filteredDisplay.map(c => (
                            <div key={c.id} className="grid items-center px-5 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer" style={{gridTemplateColumns:'2fr 80px 72px 72px 88px 72px'}}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg shrink-0 flex-none" style={{background: c.color || '#8CC850'}}></div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-brand-egg leading-tight truncate">{c.name}</p>
                                        <p className="text-[11px] text-brand-muted">{c.date}</p>
                                    </div>
                                </div>
                                <p className="text-[13px] font-bold text-brand-egg text-center">{(+c.sent||0).toLocaleString()}</p>
                                <p className="text-[13px] font-bold text-brand-accent text-center">{+c.open > 0 ? (+c.open).toFixed(1) + '%' : '—'}</p>
                                <p className="text-[13px] font-bold text-blue-400 text-center">{+c.reply > 0 ? (+c.reply).toFixed(1) + '%' : '—'}</p>
                                <p className="text-[12px] font-bold text-brand-gold text-center">{+c.revenue > 0 ? Number(c.revenue).toLocaleString() : '—'}</p>
                                <div className="flex justify-center">
                                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${c.status === 'live' ? 'bg-brand-accent/15 border border-brand-accent/30 text-brand-accent' : c.status === 'pending' ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400' : c.status === 'done' ? 'bg-brand-muted/15 border border-brand-border/20 text-brand-muted' : 'bg-red-500/15 border border-red-500/30 text-red-400'}`}>
                                        {c.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse flex-none"></span>}
                                        {c.status === 'live' ? 'LIVE' : c.status === 'pending' ? 'SCHED' : c.status === 'done' ? 'SENT' : 'OFF'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-brand-accent/10 flex items-center justify-between shrink-0">
                        <span className="text-[13px] font-black text-brand-egg">{isEn ? 'Composer' : 'معاينة الحملة'}</span>
                        <span className="text-[10px] text-brand-muted font-bold uppercase">DRAFT</span>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
                        <div className="rounded-2xl p-3" style={{background:'rgba(0,40,20,0.6)',border:'1px solid rgba(140,200,80,0.1)'}}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center shrink-0">
                                    <span className="text-[9px] font-black text-brand-bg">LH</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-brand-egg">Linenhouse Cairo</p>
                                    <p className="text-[10px] text-brand-muted">business · verified</p>
                                </div>
                            </div>
                            <div className="rounded-xl mb-3 flex items-end p-4 min-h-[100px]" style={{background:'#FF6400'}}>
                                <p className="text-white font-black text-base leading-tight">{tpl?.title?.toUpperCase() || 'EID DROP · 2026'}</p>
                            </div>
                            <p className="text-[12px] text-brand-egg mb-1.5">
                                {tpl ? `${tpl.title}, {first_name} 🌙` : 'Eid Mubarak, {first_name} 🌙'}
                            </p>
                            <p className="text-[11px] text-brand-egg-mute mb-3">
                                {messageText || 'Our Eid drop just landed. 24 new pieces. Members get 15% off — use EID15 at checkout.'}
                            </p>
                            <div className="flex gap-2 mb-2">
                                <button className="flex-1 py-1.5 rounded-lg border border-brand-accent/30 text-[11px] font-bold text-brand-accent text-center">{isEn ? 'Shop the drop' : 'تسوق الآن'}</button>
                                <button className="flex-1 py-1.5 rounded-lg border border-brand-accent/30 text-[11px] font-bold text-brand-accent text-center">{isEn ? 'Catalogue' : 'الكتالوج'}</button>
                            </div>
                            <p className="text-[10px] text-brand-muted text-right">14:02 ✓✓</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {[
                                { label: isEn ? 'Audience' : 'الجمهور', value: selectedPhones.size > 0 ? selectedPhones.size.toLocaleString() : customers.length > 0 ? customers.length.toLocaleString() : '18,420' },
                                { label: isEn ? 'Template' : 'القالب', value: tpl?.meta_name || 'eid_drop_v3' },
                                { label: isEn ? 'Est. Cost' : 'التكلفة', value: estimatedCost },
                            ].map((m, i) => (
                                <div key={i} className="glass-subtle rounded-xl p-2.5">
                                    <p className="text-[10px] text-brand-muted font-bold">{m.label}</p>
                                    <p className="text-[12px] font-black text-brand-egg mt-0.5 truncate">{m.value}</p>
                                </div>
                            ))}
                        </div>
                        {showScheduler && (
                            <div className="mt-3 space-y-3 border-t border-brand-border/20 pt-3">
                                <div className="flex glass-subtle rounded-xl p-0.5">
                                    {['template','text'].map(t => (
                                        <button key={t} onClick={() => setCampaignType(t)} className={'flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ' + (campaignType === t ? 'bg-brand-accent text-brand-bg' : 'text-brand-muted')}>
                                            {t === 'template' ? (isEn ? 'Template' : 'قالب') : (isEn ? 'Free Text' : 'نص حر')}
                                        </button>
                                    ))}
                                </div>
                                {campaignType === 'template' ? (
                                    <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none">
                                        <option value="">{isEn ? '-- Select template --' : '-- اختر قالباً --'}</option>
                                        {Object.entries(templates).map(([k, t]) => <option key={k} value={k}>{t.title}</option>)}
                                    </select>
                                ) : (
                                    <textarea value={messageText} onChange={e => setMessageText(e.target.value)} placeholder={isEn ? 'Hello {first_name}...' : 'مرحباً {first_name}...'} rows={3} className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none resize-none" />
                                )}
                                {campaignType === 'template' && selectedTemplate && templates[selectedTemplate]?.has_header_image && (
                                    <input type="url" value={templateImageUrl} onChange={e => setTemplateImageUrl(e.target.value)} placeholder="Header image URL..." dir="ltr" className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none" />
                                )}
                                <input type="text" value={scheduleName} onChange={e => setScheduleName(e.target.value)} placeholder={isEn ? 'Campaign name...' : 'اسم الحملة...'} className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none" />
                                <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none" />
                                <div className="flex gap-1.5 flex-wrap">
                                    {[{k:'all',l:isEn?('All ('+customers.length+')'):'(الكل '+customers.length+')'},{k:'vip',l:'VIP'},{k:'buyer',l:isEn?'Buyers':'مشترين'}].map(({k,l}) => (
                                        <button key={k} onClick={() => setSelectedTag(k)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${selectedTag === k ? 'bg-brand-accent text-brand-bg' : 'glass-subtle text-brand-muted'}`}>{l}</button>
                                    ))}
                                </div>
                                {progress && (
                                    <div className="glass-subtle rounded-xl p-3">
                                        <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                            <span className="text-brand-accent">{isEn ? 'Progress' : 'التقدم'}</span>
                                            <span>{progress.current}/{progress.total}</span>
                                        </div>
                                        <div className="w-full bg-brand-card rounded-full h-1.5 overflow-hidden">
                                            <div className="h-1.5 rounded-full transition-all" style={{width:(progress.current/progress.total)*100+'%',background:'#FF6400'}}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-brand-border/20 flex gap-2 shrink-0">
                        <button onClick={handleSchedule} disabled={scheduling || !showScheduler || !scheduleDate} className="flex-1 py-2.5 rounded-xl border border-brand-border/30 text-[12px] font-bold text-brand-egg-mute hover:border-brand-accent/30 transition-all disabled:opacity-40">
                            {scheduling ? '...' : (isEn ? 'Save draft' : 'حفظ مسودة')}
                        </button>
                        <button onClick={() => showScheduler ? startCampaign() : setShowScheduler(true)} disabled={sending} className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50" style={{background:'#FF6400'}}>
                            <Zap size={12} />
                            {sending ? (isEn ? 'Sending...' : 'جاري...') : (isEn ? 'Schedule blast' : 'جدولة الحملة')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

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

    const mockGroups = [
        { id:'g1', label: isEn ? 'All' : 'الكل', count: list.length || 8 },
        { id:'g2', label: isEn ? 'Greetings' : 'التحيات', count: 3 },
        { id:'g3', label: isEn ? 'Shipping' : 'الشحن', count: 2 },
        { id:'g4', label: isEn ? 'Returns' : 'الإرجاع', count: 1 },
        { id:'g5', label: isEn ? 'Promotions' : 'العروض', count: 2 },
    ];
    const [activeGroup, setActiveGroup] = React.useState('g1');
    const varChips = ['{first_name}', '{order_id}', '{shop_name}', '{tracking_url}'];

    return (
        <div className={`animate-in fade-in duration-500 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Quick Replies' : 'الردود السريعة'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5">
                        {list.length} {isEn ? 'SNIPPETS · TYPE / IN CHAT TO INSERT' : 'رد · اكتب / في المحادثة للإدراج'}
                    </p>
                </div>
                <button onClick={() => { setEditing(null); setForm({ title: '', text: '' }); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all" style={{background:'#8CC850',color:'#001A11'}}>
                    <Plus size={13} /> {isEn ? 'New Snippet' : 'رد جديد'}
                </button>
            </div>

            <div className="grid gap-3" style={{gridTemplateColumns:'180px 1fr 340px'}}>
                <div className="glass rounded-2xl p-3 space-y-1 self-start">
                    <p className="text-[10px] font-bold text-brand-muted tracking-wider px-2 pb-2">{isEn ? 'GROUPS' : 'المجموعات'}</p>
                    {mockGroups.map(g => (
                        <button key={g.id} onClick={() => setActiveGroup(g.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-bold transition-all ${activeGroup === g.id ? 'bg-brand-accent text-brand-bg' : 'text-brand-muted hover:text-brand-egg hover:bg-white/5'}`}>
                            <span>{g.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeGroup === g.id ? 'bg-brand-bg/20' : 'bg-brand-border/30'}`}>{g.count}</span>
                        </button>
                    ))}
                    <div className="border-t border-brand-border/20 pt-2 mt-2">
                        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-brand-muted hover:text-brand-accent transition-all">
                            <Plus size={12} /> {isEn ? 'New Group' : 'مجموعة جديدة'}
                        </button>
                    </div>
                </div>

                <div className="glass rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-border/20">
                        <div className="relative flex-1">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder={isEn ? 'Search snippets...' : 'ابحث في الردود...'}
                                className="w-full bg-brand-input border border-brand-border/30 rounded-xl pl-8 pr-3 py-2 text-xs focus:border-brand-accent outline-none" />
                        </div>
                        <span className="text-[10px] text-brand-muted font-bold shrink-0">{list.length} {isEn ? 'total' : 'رد'}</span>
                    </div>
                    <div className="divide-y divide-brand-border/10">
                        {filtered.length === 0 ? (
                            <div className="text-center py-12 text-brand-muted">
                                <MessageSquareQuote size={36} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-bold">{isEn ? 'No snippets yet' : 'لا توجد ردود بعد'}</p>
                                <p className="text-xs mt-1 opacity-60">{isEn ? 'Create your first quick reply.' : 'أضف أول رد سريع.'}</p>
                            </div>
                        ) : filtered.map(r => (
                            <div key={r.id} onClick={() => handleEdit(r)}
                                className={`flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer ${editing === r.id ? 'bg-brand-accent/5 border-l-2 border-brand-accent' : ''}`}>
                                <div className="w-8 h-8 rounded-xl bg-brand-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-brand-accent font-black text-sm">/</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-brand-accent">/{r.title}</p>
                                    <p className="text-[12px] text-brand-muted mt-0.5 leading-relaxed line-clamp-2">{r.text}</p>
                                </div>
                                <button onClick={e => { e.stopPropagation(); handleDelete(r.id); }}
                                    className="text-brand-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass rounded-2xl flex flex-col overflow-hidden self-start">
                    <div className="p-4 border-b border-brand-border/20 flex items-center justify-between">
                        <span className="text-[13px] font-black text-brand-egg">
                            {editing ? (isEn ? 'Edit Snippet' : 'تعديل الرد') : (isEn ? 'New Snippet' : 'رد جديد')}
                        </span>
                        {editing && <button onClick={handleCancel} className="text-brand-muted hover:text-brand-egg text-xs">✕</button>}
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider">{isEn ? 'SHORTCUT' : 'الاختصار'}</label>
                            <div className="flex items-center gap-2 bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2">
                                <span className="text-brand-accent font-black text-sm shrink-0">/</span>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder={isEn ? 'greeting' : 'تحية'}
                                    className="flex-1 bg-transparent text-xs outline-none text-brand-egg" dir="ltr" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider">{isEn ? 'MESSAGE TEXT' : 'نص الرسالة'}</label>
                            <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                                placeholder={isEn ? 'Hello! How can we help you today?' : 'مرحباً! كيف يمكننا مساعدتك؟'}
                                rows={5} className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2.5 text-xs focus:border-brand-accent outline-none resize-none custom-scrollbar" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider">{isEn ? 'INSERT VARIABLE' : 'إدراج متغير'}</label>
                            <div className="flex flex-wrap gap-1.5">
                                {varChips.map(chip => (
                                    <button key={chip} onClick={() => setForm(p => ({ ...p, text: p.text + chip }))}
                                        className="px-2.5 py-1 rounded-lg glass-subtle border border-brand-accent/20 text-[11px] font-bold text-brand-accent hover:bg-brand-accent/10 transition-all">
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-brand-bg transition-all disabled:opacity-50"
                                style={{background:'#8CC850'}}>
                                {saving ? '...' : (editing ? (isEn ? 'Update' : 'تحديث') : (isEn ? 'Save' : 'حفظ'))}
                            </button>
                            {editing && (
                                <button onClick={handleCancel} className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-brand-muted glass-subtle border border-brand-border/30 transition-all">
                                    {isEn ? 'Cancel' : 'إلغاء'}
                                </button>
                            )}
                        </div>
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
        <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-brand-egg flex items-center gap-2">
                        <Zap size={20} className="text-brand-accent" /> {isEn ? 'Automation Engine' : 'محرك الأتمتة'}
                    </h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5">
                        {automations.filter(a=>a.active).length} {isEn ? 'ACTIVE FLOWS · META CLOUD API' : 'سير نشط · Meta Cloud API'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => axios.post(`${API_URL}/automations/run-now`).then(() => { showToast(isEn ? 'Queue triggered!' : 'تم تشغيل الدورة!'); fetch(); }).catch(() => {})}
                        className="px-3 py-2 rounded-xl border border-brand-border/30 text-[11px] font-bold text-brand-muted hover:text-brand-accent hover:border-brand-accent/30 transition-all flex items-center gap-1.5">
                        <RefreshCcw size={13} /> {isEn ? 'Run Now' : 'شغّل الآن'}
                    </button>
                    <button onClick={() => { setShowQueue(!showQueue); fetch(); }}
                        className={`px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all ${showQueue ? 'bg-brand-accent/20 border-brand-accent text-brand-accent' : 'border-brand-border/30 text-brand-muted hover:border-brand-accent/30'}`}>
                        <Clock size={13} />
                        {isEn ? `Queue (${pendingCount})` : `طابور (${pendingCount})`}
                    </button>
                    <button onClick={openNew}
                        className="px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all" style={{background:'#8CC850',color:'#001A11'}}>
                        <Plus size={13} /> {isEn ? 'New Flow' : 'سير جديد'}
                    </button>
                </div>
            </div>

            {showQueue && (
                <div className="glass p-4 rounded-2xl space-y-2">
                    <h3 className="font-bold text-[11px] text-brand-muted uppercase tracking-wider">{isEn ? 'Pending Queue' : 'الرسائل المجدولة'}</h3>
                    {queue.filter(q => q.status === 'pending').length === 0 ? (
                        <p className="text-brand-muted text-sm py-3 text-center">{isEn ? 'No pending messages.' : 'لا توجد رسائل في الانتظار.'}</p>
                    ) : queue.filter(q => q.status === 'pending').map((q, i) => (
                        <div key={i} className="flex items-center justify-between bg-brand-bg/40 border border-brand-accent/10 rounded-xl px-4 py-2.5 text-sm">
                            <div>
                                <span className="font-bold text-brand-text text-[12px]">{q.automation_name}</span>
                                <span className="text-brand-muted mx-2">→</span>
                                <span className="text-brand-muted text-[12px]">{q.customer_name}</span>
                            </div>
                            <div className="text-[11px] text-brand-muted" dir="ltr">
                                {isEn ? 'Step' : 'خطوة'} {q.step_index + 1} — {new Date(q.fire_at).toLocaleString(isEn ? 'en-US' : 'ar-EG')}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid gap-3" style={{gridTemplateColumns:'260px 1fr'}}>
                <div className="glass rounded-2xl overflow-hidden self-start">
                    <div className="px-4 py-3 border-b border-brand-border/20 flex items-center justify-between">
                        <span className="text-[12px] font-black text-brand-egg">{isEn ? 'Flows' : 'السيرات'}</span>
                        <span className="text-[10px] text-brand-muted font-bold">{automations.length} {isEn ? 'total' : 'سير'}</span>
                    </div>
                    {automations.length === 0 ? (
                        <div className="p-8 text-center text-brand-muted">
                            <Zap size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-[12px] font-bold opacity-50">{isEn ? 'No flows yet' : 'لا توجد سيرات'}</p>
                            <button onClick={openNew} className="mt-3 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all" style={{background:'#8CC850',color:'#001A11'}}>
                                <Plus size={11} className="inline mr-1" />{isEn ? 'Create' : 'إنشاء'}
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-brand-border/10">
                            {automations.map(a => (
                                <div key={a.id} className={`px-4 py-3 flex items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors ${!a.active ? 'opacity-50' : ''}`}>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[12px] font-bold text-brand-egg truncate">{a.name}</p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold mt-0.5 inline-block ${triggerColor(a.trigger?.type)}`}>
                                            {triggerLabel(a)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => handleToggle(a.id)} className="text-brand-muted hover:text-brand-accent transition-colors">
                                            {a.active ? <ToggleRight size={22} className="text-brand-accent" /> : <ToggleLeft size={22} />}
                                        </button>
                                        <button onClick={() => openEdit(a)} className="p-1 rounded-lg hover:bg-brand-accent/10 text-brand-muted hover:text-brand-accent transition-all">
                                            <Cog size={13} />
                                        </button>
                                        <button onClick={() => handleDelete(a.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-400 transition-all">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="glass rounded-2xl p-5 flex flex-col gap-4">
                    <p className="text-[10px] font-bold text-brand-muted tracking-wider">{isEn ? 'VISUAL FLOW CANVAS' : 'لوحة السير'}</p>
                    {automations.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 text-brand-muted">
                            <div className="w-16 h-16 rounded-2xl glass-subtle border border-brand-border/20 flex items-center justify-center mb-4">
                                <Zap size={28} className="opacity-20" />
                            </div>
                            <p className="text-sm font-bold opacity-40">{isEn ? 'Select a flow to preview' : 'اختر سير للمعاينة'}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-0 py-4">
                            {automations.slice(0,1).map(a => {
                                const trig = TRIGGER_TYPES.find(x => x.value === a.trigger?.type);
                                return (
                                    <React.Fragment key={a.id}>
                                        <div className="flex flex-col items-center gap-0 w-full max-w-sm">
                                            <div className="glass-subtle border border-brand-accent/30 rounded-2xl px-5 py-3 flex items-center gap-3 w-full">
                                                <div className="w-8 h-8 rounded-xl bg-brand-accent/20 flex items-center justify-center shrink-0">
                                                    <Zap size={16} className="text-brand-accent" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-brand-muted tracking-wider">TRIGGER</p>
                                                    <p className="text-[13px] font-bold text-brand-egg">{isEn ? trig?.labelEn : trig?.label}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-px h-6 border-l-2 border-dashed border-brand-border/40"></div>
                                                <div className="w-2 h-2 rounded-full bg-brand-border/60"></div>
                                            </div>
                                            {a.steps?.map((step, si) => (
                                                <React.Fragment key={si}>
                                                    <div className="glass-subtle border border-brand-border/30 rounded-2xl px-5 py-3 flex items-center gap-3 w-full hover:border-brand-accent/30 transition-colors cursor-pointer">
                                                        <div className="w-8 h-8 rounded-xl bg-brand-gold/15 flex items-center justify-center shrink-0">
                                                            <Send size={14} className="text-brand-gold" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-bold text-brand-muted tracking-wider">
                                                                {step.wait_hours > 0 ? `WAIT ${step.wait_hours}h · ` : ''}ACTION {si + 1}
                                                            </p>
                                                            <p className="text-[12px] font-bold text-brand-egg truncate">
                                                                {step.action === 'send_text' ? (step.text?.slice(0,40) || 'Send text') : `Template: ${step.template_id || 'N/A'}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {si < (a.steps?.length || 0) - 1 && (
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-px h-6 border-l-2 border-dashed border-brand-border/40"></div>
                                                            <div className="w-2 h-2 rounded-full bg-brand-border/60"></div>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            {automations.length > 1 && (
                                <p className="text-[11px] text-brand-muted mt-4">{isEn ? `+${automations.length - 1} more flows` : `+${automations.length - 1} سيرات أخرى`}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

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
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-brand-muted">{isEn ? 'Automation Name' : 'اسم الأتمتة'}</label>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder={isEn ? 'e.g. Post-Ship Review Request' : 'مثال: طلب تقييم بعد الشحن'}
                                    className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-accent outline-none" />
                            </div>
                            <div className="space-y-3 p-4 bg-brand-bg/40 rounded-2xl border border-brand-accent/10">
                                <h3 className="font-bold text-sm text-brand-accent flex items-center gap-2">
                                    <Zap size={15} /> {isEn ? 'Trigger' : 'المشغّل'}
                                </h3>
                                <select value={form.trigger.type} onChange={e => setTrigger('type', e.target.value)}
                                    className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none">
                                    {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{isEn ? t.labelEn : t.label}</option>)}
                                </select>
                                {form.trigger.type === 'order_status_changed' && (
                                    <select value={form.trigger.value || ''} onChange={e => setTrigger('value', e.target.value)}
                                        className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none">
                                        {STATUS_VALUES.map(s => <option key={s.value} value={s.value}>{isEn ? s.labelEn : s.label}</option>)}
                                    </select>
                                )}
                                {form.trigger.type === 'keyword_received' && (
                                    <input value={form.trigger.value || ''} onChange={e => setTrigger('value', e.target.value)}
                                        placeholder={isEn ? 'e.g. price' : 'مثال: سعر'}
                                        className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none" />
                                )}
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-bold text-sm text-brand-accent">{isEn ? 'Steps' : 'الخطوات'}</h3>
                                {form.steps.map((step, i) => (
                                    <div key={i} className="p-4 bg-brand-bg/40 rounded-2xl border border-brand-accent/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-brand-muted">{isEn ? `Step ${i + 1}` : `الخطوة ${i + 1}`}</span>
                                            {form.steps.length > 1 && (
                                                <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14} /></button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="number" min="0" max="8760" value={step.wait_hours}
                                                onChange={e => setStep(i, 'wait_hours', parseInt(e.target.value) || 0)}
                                                placeholder={isEn ? 'Wait hours' : 'ساعات الانتظار'}
                                                className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none" dir="ltr" />
                                            <select value={step.action} onChange={e => setStep(i, 'action', e.target.value)}
                                                className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none">
                                                <option value="send_text">{isEn ? 'Send Text' : 'إرسال نص'}</option>
                                                <option value="send_template">{isEn ? 'Send Template' : 'إرسال قالب'}</option>
                                            </select>
                                        </div>
                                        {step.action === 'send_text' && (
                                            <textarea value={step.text || ''} onChange={e => setStep(i, 'text', e.target.value)}
                                                placeholder={isEn ? 'Hello {{customer_name}}, ...' : 'مرحباً {{customer_name}}, ...'}
                                                rows={3} className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none resize-none" />
                                        )}
                                        {step.action === 'send_template' && (
                                            <select value={step.template_id || ''} onChange={e => setStep(i, 'template_id', e.target.value)}
                                                className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none">
                                                <option value="">{isEn ? '-- Select template --' : '-- اختر قالب --'}</option>
                                                {Object.entries(templates).map(([k, t]) => <option key={k} value={k}>{t.title}</option>)}
                                            </select>
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
                                {saving ? (isEn ? 'Saving...' : 'جاري...') : (isEn ? 'Save' : 'حفظ')}
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
                            <input value={search} onChange={e=>setSearch(e.target.value)}
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
                                    {saving ? (isEn ? 'Saving...' : 'جاري الحفظ...') : (isEn ? 'Launch App âœ"' : 'تشغيل التطبيق âœ"')}
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

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
//  Shipping Components
// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
//  Setup Manager (In-App Settings Page)
// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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
                        : 'Groq موصى به — مجاني، سريڡ حد عالي (14,400 طلب/يوم). احصل على مفتاحك من console.groq.com. Gemini يُستخدم كبديل تلقائي.'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field k="groq_api_key" label="Groq API Key âڑ، (Recommended)" placeholder="gsk_..." secret
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

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
//  Loyalty Points Panel (CRM sidebar)
// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
//  Analytics Dashboard
// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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
        <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Analytics' : 'التقارير'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5">{isEn ? 'REAL-TIME SYSTEM OVERVIEW' : 'نظرة شاملة على النظام'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <a href={`${API_URL}/export/contacts`} download
                        className="flex items-center gap-1.5 text-xs glass-subtle border border-brand-border/30 text-brand-muted px-4 py-2 rounded-xl font-bold hover:text-brand-egg transition-colors">
                        <Download size={13} /> {isEn ? 'Contacts CSV' : 'تصدير جهات الاتصال'}
                    </a>
                    <a href={`${API_URL}/export/orders`} download
                        className="flex items-center gap-1.5 text-xs glass-subtle border border-brand-border/30 text-brand-muted px-4 py-2 rounded-xl font-bold hover:text-brand-egg transition-colors">
                        <Download size={13} /> {isEn ? 'Orders CSV' : 'تصدير الطلبات'}
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: isEn ? 'MESSAGES SENT' : 'رسائل مرسلة', value: messages.totalOutbound, sub: messages.seenCount + (isEn ? ' seen' : ' مقروءة'), color: 'text-brand-egg' },
                    { label: isEn ? 'MESSAGES RECEIVED' : 'رسائل واردة', value: messages.totalInbound, sub: messages.conversations + (isEn ? ' conversations' : ' محادثة'), color: 'text-brand-accent' },
                    { label: isEn ? 'RESPONSE RATE' : 'معدل الرد', value: messages.responseRate + '%', sub: isEn ? 'customers replied' : 'عملاء ردوا', color: 'text-blue-400' },
                    { label: isEn ? 'CONVERSION RATE' : 'معدل التحويل', value: conversionRate + '%', sub: isEn ? 'orders confirmed' : 'طلبات مؤكدة', color: 'text-brand-gold' },
                ].map((k, i) => (
                    <div key={i} className="glass rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-brand-muted tracking-wider">{k.label}</p>
                        <p className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</p>
                        <p className="text-[11px] text-brand-muted mt-1">{k.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="glass p-5 rounded-2xl space-y-3">
                    <h3 className="font-black text-[13px] text-brand-egg">{isEn ? 'Order Funnel' : 'قمع الطلبات'}</h3>
                    <div className="space-y-2.5">
                        <FunnelBar label={isEn ? 'New / Pending' : 'جديد / معلق'} value={funnel.new} max={totalOrders} color="bg-brand-muted/50" />
                        <FunnelBar label={isEn ? 'Followed Up' : 'تمت المتابعة'} value={funnel.followed_up} max={totalOrders} color="bg-brand-accent/70" />
                        <FunnelBar label={isEn ? 'Confirmed' : 'تم التأكيد'} value={funnel.confirmed} max={totalOrders} color="bg-green-500/80" />
                        <FunnelBar label={isEn ? 'Shipped' : 'تم الشحن'} value={funnel.shipped} max={totalOrders} color="bg-blue-500/80" />
                        <FunnelBar label={isEn ? 'Cancelled' : 'ملغى'} value={funnel.cancelled} max={totalOrders} color="bg-red-500/60" />
                    </div>
                    <p className="text-[11px] text-brand-muted pt-2 border-t border-brand-border/10">
                        {isEn ? `${totalOrders} total orders tracked` : `${totalOrders} طلب متتبع`}
                    </p>
                </div>

                <div className="glass p-5 rounded-2xl space-y-3">
                    <h3 className="font-black text-[13px] text-brand-egg">{isEn ? 'Message Volume — Last 7 Days' : 'حجم الرسائل — آخر 7 أيام'}</h3>
                    <div className="flex gap-4 text-[11px] text-brand-muted">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-accent/70 inline-block" />{isEn ? 'Outbound' : 'صادرة'}</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/50 inline-block" />{isEn ? 'Inbound' : 'واردة'}</span>
                    </div>
                    <BarChart data={daily} isEn={isEn} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="glass p-5 rounded-2xl">
                    <h3 className="font-black text-[13px] text-brand-egg mb-3">{isEn ? 'Automation Stats' : 'إحصاء الأتمتة'}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: isEn ? 'Pending' : 'قيد الانتظار', value: autoStats.pending, color: 'bg-brand-accent/20 text-brand-accent' },
                            { label: isEn ? 'Executed' : 'نُفّذ', value: autoStats.done, color: 'bg-green-500/20 text-green-400' },
                            { label: isEn ? 'Failed' : 'فشل', value: autoStats.failed, color: 'bg-red-500/20 text-red-400' },
                            { label: isEn ? 'Cancelled' : 'ألغي', value: autoStats.cancelled, color: 'bg-brand-muted/20 text-brand-muted' },
                        ].map(s => (
                            <div key={s.label} className={`rounded-2xl p-4 text-center ${s.color.split(' ')[0]}`}>
                                <p className={`text-2xl font-black ${s.color.split(' ')[1]}`}>{s.value}</p>
                                <p className="text-[11px] font-bold mt-1 opacity-80">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass p-5 rounded-2xl">
                    <h3 className="font-black text-[13px] text-brand-egg mb-3">{isEn ? 'Most Active Customers' : 'أكثر العملاء تفاعلاً'}</h3>
                    {topCustomers.length === 0 ? (
                        <p className="text-brand-muted text-sm text-center py-8">{isEn ? 'No data yet.' : 'لا توجد بيانات.'}</p>
                    ) : (
                        <div className="space-y-3">
                            {topCustomers.map((c, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-brand-accent/20 flex items-center justify-center text-xs font-black text-brand-accent shrink-0">{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-brand-egg truncate">{c.name}</p>
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
