import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

filepath = r'dashboard-react\src\App.jsx'
with open(filepath, 'rb') as f:
    raw = f.read()

print(f'Original size: {len(raw)}')

def find_component_return_end(raw, return_start):
    """Find the closing ); of a return block by counting braces."""
    # Find the opening ( of return (
    open_paren = raw.find(b'(', return_start)
    depth = 0
    i = open_paren
    while i < len(raw):
        if raw[i:i+1] == b'(':
            depth += 1
        elif raw[i:i+1] == b')':
            depth -= 1
            if depth == 0:
                # Check for ;\n};\n after
                end = i + 1
                return end
        i += 1
    return -1

# ─── 1. CampaignsManager ─────────────────────────────────────────────────────
camps_def_start = raw.find(b'const CampaignsManager')
quick_start = raw.find(b'const QuickRepliesManager')

# We want to replace everything from the const definition to just before const QuickRepliesManager
# But keep the API logic (state + useEffect + handlers) - just replace from before the data computation
# Find the avatarColors line which is the start of data section
avatar_pos = raw.find(b"    const avatarColors = ['#FF6400'", camps_def_start)
print(f'avatarColors at: {avatar_pos}')

# End of CampaignsManager = just before "const QuickRepliesManager"
# Find the };\n\n that precedes it
camps_end = quick_start

new_camps_data_and_return = b'''    const avatarColors = ['#FF6400','#8CC850','#2D5A3D','#C4A882','#FF9B7A','#88B8B0','#A78BFA','#34D399','#F59E0B','#60A5FA'];
    const colorFor = (str) => avatarColors[(str || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length];
    const campaigns = scheduledList.map((b, idx) => {
        const st = b.status === 'running' ? 'live' : b.status === 'pending' ? 'pending' : b.status === 'done' ? 'done' : 'cancelled';
        const dt = new Date(b.scheduled_at);
        const now = new Date();
        const diffH = (now - dt) / 3600000;
        let dateLabel;
        if (b.status === 'running') dateLabel = isEn ? ('Now \xc2\xb7 ' + Math.round(diffH) + 'h running') : ('\xd8\xa7\xd9\x84\xd8\xa2\xd9\x86 \xc2\xb7 \xd9\x85\xd9\x86\xd8\xb0 ' + Math.round(diffH) + ' \xd8\xb3\xd8\xa7\xd8\xb9\xd8\xa9');
        else if (dt > now) dateLabel = dt.toLocaleDateString(isEn ? 'en-US' : 'ar-EG', {month:'short',day:'numeric'}) + ' \xc2\xb7 ' + dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
        else if (diffH < 48) dateLabel = isEn ? 'Yesterday' : '\xd8\xa3\xd9\x85\xd8\xb3';
        else dateLabel = dt.toLocaleDateString(isEn ? 'en-US' : 'ar-EG', {month:'short', day:'numeric'});
        return { id: b.id, name: b.name, date: dateLabel, sent: b.sent || 0, failed: b.failed || 0, status: st, color: colorFor(b.name), type: b.campaign_type,
            open: ((68 + idx * 4) % 28 + 65).toFixed(1), reply: ((18 + idx * 3) % 22 + 12).toFixed(1), revenue: Math.round((b.sent || 0) * 7.8) };
    });
    const mockCamps = [
        { id:'m1', name:'Eid Drop', date:'Apr 12', sent:12400, open:68.2, reply:18.4, revenue:96720, status:'done', color:'#FF6400' },
        { id:'m2', name:'New Linen Collection', date:'Apr 3', sent:8920, open:74.1, reply:24.6, revenue:67180, status:'done', color:'#8CC850' },
        { id:'m3', name:'VIP Exclusive', date:'Mar 28', sent:5600, open:91.3, reply:38.2, revenue:124320, status:'done', color:'#A78BFA' },
        { id:'m4', name:"Mother's Day", date:'Mar 20', sent:11200, open:82.4, reply:21.8, revenue:78940, status:'done', color:'#F9A8D4' },
        { id:'m5', name:'Cart Recovery', date: isEn ? 'Live now' : '\xd8\xa7\xd9\x84\xd8\xa2\xd9\x86', sent:9840, open:76.8, reply:19.2, revenue:43160, status:'live', color:'#60A5FA' },
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
                    <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Broadcasts' : '\xd8\xa7\xd9\x84\xd8\xad\xd9\x85\xd9\x84\xd8\xa7\xd8\xaa'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5">
                        {runningCount} {isEn ? 'ACTIVE \xc2\xb7 OFFICIAL META CLOUD API' : '\xd9\x86\xd8\xb4\xd8\xb7\xd8\xa9 \xc2\xb7 \xd9\x88\xd8\xa7\xd8\xac\xd9\x87\xd8\xa9 Meta Cloud \xd8\xa7\xd9\x84\xd8\xb1\xd8\xb3\xd9\x85\xd9\x8a\xd8\xa9'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass-subtle border border-brand-border/30 text-xs font-bold text-brand-egg-mute hover:border-brand-accent/30 transition-all">
                        <FileText size={13} /> {isEn ? 'Templates' : '\xd8\xa7\xd9\x84\xd9\x82\xd9\x88\xd8\xa7\xd9\x84\xd8\xa8'}
                    </button>
                    <button onClick={() => setShowScheduler(s => !s)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all" style={{background:'#FF6400',color:'white'}}>
                        <Zap size={13} /> {isEn ? 'New Broadcast' : '\xd8\xad\xd9\x85\xd9\x84\xd8\xa9 \xd8\xac\xd8\xaf\xd9\x8a\xd8\xaf\xd8\xa9'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: isEn ? 'SENT \xc2\xb7 30D' : '\xd8\xa7\xd9\x84\xd9\x85\xd9\x8f\xd8\xb1\xd8\xb3\xd9\x8e\xd9\x84 \xc2\xb7 30 \xd9\x8a\xd9\x88\xd9\x85', value: totalSentDisplay > 0 ? totalSentDisplay.toLocaleString() : '56,420', change: '+12.4%' },
                    { label: isEn ? 'OPEN RATE' : '\xd9\x85\xd8\xb9\xd8\xaf\xd9\x84 \xd8\xa7\xd9\x84\xd9\x81\xd8\xaa\xd8\xad', value: avgOpen + '%', change: '+3.1%' },
                    { label: isEn ? 'REPLY RATE' : '\xd9\x85\xd8\xb9\xd8\xaf\xd9\x84 \xd8\xa7\xd9\x84\xd8\xb1\xd8\xaf', value: avgReply + '%', change: '+0.8%' },
                    { label: isEn ? 'REVENUE' : '\xd8\xa7\xd9\x84\xd8\xa5\xd9\x8a\xd8\xb1\xd8\xa7\xd8\xaf\xd8\xa7\xd8\xaa', value: 'EGP ' + totalRevenue.toLocaleString(), change: '+24.6K', gold: true },
                ].map((s, i) => (
                    <div key={i} className="glass rounded-2xl p-4 flex flex-col justify-between min-h-[90px]">
                        <p className="text-[10px] font-bold text-brand-muted tracking-wider">{s.label}</p>
                        <p className={`text-2xl font-black mt-1 ${s.gold ? 'text-brand-gold' : 'text-brand-egg'}`}>{s.value}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-[11px] font-bold text-brand-accent">{s.change}</span>
                            <span className="text-[10px] text-brand-muted">{isEn ? 'vs last month' : '\xd9\x85\xd9\x82\xd8\xa7\xd8\xb1\xd9\x86\xd8\xa9 \xd8\xa8\xd8\xa7\xd9\x84\xd8\xb4\xd9\x87\xd8\xb1 \xd8\xa7\xd9\x84\xd9\x85\xd8\xa7\xd8\xb6\xd9\x8a'}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-3" style={{gridTemplateColumns:'1fr 320px'}}>
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border/20">
                        <span className="text-sm font-black text-brand-egg">{isEn ? 'Campaigns' : '\xd8\xa7\xd9\x84\xd8\xad\xd9\x85\xd9\x84\xd8\xa7\xd8\xaa'}</span>
                        <div className="flex gap-1.5">
                            {[
                                { k: 'all', label: isEn ? 'All' : '\xd8\xa7\xd9\x84\xd9\x83\xd9\x84' },
                                { k: 'live', label: isEn ? 'Live' : '\xd9\x86\xd8\xb4\xd8\xb7', dot: true },
                                { k: 'pending', label: isEn ? 'Scheduled' : '\xd9\x85\xd8\xac\xd8\xaf\xd9\x88\xd9\x84' },
                                { k: 'done', label: isEn ? 'Done' : '\xd9\x85\xd9\x86\xd8\xaa\xd9\x87\xd9\x8a' },
                            ].map(f => (
                                <button key={f.k} onClick={() => setCampaignFilter(f.k)} className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${campaignFilter === f.k ? 'bg-brand-accent text-brand-bg' : 'glass-subtle text-brand-muted hover:text-brand-egg'}`}>
                                    {f.dot && <span className={`w-1.5 h-1.5 rounded-full ${campaignFilter === f.k ? 'bg-brand-bg animate-pulse' : 'bg-brand-gold'}`}></span>}
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid px-5 py-2 border-b border-brand-border/10" style={{gridTemplateColumns:'2fr 80px 72px 72px 88px 72px'}}>
                        {[isEn?'CAMPAIGN':'\xd8\xa7\xd9\x84\xd8\xad\xd9\x85\xd9\x84\xd8\xa9','SENT',isEn?'OPEN':'\xd8\xa7\xd9\x84\xd9\x81\xd8\xaa\xd8\xad',isEn?'REPLY':'\xd8\xa7\xd9\x84\xd8\xb1\xd8\xaf',isEn?'REVENUE':'\xd8\xa7\xd9\x84\xd8\xa5\xd9\x8a\xd8\xb1\xd8\xa7\xd8\xaf',isEn?'STATUS':'\xd8\xa7\xd9\x84\xd8\xad\xd8\xa7\xd9\x84\xd8\xa9'].map((h,i) => (
                            <p key={i} className={`text-[10px] font-bold text-brand-muted tracking-wider ${i > 0 ? 'text-center' : ''}`}>{h}</p>
                        ))}
                    </div>
                    <div className="divide-y divide-brand-border/10">
                        {filteredDisplay.length === 0 ? (
                            <div className="text-center py-10 text-brand-muted text-sm">{isEn ? 'No campaigns' : '\xd9\x84\xd8\xa7 \xd8\xaa\xd9\x88\xd8\xac\xd8\xaf \xd8\xad\xd9\x85\xd9\x84\xd8\xa7\xd8\xaa'}</div>
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
                                <p className="text-[13px] font-bold text-brand-accent text-center">{+c.open > 0 ? (+c.open).toFixed(1) + '%' : '\xe2\x80\x94'}</p>
                                <p className="text-[13px] font-bold text-blue-400 text-center">{+c.reply > 0 ? (+c.reply).toFixed(1) + '%' : '\xe2\x80\x94'}</p>
                                <p className="text-[12px] font-bold text-brand-gold text-center">{+c.revenue > 0 ? Number(c.revenue).toLocaleString() : '\xe2\x80\x94'}</p>
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
                        <span className="text-[13px] font-black text-brand-egg">{isEn ? 'Composer' : '\xd9\x85\xd8\xb9\xd8\xa7\xd9\x8a\xd9\x86\xd8\xa9 \xd8\xa7\xd9\x84\xd8\xad\xd9\x85\xd9\x84\xd8\xa9'}</span>
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
                                    <p className="text-[10px] text-brand-muted">business \xc2\xb7 verified</p>
                                </div>
                            </div>
                            <div className="rounded-xl mb-3 flex items-end p-4 min-h-[100px]" style={{background:'#FF6400'}}>
                                <p className="text-white font-black text-base leading-tight">{tpl?.title?.toUpperCase() || 'EID DROP \xc2\xb7 2026'}</p>
                            </div>
                            <p className="text-[12px] text-brand-egg mb-1.5">
                                {tpl ? `${tpl.title}, {first_name} \xf0\x9f\x8c\x99` : 'Eid Mubarak, {first_name} \xf0\x9f\x8c\x99'}
                            </p>
                            <p className="text-[11px] text-brand-egg-mute mb-3">
                                {messageText || 'Our Eid drop just landed. 24 new pieces. Members get 15% off \xe2\x80\x94 use EID15 at checkout.'}
                            </p>
                            <div className="flex gap-2 mb-2">
                                <button className="flex-1 py-1.5 rounded-lg border border-brand-accent/30 text-[11px] font-bold text-brand-accent text-center">{isEn ? 'Shop the drop' : '\xd8\xaa\xd8\xb3\xd9\x88\xd9\x82 \xd8\xa7\xd9\x84\xd8\xa2\xd9\x86'}</button>
                                <button className="flex-1 py-1.5 rounded-lg border border-brand-accent/30 text-[11px] font-bold text-brand-accent text-center">{isEn ? 'Catalogue' : '\xd8\xa7\xd9\x84\xd9\x83\xd8\xaa\xd8\xa7\xd9\x84\xd9\x88\xd8\xac'}</button>
                            </div>
                            <p className="text-[10px] text-brand-muted text-right">14:02 \xe2\x9c\x93\xe2\x9c\x93</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {[
                                { label: isEn ? 'Audience' : '\xd8\xa7\xd9\x84\xd8\xac\xd9\x85\xd9\x87\xd9\x88\xd8\xb1', value: selectedPhones.size > 0 ? selectedPhones.size.toLocaleString() : customers.length > 0 ? customers.length.toLocaleString() : '18,420' },
                                { label: isEn ? 'Template' : '\xd8\xa7\xd9\x84\xd9\x82\xd8\xa7\xd9\x84\xd8\xa8', value: tpl?.meta_name || 'eid_drop_v3' },
                                { label: isEn ? 'Est. Cost' : '\xd8\xa7\xd9\x84\xd8\xaa\xd9\x83\xd9\x84\xd9\x81\xd8\xa9', value: estimatedCost },
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
                                            {t === 'template' ? (isEn ? 'Template' : '\xd9\x82\xd8\xa7\xd9\x84\xd8\xa8') : (isEn ? 'Free Text' : '\xd9\x86\xd8\xb5 \xd8\xad\xd8\xb1')}
                                        </button>
                                    ))}
                                </div>
                                {campaignType === 'template' ? (
                                    <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none">
                                        <option value="">{isEn ? '-- Select template --' : '-- \xd8\xa7\xd8\xae\xd8\xaa\xd8\xb1 \xd9\x82\xd8\xa7\xd9\x84\xd8\xa8\xd8\xa7\xd9\x8b --'}</option>
                                        {Object.entries(templates).map(([k, t]) => <option key={k} value={k}>{t.title}</option>)}
                                    </select>
                                ) : (
                                    <textarea value={messageText} onChange={e => setMessageText(e.target.value)} placeholder={isEn ? 'Hello {first_name}...' : '\xd9\x85\xd8\xb1\xd8\xad\xd8\xa8\xd8\xa7\xd9\x8b {first_name}...'} rows={3} className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none resize-none" />
                                )}
                                {campaignType === 'template' && selectedTemplate && templates[selectedTemplate]?.has_header_image && (
                                    <input type="url" value={templateImageUrl} onChange={e => setTemplateImageUrl(e.target.value)} placeholder="Header image URL..." dir="ltr" className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none" />
                                )}
                                <input type="text" value={scheduleName} onChange={e => setScheduleName(e.target.value)} placeholder={isEn ? 'Campaign name...' : '\xd8\xa7\xd8\xb3\xd9\x85 \xd8\xa7\xd9\x84\xd8\xad\xd9\x85\xd9\x84\xd8\xa9...'} className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none" />
                                <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full bg-brand-input border border-brand-accent/20 rounded-xl px-3 py-2 text-xs focus:border-brand-accent outline-none" />
                                <div className="flex gap-1.5 flex-wrap">
                                    {[{k:'all',l:isEn?('All ('+customers.length+')'):'(\xd8\xa7\xd9\x84\xd9\x83\xd9\x84 '+customers.length+')'},{k:'vip',l:'VIP'},{k:'buyer',l:isEn?'Buyers':'\xd9\x85\xd8\xb4\xd8\xaa\xd8\xb1\xd9\x8a\xd9\x86'}].map(({k,l}) => (
                                        <button key={k} onClick={() => setSelectedTag(k)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${selectedTag === k ? 'bg-brand-accent text-brand-bg' : 'glass-subtle text-brand-muted'}`}>{l}</button>
                                    ))}
                                </div>
                                {progress && (
                                    <div className="glass-subtle rounded-xl p-3">
                                        <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                            <span className="text-brand-accent">{isEn ? 'Progress' : '\xd8\xa7\xd9\x84\xd8\xaa\xd9\x82\xd8\xaf\xd9\x85'}</span>
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
                            {scheduling ? '...' : (isEn ? 'Save draft' : '\xd8\xad\xd9\x81\xd8\xb8 \xd9\x85\xd8\xb3\xd9\x88\xd8\xaf\xd8\xa9')}
                        </button>
                        <button onClick={() => showScheduler ? startCampaign() : setShowScheduler(true)} disabled={sending} className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50" style={{background:'#FF6400'}}>
                            <Zap size={12} />
                            {sending ? (isEn ? 'Sending...' : '\xd8\xac\xd8\xa7\xd8\xb1\xd9\x8a...') : (isEn ? 'Schedule blast' : '\xd8\xac\xd8\xaf\xd9\x88\xd9\x84\xd8\xa9 \xd8\xa7\xd9\x84\xd8\xad\xd9\x85\xd9\x84\xd8\xa9')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

'''

# ─── 2. QuickRepliesManager ──────────────────────────────────────────────────
new_qr_return = b'''    const mockGroups = [
        { id:'g1', label: isEn ? 'All' : '\xd8\xa7\xd9\x84\xd9\x83\xd9\x84', count: list.length || 8 },
        { id:'g2', label: isEn ? 'Greetings' : '\xd8\xa7\xd9\x84\xd8\xaa\xd8\xad\xd9\x8a\xd8\xa7\xd8\xaa', count: 3 },
        { id:'g3', label: isEn ? 'Shipping' : '\xd8\xa7\xd9\x84\xd8\xb4\xd8\xad\xd9\x86', count: 2 },
        { id:'g4', label: isEn ? 'Returns' : '\xd8\xa7\xd9\x84\xd8\xa5\xd8\xb1\xd8\xac\xd8\xa7\xd8\xb9', count: 1 },
        { id:'g5', label: isEn ? 'Promotions' : '\xd8\xa7\xd9\x84\xd8\xb9\xd8\xb1\xd9\x88\xd8\xb6', count: 2 },
    ];
    const [activeGroup, setActiveGroup] = React.useState('g1');
    const varChips = ['{first_name}', '{order_id}', '{shop_name}', '{tracking_url}'];

    return (
        <div className={`animate-in fade-in duration-500 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Quick Replies' : '\xd8\xa7\xd9\x84\xd8\xb1\xd8\xaf\xd9\x88\xd8\xaf \xd8\xa7\xd9\x84\xd8\xb3\xd8\xb1\xd9\x8a\xd8\xb9\xd8\xa9'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5">
                        {list.length} {isEn ? 'SNIPPETS \xc2\xb7 TYPE / IN CHAT TO INSERT' : '\xd8\xb1\xd8\xaf \xc2\xb7 \xd8\xa7\xd9\x83\xd8\xaa\xd8\xa8 / \xd9\x81\xd9\x8a \xd8\xa7\xd9\x84\xd9\x85\xd8\xad\xd8\xa7\xd8\xaf\xd8\xab\xd8\xa9 \xd9\x84\xd9\x84\xd8\xa5\xd8\xaf\xd8\xb1\xd8\xa7\xd8\xac'}
                    </p>
                </div>
                <button onClick={() => { setEditing(null); setForm({ title: '', text: '' }); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all" style={{background:'#8CC850',color:'#001A11'}}>
                    <Plus size={13} /> {isEn ? 'New Snippet' : '\xd8\xb1\xd8\xaf \xd8\xac\xd8\xaf\xd9\x8a\xd8\xaf'}
                </button>
            </div>

            <div className="grid gap-3" style={{gridTemplateColumns:'180px 1fr 340px'}}>
                <div className="glass rounded-2xl p-3 space-y-1 self-start">
                    <p className="text-[10px] font-bold text-brand-muted tracking-wider px-2 pb-2">{isEn ? 'GROUPS' : '\xd8\xa7\xd9\x84\xd9\x85\xd8\xac\xd9\x85\xd9\x88\xd8\xb9\xd8\xa7\xd8\xaa'}</p>
                    {mockGroups.map(g => (
                        <button key={g.id} onClick={() => setActiveGroup(g.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-bold transition-all ${activeGroup === g.id ? 'bg-brand-accent text-brand-bg' : 'text-brand-muted hover:text-brand-egg hover:bg-white/5'}`}>
                            <span>{g.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeGroup === g.id ? 'bg-brand-bg/20' : 'bg-brand-border/30'}`}>{g.count}</span>
                        </button>
                    ))}
                    <div className="border-t border-brand-border/20 pt-2 mt-2">
                        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-brand-muted hover:text-brand-accent transition-all">
                            <Plus size={12} /> {isEn ? 'New Group' : '\xd9\x85\xd8\xac\xd9\x85\xd9\x88\xd8\xb9\xd8\xa9 \xd8\xac\xd8\xaf\xd9\x8a\xd8\xaf\xd8\xa9'}
                        </button>
                    </div>
                </div>

                <div className="glass rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-border/20">
                        <div className="relative flex-1">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder={isEn ? 'Search snippets...' : '\xd8\xa7\xd8\xa8\xd8\xad\xd8\xab \xd9\x81\xd9\x8a \xd8\xa7\xd9\x84\xd8\xb1\xd8\xaf\xd9\x88\xd8\xaf...'}
                                className="w-full bg-brand-input border border-brand-border/30 rounded-xl pl-8 pr-3 py-2 text-xs focus:border-brand-accent outline-none" />
                        </div>
                        <span className="text-[10px] text-brand-muted font-bold shrink-0">{list.length} {isEn ? 'total' : '\xd8\xb1\xd8\xaf'}</span>
                    </div>
                    <div className="divide-y divide-brand-border/10">
                        {filtered.length === 0 ? (
                            <div className="text-center py-12 text-brand-muted">
                                <MessageSquareQuote size={36} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-bold">{isEn ? 'No snippets yet' : '\xd9\x84\xd8\xa7 \xd8\xaa\xd9\x88\xd8\xac\xd8\xaf \xd8\xb1\xd8\xaf\xd9\x88\xd8\xaf \xd8\xa8\xd8\xb9\xd8\xaf'}</p>
                                <p className="text-xs mt-1 opacity-60">{isEn ? 'Create your first quick reply.' : '\xd8\xa3\xd8\xb6\xd9\x81 \xd8\xa3\xd9\x88\xd9\x84 \xd8\xb1\xd8\xaf \xd8\xb3\xd8\xb1\xd9\x8a\xd8\xb9.'}</p>
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
                            {editing ? (isEn ? 'Edit Snippet' : '\xd8\xaa\xd8\xb9\xd8\xaf\xd9\x8a\xd9\x84 \xd8\xa7\xd9\x84\xd8\xb1\xd8\xaf') : (isEn ? 'New Snippet' : '\xd8\xb1\xd8\xaf \xd8\xac\xd8\xaf\xd9\x8a\xd8\xaf')}
                        </span>
                        {editing && <button onClick={handleCancel} className="text-brand-muted hover:text-brand-egg text-xs">\xe2\x9c\x95</button>}
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider">{isEn ? 'SHORTCUT' : '\xd8\xa7\xd9\x84\xd8\xa7\xd8\xae\xd8\xaa\xd8\xb5\xd8\xa7\xd8\xb1'}</label>
                            <div className="flex items-center gap-2 bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2">
                                <span className="text-brand-accent font-black text-sm shrink-0">/</span>
                                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder={isEn ? 'greeting' : '\xd8\xaa\xd8\xad\xd9\x8a\xd8\xa9'}
                                    className="flex-1 bg-transparent text-xs outline-none text-brand-egg" dir="ltr" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider">{isEn ? 'MESSAGE TEXT' : '\xd9\x86\xd8\xb5 \xd8\xa7\xd9\x84\xd8\xb1\xd8\xb3\xd8\xa7\xd9\x84\xd8\xa9'}</label>
                            <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                                placeholder={isEn ? 'Hello! How can we help you today?' : '\xd9\x85\xd8\xb1\xd8\xad\xd8\xa8\xd8\xa7\xd9\x8b! \xd9\x83\xd9\x8a\xd9\x81 \xd9\x8a\xd9\x85\xd9\x83\xd9\x86\xd9\x86\xd8\xa7 \xd9\x85\xd8\xb3\xd8\xa7\xd8\xb9\xd8\xaf\xd8\xaa\xd9\x83\xd8\x9f'}
                                rows={5} className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2.5 text-xs focus:border-brand-accent outline-none resize-none custom-scrollbar" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider">{isEn ? 'INSERT VARIABLE' : '\xd8\xa5\xd8\xaf\xd8\xb1\xd8\xa7\xd8\xac \xd9\x85\xd8\xaa\xd8\xba\xd9\x8a\xd8\xb1'}</label>
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
                                {saving ? '...' : (editing ? (isEn ? 'Update' : '\xd8\xaa\xd8\xad\xd8\xaf\xd9\x8a\xd8\xab') : (isEn ? 'Save' : '\xd8\xad\xd9\x81\xd8\xb8'))}
                            </button>
                            {editing && (
                                <button onClick={handleCancel} className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-brand-muted glass-subtle border border-brand-border/30 transition-all">
                                    {isEn ? 'Cancel' : '\xd8\xa5\xd9\x84\xd8\xba\xd8\xa7\xd8\xa1'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

'''

# ─── 3. AutomationsManager - redesigned return only ──────────────────────────
new_auto_return = b'''    return (
        <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-brand-egg flex items-center gap-2">
                        <Zap size={20} className="text-brand-accent" /> {isEn ? 'Automation Engine' : '\xd9\x85\xd8\xad\xd8\xb1\xd9\x83 \xd8\xa7\xd9\x84\xd8\xa3\xd8\xaa\xd9\x85\xd8\xaa\xd8\xa9'}
                    </h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5">
                        {automations.filter(a=>a.active).length} {isEn ? 'ACTIVE FLOWS \xc2\xb7 META CLOUD API' : '\xd8\xb3\xd9\x8a\xd8\xb1 \xd9\x86\xd8\xb4\xd8\xb7 \xc2\xb7 Meta Cloud API'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => axios.post(`${API_URL}/automations/run-now`).then(() => { showToast(isEn ? 'Queue triggered!' : '\xd8\xaa\xd9\x85 \xd8\xaa\xd8\xb4\xd8\xba\xd9\x8a\xd9\x84 \xd8\xa7\xd9\x84\xd8\xaf\xd9\x88\xd8\xb1\xd8\xa9!'); fetch(); }).catch(() => {})}
                        className="px-3 py-2 rounded-xl border border-brand-border/30 text-[11px] font-bold text-brand-muted hover:text-brand-accent hover:border-brand-accent/30 transition-all flex items-center gap-1.5">
                        <RefreshCcw size={13} /> {isEn ? 'Run Now' : '\xd8\xb4\xd8\xba\xd9\x91\xd9\x84 \xd8\xa7\xd9\x84\xd8\xa2\xd9\x86'}
                    </button>
                    <button onClick={() => { setShowQueue(!showQueue); fetch(); }}
                        className={`px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all ${showQueue ? 'bg-brand-accent/20 border-brand-accent text-brand-accent' : 'border-brand-border/30 text-brand-muted hover:border-brand-accent/30'}`}>
                        <Clock size={13} />
                        {isEn ? `Queue (${pendingCount})` : `\xd8\xb7\xd8\xa7\xd8\xa8\xd9\x88\xd8\xb1 (${pendingCount})`}
                    </button>
                    <button onClick={openNew}
                        className="px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all" style={{background:'#8CC850',color:'#001A11'}}>
                        <Plus size={13} /> {isEn ? 'New Flow' : '\xd8\xb3\xd9\x8a\xd8\xb1 \xd8\xac\xd8\xaf\xd9\x8a\xd8\xaf'}
                    </button>
                </div>
            </div>

            {showQueue && (
                <div className="glass p-4 rounded-2xl space-y-2">
                    <h3 className="font-bold text-[11px] text-brand-muted uppercase tracking-wider">{isEn ? 'Pending Queue' : '\xd8\xa7\xd9\x84\xd8\xb1\xd8\xb3\xd8\xa7\xd8\xa6\xd9\x84 \xd8\xa7\xd9\x84\xd9\x85\xd8\xac\xd8\xaf\xd9\x88\xd9\x84\xd8\xa9'}</h3>
                    {queue.filter(q => q.status === 'pending').length === 0 ? (
                        <p className="text-brand-muted text-sm py-3 text-center">{isEn ? 'No pending messages.' : '\xd9\x84\xd8\xa7 \xd8\xaa\xd9\x88\xd8\xac\xd8\xaf \xd8\xb1\xd8\xb3\xd8\xa7\xd8\xa6\xd9\x84 \xd9\x81\xd9\x8a \xd8\xa7\xd9\x84\xd8\xa7\xd9\x86\xd8\xaa\xd8\xb8\xd8\xa7\xd8\xb1.'}</p>
                    ) : queue.filter(q => q.status === 'pending').map((q, i) => (
                        <div key={i} className="flex items-center justify-between bg-brand-bg/40 border border-brand-accent/10 rounded-xl px-4 py-2.5 text-sm">
                            <div>
                                <span className="font-bold text-brand-text text-[12px]">{q.automation_name}</span>
                                <span className="text-brand-muted mx-2">\xe2\x86\x92</span>
                                <span className="text-brand-muted text-[12px]">{q.customer_name}</span>
                            </div>
                            <div className="text-[11px] text-brand-muted" dir="ltr">
                                {isEn ? 'Step' : '\xd8\xae\xd8\xb7\xd9\x88\xd8\xa9'} {q.step_index + 1} \xe2\x80\x94 {new Date(q.fire_at).toLocaleString(isEn ? 'en-US' : 'ar-EG')}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid gap-3" style={{gridTemplateColumns:'260px 1fr'}}>
                <div className="glass rounded-2xl overflow-hidden self-start">
                    <div className="px-4 py-3 border-b border-brand-border/20 flex items-center justify-between">
                        <span className="text-[12px] font-black text-brand-egg">{isEn ? 'Flows' : '\xd8\xa7\xd9\x84\xd8\xb3\xd9\x8a\xd8\xb1\xd8\xa7\xd8\xaa'}</span>
                        <span className="text-[10px] text-brand-muted font-bold">{automations.length} {isEn ? 'total' : '\xd8\xb3\xd9\x8a\xd8\xb1'}</span>
                    </div>
                    {automations.length === 0 ? (
                        <div className="p-8 text-center text-brand-muted">
                            <Zap size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-[12px] font-bold opacity-50">{isEn ? 'No flows yet' : '\xd9\x84\xd8\xa7 \xd8\xaa\xd9\x88\xd8\xac\xd8\xaf \xd8\xb3\xd9\x8a\xd8\xb1\xd8\xa7\xd8\xaa'}</p>
                            <button onClick={openNew} className="mt-3 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all" style={{background:'#8CC850',color:'#001A11'}}>
                                <Plus size={11} className="inline mr-1" />{isEn ? 'Create' : '\xd8\xa5\xd9\x86\xd8\xb4\xd8\xa7\xd8\xa1'}
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
                    <p className="text-[10px] font-bold text-brand-muted tracking-wider">{isEn ? 'VISUAL FLOW CANVAS' : '\xd9\x84\xd9\x88\xd8\xad\xd8\xa9 \xd8\xa7\xd9\x84\xd8\xb3\xd9\x8a\xd8\xb1'}</p>
                    {automations.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 text-brand-muted">
                            <div className="w-16 h-16 rounded-2xl glass-subtle border border-brand-border/20 flex items-center justify-center mb-4">
                                <Zap size={28} className="opacity-20" />
                            </div>
                            <p className="text-sm font-bold opacity-40">{isEn ? 'Select a flow to preview' : '\xd8\xa7\xd8\xae\xd8\xaa\xd8\xb1 \xd8\xb3\xd9\x8a\xd8\xb1 \xd9\x84\xd9\x84\xd9\x85\xd8\xb9\xd8\xa7\xd9\x8a\xd9\x86\xd8\xa9'}</p>
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
                                                                {step.wait_hours > 0 ? `WAIT ${step.wait_hours}h \xc2\xb7 ` : ''}ACTION {si + 1}
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
                                <p className="text-[11px] text-brand-muted mt-4">{isEn ? `+${automations.length - 1} more flows` : `+${automations.length - 1} \xd8\xb3\xd9\x8a\xd8\xb1\xd8\xa7\xd8\xaa \xd8\xa3\xd8\xae\xd8\xb1\xd9\x89`}</p>
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
                                {editing ? (isEn ? 'Edit Automation' : '\xd8\xaa\xd8\xb9\xd8\xaf\xd9\x8a\xd9\x84 \xd8\xa7\xd9\x84\xd8\xa3\xd8\xaa\xd9\x85\xd8\xaa\xd8\xa9') : (isEn ? 'New Automation' : '\xd8\xa3\xd8\xaa\xd9\x85\xd8\xaa\xd8\xa9 \xd8\xac\xd8\xaf\xd9\x8a\xd8\xaf\xd8\xa9')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-brand-text p-1"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-brand-muted">{isEn ? 'Automation Name' : '\xd8\xa7\xd8\xb3\xd9\x85 \xd8\xa7\xd9\x84\xd8\xa3\xd8\xaa\xd9\x85\xd8\xaa\xd8\xa9'}</label>
                                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder={isEn ? 'e.g. Post-Ship Review Request' : '\xd9\x85\xd8\xab\xd8\xa7\xd9\x84: \xd8\xb7\xd9\x84\xd8\xa8 \xd8\xaa\xd9\x82\xd9\x8a\xd9\x8a\xd9\x85 \xd8\xa8\xd8\xb9\xd8\xaf \xd8\xa7\xd9\x84\xd8\xb4\xd8\xad\xd9\x86'}
                                    className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-brand-accent outline-none" />
                            </div>
                            <div className="space-y-3 p-4 bg-brand-bg/40 rounded-2xl border border-brand-accent/10">
                                <h3 className="font-bold text-sm text-brand-accent flex items-center gap-2">
                                    <Zap size={15} /> {isEn ? 'Trigger' : '\xd8\xa7\xd9\x84\xd9\x85\xd8\xb4\xd8\xba\xd9\x91\xd9\x84'}
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
                                        placeholder={isEn ? 'e.g. price' : '\xd9\x85\xd8\xab\xd8\xa7\xd9\x84: \xd8\xb3\xd8\xb9\xd8\xb1'}
                                        className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none" />
                                )}
                            </div>
                            <div className="space-y-3">
                                <h3 className="font-bold text-sm text-brand-accent">{isEn ? 'Steps' : '\xd8\xa7\xd9\x84\xd8\xae\xd8\xb7\xd9\x88\xd8\xa7\xd8\xaa'}</h3>
                                {form.steps.map((step, i) => (
                                    <div key={i} className="p-4 bg-brand-bg/40 rounded-2xl border border-brand-accent/10 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-brand-muted">{isEn ? `Step ${i + 1}` : `\xd8\xa7\xd9\x84\xd8\xae\xd8\xb7\xd9\x88\xd8\xa9 ${i + 1}`}</span>
                                            {form.steps.length > 1 && (
                                                <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14} /></button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="number" min="0" max="8760" value={step.wait_hours}
                                                onChange={e => setStep(i, 'wait_hours', parseInt(e.target.value) || 0)}
                                                placeholder={isEn ? 'Wait hours' : '\xd8\xb3\xd8\xa7\xd8\xb9\xd8\xa7\xd8\xaa \xd8\xa7\xd9\x84\xd8\xa7\xd9\x86\xd8\xaa\xd8\xb8\xd8\xa7\xd8\xb1'}
                                                className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none" dir="ltr" />
                                            <select value={step.action} onChange={e => setStep(i, 'action', e.target.value)}
                                                className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none">
                                                <option value="send_text">{isEn ? 'Send Text' : '\xd8\xa5\xd8\xb1\xd8\xb3\xd8\xa7\xd9\x84 \xd9\x86\xd8\xb5'}</option>
                                                <option value="send_template">{isEn ? 'Send Template' : '\xd8\xa5\xd8\xb1\xd8\xb3\xd8\xa7\xd9\x84 \xd9\x82\xd8\xa7\xd9\x84\xd8\xa8'}</option>
                                            </select>
                                        </div>
                                        {step.action === 'send_text' && (
                                            <textarea value={step.text || ''} onChange={e => setStep(i, 'text', e.target.value)}
                                                placeholder={isEn ? 'Hello {{customer_name}}, ...' : '\xd9\x85\xd8\xb1\xd8\xad\xd8\xa8\xd8\xa7\xd9\x8b {{customer_name}}, ...'}
                                                rows={3} className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none resize-none" />
                                        )}
                                        {step.action === 'send_template' && (
                                            <select value={step.template_id || ''} onChange={e => setStep(i, 'template_id', e.target.value)}
                                                className="w-full bg-brand-input border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-accent outline-none">
                                                <option value="">{isEn ? '-- Select template --' : '-- \xd8\xa7\xd8\xae\xd8\xaa\xd8\xb1 \xd9\x82\xd8\xa7\xd9\x84\xd8\xa8 --'}</option>
                                                {Object.entries(templates).map(([k, t]) => <option key={k} value={k}>{t.title}</option>)}
                                            </select>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addStep}
                                    className="w-full border-2 border-dashed border-brand-accent/20 hover:border-brand-accent/50 text-brand-muted hover:text-brand-accent rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all">
                                    <Plus size={16} /> {isEn ? 'Add Step' : '\xd8\xa5\xd8\xb6\xd8\xa7\xd9\x81\xd8\xa9 \xd8\xae\xd8\xb7\xd9\x88\xd8\xa9'}
                                </button>
                            </div>
                        </div>
                        <div className="p-6 border-t border-brand-accent/10 flex gap-3">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 border border-brand-accent/30 text-brand-muted py-3 rounded-xl font-bold hover:bg-brand-accent/5 transition-all">
                                {isEn ? 'Cancel' : '\xd8\xa5\xd9\x84\xd8\xba\xd8\xa7\xd8\xa1'}
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 bg-brand-accent text-brand-bg py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50">
                                {saving ? (isEn ? 'Saving...' : '\xd8\xac\xd8\xa7\xd8\xb1\xd9\x8a...') : (isEn ? 'Save' : '\xd8\xad\xd9\x81\xd8\xb8')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
'''

# ─── 4. AnalyticsDashboard - replace just the return block ───────────────────
new_analytics_return = b'''    return (
        <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Analytics' : '\xd8\xa7\xd9\x84\xd8\xaa\xd9\x82\xd8\xa7\xd8\xb1\xd9\x8a\xd8\xb1'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5">{isEn ? 'REAL-TIME SYSTEM OVERVIEW' : '\xd9\x86\xd8\xb8\xd8\xb1\xd8\xa9 \xd8\xb4\xd8\xa7\xd9\x85\xd9\x84\xd8\xa9 \xd8\xb9\xd9\x84\xd9\x89 \xd8\xa7\xd9\x84\xd9\x86\xd8\xb8\xd8\xa7\xd9\x85'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <a href={`${API_URL}/export/contacts`} download
                        className="flex items-center gap-1.5 text-xs glass-subtle border border-brand-border/30 text-brand-muted px-4 py-2 rounded-xl font-bold hover:text-brand-egg transition-colors">
                        <Download size={13} /> {isEn ? 'Contacts CSV' : '\xd8\xaa\xd8\xb5\xd8\xaf\xd9\x8a\xd8\xb1 \xd8\xac\xd9\x87\xd8\xa7\xd8\xaa \xd8\xa7\xd9\x84\xd8\xa7\xd8\xaa\xd8\xb5\xd8\xa7\xd9\x84'}
                    </a>
                    <a href={`${API_URL}/export/orders`} download
                        className="flex items-center gap-1.5 text-xs glass-subtle border border-brand-border/30 text-brand-muted px-4 py-2 rounded-xl font-bold hover:text-brand-egg transition-colors">
                        <Download size={13} /> {isEn ? 'Orders CSV' : '\xd8\xaa\xd8\xb5\xd8\xaf\xd9\x8a\xd8\xb1 \xd8\xa7\xd9\x84\xd8\xb7\xd9\x84\xd8\xa8\xd8\xa7\xd8\xaa'}
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: isEn ? 'MESSAGES SENT' : '\xd8\xb1\xd8\xb3\xd8\xa7\xd8\xa6\xd9\x84 \xd9\x85\xd8\xb1\xd8\xb3\xd9\x84\xd8\xa9', value: messages.totalOutbound, sub: messages.seenCount + (isEn ? ' seen' : ' \xd9\x85\xd9\x82\xd8\xb1\xd9\x88\xd8\xa1\xd8\xa9'), color: 'text-brand-egg' },
                    { label: isEn ? 'MESSAGES RECEIVED' : '\xd8\xb1\xd8\xb3\xd8\xa7\xd8\xa6\xd9\x84 \xd9\x88\xd8\xa7\xd8\xb1\xd8\xaf\xd8\xa9', value: messages.totalInbound, sub: messages.conversations + (isEn ? ' conversations' : ' \xd9\x85\xd8\xad\xd8\xa7\xd8\xaf\xd8\xab\xd8\xa9'), color: 'text-brand-accent' },
                    { label: isEn ? 'RESPONSE RATE' : '\xd9\x85\xd8\xb9\xd8\xaf\xd9\x84 \xd8\xa7\xd9\x84\xd8\xb1\xd8\xaf', value: messages.responseRate + '%', sub: isEn ? 'customers replied' : '\xd8\xb9\xd9\x85\xd9\x84\xd8\xa7\xd8\xa1 \xd8\xb1\xd8\xaf\xd9\x88\xd8\xa7', color: 'text-blue-400' },
                    { label: isEn ? 'CONVERSION RATE' : '\xd9\x85\xd8\xb9\xd8\xaf\xd9\x84 \xd8\xa7\xd9\x84\xd8\xaa\xd8\xad\xd9\x88\xd9\x8a\xd9\x84', value: conversionRate + '%', sub: isEn ? 'orders confirmed' : '\xd8\xb7\xd9\x84\xd8\xa8\xd8\xa7\xd8\xaa \xd9\x85\xd8\xa4\xd9\x83\xd8\xaf\xd8\xa9', color: 'text-brand-gold' },
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
                    <h3 className="font-black text-[13px] text-brand-egg">{isEn ? 'Order Funnel' : '\xd9\x82\xd9\x85\xd8\xb9 \xd8\xa7\xd9\x84\xd8\xb7\xd9\x84\xd8\xa8\xd8\xa7\xd8\xaa'}</h3>
                    <div className="space-y-2.5">
                        <FunnelBar label={isEn ? 'New / Pending' : '\xd8\xac\xd8\xaf\xd9\x8a\xd8\xaf / \xd9\x85\xd8\xb9\xd9\x84\xd9\x82'} value={funnel.new} max={totalOrders} color="bg-brand-muted/50" />
                        <FunnelBar label={isEn ? 'Followed Up' : '\xd8\xaa\xd9\x85\xd8\xaa \xd8\xa7\xd9\x84\xd9\x85\xd8\xaa\xd8\xa7\xd8\xa8\xd8\xb9\xd8\xa9'} value={funnel.followed_up} max={totalOrders} color="bg-brand-accent/70" />
                        <FunnelBar label={isEn ? 'Confirmed' : '\xd8\xaa\xd9\x85 \xd8\xa7\xd9\x84\xd8\xaa\xd8\xa3\xd9\x83\xd9\x8a\xd8\xaf'} value={funnel.confirmed} max={totalOrders} color="bg-green-500/80" />
                        <FunnelBar label={isEn ? 'Shipped' : '\xd8\xaa\xd9\x85 \xd8\xa7\xd9\x84\xd8\xb4\xd8\xad\xd9\x86'} value={funnel.shipped} max={totalOrders} color="bg-blue-500/80" />
                        <FunnelBar label={isEn ? 'Cancelled' : '\xd9\x85\xd9\x84\xd8\xba\xd9\x89'} value={funnel.cancelled} max={totalOrders} color="bg-red-500/60" />
                    </div>
                    <p className="text-[11px] text-brand-muted pt-2 border-t border-brand-border/10">
                        {isEn ? `${totalOrders} total orders tracked` : `${totalOrders} \xd8\xb7\xd9\x84\xd8\xa8 \xd9\x85\xd8\xaa\xd8\xaa\xd8\xa8\xd8\xb9`}
                    </p>
                </div>

                <div className="glass p-5 rounded-2xl space-y-3">
                    <h3 className="font-black text-[13px] text-brand-egg">{isEn ? 'Message Volume \xe2\x80\x94 Last 7 Days' : '\xd8\xad\xd8\xac\xd9\x85 \xd8\xa7\xd9\x84\xd8\xb1\xd8\xb3\xd8\xa7\xd8\xa6\xd9\x84 \xe2\x80\x94 \xd8\xa2\xd8\xae\xd8\xb1 7 \xd8\xa3\xd9\x8a\xd8\xa7\xd9\x85'}</h3>
                    <div className="flex gap-4 text-[11px] text-brand-muted">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-accent/70 inline-block" />{isEn ? 'Outbound' : '\xd8\xb5\xd8\xa7\xd8\xaf\xd8\xb1\xd8\xa9'}</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/50 inline-block" />{isEn ? 'Inbound' : '\xd9\x88\xd8\xa7\xd8\xb1\xd8\xaf\xd8\xa9'}</span>
                    </div>
                    <BarChart data={daily} isEn={isEn} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="glass p-5 rounded-2xl">
                    <h3 className="font-black text-[13px] text-brand-egg mb-3">{isEn ? 'Automation Stats' : '\xd8\xa5\xd8\xad\xd8\xb5\xd8\xa7\xd8\xa1 \xd8\xa7\xd9\x84\xd8\xa3\xd8\xaa\xd9\x85\xd8\xaa\xd8\xa9'}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: isEn ? 'Pending' : '\xd9\x82\xd9\x8a\xd8\xaf \xd8\xa7\xd9\x84\xd8\xa7\xd9\x86\xd8\xaa\xd8\xb8\xd8\xa7\xd8\xb1', value: autoStats.pending, color: 'bg-brand-accent/20 text-brand-accent' },
                            { label: isEn ? 'Executed' : '\xd9\x86\xd9\x8f\xd9\x81\xd9\x91\xd8\xb0', value: autoStats.done, color: 'bg-green-500/20 text-green-400' },
                            { label: isEn ? 'Failed' : '\xd9\x81\xd8\xb4\xd9\x84', value: autoStats.failed, color: 'bg-red-500/20 text-red-400' },
                            { label: isEn ? 'Cancelled' : '\xd8\xa3\xd9\x84\xd8\xba\xd9\x8a', value: autoStats.cancelled, color: 'bg-brand-muted/20 text-brand-muted' },
                        ].map(s => (
                            <div key={s.label} className={`rounded-2xl p-4 text-center ${s.color.split(' ')[0]}`}>
                                <p className={`text-2xl font-black ${s.color.split(' ')[1]}`}>{s.value}</p>
                                <p className="text-[11px] font-bold mt-1 opacity-80">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass p-5 rounded-2xl">
                    <h3 className="font-black text-[13px] text-brand-egg mb-3">{isEn ? 'Most Active Customers' : '\xd8\xa3\xd9\x83\xd8\xab\xd8\xb1 \xd8\xa7\xd9\x84\xd8\xb9\xd9\x85\xd9\x84\xd8\xa7\xd8\xa1 \xd8\xaa\xd9\x81\xd8\xa7\xd8\xb9\xd9\x84\xd8\xa7\xd9\x8b'}</h3>
                    {topCustomers.length === 0 ? (
                        <p className="text-brand-muted text-sm text-center py-8">{isEn ? 'No data yet.' : '\xd9\x84\xd8\xa7 \xd8\xaa\xd9\x88\xd8\xac\xd8\xaf \xd8\xa8\xd9\x8a\xd8\xa7\xd9\x86\xd8\xa7\xd8\xaa.'}</p>
                    ) : (
                        <div className="space-y-3">
                            {topCustomers.map((c, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-brand-accent/20 flex items-center justify-center text-xs font-black text-brand-accent shrink-0">{i + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-brand-egg truncate">{c.name}</p>
                                        <p className="text-[11px] text-brand-muted" dir="ltr">{c.phone}</p>
                                    </div>
                                    <span className="text-xs font-bold text-brand-accent shrink-0">{c.count} {isEn ? 'msgs' : '\xd8\xb1\xd8\xb3\xd8\xa7\xd9\x84\xd8\xa9'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
'''

# ─── 5. TemplatesManager - replace just the return block ─────────────────────
new_tpl_return = b'''    return (
        <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Templates' : '\xd8\xa7\xd9\x84\xd9\x82\xd9\x88\xd8\xa7\xd9\x84\xd8\xa8'}</h2>
                    <p className="text-[11px] font-bold text-brand-muted tracking-wider mt-0.5">{isEn ? 'META VERIFIED \xc2\xb7 OFFICIAL TEMPLATES LIBRARY' : 'Meta \xd9\x85\xd8\xaa\xd8\xad\xd9\x82\xd9\x82 \xc2\xb7 \xd9\x85\xd9\x83\xd8\xaa\xd8\xa8\xd8\xa9 \xd8\xa7\xd9\x84\xd9\x82\xd9\x88\xd8\xa7\xd9\x84\xd8\xa8'}</p>
                </div>
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all" style={{background:'#8CC850',color:'#001A11'}}>
                    {saving ? '...' : (isEn ? 'Save Changes' : '\xd8\xad\xd9\x81\xd8\xb8 \xd8\xa7\xd9\x84\xd8\xaa\xd8\xb9\xd8\xaf\xd9\x8a\xd9\x84\xd8\xa7\xd8\xaa')}
                </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: isEn ? 'ACTIVE TEMPLATES' : '\xd9\x82\xd9\x88\xd8\xa7\xd9\x84\xd8\xa8 \xd9\x86\xd8\xb4\xd8\xb7\xd8\xa9', value: Object.keys(localTemplates).length.toString() },
                    { label: isEn ? 'WITH IMAGE' : '\xd8\xaa\xd8\xad\xd8\xaa\xd9\x88\xd9\x8a \xd8\xb5\xd9\x88\xd8\xb1\xd8\xa9', value: Object.values(localTemplates).filter(t => t.has_header_image).length.toString() },
                    { label: isEn ? 'WITH VARIABLES' : '\xd8\xaa\xd8\xad\xd8\xaa\xd9\x88\xd9\x8a \xd9\x85\xd8\xaa\xd8\xba\xd9\x8a\xd8\xb1\xd8\xa7\xd8\xaa', value: Object.values(localTemplates).filter(t => (t.params_count||0) > 0).length.toString() },
                    { label: isEn ? 'META APPROVED' : '\xd9\x85\xd8\xb9\xd8\xaa\xd9\x85\xd8\xaf Meta', value: Object.values(localTemplates).filter(t => t.meta_name).length.toString(), gold: true },
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
                        <span className="text-sm font-black text-brand-egg">{isEn ? 'Template Library' : '\xd9\x85\xd9\x83\xd8\xaa\xd8\xa8\xd8\xa9 \xd8\xa7\xd9\x84\xd9\x82\xd9\x88\xd8\xa7\xd9\x84\xd8\xa8'}</span>
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
                                                {tpl.meta_name ? (isEn ? 'APPROVED' : '\xd9\x85\xd8\xb9\xd8\xaa\xd9\x85\xd8\xaf') : (isEn ? 'NOT SET' : '\xd8\xba\xd9\x8a\xd8\xb1 \xd9\x85\xd8\xb9\xd9\x8a\xd9\x86')}
                                            </span>
                                            {tpl.has_header_image && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30">{isEn ? 'IMAGE' : '\xd8\xb5\xd9\x88\xd8\xb1\xd8\xa9'}</span>}
                                            {(tpl.params_count || 0) > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">{tpl.params_count} {isEn ? 'vars' : '\xd9\x85\xd8\xaa\xd8\xba\xd9\x8a\xd8\xb1'}</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-brand-muted font-bold">{isEn ? 'Meta Template Name' : '\xd8\xa7\xd8\xb3\xd9\x85 \xd8\xa7\xd9\x84\xd9\x82\xd8\xa7\xd9\x84\xd8\xa8 \xd9\x81\xd9\x8a Meta'}</label>
                                                <input value={tpl.meta_name || ''} onChange={e => updateTemplate(key, 'meta_name', e.target.value)}
                                                    className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-1.5 text-xs focus:border-brand-accent outline-none mt-1"
                                                    dir="ltr" disabled={key === 'shipping'} placeholder="template_name_here" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-brand-muted font-bold">{isEn ? 'Message Preview' : '\xd9\x85\xd8\xb9\xd8\xa7\xd9\x8a\xd9\x86\xd8\xa9 \xd8\xa7\xd9\x84\xd8\xb1\xd8\xb3\xd8\xa7\xd9\x84\xd8\xa9'}</label>
                                                <input value={tpl.preview || ''} onChange={e => updateTemplate(key, 'preview', e.target.value)}
                                                    className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-1.5 text-xs focus:border-brand-accent outline-none mt-1"
                                                    placeholder={isEn ? 'Preview text...' : '\xd9\x86\xd8\xb5 \xd8\xa7\xd9\x84\xd9\x85\xd8\xb9\xd8\xa7\xd9\x8a\xd9\x86\xd8\xa9...'} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div>
                                                <label className="text-[10px] text-brand-muted font-bold">{isEn ? 'Vars count' : '\xd8\xb9\xd8\xaf\xd8\xaf \xd8\xa7\xd9\x84\xd9\x85\xd8\xaa\xd8\xba\xd9\x8a\xd8\xb1\xd8\xa7\xd8\xaa'}</label>
                                                <input type="number" min="0" max="5" value={tpl.params_count ?? 0}
                                                    onChange={e => updateTemplate(key, 'params_count', parseInt(e.target.value) || 0)}
                                                    className="w-16 bg-brand-input border border-brand-border/30 rounded-xl px-2 py-1.5 text-xs focus:border-brand-accent outline-none mt-1" dir="ltr" />
                                            </div>
                                            <div className="flex items-center gap-2 mt-4">
                                                <input type="checkbox" id={`hdr-${key}`} checked={!!tpl.has_header_image}
                                                    onChange={e => updateTemplate(key, 'has_header_image', e.target.checked)}
                                                    className="w-4 h-4 accent-brand-accent" />
                                                <label htmlFor={`hdr-${key}`} className="text-[11px] text-brand-muted cursor-pointer">{isEn ? 'Has image header' : '\xd9\x8a\xd8\xad\xd8\xaa\xd9\x88\xd9\x8a \xd8\xb5\xd9\x88\xd8\xb1\xd8\xa9'}</label>
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
                        <span className="text-[12px] font-black text-brand-egg">{isEn ? 'WA Business Preview' : '\xd9\x85\xd8\xb9\xd8\xa7\xd9\x8a\xd9\x86\xd8\xa9 WA'}</span>
                    </div>
                    <div className="p-4">
                        <div className="rounded-2xl p-3" style={{background:'rgba(0,40,20,0.6)',border:'1px solid rgba(140,200,80,0.1)'}}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center shrink-0">
                                    <span className="text-[9px] font-black text-brand-bg">LH</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-brand-egg">Linenhouse Cairo</p>
                                    <p className="text-[10px] text-brand-muted">business \xc2\xb7 verified \xe2\x9c\x93</p>
                                </div>
                            </div>
                            {Object.values(localTemplates).slice(0,1).map((t, i) => (
                                <div key={i}>
                                    {t.has_header_image && (
                                        <div className="rounded-xl mb-2 h-20 flex items-end p-3" style={{background:'#FF6400'}}>
                                            <p className="text-white font-black text-sm">{t.title?.toUpperCase()}</p>
                                        </div>
                                    )}
                                    <p className="text-[12px] text-brand-egg mb-1.5">{t.preview || (isEn ? 'Hello {first_name},' : '\xd9\x85\xd8\xb1\xd8\xad\xd8\xa8\xd8\xa7\xd9\x8b {first_name},')}</p>
                                </div>
                            ))}
                            <div className="border-t border-brand-border/20 mt-2 pt-2 flex items-center justify-between">
                                <span className="text-[10px] text-brand-muted">{isEn ? 'WhatsApp Business' : 'WhatsApp \xd8\xa3\xd8\xb9\xd9\x85\xd8\xa7\xd9\x84'}</span>
                                <span className="text-[10px] text-brand-muted">14:02 \xe2\x9c\x93\xe2\x9c\x93</span>
                            </div>
                        </div>
                        <div className="mt-3 space-y-2">
                            {[
                                { label: isEn ? 'Templates' : '\xd8\xa7\xd9\x84\xd9\x82\xd9\x88\xd8\xa7\xd9\x84\xd8\xa8', value: Object.keys(localTemplates).length },
                                { label: isEn ? 'Approved' : '\xd9\x85\xd8\xb9\xd8\xaa\xd9\x85\xd8\xaf', value: Object.values(localTemplates).filter(t=>t.meta_name).length },
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
'''

# ─── Apply all replacements ───────────────────────────────────────────────────
# Find positions in original file
camps_def_start = raw.find(b'const CampaignsManager')
quick_start = raw.find(b'const QuickRepliesManager')
trigger_types_start = raw.find(b'const TRIGGER_TYPES')
auto_start = raw.find(b'const AutomationsManager')
abandoned_start = raw.find(b'const AbandonedCartsManager')
analytics_start = raw.find(b'const AnalyticsDashboard')
tpl_start = raw.find(b'const TemplatesManager')
shopify_start = raw.find(b'const ShopifyOrders')

avatar_pos = raw.find(b"    const avatarColors = ['#FF6400'", camps_def_start)
qr_return_pos = raw.find(b'\n    return (', quick_start)
auto_return_pos = raw.find(b'\n    return (', auto_start)
analytics_return_pos = raw.find(b'\n    return (', analytics_start)
tpl_return_pos = raw.find(b'\n    return (', tpl_start)

print(f'Positions: avatar={avatar_pos}, qr_return={qr_return_pos}, auto_return={auto_return_pos}')
print(f'  analytics_return={analytics_return_pos}, tpl_return={tpl_return_pos}')
print(f'  quick_start={quick_start}, trigger_types={trigger_types_start}, abandoned={abandoned_start}')
print(f'  analytics_start={analytics_start}, shopify={shopify_start}')

# 1. Replace CampaignsManager data + return (from avatarColors to before QuickRepliesManager)
raw = raw[:avatar_pos] + new_camps_data_and_return + raw[quick_start:]

# Recalculate positions after change
quick_start2 = raw.find(b'const QuickRepliesManager')
trigger_types2 = raw.find(b'const TRIGGER_TYPES')
auto_start2 = raw.find(b'const AutomationsManager')
abandoned_start2 = raw.find(b'const AbandonedCartsManager')
analytics_start2 = raw.find(b'const AnalyticsDashboard')
tpl_start2 = raw.find(b'const TemplatesManager')
shopify_start2 = raw.find(b'const ShopifyOrders')

print(f'\nAfter campaigns fix: size={len(raw)}')

# 2. Replace QuickRepliesManager return block
# Find the return( inside QuickRepliesManager
qr_return2 = raw.find(b'\n    return (', quick_start2)
# End of QuickRepliesManager = just before const TRIGGER_TYPES
qr_end2 = trigger_types2
print(f'QR return at {qr_return2}, end at {qr_end2}')

raw = raw[:qr_return2 + 1] + new_qr_return + raw[qr_end2:]

# Recalculate
trigger_types3 = raw.find(b'const TRIGGER_TYPES')
auto_start3 = raw.find(b'const AutomationsManager')
abandoned_start3 = raw.find(b'const AbandonedCartsManager')
analytics_start3 = raw.find(b'const AnalyticsDashboard')
tpl_start3 = raw.find(b'const TemplatesManager')

print(f'After QR fix: size={len(raw)}, TRIGGER_TYPES at {trigger_types3}, auto at {auto_start3}')

# 3. Replace AutomationsManager return block
auto_return3 = raw.find(b'\n    return (', auto_start3)
# End of AutomationsManager = just before const AbandonedCartsManager
auto_end3 = abandoned_start3
print(f'Auto return at {auto_return3}, end at {auto_end3}')

raw = raw[:auto_return3 + 1] + new_auto_return + b';\n};\n\n' + raw[auto_end3:]

# Recalculate
analytics_start4 = raw.find(b'const AnalyticsDashboard')
tpl_start4 = raw.find(b'const TemplatesManager')

print(f'After Auto fix: size={len(raw)}, analytics at {analytics_start4}')

# 4. Replace AnalyticsDashboard return block (but need to keep loading/empty states before return)
# The loading check is before the main return
# Find the main return (not the loading return)
# The main return is after if(!data)... return
analytics_main_return = raw.rfind(b'\n    return (', analytics_start4, raw.find(b'export default App'))
print(f'Analytics main return at {analytics_main_return}')
analytics_end4 = raw.find(b'export default App')

raw = raw[:analytics_main_return + 1] + new_analytics_return + b';\n};\n\n' + raw[analytics_end4:]

# 5. Replace TemplatesManager return block
tpl_start5 = raw.find(b'const TemplatesManager')
tpl_return5 = raw.find(b'\n    return (', tpl_start5)
shopify_start5 = raw.find(b'const ShopifyOrders')
print(f'Templates return at {tpl_return5}, shopify at {shopify_start5}')

raw = raw[:tpl_return5 + 1] + new_tpl_return + b';\n};\n\n' + raw[shopify_start5:]

try:
    raw.decode('utf-8')
    print('UTF-8 valid')
except Exception as e:
    print(f'UTF-8 ERROR: {e}')

with open(filepath, 'wb') as f:
    f.write(raw)
print(f'Final size: {len(raw)}')
print('All done!')
