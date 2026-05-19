import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

filepath = r'dashboard-react\src\App.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')

# Lines 2414-2748 (0-indexed: 2413-2747) = AutomationsManager
BEFORE = '\n'.join(lines[:2413])
AFTER  = '\n'.join(lines[2748:])

NEW_COMPONENT = r"""
const AutomationsManager = ({ templates, showToast, lang }) => {
    const isEn = lang === 'en';
    const [automations, setAutomations] = useState([]);
    const [queue, setQueue] = useState([]);
    const [saving, setSaving] = useState(false);
    const [selectedFlow, setSelectedFlow] = React.useState(null);
    const [selectedStep, setSelectedStep] = React.useState(null);
    const [showNewModal, setShowNewModal] = React.useState(false);
    const [newForm, setNewForm] = React.useState({ name: '', trigger: 'order_created' });

    const fetchData = async () => {
        try {
            const [ar, qr] = await Promise.all([
                axios.get(`${API_URL}/automations`),
                axios.get(`${API_URL}/automations/queue`)
            ]);
            setAutomations(Array.isArray(ar.data) ? ar.data : []);
            setQueue(Array.isArray(qr.data) ? qr.data : []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleToggle = async (id) => {
        try {
            await axios.patch(`${API_URL}/automations/${id}/toggle`);
            await fetchData();
        } catch (e) { showToast(isEn ? 'Toggle failed' : 'فشل التبديل', 'error'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(isEn ? 'Delete this flow?' : 'حذف هذا الفلو؟')) return;
        try {
            await axios.delete(`${API_URL}/automations/${id}`);
            if (selectedFlow?.id === id) setSelectedFlow(null);
            await fetchData();
            showToast(isEn ? 'Deleted' : 'تم الحذف');
        } catch (e) { showToast(isEn ? 'Delete failed' : 'فشل الحذف', 'error'); }
    };

    const handleCreate = async () => {
        if (!newForm.name.trim()) return showToast(isEn ? 'Name required' : 'الاسم مطلوب', 'error');
        setSaving(true);
        try {
            await axios.post(`${API_URL}/automations`, {
                name: newForm.name,
                trigger: { type: newForm.trigger, value: '' },
                steps: [{ wait_hours: 0, action: 'send_text', text: '' }]
            });
            await fetchData();
            setShowNewModal(false);
            setNewForm({ name: '', trigger: 'order_created' });
            showToast(isEn ? 'Flow created!' : 'تم إنشاء الفلو!');
        } catch (e) { showToast(isEn ? 'Failed to create' : 'فشل الإنشاء', 'error'); }
        setSaving(false);
    };

    // Build flow steps based on trigger type (for visual canvas)
    const getFlowSteps = (auto) => {
        const trig = auto?.trigger?.type || 'order_created';
        if (trig === 'order_created' || trig === 'order_status_changed') return [
            { id:'s1', type:'TRIGGER', icon:'⚡', color:'#FF6400', title: isEn?'Trigger':'المشغّل',        sub: isEn?'New Shopify order':'طلب شوبيفاي جديد',      tpl:null,          lang:null,  vars:null,        btns:null,        sendAt:null, delivered:null, seen:null },
            { id:'s2', type:'ACTION',  icon:'💬', color:'#8CC850', title: isEn?'Send WA':'إرسال WA',        sub: isEn?'Template · t_confirm_25 with buttons':'قالب · t_confirm_25 مع أزرار', tpl:'t_confirm_25', lang:'ar + en', vars:'{name} · {order_id} · {total}', btns:'2 quick-reply', sendAt:isEn?'Immediately':'فوراً', delivered:'99.4%', seen:'84%' },
            { id:'s3', type:'BRANCH',  icon:'🔀', color:'#60A5FA', title: isEn?'Wait for reply':'انتظر رد', sub: isEn?'If confirmed · 24h':'إذا أُكد · 24 ساعة',  tpl:null,          lang:null,  vars:null,        btns:null,        sendAt:null, delivered:'91%', seen:null },
            { id:'s4', type:'ACTION',  icon:'✅', color:'#8CC850', title: isEn?'Mark confirmed':'تأكيد الطلب', sub: isEn?'Update Shopify status · Tag VIP':'تحديث حالة شوبيفاي · وسم VIP', tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:null, seen:null },
            { id:'s5', type:'ACTION',  icon:'⭐', color:'#F59E0B', title: isEn?'Award loyalty':'نقاط ولاء',  sub: isEn?'+ {total /10} points':'+ {total /10} نقطة', tpl:null,          lang:null,  vars:null,        btns:null,        sendAt:null, delivered:null, seen:null },
            { id:'s6', type:'ACTION',  icon:'🚚', color:'#8CC850', title: isEn?'Trigger ship flow':'تشغيل فلو الشحن', sub: isEn?'Hand off to fulfilment':'تحويل للتوصيل', tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:null, seen:null },
        ];
        if (trig === 'keyword_received') return [
            { id:'s1', type:'TRIGGER', icon:'⚡', color:'#FF6400', title: isEn?'Trigger':'المشغّل',          sub: isEn?'Keyword received':'كلمة مفتاحية',          tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:null, seen:null },
            { id:'s2', type:'ACTION',  icon:'💬', color:'#8CC850', title: isEn?'Send WA reply':'إرسال رد WA',  sub: isEn?'Auto-reply template':'قالب رد تلقائي',     tpl:'t_keyword_01', lang:'ar + en', vars:'{name}', btns:'1 quick-reply', sendAt:isEn?'Immediately':'فوراً', delivered:'97%', seen:'79%' },
            { id:'s3', type:'ACTION',  icon:'🏷️', color:'#A78BFA', title: isEn?'Tag contact':'وسم جهة الاتصال', sub: isEn?'Tag: interested':'وسم: مهتم',           tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:null, seen:null },
        ];
        return [
            { id:'s1', type:'TRIGGER', icon:'⚡', color:'#FF6400', title: isEn?'Trigger':'المشغّل',          sub: isEn?'New message received':'رسالة جديدة',        tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:null, seen:null },
            { id:'s2', type:'ACTION',  icon:'🧠', color:'#8CC850', title: isEn?'Classify intent':'تصنيف النية', sub: isEn?'AI intent detection':'كشف النية بالذكاء', tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:'95%', seen:null },
            { id:'s3', type:'ACTION',  icon:'👤', color:'#34D399', title: isEn?'Route to agent':'توجيه لموظف', sub: isEn?'Assign to available agent':'توجيه لموظف متاح', tpl:null, lang:null, vars:null, btns:null, sendAt:null, delivered:null, seen:null },
        ];
    };

    const liveFlows   = automations.filter(a => a.enabled);
    const flowSteps   = selectedFlow ? getFlowSteps(selectedFlow) : [];
    const activeStep  = selectedStep || (flowSteps[1] || null);
    const stepIndex   = flowSteps.findIndex(s => s.id === activeStep?.id);
    const triggerLabels = {
        order_created:        isEn ? 'ORDER PLACED → CONFIRM → SHIP → FOLLOW UP' : 'طلب → تأكيد → شحن → متابعة',
        order_status_changed: isEn ? 'STATUS CHANGE → NOTIFY → TAG → FOLLOW UP'  : 'تغيير حالة → إشعار → وسم → متابعة',
        keyword_received:     isEn ? 'KEYWORD → REPLY → TAG → QUALIFY'            : 'كلمة مفتاحية → رد → وسم → تأهيل',
        new_message:          isEn ? 'MESSAGE → CLASSIFY → ROUTE → RESPOND'       : 'رسالة → تصنيف → توجيه → رد',
    };
    const flowBreadcrumb = selectedFlow
        ? (triggerLabels[selectedFlow.trigger?.type] || triggerLabels.order_created)
        : '';
    const runCount = (a) => queue.filter(q => q.automation_id === a.id).length || a.runs || 0;

    return (
        <div className={`flex flex-col gap-3 animate-in fade-in duration-500 ${isEn ? 'text-left' : 'text-right'}`} style={{height:'calc(100vh - 120px)'}}>

            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-brand-egg">{isEn ? 'Automations' : 'الأتمتة'}</h2>
                    <p className="text-[11px] font-bold tracking-wider mt-0.5" style={{color:'#8CC850'}}>
                        {flowBreadcrumb || (isEn ? 'SELECT A FLOW TO VIEW CANVAS' : 'اختر فلو لعرض اللوحة')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        {liveFlows.length} {isEn ? 'active' : 'نشط'}
                    </span>
                    <button onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{background:'#FF6400', color:'white'}}>
                        <Zap size={13} /> {isEn ? 'New flow' : 'فلو جديد'}
                    </button>
                </div>
            </div>

            {/* 3-column layout */}
            <div className="grid flex-1 gap-3 min-h-0" style={{gridTemplateColumns:'220px 1fr 300px'}}>

                {/* ── Left: Flows list ── */}
                <div className="glass rounded-2xl flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-brand-border/20 shrink-0">
                        <span className="text-sm font-black text-brand-egg">{isEn ? 'Flows' : 'الفلوز'} </span>
                        <span className="text-[11px] text-brand-muted font-bold">{liveFlows.length} / {automations.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-brand-border/10">
                        {automations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center text-brand-muted">
                                <Zap size={32} className="opacity-20" />
                                <p className="text-xs font-bold">{isEn ? 'No flows yet' : 'لا توجد فلوز بعد'}</p>
                                <button onClick={() => setShowNewModal(true)}
                                    className="text-xs font-bold text-brand-accent hover:underline">
                                    + {isEn ? 'Create first flow' : 'أنشئ أول فلو'}
                                </button>
                            </div>
                        ) : automations.map(a => {
                            const isSelected = selectedFlow?.id === a.id;
                            const runs = runCount(a);
                            return (
                                <div key={a.id} onClick={() => { setSelectedFlow(a); setSelectedStep(null); }}
                                     className={`px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors ${isSelected ? 'bg-brand-accent/5 border-l-2 border-brand-accent' : ''}`}>
                                    <div className="flex items-start justify-between gap-1">
                                        <p className={`text-[13px] font-bold leading-tight ${isSelected ? 'text-brand-egg' : 'text-brand-egg-mute'}`}>{a.name}</p>
                                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${a.enabled ? 'bg-green-400' : 'bg-brand-border'}`}></span>
                                    </div>
                                    <p className="text-[11px] text-brand-muted mt-0.5">{runs.toLocaleString()} {isEn ? 'runs · 30d' : 'تشغيل · 30 يوم'}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Middle: Visual canvas ── */}
                <div className="glass rounded-2xl flex flex-col overflow-hidden">
                    {selectedFlow ? (<>
                        {/* Canvas header */}
                        <div className="px-5 py-3 border-b border-brand-border/20 shrink-0 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-bold text-brand-muted tracking-wider">
                                    {selectedFlow.name.toUpperCase()} · v1 · {selectedFlow.enabled ? (isEn?'LIVE':'مباشر') : (isEn?'PAUSED':'موقوف')}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleToggle(selectedFlow.id)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${selectedFlow.enabled ? 'border-brand-gold/40 text-brand-gold bg-brand-gold/10' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
                                    {selectedFlow.enabled ? (isEn?'Pause':'إيقاف') : (isEn?'Activate':'تفعيل')}
                                </button>
                                <button onClick={() => handleDelete(selectedFlow.id)}
                                    className="px-3 py-1 rounded-full text-[11px] font-bold border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
                                    {isEn?'Delete':'حذف'}
                                </button>
                            </div>
                        </div>

                        {/* Flow canvas */}
                        <div className="flex-1 overflow-auto custom-scrollbar p-6" style={{background:'rgba(0,0,0,0.15)'}}>
                            {/* Row 1: steps 1-3 */}
                            <div className="flex items-center gap-0 mb-8">
                                {flowSteps.slice(0, 3).map((step, idx) => (
                                    <React.Fragment key={step.id}>
                                        {idx > 0 && (
                                            <div className="flex items-center shrink-0 px-1">
                                                <div className="flex items-center gap-0.5 text-brand-muted text-[11px]">
                                                    <span style={{letterSpacing:'-2px'}}>·····</span>
                                                    <span>→</span>
                                                </div>
                                            </div>
                                        )}
                                        <div onClick={() => setSelectedStep(step)}
                                             className={`cursor-pointer rounded-2xl p-4 transition-all shrink-0 w-[155px] ${activeStep?.id === step.id ? 'ring-2 ring-brand-accent' : 'hover:bg-white/5'}`}
                                             style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)'}}>
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded"
                                                      style={{background: step.color + '22', color: step.color}}>
                                                    {step.type}
                                                </span>
                                            </div>
                                            <p className="text-xs font-black text-brand-egg leading-tight">{step.title}</p>
                                            <p className="text-[11px] text-brand-muted mt-1 leading-snug">{step.sub}</p>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Branch arrow down */}
                            {flowSteps.length > 3 && (
                                <div className="flex ml-[77px] mb-3">
                                    <div className="flex flex-col items-center text-brand-muted text-[11px]">
                                        <span>·</span><span>·</span><span>·</span>
                                        <span>↓</span>
                                    </div>
                                </div>
                            )}

                            {/* Row 2: steps 4-6 */}
                            {flowSteps.length > 3 && (
                                <div className="flex items-center gap-0 ml-[40px]">
                                    {flowSteps.slice(3).map((step, idx) => (
                                        <React.Fragment key={step.id}>
                                            {idx > 0 && (
                                                <div className="flex items-center shrink-0 px-1">
                                                    <div className="flex items-center gap-0.5 text-brand-muted text-[11px]">
                                                        <span style={{letterSpacing:'-2px'}}>·····</span>
                                                        <span>→</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div onClick={() => setSelectedStep(step)}
                                                 className={`cursor-pointer rounded-2xl p-4 transition-all shrink-0 w-[155px] ${activeStep?.id === step.id ? 'ring-2 ring-brand-accent' : 'hover:bg-white/5'}`}
                                                 style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)'}}>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <span className="text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded"
                                                          style={{background: step.color + '22', color: step.color}}>
                                                        {step.type}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-black text-brand-egg leading-tight">{step.title}</p>
                                                <p className="text-[11px] text-brand-muted mt-1 leading-snug">{step.sub}</p>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-brand-muted p-8 text-center">
                            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-2">
                                <Zap size={28} className="opacity-30" />
                            </div>
                            <p className="text-sm font-bold text-brand-egg-mute">{isEn ? 'Select a flow to view its canvas' : 'اختر فلو لعرض لوحته'}</p>
                            <p className="text-xs">{isEn ? 'Or create a new flow to get started.' : 'أو أنشئ فلو جديد للبدء.'}</p>
                        </div>
                    )}
                </div>

                {/* ── Right: Step properties ── */}
                <div className="glass rounded-2xl flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-brand-border/20 shrink-0">
                        <span className="text-[12px] font-black text-brand-egg">{isEn ? 'Step properties' : 'خصائص الخطوة'} </span>
                        {activeStep && <span className="text-[10px] font-bold text-brand-muted">{stepIndex + 1} {isEn ? 'OF' : 'من'} {flowSteps.length}</span>}
                    </div>

                    {activeStep ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                            <div>
                                <p className="text-[11px] font-black text-brand-egg">{isEn ? 'Send WhatsApp template' : 'إرسال قالب واتساب'}</p>
                            </div>
                            {[
                                { label: isEn?'TEMPLATE':'القالب',  value: activeStep.tpl },
                                { label: isEn?'LANGUAGE':'اللغة',   value: activeStep.lang },
                                { label: isEn?'VARIABLES':'المتغيرات', value: activeStep.vars },
                                { label: isEn?'BUTTONS':'الأزرار',  value: activeStep.btns },
                                { label: isEn?'SEND AT':'الإرسال في', value: activeStep.sendAt },
                            ].filter(f => f.value).map((f,i) => (
                                <div key={i}>
                                    <p className="text-[9px] font-bold text-brand-muted tracking-wider mb-1">{f.label}</p>
                                    <div className="px-3 py-2 rounded-xl text-[12px] font-bold text-brand-egg"
                                         style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)'}}>
                                        {f.value}
                                    </div>
                                </div>
                            ))}

                            {(activeStep.delivered || activeStep.seen) && (
                                <div>
                                    <p className="text-[9px] font-bold text-brand-muted tracking-wider mb-2">{isEn ? 'STEP STATS · 30D' : 'إحصائيات الخطوة · 30 يوم'}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeStep.delivered && (
                                            <div className="glass-subtle rounded-xl p-3 text-center">
                                                <p className="text-[9px] font-bold text-brand-muted mb-1">{isEn?'DELIVERED':'تم الإرسال'}</p>
                                                <p className="text-xl font-black text-brand-egg">{activeStep.delivered}</p>
                                            </div>
                                        )}
                                        {activeStep.seen && (
                                            <div className="glass-subtle rounded-xl p-3 text-center">
                                                <p className="text-[9px] font-bold text-brand-muted mb-1">{isEn?'SEEN':'شُوهد'}</p>
                                                <p className="text-xl font-black text-brand-egg">{activeStep.seen}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-1">
                                <button className="flex-1 py-2 rounded-xl border border-brand-border/30 text-[12px] font-bold text-brand-muted hover:text-brand-egg hover:border-brand-accent/30 transition-all">
                                    {isEn ? 'Test step' : 'اختبار'}
                                </button>
                                <button className="flex-1 py-2 rounded-xl text-[12px] font-bold text-brand-bg transition-all"
                                        style={{background:'#8CC850'}}>
                                    {isEn ? 'Save' : 'حفظ'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-brand-muted p-4 text-center">
                            <p className="text-xs font-bold">{selectedFlow ? (isEn?'Click a node to see its properties':'اضغط على خطوة لعرض خصائصها') : (isEn?'Select a flow first':'اختر فلو أولاً')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New flow modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowNewModal(false)}>
                    <div className="glass rounded-2xl p-6 w-80 space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-black text-brand-egg">{isEn ? 'New Flow' : 'فلو جديد'}</h3>
                        <div>
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider">{isEn?'FLOW NAME':'اسم الفلو'}</label>
                            <input value={newForm.name} onChange={e => setNewForm(p=>({...p,name:e.target.value}))}
                                placeholder={isEn?'e.g. Order confirmation':'مثال: تأكيد الطلب'}
                                className="w-full mt-1 bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-accent text-brand-egg" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-brand-muted tracking-wider">{isEn?'TRIGGER':'المشغّل'}</label>
                            <select value={newForm.trigger} onChange={e => setNewForm(p=>({...p,trigger:e.target.value}))}
                                className="w-full mt-1 bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2 text-sm outline-none text-brand-egg">
                                <option value="order_created">{isEn?'New Order Created':'طلب جديد'}</option>
                                <option value="order_status_changed">{isEn?'Order Status Changed':'تغيير حالة الطلب'}</option>
                                <option value="keyword_received">{isEn?'Keyword Received':'كلمة مفتاحية'}</option>
                                <option value="new_message">{isEn?'Any New Message':'أي رسالة جديدة'}</option>
                            </select>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setShowNewModal(false)}
                                className="flex-1 py-2 rounded-xl border border-brand-border/30 text-sm font-bold text-brand-muted">
                                {isEn?'Cancel':'إلغاء'}
                            </button>
                            <button onClick={handleCreate} disabled={saving}
                                className="flex-1 py-2 rounded-xl text-sm font-bold text-brand-bg disabled:opacity-50"
                                style={{background:'#FF6400'}}>
                                {saving ? '...' : (isEn?'Create':'إنشاء')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
"""

new_text = BEFORE + '\n' + NEW_COMPONENT + '\n' + AFTER

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(new_text)

print(f'Done. Lines: {new_text.count(chr(10))}')
