import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()
raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
text = raw.decode('utf-8', errors='replace')

NEW_ONBOARDING = r'''const OnboardingScreen = ({ lang, onLangChange, onComplete }) => {
    const isEn = lang === 'en';
    const [step, setStep] = React.useState(0); // 0=welcome, 1=whatsapp, 2=shopify, 3=done
    const [saving, setSaving] = React.useState(false);
    const [testing, setTesting] = React.useState({});
    const [testResult, setTestResult] = React.useState({});
    const [errors, setErrors] = React.useState({});
    const [show, setShow] = React.useState({});
    const [form, setForm] = React.useState({
        business_name: '', access_token: '', phone_number_id: '',
        verify_token: '', shopify_url: '', shopify_access_token: '',
        gemini_api_key: '', server_url: ''
    });

    const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: null })); };
    const toggleShow = (k) => setShow(p => ({ ...p, [k]: !p[k] }));

    const validate1 = () => {
        const e = {};
        if (!form.business_name.trim()) e.business_name = isEn ? 'Required' : 'مطلوب';
        if (!form.access_token.trim()) e.access_token = isEn ? 'Required' : 'مطلوب';
        if (!form.phone_number_id.trim()) e.phone_number_id = isEn ? 'Required' : 'مطلوب';
        if (!form.verify_token.trim()) e.verify_token = isEn ? 'Required' : 'مطلوب';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const testWhatsApp = async () => {
        if (!form.access_token || !form.phone_number_id) return;
        setTesting(p => ({ ...p, wa: true }));
        setTestResult(p => ({ ...p, wa: null }));
        try {
            const res = await axios.post(`${API_URL}/config/test-whatsapp`, {
                access_token: form.access_token,
                phone_number_id: form.phone_number_id
            });
            setTestResult(p => ({ ...p, wa: { ok: true, msg: res.data?.name || (isEn ? 'Connected!' : 'تم الاتصال!') } }));
        } catch (e) {
            setTestResult(p => ({ ...p, wa: { ok: false, msg: e.response?.data?.error || (isEn ? 'Connection failed' : 'فشل الاتصال') } }));
        }
        setTesting(p => ({ ...p, wa: false }));
    };

    const testShopify = async () => {
        if (!form.shopify_url || !form.shopify_access_token) return;
        setTesting(p => ({ ...p, sh: true }));
        setTestResult(p => ({ ...p, sh: null }));
        try {
            const res = await axios.post(`${API_URL}/config/test-shopify`, {
                shopify_url: form.shopify_url,
                shopify_access_token: form.shopify_access_token
            });
            setTestResult(p => ({ ...p, sh: { ok: true, msg: res.data?.shop || (isEn ? 'Connected!' : 'تم الاتصال!') } }));
        } catch (e) {
            setTestResult(p => ({ ...p, sh: { ok: false, msg: e.response?.data?.error || (isEn ? 'Connection failed' : 'فشل الاتصال') } }));
        }
        setTesting(p => ({ ...p, sh: false }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post(`${API_URL}/config/setup`, form);
            setStep(3);
        } catch (e) { alert(isEn ? 'Save failed!' : 'فشل الحفظ!'); }
        setSaving(false);
    };

    const Field = ({ k, label, placeholder, hint, secret, optional }) => (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-brand-text flex items-center gap-1">
                    {label}
                    {!optional && <span className="text-red-400">*</span>}
                    {optional && <span className="text-[10px] text-brand-muted font-normal ml-1">({isEn ? 'optional' : 'اختياري'})</span>}
                </label>
                {errors[k] && <span className="text-[10px] text-red-400 font-bold">{errors[k]}</span>}
            </div>
            {hint && <p className="text-[10px] text-brand-muted leading-relaxed">{hint}</p>}
            <div className="relative" dir="ltr">
                <input
                    type={show[k] ? 'text' : (secret ? 'password' : 'text')}
                    value={form[k]}
                    onChange={e => set(k, e.target.value)}
                    placeholder={placeholder}
                    className={`w-full bg-brand-input rounded-xl px-4 py-2.5 text-sm outline-none pr-10 text-left transition-all ${errors[k] ? 'border-2 border-red-400/60' : 'border border-brand-accent/20 focus:border-brand-accent'}`}
                />
                {secret && (
                    <button type="button" onClick={() => toggleShow(k)} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-accent">
                        {show[k] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                )}
            </div>
        </div>
    );

    const steps = [
        { id: 0, label: isEn ? 'Welcome' : 'مرحباً' },
        { id: 1, label: isEn ? 'WhatsApp' : 'واتساب' },
        { id: 2, label: isEn ? 'Shopify' : 'شوبيفاي' },
        { id: 3, label: isEn ? 'Done' : 'تم' },
    ];

    const serverUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const webhookUrl = `${serverUrl}/webhooks/whatsapp`;

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4" dir={isEn ? 'ltr' : 'rtl'}>
            <div className="w-full max-w-lg space-y-5">

                {/* Header */}
                <div className="text-center space-y-3 relative">
                    <button onClick={() => onLangChange(isEn ? 'ar' : 'en')}
                        className="absolute top-0 left-0 px-3 py-1.5 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-bold hover:bg-brand-accent/20 transition-all">
                        {isEn ? 'عربي' : 'English'}
                    </button>
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <OmniFlowMark size={36} />
                        <h1 className="text-2xl font-bold text-brand-egg">Omni<span className="font-light">Flow</span></h1>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-1">
                    {steps.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${step === s.id ? 'bg-brand-accent text-brand-bg' : step > s.id ? 'text-brand-accent' : 'text-brand-muted'}`}>
                                {step > s.id ? <CheckCircle size={11} /> : <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[8px]">{s.id + 1}</span>}
                                {s.label}
                            </div>
                            {i < steps.length - 1 && <div className={`flex-1 h-px transition-all ${step > i ? 'bg-brand-accent' : 'bg-brand-border/30'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Card */}
                <div className="glass rounded-2xl overflow-hidden border border-brand-border/20">

                    {/* ── STEP 0: Welcome ─────────────────────────────── */}
                    {step === 0 && (
                        <div className="p-8 space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center mx-auto border border-brand-accent/20">
                                    <ShieldCheck size={28} className="text-brand-accent" />
                                </div>
                                <h2 className="text-xl font-black text-brand-egg">{isEn ? 'Welcome to OmniFlow' : 'أهلاً بك في OmniFlow'}</h2>
                                <p className="text-sm text-brand-muted">{isEn ? 'Setup takes about 5 minutes. Here\'s what you\'ll need:' : 'الإعداد يأخذ حوالي 5 دقائق. ستحتاج إلى:'}</p>
                            </div>
                            <div className="space-y-3">
                                {[
                                    {
                                        icon: '💬', title: isEn ? 'WhatsApp Business API' : 'واتساب Business API',
                                        desc: isEn ? 'A Meta Business account with WhatsApp Cloud API access' : 'حساب Meta Business مع صلاحية WhatsApp Cloud API',
                                        link: 'https://developers.facebook.com', linkText: isEn ? 'Open Meta Developers →' : 'افتح Meta Developers →'
                                    },
                                    {
                                        icon: '🛒', title: isEn ? 'Shopify Store (Optional)' : 'متجر Shopify (اختياري)',
                                        desc: isEn ? 'Your Shopify store URL and a private app access token' : 'رابط متجر Shopify وتوكن الوصول',
                                        link: 'https://admin.shopify.com', linkText: isEn ? 'Open Shopify Admin →' : 'افتح Shopify Admin →'
                                    },
                                    {
                                        icon: '🤖', title: isEn ? 'AI Key (Optional)' : 'مفتاح AI (اختياري)',
                                        desc: isEn ? 'Gemini API key for AI auto-replies (free tier available)' : 'مفتاح Gemini API للرد الآلي (متاح مجاناً)',
                                        link: 'https://aistudio.google.com/app/apikey', linkText: isEn ? 'Get free Gemini key →' : 'احصل على مفتاح Gemini مجاني →'
                                    },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-brand-card/50 border border-brand-border/20">
                                        <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-brand-egg">{item.title}</p>
                                            <p className="text-[11px] text-brand-muted mt-0.5">{item.desc}</p>
                                            <a href={item.link} target="_blank" rel="noreferrer"
                                                className="text-[11px] text-brand-accent font-bold hover:underline mt-1 inline-block">{item.linkText}</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setStep(1)}
                                className="w-full bg-brand-accent text-brand-bg py-3 rounded-xl font-bold hover:opacity-90 transition-all text-sm">
                                {isEn ? "Let's start →" : 'هيا نبدأ ←'}
                            </button>
                        </div>
                    )}

                    {/* ── STEP 1: WhatsApp ─────────────────────────────── */}
                    {step === 1 && (
                        <div className="p-7 space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-brand-border/15">
                                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                    <span className="text-lg">💬</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-brand-egg text-sm">{isEn ? 'WhatsApp Business Setup' : 'إعداد واتساب Business'}</h3>
                                    <a href="https://business.facebook.com/settings/whatsapp-business-accounts" target="_blank" rel="noreferrer"
                                        className="text-[10px] text-brand-accent hover:underline font-bold">
                                        {isEn ? 'Open Meta Business Manager →' : 'افتح Meta Business Manager →'}
                                    </a>
                                </div>
                            </div>

                            <Field k="business_name" label={isEn ? 'Business Name' : 'اسم البيزنس'}
                                placeholder={isEn ? 'My Store' : 'متجري'}
                                hint={isEn ? 'Appears in the app header and outgoing messages' : 'يظهر في الهيدر وفي الرسائل الصادرة'} />

                            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">{isEn ? 'Where to find these:' : 'من أين تحصل عليهم:'}</p>
                                <p className="text-[10px] text-brand-muted">Meta Business → WhatsApp → API Setup → <span className="text-brand-egg font-bold">API credentials</span></p>
                            </div>

                            <Field k="access_token" label="Meta Access Token" placeholder="EAAVXdh..." secret
                                hint={isEn ? 'Permanent token from Meta WhatsApp API Setup page' : 'التوكن الدائم من صفحة Meta WhatsApp API Setup'} />
                            <Field k="phone_number_id" label="Phone Number ID" placeholder="1032753703264445"
                                hint={isEn ? 'The numeric ID next to your WhatsApp number' : 'الرقم التعريفي بجانب رقم واتساب الخاص بك'} />
                            <Field k="verify_token" label="Webhook Verify Token" placeholder="my_secret_2025"
                                hint={isEn ? 'A secret word you choose — you\'ll enter it in Meta Webhook settings' : 'كلمة سر تختارها أنت — ستُدخلها في إعدادات Webhook في Meta'} />

                            {/* Test connection */}
                            <div className="flex items-center gap-3">
                                <button onClick={testWhatsApp} disabled={testing.wa || !form.access_token || !form.phone_number_id}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-accent/30 text-brand-accent text-xs font-bold hover:bg-brand-accent/10 disabled:opacity-40 transition-all">
                                    {testing.wa ? <RefreshCcw size={12} className="animate-spin" /> : <Zap size={12} />}
                                    {isEn ? 'Test Connection' : 'اختبر الاتصال'}
                                </button>
                                {testResult.wa && (
                                    <span className={`text-[11px] font-bold flex items-center gap-1 ${testResult.wa.ok ? 'text-brand-accent' : 'text-red-400'}`}>
                                        {testResult.wa.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                        {testResult.wa.msg}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-xl border border-brand-border/30 text-brand-muted text-sm font-bold hover:text-brand-egg transition-all">
                                    {isEn ? '← Back' : 'رجوع →'}
                                </button>
                                <button onClick={() => { if (validate1()) setStep(2); }}
                                    className="flex-1 bg-brand-accent text-brand-bg py-2.5 rounded-xl font-bold hover:opacity-90 transition-all text-sm">
                                    {isEn ? 'Next: Shopify →' : 'التالي: Shopify ←'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Shopify + AI ─────────────────────────── */}
                    {step === 2 && (
                        <div className="p-7 space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-brand-border/15">
                                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                    <span className="text-lg">🛒</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-brand-egg text-sm">{isEn ? 'Shopify & AI (Optional)' : 'Shopify والذكاء الاصطناعي (اختياري)'}</h3>
                                    <p className="text-[10px] text-brand-muted">{isEn ? 'Skip if you don\'t have a Shopify store yet' : 'تخطَّ إذا لم يكن لديك متجر Shopify بعد'}</p>
                                </div>
                            </div>

                            {/* Shopify OAuth button */}
                            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-3">
                                <p className="text-xs font-black text-brand-egg">{isEn ? 'Connect Shopify' : 'ربط Shopify'}</p>
                                <a href={`${serverUrl}/auth/shopify`}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#96BF48] text-white text-sm font-bold hover:opacity-90 transition-all">
                                    <ShoppingCart size={15} />
                                    {isEn ? 'Connect with Shopify (OAuth)' : 'ربط مع Shopify تلقائياً'}
                                </a>
                                <p className="text-[10px] text-brand-muted text-center">{isEn ? '— or enter credentials manually below —' : '— أو أدخل البيانات يدوياً أدناه —'}</p>
                            </div>

                            <Field k="shopify_url" label={isEn ? 'Store URL' : 'رابط المتجر'} optional
                                placeholder="my-store.myshopify.com"
                                hint={isEn ? 'Your Shopify store domain' : 'دومين متجر Shopify الخاص بك'} />
                            <Field k="shopify_access_token" label="Admin API Token" placeholder="shpat_..." secret optional
                                hint={isEn ? 'From Shopify Admin → Settings → Apps → Develop apps' : 'من Shopify Admin → الإعدادات → التطبيقات → طوّر تطبيقات'} />

                            {/* Test Shopify */}
                            {(form.shopify_url || form.shopify_access_token) && (
                                <div className="flex items-center gap-3">
                                    <button onClick={testShopify} disabled={testing.sh || !form.shopify_url || !form.shopify_access_token}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-accent/30 text-brand-accent text-xs font-bold hover:bg-brand-accent/10 disabled:opacity-40 transition-all">
                                        {testing.sh ? <RefreshCcw size={12} className="animate-spin" /> : <Zap size={12} />}
                                        {isEn ? 'Test Shopify' : 'اختبر Shopify'}
                                    </button>
                                    {testResult.sh && (
                                        <span className={`text-[11px] font-bold flex items-center gap-1 ${testResult.sh.ok ? 'text-brand-accent' : 'text-red-400'}`}>
                                            {testResult.sh.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {testResult.sh.msg}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                <p className="text-[10px] font-black text-purple-400 mb-1">{isEn ? 'AI Auto-Reply (Free)' : 'الرد الآلي بالذكاء الاصطناعي (مجاني)'}</p>
                                <Field k="gemini_api_key" label="Gemini API Key" placeholder="AIzaSy..." secret optional
                                    hint="" />
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                                    className="text-[10px] text-purple-400 font-bold hover:underline mt-1 inline-block">
                                    {isEn ? 'Get free key from Google AI Studio →' : 'احصل على مفتاح مجاني من Google AI Studio →'}
                                </a>
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl border border-brand-border/30 text-brand-muted text-sm font-bold hover:text-brand-egg transition-all">
                                    {isEn ? '← Back' : 'رجوع →'}
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    className="flex-1 bg-brand-accent text-brand-bg py-2.5 rounded-xl font-bold hover:opacity-90 transition-all text-sm disabled:opacity-50">
                                    {saving ? <RefreshCcw size={14} className="animate-spin mx-auto" /> : (isEn ? 'Save & Launch App →' : 'حفظ وتشغيل التطبيق ←')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Done ─────────────────────────────────── */}
                    {step === 3 && (
                        <div className="p-8 space-y-5 text-center">
                            <div className="w-16 h-16 bg-brand-accent/20 rounded-full flex items-center justify-center mx-auto border-2 border-brand-accent">
                                <CheckCircle size={32} className="text-brand-accent" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-brand-egg">{isEn ? 'You\'re all set!' : 'كل شيء جاهز!'}</h2>
                                <p className="text-sm text-brand-muted mt-1">{isEn ? 'One last step — connect your WhatsApp Webhook' : 'خطوة أخيرة — اربط الـ Webhook في Meta'}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-brand-card/60 border border-brand-border/20 text-left space-y-3">
                                <p className="text-xs font-black text-brand-egg">{isEn ? 'Set this Webhook URL in Meta:' : 'أضف هذا الرابط في إعدادات Webhook في Meta:'}</p>
                                <div className="flex items-center gap-2" dir="ltr">
                                    <code className="flex-1 text-[11px] bg-brand-input rounded-lg px-3 py-2 text-brand-accent font-mono break-all">{webhookUrl}</code>
                                    <button onClick={() => navigator.clipboard?.writeText(webhookUrl)}
                                        className="shrink-0 p-2 rounded-lg bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 transition-all">
                                        <Copy size={13} />
                                    </button>
                                </div>
                                <ol className={`text-[11px] text-brand-muted space-y-1 list-decimal ${isEn ? 'pl-4' : 'pr-4'}`}>
                                    <li>{isEn ? 'Go to Meta Developers → your app → WhatsApp → Configuration' : 'افتح Meta Developers → تطبيقك → WhatsApp → Configuration'}</li>
                                    <li>{isEn ? 'Paste the URL above in "Callback URL"' : 'الصق الرابط أعلاه في "Callback URL"'}</li>
                                    <li>{isEn ? 'Enter your Verify Token (the one you set in step 2)' : 'أدخل الـ Verify Token اللي حددته في الخطوة السابقة'}</li>
                                    <li>{isEn ? 'Subscribe to: messages, messaging_postbacks' : 'اشترك في: messages, messaging_postbacks'}</li>
                                </ol>
                                <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-brand-accent/30 text-brand-accent text-xs font-bold hover:bg-brand-accent/10 transition-all">
                                    <ExternalLink size={12} />
                                    {isEn ? 'Open Meta Developers' : 'افتح Meta Developers'}
                                </a>
                            </div>
                            <button onClick={() => onComplete(form.business_name)}
                                className="w-full bg-brand-accent text-brand-bg py-3 rounded-xl font-black hover:opacity-90 transition-all">
                                {isEn ? 'Open OmniFlow Dashboard →' : 'افتح لوحة تحكم OmniFlow ←'}
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-[10px] text-brand-muted">{isEn ? 'Settings saved securely on your server' : 'الإعدادات محفوظة بأمان على سيرفرك'}</p>
            </div>
        </div>
    );
};'''

# Find and replace OnboardingScreen
start = text.find('const OnboardingScreen = (')
if start == -1:
    print('ERROR: OnboardingScreen not found')
    sys.exit(1)

# Find end: next top-level const/function after it
end = text.find('\nconst ', start + 10)
if end == -1:
    end = len(text)

old = text[start:end]
text = text[:start] + NEW_ONBOARDING + '\n\n' + text[end:]
print(f'Replaced OnboardingScreen ({len(old)} chars -> {len(NEW_ONBOARDING)} chars)')

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(text.encode('utf-8'))
print('Done.')
