import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

filepath = r'dashboard-react\src\App.jsx'
with open(filepath, 'rb') as f:
    raw = f.read()

start_marker = b'    return (\n        <div className={`space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 pb-20'
end_marker = b'\n};\n\n// \xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\xe2\x80\x94\n//  Automations Manager'

start = raw.find(start_marker)
end = raw.find(end_marker)

print(f'Start: {start}, End: {end}')

if start == -1 or end == -1:
    # fallback: find by unique text
    start_marker2 = b'<MessageSquareQuote size={26} /> {isEn ?'
    start2 = raw.find(start_marker2)
    # find the return( for QuickRepliesManager
    qr_start = raw.find(b'const QuickRepliesManager')
    return_pos = raw.find(b'    return (', qr_start)
    print(f'qr_start: {qr_start}, return_pos: {return_pos}')
    start = return_pos

    end_marker2 = b'\nconst TRIGGER_TYPES'
    end = raw.find(end_marker2)
    print(f'End2: {end}')

print(f'Start: {start}, End: {end}')
print(f'Context start: {raw[start:start+80]}')
print(f'Context end: {raw[end:end+80]}')

new_block = '''    const mockGroups = [
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
                {/* Groups sidebar */}
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

                {/* Snippets list */}
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
                                <p className="text-xs mt-1 opacity-60">{isEn ? 'Create your first quick reply above.' : 'أضف أول رد سريع.'}</p>
                            </div>
                        ) : filtered.map(r => (
                            <div key={r.id} onClick={() => handleEdit(r)}
                                className={`flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer ${editing === r.id ? 'bg-brand-accent/5 border-r-2 border-brand-accent' : ''}`}>
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

                {/* Edit panel */}
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
'''

new_block_bytes = new_block.encode('utf-8')
new_raw = raw[:start] + new_block_bytes + raw[end:]

try:
    new_raw.decode('utf-8')
    print('UTF-8 valid')
except Exception as e:
    print(f'UTF-8 error: {e}')

with open(filepath, 'wb') as f:
    f.write(new_raw)
print(f'Done. Size: {len(raw)} -> {len(new_raw)}')
