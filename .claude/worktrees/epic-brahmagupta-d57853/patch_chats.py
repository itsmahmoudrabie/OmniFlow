import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()

raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
text = raw.decode('utf-8', errors='replace')

# ── 1. Left panel: fix width and filter tabs on one row ─────────────────────
text = text.replace(
    'className={`w-80 flex flex-col glass rounded-2xl overflow-hidden shrink-0`}',
    'className="flex flex-col glass rounded-2xl overflow-hidden shrink-0" style={{width:272}}'
)

# Filter tabs: flex-wrap → flex gap-1 nowrap, smaller padding
text = text.replace(
    '<div className="flex flex-wrap gap-1.5">',
    '<div className="flex gap-1 overflow-x-auto">',
    1  # only first occurrence (the filter tabs one)
)

# Make each filter tab button smaller
text = text.replace(
    "className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${chatFilter === f.id ? 'bg-brand-accent text-brand-bg' : 'bg-brand-bg/60 text-brand-muted hover:bg-brand-accent/10 border border-brand-accent/10'}`}",
    "className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${chatFilter === f.id ? 'bg-brand-accent text-brand-bg' : 'bg-white/5 text-brand-muted hover:bg-brand-accent/10 border border-brand-border/20'}`}"
)

# ── 2. Right panel: fix loyalty points (use real LTV-based only, no fake multiplier) ──
text = text.replace(
    '<span className="font-bold text-brand-accent">{(customerOrders.length * 120 + Math.floor(customerLTV / 10)).toLocaleString()}</span>',
    '<span className="font-bold text-brand-accent">{customerOrders.length > 0 ? Math.floor(customerLTV / 10).toLocaleString() : "—"}</span>'
)

# ── 3. Fix recent items quantity display: أ—{qty} → ×{qty} ──────────────────
text = text.replace(
    '<span className="text-[10px] text-brand-muted font-mono shrink-0">أ—{qty}</span>',
    '<span className="text-[10px] text-brand-muted font-bold shrink-0">×{qty}</span>'
)
text = text.replace(
    '<span className="text-[10px] text-brand-muted shrink-0">أ—{o.line_items?.[0]?.quantity || 1}</span>',
    '<span className="text-[10px] text-brand-muted font-bold shrink-0">×{o.line_items?.[0]?.quantity || 1}</span>'
)

# ── 4. Recent items panel: show always (not just when !showTeamPanel) ────────
text = text.replace(
    '{customerOrders.length > 0 && !showTeamPanel && (',
    '{customerOrders.length > 0 && ('
)

# ── 5. Right panel: improve RECENT ITEMS header style ───────────────────────
text = text.replace(
    '<p className="text-[10px] font-mono text-brand-muted tracking-wider uppercase">{isEn ? \'RECENT ITEMS\' : \'العناصر الأخيرة\'}</p>',
    '<p className="text-[10px] font-bold text-brand-muted tracking-widest uppercase mb-1">{isEn ? \'RECENT ITEMS\' : \'آخر المنتجات\'}</p>'
)

# ── 6. Recent items: show product name + quantity better ─────────────────────
text = text.replace(
    "<div key={i} className=\"flex items-center gap-3 py-2\">\n                                    <div className=\"w-10 h-10 rounded-lg bg-brand-green-soft border border-brand-border/50 flex items-center justify-center shrink-0\">\n                                        <Package size={16} className=\"text-brand-accent\" />\n                                    </div>\n                                    <div className=\"flex-1 min-w-0\">\n                                        <p className=\"text-xs font-bold text-brand-text truncate\">{o.line_items?.[0]?.name || `Order #${o.order_number || o.id}`}</p>\n                                    </div>\n                                    <span className=\"text-[10px] text-brand-muted font-bold shrink-0\">×{o.line_items?.[0]?.quantity || 1}</span>\n                                </div>",
    "<div key={i} className=\"flex items-center gap-3 py-2.5\">\n                                    <div className=\"w-9 h-9 rounded-xl glass border border-brand-border/30 flex items-center justify-center shrink-0\">\n                                        <Package size={14} className=\"text-brand-accent\" />\n                                    </div>\n                                    <div className=\"flex-1 min-w-0\">\n                                        <p className=\"text-[12px] font-bold text-brand-egg truncate\">{o.line_items?.[0]?.name || `Order #${o.order_number || o.id}`}</p>\n                                    </div>\n                                    <span className=\"text-[10px] text-brand-muted font-bold shrink-0\">×{o.line_items?.[0]?.quantity || 1}</span>\n                                </div>"
)

# ── 7. VIP badge: show when ≥2 orders (not ≥3) ──────────────────────────────
text = text.replace(
    '{customerOrders.length >= 3 && (',
    '{customerOrders.length >= 2 && ('
)

# ── 8. Chat header: "Tag" button style improvement ──────────────────────────
text = text.replace(
    '<Star size={14} /> {isEn ? \'Tag\' : \'تصنيف\'}',
    '<Star size={13} /> {isEn ? \'Tag VIP\' : \'VIP\'}'
)

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(text.encode('utf-8'))

print('Done.')
