import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

NEW_CODE = r'''
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
        ai_enabled: false, ai_model: 'gemini-2.0-flash', ai_instruction: '',
        ai_auto_reply: true, ai_draft_mode: false, ai_auto_tag_vip: false,
        ai_send_recovery: false, ai_escalate_negative: false,
        openai_key: '',
    });
    const [branding, setBranding] = React.useState({ brand_color: '#8CC850', logo_url: null });
    const [team, setTeam] = React.useState([]);
    const [integrations, setIntegrations] = React.useState({ wa: null, shopify: null, ai: null });
    const [showSecrets, setShowSecrets] = React.useState({});
    const logoRef = React.useRef(null);

    // ── Load ────────────────────────────────────────────────────────────────
    React.useEffect(() => {
        axios.get(`${API_URL}/config/setup`).then(r => {
            if (r.data && typeof r.data === 'object') setWs(p => ({ ...p, ...r.data }));
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
            await axios.post(`${API_URL}/config/setup`, ws);
            await axios.post(`${API_URL}/settings`, {
                ai_instruction: ws.ai_instruction,
                ai_enabled: ws.ai_enabled,
                ai_auto_reply: ws.ai_auto_reply,
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
    const Field = ({ label, field, placeholder = '', dir = '', type = 'text', secret = false }) => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{label}</label>
            <div className="relative">
                <input
                    type={secret && !showSecrets[field] ? 'password' : type}
                    value={ws[field] || ''}
                    onChange={e => set(field, e.target.value)}
                    placeholder={placeholder}
                    dir={dir}
                    className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2.5 text-xs focus:border-brand-accent outline-none text-brand-egg"
                />
                {secret && (
                    <button onClick={() => toggleSecret(field)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-egg" type="button">
                        {showSecrets[field] ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                )}
            </div>
        </div>
    );

    const Toggle = ({ label, field, description }) => (
        <div className="flex items-center justify-between py-2.5 border-b border-brand-border/10 last:border-0">
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
    const IntCard = ({ icon: Icon, iconBg, name, subtitle, stat, connectedAt, status }) => (
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
                        <Field label={isEn ? 'Brand Name' : 'اسم العلامة التجارية'} field="brand_name" placeholder="Linenhouse Cairo" />
                        <Field label={isEn ? 'Region' : 'المنطقة'} field="region" placeholder="EG · Africa/Cairo (UTC+2)" />
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
                    <IntCard
                        icon={MessageCircle} iconBg="#25D366"
                        name="WhatsApp Cloud" subtitle={ws.wa_phone || (isEn ? 'Not connected' : 'غير متصل')}
                        stat={waConnected ? (isEn ? 'Official Meta API connected' : 'Meta API متصل') : (isEn ? 'Add credentials to connect' : 'أضف بيانات الاتصال')}
                        connectedAt={integrations.wa?.connected_at || null}
                        status={waConnected ? 'connected' : 'disconnected'}
                    />
                    <IntCard
                        icon={ShoppingCart} iconBg="#96BF48"
                        name="Shopify" subtitle={ws.shopify_store || (isEn ? 'Not connected' : 'غير متصل')}
                        stat={integrations.shopify ? `${integrations.shopify.products || 0} ${isEn ? 'products' : 'منتج'} · ${integrations.shopify.orders || 0} ${isEn ? 'orders' : 'طلب'}` : (isEn ? 'Add store URL to connect' : 'أضف رابط المتجر')}
                        connectedAt={integrations.shopify?.connected_at || null}
                        status={shopConnected ? 'synced' : 'disconnected'}
                    />
                    <IntCard
                        icon={Sparkles} iconBg="#FF6B35"
                        name="Gemini AI" subtitle={ws.ai_model || 'gemini-2.0-flash'}
                        stat={aiActive ? (isEn ? 'AI assistant active' : 'مساعد AI نشط') : (isEn ? 'AI assistant disabled' : 'مساعد AI معطل')}
                        connectedAt={integrations.ai?.connected_at || null}
                        status={aiActive ? 'active' : 'disconnected'}
                    />
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
                                <p className="text-[10px] text-brand-muted uppercase tracking-wider mt-0.5">{(ws.ai_model || 'gemini-2.0-flash').toUpperCase()}</p>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-full ${aiActive ? 'text-brand-accent' : 'text-brand-muted'}`}
                                style={{background: aiActive ? 'rgba(140,200,80,0.12)' : 'rgba(100,100,100,0.1)'}}>
                                ● {aiActive ? (isEn ? 'Active' : 'نشط') : (isEn ? 'Inactive' : 'معطل')}
                            </span>
                        </div>
                        <div>
                            <Toggle label={isEn ? 'Auto-reply unknown questions' : 'رد تلقائي على الأسئلة'} field="ai_auto_reply" />
                            <Toggle label={isEn ? 'Draft replies for agent approval' : 'مسودة ردود للموافقة'} field="ai_draft_mode" />
                            <Toggle label={isEn ? 'Auto-tag VIP customers' : 'تصنيف VIP تلقائي'} field="ai_auto_tag_vip" />
                            <Toggle label={isEn ? 'Send recovery messages' : 'إرسال رسائل استرداد'} field="ai_send_recovery" />
                            <Toggle label={isEn ? 'Escalate negative sentiment' : 'تصعيد المشاعر السلبية'} field="ai_escalate_negative" />
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
                    <Field label={isEn ? 'Phone Number' : 'رقم الهاتف'} field="wa_phone" placeholder="+20 100 000 0000" dir="ltr" />
                    <Field label={isEn ? 'Phone Number ID' : 'معرف رقم الهاتف'} field="wa_phone_id" placeholder="123456789" dir="ltr" secret />
                    <Field label={isEn ? 'Business Account ID' : 'معرف حساب الأعمال'} field="wa_business_id" placeholder="987654321" dir="ltr" secret />
                    <Field label={isEn ? 'Permanent Access Token' : 'رمز الوصول الدائم'} field="wa_token" placeholder="EAAxxxxxxxx..." dir="ltr" secret />
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
                    <Field label={isEn ? 'Store URL' : 'رابط المتجر'} field="shopify_store" placeholder="yourstore.myshopify.com" dir="ltr" />
                    <Field label={isEn ? 'Admin API Key' : 'مفتاح Admin API'} field="shopify_key" placeholder="shpat_xxxxxxxx" dir="ltr" secret />
                    <Field label={isEn ? 'API Secret' : 'API Secret'} field="shopify_secret" placeholder="shpss_xxxxxxxx" dir="ltr" secret />
                    <Field label={isEn ? 'Webhook Secret' : 'Webhook Secret'} field="shopify_webhook" placeholder="whsec_xxxxxxxx" dir="ltr" secret />
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
                            <p className="text-[10px] text-brand-muted uppercase">GEMINI 2.0 FLASH · MULTIMODAL</p>
                        </div>
                        <div className="ml-auto">
                            <Toggle label="" field="ai_enabled" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'AI Model' : 'نموذج AI'}</label>
                        <select value={ws.ai_model || 'gemini-2.0-flash'} onChange={e => set('ai_model', e.target.value)}
                            className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2.5 text-xs focus:border-brand-accent outline-none text-brand-egg">
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                            <option value="gpt-4o">GPT-4o (OpenAI)</option>
                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                        </select>
                    </div>
                    {(ws.ai_model || '').startsWith('gpt') && (
                        <Field label="OpenAI API Key" field="openai_key" placeholder="sk-..." dir="ltr" secret />
                    )}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-brand-muted tracking-wider uppercase">{isEn ? 'System Instruction' : 'تعليمات النظام'}</label>
                        <textarea value={ws.ai_instruction} onChange={e => set('ai_instruction', e.target.value)}
                            rows={5} placeholder={isEn ? 'You are a helpful assistant for...' : 'أنت مساعد مفيد لـ...'}
                            className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2.5 text-xs focus:border-brand-accent outline-none resize-none text-brand-egg" />
                    </div>
                </div>
                <div className="glass rounded-2xl p-6">
                    <p className="text-[13px] font-black text-brand-egg mb-4">{isEn ? 'Behaviour toggles' : 'إعدادات السلوك'}</p>
                    <Toggle label={isEn ? 'Auto-reply unknown questions' : 'رد تلقائي على الأسئلة المجهولة'} field="ai_auto_reply"
                        description={isEn ? 'AI answers questions it recognises' : 'يجيب AI على الأسئلة التي يعرفها'} />
                    <Toggle label={isEn ? 'Draft replies for agent approval' : 'مسودة ردود للموافقة البشرية'} field="ai_draft_mode"
                        description={isEn ? 'Show AI reply as draft before sending' : 'عرض رد AI كمسودة قبل الإرسال'} />
                    <Toggle label={isEn ? 'Auto-tag VIP customers' : 'تصنيف عملاء VIP تلقائياً'} field="ai_auto_tag_vip"
                        description={isEn ? 'Tag high-value customers automatically' : 'يصنف العملاء ذوي القيمة تلقائياً'} />
                    <Toggle label={isEn ? 'Send recovery messages' : 'إرسال رسائل استرداد السلة'} field="ai_send_recovery"
                        description={isEn ? 'Auto-send cart recovery on trigger' : 'إرسال استرداد السلة تلقائياً'} />
                    <Toggle label={isEn ? 'Escalate negative sentiment' : 'تصعيد المشاعر السلبية'} field="ai_escalate_negative"
                        description={isEn ? 'Route angry/upset customers to human' : 'توجيه العملاء الغاضبين للبشر'} />
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
                    <Field label={isEn ? 'Points per EGP spent' : 'نقاط لكل جنيه'} field="loyalty_rate" placeholder="1" />
                    <Field label={isEn ? 'Min points to redeem' : 'الحد الأدنى للاسترداد'} field="loyalty_min" placeholder="100" />
                    <Field label={isEn ? 'Point value (EGP)' : 'قيمة النقطة (جنيه)'} field="loyalty_value" placeholder="0.5" />
                    <Field label={isEn ? 'Expiry (days)' : 'انتهاء الصلاحية (يوم)'} field="loyalty_expiry" placeholder="365" />
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
'''

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()

raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
lines = raw.split(b'\n')

# Find SetupManager (comment line before it) through end
start = next(i for i,l in enumerate(lines) if b'Setup Manager' in l or b'const SetupManager' in l)
end = next((i for i,l in enumerate(lines) if i > start+5 and (b'export default' in l or b'const AnalyticsDashboard' in l or b'const ShippingSettings' in l)), len(lines))

new_lines = lines[:start] + [NEW_CODE.encode('utf-8')] + lines[end:]
result = b'\n'.join(new_lines)

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(result)

print(f'Done. Replaced lines {start}-{end}. Total lines: {len(new_lines)}')
