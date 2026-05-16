import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

NEW_CODE = r'''const QuickRepliesManager = ({ showToast, lang }) => {
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
'''

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()

# Normalize line endings
raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
lines = raw.split(b'\n')

start = next(i for i,l in enumerate(lines) if b'const QuickRepliesManager' in l)
end = next(i for i,l in enumerate(lines) if i > start and (b'const AutomationsManager' in l or b'TRIGGER_TYPES' in l))

new_lines = lines[:start] + [NEW_CODE.encode('utf-8')] + lines[end:]
result = b'\n'.join(new_lines)

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(result)

print(f'Done. Lines: {len(new_lines)}')
