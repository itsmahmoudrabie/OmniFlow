import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

NEW_CODE = r'''const TemplatesManager = ({ templates, fetchTemplates, showToast, lang }) => {
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
                        <RefreshCw size={12} /> {isEn ? 'Sync from Meta' : 'مزامنة Meta'}
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
'''

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()

raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
lines = raw.split(b'\n')

start = next(i for i,l in enumerate(lines) if b'const TemplatesManager' in l)
end = next((i for i,l in enumerate(lines) if i > start+5 and (b'const ShopifyOrders' in l or b'function App' in l or b'const App ' in l or b'export default' in l or b'const AbandonedCarts' in l)), len(lines))

new_lines = lines[:start] + [NEW_CODE.encode('utf-8')] + lines[end:]
result = b'\n'.join(new_lines)

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(result)

print(f'Done. Replaced lines {start}-{end}. Total lines: {len(new_lines)}')
