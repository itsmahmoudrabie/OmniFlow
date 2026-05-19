import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

NEW_CODE = r'''
// ── Analytics helpers ────────────────────────────────────────────────────────
const Sparkline = ({ values = [], color = '#8CC850', width = 80, height = 32 }) => {
    if (!values.length) return <svg width={width} height={height} />;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1 || 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

const StackedBarChart = ({ data = [], isEn }) => {
    if (!data.length) return (
        <div className="flex items-center justify-center h-48 text-brand-muted text-xs opacity-40">
            {isEn ? 'No data yet' : 'لا توجد بيانات'}
        </div>
    );
    const max = Math.max(...data.map(d => (d.carts || 0) + (d.broadcasts || 0) + (d.direct || 0)), 1);
    const H = 160;
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-end gap-[3px]" style={{ height: H }}>
                {data.map((d, i) => {
                    const total = (d.carts || 0) + (d.broadcasts || 0) + (d.direct || 0);
                    const totalH = (total / max) * H;
                    return (
                        <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: H }}>
                            <div className="flex flex-col rounded-t-sm overflow-hidden" style={{ height: totalH }}>
                                <div style={{ flex: d.direct || 0, background: '#93C5FD', minHeight: d.direct > 0 ? 1 : 0 }} title={`Direct: ${d.direct}`} />
                                <div style={{ flex: d.broadcasts || 0, background: '#FF6B35', minHeight: d.broadcasts > 0 ? 1 : 0 }} title={`Broadcasts: ${d.broadcasts}`} />
                                <div style={{ flex: d.carts || 0, background: '#8CC850', minHeight: d.carts > 0 ? 1 : 0 }} title={`Recovered carts: ${d.carts}`} />
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between">
                {[data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].filter(Boolean).map((d, i) => (
                    <span key={i} className="text-[9px] text-brand-muted">{d.label}</span>
                ))}
            </div>
        </div>
    );
};

const DonutChart = ({ segments = [], total = 0, size = 120 }) => {
    const r = 44;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    const colors = ['#8CC850', '#93C5FD', '#FF6B35', '#6B7280'];
    return (
        <svg width={size} height={size}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a2e20" strokeWidth="16" />
            {segments.map((seg, i) => {
                const pct = total > 0 ? seg.value / total : 0;
                const dash = pct * circumference;
                const gap = circumference - dash;
                const el = (
                    <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                        stroke={colors[i % colors.length]} strokeWidth="16"
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={-offset}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
                );
                offset += dash;
                return el;
            })}
            <text x={cx} y={cy - 6} textAnchor="middle" className="fill-brand-egg" style={{ fontSize: 18, fontWeight: 900, fill: '#e8f5e9' }}>{total.toLocaleString()}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: '#5a7a60', letterSpacing: '0.05em' }}>CHATS</text>
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
                        {totalChats > 0 ? (
                            <DonutChart segments={donutSegments} total={totalChats} size={130} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-brand-muted opacity-40">
                                <div className="w-24 h-24 rounded-full border-4 border-brand-border/20 flex items-center justify-center">
                                    <span className="text-xs font-bold">0</span>
                                </div>
                            </div>
                        )}
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
'''

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()

raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
lines = raw.split(b'\n')

# Replace from BarChart helper through end of AnalyticsDashboard
helper_start = next(i for i,l in enumerate(lines) if b'const BarChart' in l or b'const FunnelBar' in l)
ana_start = next(i for i,l in enumerate(lines) if b'const AnalyticsDashboard' in l)
ana_end = next((i for i,l in enumerate(lines) if i > ana_start+5 and (b'const Templates' in l or b'const ShopifyOrders' in l or b'function App' in l or b'const App ' in l or b'export default' in l)), len(lines))

# Use helper_start as the replacement begin
replace_start = helper_start
replace_end = ana_end

new_lines = lines[:replace_start] + [NEW_CODE.encode('utf-8')] + lines[replace_end:]
result = b'\n'.join(new_lines)

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(result)

print(f'Done. Replaced lines {replace_start}-{replace_end}. Total lines: {len(new_lines)}')
