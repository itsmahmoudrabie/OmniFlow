import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ── 1. Notification + Search components (inject before App component) ─────────
COMPONENTS = r'''
// ── Professional notification sound (Web Audio API) ──────────────────────────
const playNotifSound = (type = 'message') => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const freqs = type === 'order'
            ? [[660, 880, 0.12], [880, 1100, 0.12]]   // two rising tones for orders
            : [[880, 660, 0.10], [1320, 880, 0.10]];   // descending chime for messages
        freqs.forEach(([from, to, dur], i) => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(from, ctx.currentTime + i * 0.13);
            osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + i * 0.13 + dur);
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.13);
            gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.13 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + dur + 0.3);
            osc.start(ctx.currentTime + i * 0.13);
            osc.stop(ctx.currentTime + i * 0.13 + dur + 0.35);
        });
    } catch(e) {}
};

// ── Notification Center ───────────────────────────────────────────────────────
const NotificationCenter = ({ notifications, onRead, onClear, onNavigate, lang }) => {
    const isEn = lang === 'en';
    const unread = notifications.filter(n => !n.read).length;

    const iconFor = (type) => {
        if (type === 'order')    return <ShoppingCart size={13} className="text-brand-accent" />;
        if (type === 'cart')     return <RefreshCcw size={13} className="text-brand-gold" />;
        if (type === 'message')  return <MessageCircle size={13} className="text-blue-400" />;
        return <Zap size={13} className="text-brand-muted" />;
    };

    const timeAgo = (iso) => {
        const d = Math.floor((Date.now() - new Date(iso)) / 1000);
        if (d < 60)   return isEn ? `${d}s ago` : `منذ ${d}ث`;
        if (d < 3600) return isEn ? `${Math.floor(d/60)}m ago` : `منذ ${Math.floor(d/60)}د`;
        return isEn ? `${Math.floor(d/3600)}h ago` : `منذ ${Math.floor(d/3600)}س`;
    };

    return (
        <div className="absolute top-full mt-2 right-0 w-80 glass rounded-2xl shadow-2xl z-50 overflow-hidden border border-brand-border/20 animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border/15">
                <div className="flex items-center gap-2">
                    <Bell size={14} className="text-brand-accent" />
                    <span className="text-[12px] font-black text-brand-egg">{isEn ? 'Notifications' : 'الإشعارات'}</span>
                    {unread > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-brand-accent text-brand-bg">{unread}</span>}
                </div>
                {notifications.length > 0 && (
                    <button onClick={onClear} className="text-[10px] text-brand-muted hover:text-brand-accent font-bold transition-colors">
                        {isEn ? 'Clear all' : 'مسح الكل'}
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-brand-border/10">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-brand-muted opacity-50">
                        <Bell size={28} className="mb-2 opacity-30" />
                        <p className="text-xs font-bold">{isEn ? 'All caught up!' : 'لا توجد إشعارات'}</p>
                    </div>
                ) : notifications.map(n => (
                    <div key={n.id} onClick={() => { onRead(n.id); onNavigate(n.tab); }}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.04] transition-colors ${!n.read ? 'bg-brand-accent/5' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${!n.read ? 'bg-brand-accent/15' : 'bg-brand-border/20'}`}>
                            {iconFor(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-brand-egg truncate">{n.title}</p>
                            <p className="text-[11px] text-brand-muted leading-relaxed mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-[9px] text-brand-muted/60 mt-1">{timeAgo(n.time)}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-brand-accent shrink-0 mt-1.5" />}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Global Search ─────────────────────────────────────────────────────────────
const GlobalSearch = ({ inbox, orders, quickReplies, navItems, onNavigate, onOpenChat, onClose, lang }) => {
    const isEn = lang === 'en';
    const [q, setQ] = React.useState('');
    const inputRef = React.useRef(null);

    React.useEffect(() => { inputRef.current?.focus(); }, []);

    // Keyboard: Escape to close
    React.useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    const results = React.useMemo(() => {
        if (!q.trim() || q.length < 2) return [];
        const ql = q.toLowerCase();
        const out = [];

        // Navigation
        navItems.filter(n => n.label.toLowerCase().includes(ql)).forEach(n => {
            out.push({ type: 'nav', icon: n.icon, title: n.label, sub: isEn ? 'Go to section' : 'اذهب إلى القسم', action: () => { onNavigate(n.id); onClose(); } });
        });

        // Chats
        (inbox || []).filter(c => c.name?.toLowerCase().includes(ql) || c.phone?.includes(ql)).slice(0,4).forEach(c => {
            const lastMsg = c.messages?.[c.messages.length-1]?.text || '';
            out.push({ type: 'chat', icon: MessageCircle, title: c.name || c.phone, sub: lastMsg || c.phone, action: () => { onOpenChat(c.phone); onNavigate('chat'); onClose(); } });
        });

        // Orders
        (orders || []).filter(o => {
            const name = `${o.customer?.first_name||''} ${o.customer?.last_name||''}`.toLowerCase();
            return name.includes(ql) || String(o.order_number||'').includes(ql) || String(o.id||'').includes(ql);
        }).slice(0,4).forEach(o => {
            const name = `${o.customer?.first_name||''} ${o.customer?.last_name||''}`.trim() || '—';
            out.push({ type: 'order', icon: ShoppingCart, title: `#${o.order_number || o.id}`, sub: `${name} · EGP ${o.total_price || 0}`, action: () => { onNavigate('shop'); onClose(); } });
        });

        // Quick Replies
        (quickReplies || []).filter(r => r.title?.toLowerCase().includes(ql) || r.text?.toLowerCase().includes(ql)).slice(0,3).forEach(r => {
            out.push({ type: 'reply', icon: MessageSquareQuote, title: `/${r.title}`, sub: r.text, action: () => { onNavigate('quick-replies'); onClose(); } });
        });

        return out;
    }, [q, inbox, orders, quickReplies, navItems, isEn]);

    const typeLabel = { nav: isEn?'Navigation':'تنقل', chat: isEn?'Chats':'محادثات', order: isEn?'Orders':'طلبات', reply: isEn?'Quick Replies':'ردود سريعة' };
    const typeColor = { nav: 'text-brand-accent', chat: 'text-blue-400', order: 'text-brand-gold', reply: 'text-purple-400' };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" style={{background:'rgba(0,0,0,0.6)'}} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-xl glass rounded-2xl shadow-2xl overflow-hidden border border-brand-border/20 animate-in slide-in-from-top-4 fade-in duration-200">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-brand-border/15">
                    <Search size={16} className="text-brand-accent shrink-0" />
                    <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
                        placeholder={isEn ? 'Search chats, orders, features...' : 'ابحث في المحادثات، الطلبات، المزايا...'}
                        className="flex-1 bg-transparent text-sm outline-none text-brand-egg placeholder-brand-muted/50" />
                    <kbd className="text-[10px] text-brand-muted font-mono bg-brand-border/20 px-1.5 py-0.5 rounded">ESC</kbd>
                </div>

                {/* Results */}
                {q.length >= 2 && (
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {results.length === 0 ? (
                            <div className="flex flex-col items-center py-10 text-brand-muted opacity-50">
                                <Search size={24} className="mb-2 opacity-30" />
                                <p className="text-sm font-bold">{isEn ? 'No results' : 'لا توجد نتائج'}</p>
                            </div>
                        ) : (() => {
                            const groups = {};
                            results.forEach(r => { if (!groups[r.type]) groups[r.type] = []; groups[r.type].push(r); });
                            return Object.entries(groups).map(([type, items]) => (
                                <div key={type}>
                                    <p className="text-[9px] font-black text-brand-muted tracking-widest uppercase px-4 py-2 border-b border-brand-border/10">{typeLabel[type]}</p>
                                    {items.map((item, i) => (
                                        <button key={i} onClick={item.action}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.05] transition-colors text-left border-b border-brand-border/10 last:border-0">
                                            <div className={`w-7 h-7 rounded-lg glass flex items-center justify-center shrink-0 ${typeColor[type]}`}>
                                                <item.icon size={13} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[12px] font-bold ${typeColor[type]}`}>{item.title}</p>
                                                <p className="text-[11px] text-brand-muted truncate">{item.sub}</p>
                                            </div>
                                            <ChevronLeft size={13} className="text-brand-muted rotate-180 shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            ));
                        })()}
                    </div>
                )}

                {q.length < 2 && (
                    <div className="px-4 py-4 grid grid-cols-2 gap-2">
                        {[
                            { label: isEn?'Chats':'محادثات', id:'chat', icon: MessageCircle, color:'text-blue-400' },
                            { label: isEn?'Orders':'الطلبات', id:'shop', icon: ShoppingCart, color:'text-brand-gold' },
                            { label: isEn?'Broadcasts':'البث', id:'campaigns', icon: Megaphone, color:'text-brand-accent' },
                            { label: isEn?'Analytics':'التقارير', id:'logs', icon: Calendar, color:'text-purple-400' },
                        ].map(s => (
                            <button key={s.id} onClick={() => { onNavigate(s.id); onClose(); }}
                                className="flex items-center gap-2.5 px-3 py-2.5 glass-subtle rounded-xl text-[11px] font-bold text-brand-muted hover:text-brand-egg transition-colors border border-brand-border/15">
                                <s.icon size={13} className={s.color} />
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
'''

# ── 2. Read file ──────────────────────────────────────────────────────────────
with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()
raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
text = raw.decode('utf-8', errors='replace')

# ── 3. Inject components before the App function ─────────────────────────────
# Find "const App = " or "function App("
inject_before = 'const App = () => {'
if inject_before not in text:
    inject_before = 'function App('
text = text.replace(inject_before, COMPONENTS + '\n' + inject_before, 1)

# ── 4. Add Bell icon to lucide imports ───────────────────────────────────────
text = text.replace(
    '    Brain\n} from',
    '    Brain,\n    Bell\n} from',
)

# ── 5. Add state + refs + logic in App component (after existing useEffect) ──
# Find the polling useEffect and add notification state before it
notif_state = r'''
    // ── Notifications + Search state ────────────────────────────────────────
    const [notifications, setNotifications] = React.useState([]);
    const [showNotifs, setShowNotifs] = React.useState(false);
    const [showSearch, setShowSearch] = React.useState(false);
    const [quickRepliesGlobal, setQuickRepliesGlobal] = React.useState([]);
    const prevInboxLen = React.useRef(0);
    const prevOrdersLen = React.useRef(0);
    const notifIdRef = React.useRef(0);

    const addNotif = React.useCallback((type, title, body, tab) => {
        const id = ++notifIdRef.current;
        setNotifications(p => [{ id, type, title, body, tab, time: new Date().toISOString(), read: false }, ...p].slice(0, 50));
        playNotifSound(type);
        if (Notification?.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
    }, []);

    // Global keyboard shortcut Ctrl+K / Cmd+K
    React.useEffect(() => {
        const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(p => !p); } };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);

    // Load quick replies for global search
    React.useEffect(() => {
        axios.get(`${API_URL}/quick-replies`).then(r => setQuickRepliesGlobal(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    }, []);

    // Request notification permission
    React.useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    }, []);

'''

# Insert after "const [branding, setBranding] = useState" state line
insert_after_marker = "    const [isConfigured, setIsConfigured] = useState(true);"
text = text.replace(insert_after_marker, insert_after_marker + '\n' + notif_state, 1)

# ── 6. Hook into the polling to detect new items ─────────────────────────────
# Replace the polling interval to also fire notifications
old_interval = '''        const interval = setInterval(() => {
            fetchInbox();
            fetchOrders();
            fetchAbandonedCarts();
        }, 5000);'''

new_interval = '''        const interval = setInterval(async () => {
            const prevI = prevInboxLen.current;
            const prevO = prevOrdersLen.current;
            await fetchInbox();
            await fetchOrders();
            await fetchAbandonedCarts();
            // Detect new inbox messages
            setInbox(cur => {
                const newLen = cur.length;
                if (prevI > 0 && newLen > prevI) {
                    const newest = cur[0];
                    addNotif('message', newest?.name || newest?.phone || 'New message',
                        newest?.messages?.[newest.messages.length-1]?.text || '...', 'chat');
                }
                prevInboxLen.current = newLen;
                return cur;
            });
            setOrders(cur => {
                const newLen = cur.length;
                if (prevO > 0 && newLen > prevO) {
                    const newest = cur[0];
                    addNotif('order',
                        `New order #${newest?.order_number || newest?.id}`,
                        `${newest?.customer?.first_name || ''} · EGP ${newest?.total_price || 0}`, 'shop');
                }
                prevOrdersLen.current = newLen;
                return cur;
            });
        }, 5000);'''

text = text.replace(old_interval, new_interval, 1)

# ── 7. Replace the TopBar header with new header (search + notifications) ────
old_header = '''                    <div className="flex items-center gap-2">
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
                    </div>'''

new_header = r'''                    <div className="flex items-center gap-2">
                        {/* Global Search trigger */}
                        <button onClick={() => setShowSearch(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl glass-subtle border border-brand-border/30 text-[11px] font-bold text-brand-muted hover:text-brand-egg hover:border-brand-accent/30 transition-all">
                            <Search size={13} className="text-brand-accent" />
                            <span className="hidden sm:inline">{lang === 'en' ? 'Search...' : 'بحث...'}</span>
                            <kbd className="hidden sm:inline text-[9px] font-mono bg-brand-border/30 px-1.5 py-0.5 rounded text-brand-muted/70">⌘K</kbd>
                        </button>

                        {/* Train assistant */}
                        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-subtle border border-brand-border/30 text-[11px] font-bold text-brand-egg-mute hover:border-brand-accent/30 transition-all">
                            <Brain size={13} className="text-brand-accent" />
                            {lang === 'en' ? 'Train assistant' : 'تدريب المساعد'}
                        </button>

                        {/* Notifications bell */}
                        <div className="relative">
                            <button onClick={() => setShowNotifs(p => !p)}
                                className="relative flex items-center justify-center w-9 h-9 rounded-xl glass-subtle border border-brand-border/30 hover:border-brand-accent/30 transition-all">
                                <Bell size={15} className={notifications.some(n=>!n.read) ? 'text-brand-accent' : 'text-brand-muted'} />
                                {notifications.filter(n=>!n.read).length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-accent text-[9px] font-black text-brand-bg flex items-center justify-center">
                                        {Math.min(notifications.filter(n=>!n.read).length, 9)}
                                    </span>
                                )}
                            </button>
                            {showNotifs && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                                    <div className="relative z-50">
                                        <NotificationCenter
                                            notifications={notifications}
                                            lang={lang}
                                            onRead={id => setNotifications(p => p.map(n => n.id===id ? {...n,read:true} : n))}
                                            onClear={() => { setNotifications([]); setShowNotifs(false); }}
                                            onNavigate={tab => { setActiveTab(tab); setShowNotifs(false); }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* AI toggle */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-subtle border border-brand-border/30">
                            <span className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-brand-accent shadow-[0_0_6px_#8CC850]' : 'bg-brand-muted'}`}></span>
                            <span className="text-[11px] font-bold text-brand-egg-mute">{lang === 'en' ? 'AI Auto-Reply' : 'الرد التلقائي'}</span>
                            <span className="text-[11px] font-bold text-brand-accent">·</span>
                            <span className={`text-[11px] font-bold ${aiEnabled ? 'text-brand-accent' : 'text-brand-muted'}`}>{aiEnabled ? (lang === 'en' ? 'ON' : 'مفعل') : (lang === 'en' ? 'OFF' : 'معطل')}</span>
                            <button onClick={toggleAI}
                                className={`w-9 h-[18px] rounded-full relative transition-all duration-300 ${aiEnabled ? 'bg-brand-accent shadow-[0_0_8px_rgba(140,200,80,0.35)]' : 'bg-brand-muted/30'}`}>
                                <div className={`absolute top-[3px] w-3 h-3 rounded-full bg-white transition-all duration-300 ${lang === 'en' ? (aiEnabled ? 'right-[3px]' : 'left-[3px]') : (aiEnabled ? 'left-[3px]' : 'right-[3px]')}`} />
                            </button>
                        </div>
                    </div>
                    {/* Global Search overlay */}
                    {showSearch && (
                        <GlobalSearch
                            inbox={inbox} orders={orders} quickReplies={quickRepliesGlobal}
                            navItems={navItems}
                            onNavigate={tab => setActiveTab(tab)}
                            onOpenChat={phone => { setActiveChatPhone(phone); setActiveTab('chat'); }}
                            onClose={() => setShowSearch(false)}
                            lang={lang}
                        />
                    )}'''

text = text.replace(old_header, new_header, 1)

# ── 8. Write back ─────────────────────────────────────────────────────────────
with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(text.encode('utf-8'))

print('Done.')
