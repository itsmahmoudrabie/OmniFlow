import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

filepath = r'dashboard-react\src\App.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')

# Replace lines 1982-2203 (0-indexed: 1981-2202)
BEFORE = '\n'.join(lines[:1981])
AFTER  = '\n'.join(lines[2203:])

NEW_BLOCK = """
    const [selectedCamp, setSelectedCamp] = React.useState(null);

    const mockCamps = [
        { id:'m1', name: isEn ? 'Eid Drop · 2026'        : 'حملة العيد · 2026',       date: isEn ? 'Now · 3h running' : 'الآن · منذ 3 ساعات', sent:12840, open:76, reply:24, revenue:184200, status:'live',   color:'#FF6400', tpl:'t_eid_25',    tplMsg: isEn ? 'Eid Mubarak, {first_name} 🌙\\nOur Eid drop just landed. 24 new pieces. Members get 15% off — use EID15 at checkout.' : 'عيد مبارك {first_name} 🌙\\nتشكيلة العيد وصلت. 24 قطعة جديدة. خصم 15% لأعضاء الكلوب.', btn1: isEn ? 'Shop the drop' : 'تسوق الآن', btn2: isEn ? 'Catalogue' : 'الكتالوج' },
        { id:'m2', name: isEn ? 'New Linen Capsule'       : 'تشكيلة الكتان الجديدة',    date: isEn ? 'Yesterday'       : 'أمس',             sent:8420,  open:71, reply:18, revenue:92400,  status:'live',   color:'#8CC850', tpl:'t_linen_12',  tplMsg: isEn ? 'New arrivals are here, {first_name} 👗\\nFresh linen pieces, limited stock.' : 'وصلت التشكيلة الجديدة {first_name} 👗\\nقطع كتان جديدة، كميات محدودة.', btn1: isEn ? 'Shop now' : 'تسوق الآن', btn2: isEn ? 'View all' : 'عرض الكل' },
        { id:'m3', name: isEn ? 'VIP Early Access · May' : 'وصول مبكر VIP · مايو',   date: isEn ? 'May 12'          : '12 مايو',           sent:420,   open:94, reply:52, revenue:38200,  status:'live',   color:'#2D5A3D', tpl:'t_vip_07',    tplMsg: isEn ? "You're VIP, {first_name} ⭐\\nExclusive early access to our May drop — 24 hours before everyone else." : 'أنت VIP {first_name} ⭐\\nوصول حصري مبكر لتشكيلة مايو — 24 ساعة قبل الجميع.', btn1: isEn ? 'Access now' : 'ادخل الآن', btn2: isEn ? 'Learn more' : 'اعرف أكثر' },
        { id:'m4', name: isEn ? "Mother's Day Flash"      : 'فلاش عيد الأم',            date: isEn ? 'May 09'          : '9 مايو',            sent:6210,  open:82, reply:21, revenue:74800,  status:'paused', color:'#C4A882', tpl:'t_mom_03',    tplMsg: isEn ? "Happy Mother's Day, {first_name} 💐\\nSurprise her with something special. Free gift wrapping today only." : 'عيد أم سعيد {first_name} 💐\\nفاجئيها بشيء مميز. تغليف هدية مجاني اليوم فقط.', btn1: isEn ? 'Shop gifts' : 'تسوق الهدايا', btn2: isEn ? 'Gift guide' : 'دليل الهدايا' },
        { id:'m5', name: isEn ? 'Cart Recovery · Auto'  : 'استرداد السلة · تلقائي',   date: isEn ? 'Ongoing'         : 'مستمر',         sent:2840,  open:88, reply:42, revenue:12640,  status:'live',   color:'#FF9B7A', tpl:'t_cart_01',   tplMsg: isEn ? 'You left something behind, {first_name} 🛒\\nYour cart is waiting. Complete your order and get free shipping.' : 'نسيت حاجة {first_name} 🛒\\nسلتك لسه في الانتظار. أكمل طلبك واحصل على شحن مجاني.', btn1: isEn ? 'Complete order' : 'أكمل الطلب', btn2: isEn ? 'View cart' : 'عرض السلة' },
        { id:'m6', name: isEn ? 'Spring Catalogue Reveal' : 'كشف كتالوج الربيع',        date: isEn ? 'Apr 28'          : '28 أبريل',          sent:15640, open:64, reply:12, revenue:124800, status:'paused', color:'#34D399', tpl:'t_spring_09', tplMsg: isEn ? 'Spring is here, {first_name} 🌸\\nOur full spring catalogue is now live. 60+ new styles.' : 'الربيع وصل {first_name} 🌸\\nكتالوج الربيع متاح الآن. أكثر من 60 موديل جديد.', btn1: isEn ? 'Browse now' : 'تصفح الآن', btn2: isEn ? 'New arrivals' : 'الجديد' },
    ];

    const liveCamps   = mockCamps.filter(c => c.status === 'live');
    const pausedCamps = mockCamps.filter(c => c.status === 'paused');
    const filteredDisplay = campaignFilter === 'live' ? liveCamps : campaignFilter === 'paused' ? pausedCamps : campaignFilter === 'draft' ? [] : mockCamps;
    const displayCamps = scheduledList.length > 0
        ? (campaignFilter === 'live' ? scheduledList.filter(c => c.status === 'running') : scheduledList)
        : filteredDisplay;
    const previewCamp = selectedCamp || mockCamps[0];

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
                    { label: isEn ? 'SENT · 30D'         : 'المُرسَل · 30 يوم', value: '56,420',       sub: '↑ 18%',      subC:'text-brand-accent' },
                    { label: isEn ? 'OPEN RATE'          : 'معدل الفتح',          value: '78.4%',        sub: '↑ 4.2 pts',  subC:'text-brand-accent' },
                    { label: isEn ? 'REPLY RATE'         : 'معدل الرد',           value: '22.1%',        sub: '↑ 1.8 pts',  subC:'text-brand-accent' },
                    { label: isEn ? 'REVENUE ATTRIBUTED' : 'الإيرادات المحققة',   value: 'EGP 412,840',  sub: '↑ EGP 84k', subC:'text-brand-gold', gold:true },
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
                                { k:'all',    label: isEn?'All':'الكل',     count: mockCamps.length },
                                { k:'live',   label: isEn?'Live':'نشط',   count: liveCamps.length,   dot:true },
                                { k:'paused', label: isEn?'Paused':'موقوف', count: pausedCamps.length },
                                { k:'draft',  label: isEn?'Draft':'مسودة',  count: 0 },
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
                            <div className="flex items-center justify-center h-32 text-brand-muted text-sm">
                                {isEn ? 'No campaigns in this filter' : 'لا توجد حملات'}
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
                            {isEn ? 'DRAFT' : 'مسودة'} · {(previewCamp?.name||'').replace(/[؀-ۿ]/g,'').trim().toUpperCase().slice(0,14)||previewCamp?.name?.slice(0,14)}
                        </span>
                    </div>

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
                                            {(previewCamp?.name||'EID DROP').toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="px-3 py-2.5">
                                        <p className="text-[12px] text-brand-egg leading-relaxed whitespace-pre-line">
                                            {previewCamp?.tplMsg || (isEn ? 'Select a campaign to preview.' : 'اختر حملة للمعاينة.')}
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
                </div>
            </div>
        </div>
    );
};
"""

new_text = BEFORE + NEW_BLOCK + '\n' + AFTER

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(new_text)

print(f'Done. Lines: {new_text.count(chr(10))}')
