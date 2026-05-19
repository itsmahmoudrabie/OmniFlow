import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

filepath = r'dashboard-react\src\App.jsx'
with open(filepath, 'rb') as f:
    raw = f.read()

start_marker = b"    const avatarColors = ['#FF6400','#8CC850',"
end_marker = b"// --- Abandoned Carts"

start = raw.find(start_marker)
end = raw.find(end_marker)

print(f'Start: {start}, End: {end}')

if start == -1 or end == -1:
    print('Markers not found')
    sys.exit(1)

new_block = '''    const avatarColors = ['#FF6400','#8CC850','#2D5A3D','#C4A882','#FF9B7A','#88B8B0','#A78BFA','#34D399','#F59E0B','#60A5FA'];
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
