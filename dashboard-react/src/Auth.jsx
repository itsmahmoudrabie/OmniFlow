import React from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : `${window.location.origin}/api`;

// ── Pricing data ──────────────────────────────────────────────────────────────
const PLANS = [
    {
        id: 'starter', nameEn: 'Starter', nameAr: 'المبتدئ',
        price: 29, priceEGP: 1450,
        color: '#8CC850', bgColor: 'rgba(140,200,80,0.08)',
        features: [
            { en: '1,000 conversations/month', ar: '1,000 محادثة / شهر' },
            { en: '1 WhatsApp number',         ar: 'رقم واتساب واحد' },
            { en: '2 team members',            ar: 'عضوان في الفريق' },
            { en: 'Basic automations',         ar: 'أتمتة أساسية' },
            { en: 'Shopify integration',       ar: 'ربط Shopify' },
            { en: 'AI auto-reply',             ar: 'رد AI تلقائي' },
        ],
    },
    {
        id: 'growth', nameEn: 'Growth', nameAr: 'النمو',
        price: 79, priceEGP: 3950,
        color: '#FF6B35', bgColor: 'rgba(255,107,53,0.08)',
        popular: true,
        features: [
            { en: '5,000 conversations/month', ar: '5,000 محادثة / شهر' },
            { en: '3 WhatsApp numbers',        ar: '3 أرقام واتساب' },
            { en: '10 team members',           ar: '10 أعضاء في الفريق' },
            { en: 'Full automations + flows',  ar: 'أتمتة كاملة + flows' },
            { en: 'Broadcasts & campaigns',    ar: 'إرسال جماعي وحملات' },
            { en: 'Analytics dashboard',       ar: 'لوحة تحليلات' },
            { en: 'Loyalty program',           ar: 'برنامج ولاء' },
        ],
    },
    {
        id: 'pro', nameEn: 'Pro', nameAr: 'الاحترافي',
        price: 149, priceEGP: 7450,
        color: '#93C5FD', bgColor: 'rgba(147,197,253,0.08)',
        features: [
            { en: 'Unlimited conversations',   ar: 'محادثات غير محدودة' },
            { en: '10 WhatsApp numbers',       ar: '10 أرقام واتساب' },
            { en: 'Unlimited team members',    ar: 'فريق غير محدود' },
            { en: 'All Growth features',       ar: 'كل مزايا Growth' },
            { en: 'Priority support',          ar: 'دعم فني مميز' },
            { en: 'Custom AI instruction',     ar: 'تعليمات AI مخصصة' },
            { en: 'White-label option',        ar: 'خيار White-label' },
        ],
    },
    {
        id: 'enterprise', nameEn: 'Enterprise', nameAr: 'المؤسسات',
        price: null, priceEGP: null,
        color: '#A78BFA', bgColor: 'rgba(167,139,250,0.08)',
        features: [
            { en: 'Everything in Pro',         ar: 'كل مزايا Pro' },
            { en: 'Unlimited WhatsApp numbers',ar: 'أرقام واتساب غير محدودة' },
            { en: 'Dedicated account manager', ar: 'مدير حساب مخصص' },
            { en: 'Custom integrations',       ar: 'تكاملات مخصصة' },
            { en: 'SLA guarantee',             ar: 'ضمان SLA' },
        ],
    },
];

// ── Pricing Page ──────────────────────────────────────────────────────────────
export const PricingPage = ({ lang = 'ar', onSelectPlan, onLogin }) => {
    const isEn = lang === 'en';
    const [billing, setBilling] = React.useState('monthly');

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text" dir={isEn ? 'ltr' : 'rtl'}>
            {/* Nav */}
            <nav className="flex items-center justify-between px-8 py-5 border-b border-brand-border/20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                        <span className="text-brand-bg font-black text-sm">O</span>
                    </div>
                    <span className="font-black text-brand-egg text-lg">Omni<span className="font-light">Flow</span></span>
                </div>
                <button onClick={onLogin}
                    className="text-sm font-bold text-brand-muted hover:text-brand-egg transition-colors">
                    {isEn ? 'Already have an account? Sign in →' : 'لديك حساب؟ تسجيل الدخول ←'}
                </button>
            </nav>

            {/* Hero */}
            <div className="text-center py-16 px-4 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-bold mb-2">
                    ✦ {isEn ? '14-day free trial on all plans' : 'تجربة مجانية 14 يوم على جميع الباقات'}
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-brand-egg leading-tight">
                    {isEn ? 'Simple, transparent pricing' : 'أسعار واضحة وشفافة'}
                </h1>
                <p className="text-brand-muted text-lg max-w-xl mx-auto">
                    {isEn
                        ? 'Start free for 14 days. No charge until your trial ends. Cancel anytime.'
                        : 'ابدأ مجاناً لمدة 14 يوم. لا يتم الخصم حتى تنتهي التجربة. إلغاء في أي وقت.'}
                </p>
                <p className="text-xs text-brand-muted opacity-60">
                    {isEn ? '* Card required to start trial' : '* يشترط إدخال كارت صالح لبدء التجربة'}
                </p>
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto px-6 pb-20">
                {PLANS.map(plan => (
                    <div key={plan.id}
                        className={`relative rounded-2xl p-6 border transition-all flex flex-col ${plan.popular ? 'border-2' : 'border'}`}
                        style={{
                            background: plan.bgColor,
                            borderColor: plan.popular ? plan.color : 'rgba(255,255,255,0.08)',
                        }}>

                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black text-white"
                                style={{ background: plan.color }}>
                                {isEn ? '★ Most Popular' : '★ الأكثر طلباً'}
                            </div>
                        )}

                        <div className="mb-4">
                            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: plan.color }}>
                                {isEn ? plan.nameEn : plan.nameAr}
                            </p>
                            {plan.price ? (
                                <div>
                                    <div className="flex items-end gap-1">
                                        <span className="text-3xl font-black text-brand-egg">${plan.price}</span>
                                        <span className="text-brand-muted text-sm mb-1">/{isEn ? 'mo' : 'شهر'}</span>
                                    </div>
                                    <p className="text-xs text-brand-muted">≈ {plan.priceEGP.toLocaleString()} {isEn ? 'EGP' : 'جنيه'}</p>
                                </div>
                            ) : (
                                <div className="text-2xl font-black text-brand-egg">
                                    {isEn ? 'Custom' : 'سعر خاص'}
                                </div>
                            )}
                        </div>

                        <ul className="space-y-2 flex-1 mb-6">
                            {plan.features.map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-brand-muted">
                                    <span className="mt-0.5 shrink-0" style={{ color: plan.color }}>✓</span>
                                    {isEn ? f.en : f.ar}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => onSelectPlan(plan.id)}
                            className="w-full py-2.5 rounded-xl text-sm font-black transition-all hover:opacity-90"
                            style={{
                                background: plan.id === 'enterprise' ? 'transparent' : plan.color,
                                color: plan.id === 'enterprise' ? plan.color : '#001A11',
                                border: plan.id === 'enterprise' ? `2px solid ${plan.color}` : 'none',
                            }}>
                            {plan.id === 'enterprise'
                                ? (isEn ? 'Contact us' : 'تواصل معنا')
                                : (isEn ? 'Start free trial →' : 'ابدأ التجربة المجانية ←')}
                        </button>
                    </div>
                ))}
            </div>

            {/* FAQ strip */}
            <div className="border-t border-brand-border/20 py-10 px-6 max-w-4xl mx-auto">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                    {[
                        { q: isEn ? 'When will I be charged?' : 'متى يتم الخصم؟',
                          a: isEn ? 'After 14 days. We verify your card on sign-up but charge only when trial ends.' : 'بعد 14 يوم. نتحقق من الكارت عند التسجيل لكن الخصم بعد انتهاء التجربة.' },
                        { q: isEn ? 'Can I cancel anytime?' : 'هل أستطيع الإلغاء؟',
                          a: isEn ? 'Yes. Cancel before trial ends and pay nothing.' : 'نعم. ألغِ قبل انتهاء التجربة ولن تدفع شيئاً.' },
                        { q: isEn ? 'What payment methods?' : 'طرق الدفع المتاحة؟',
                          a: isEn ? 'Visa, Mastercard, Vodafone Cash, Fawry, Meeza — via PayMob.' : 'فيزا، ماستر كارد، فودافون كاش، فوري، ميزة — عبر PayMob.' },
                    ].map((item, i) => (
                        <div key={i} className="space-y-2">
                            <p className="text-sm font-black text-brand-egg">{item.q}</p>
                            <p className="text-xs text-brand-muted">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Register Page ─────────────────────────────────────────────────────────────
export const RegisterPage = ({ lang = 'ar', selectedPlan = 'starter', onSuccess, onBack, onLogin }) => {
    const isEn = lang === 'en';
    const plan = PLANS.find(p => p.id === selectedPlan) || PLANS[0];

    const [step, setStep] = React.useState(1); // 1=account, 2=payment
    const [form, setForm] = React.useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [tenant, setTenant] = React.useState(null);
    const [token, setToken] = React.useState('');
    const [iframeUrl, setIframeUrl] = React.useState('');

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword)
            return setError(isEn ? 'Passwords do not match' : 'كلمة المرور غير متطابقة');
        if (form.password.length < 8)
            return setError(isEn ? 'Password must be at least 8 characters' : 'كلمة المرور 8 أحرف على الأقل');

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/register`, {
                name: form.name, email: form.email,
                password: form.password, plan: selectedPlan,
            });
            setTenant(res.data.tenant);
            setToken(res.data.token);
            localStorage.setItem('omni_token', res.data.token);
            setStep(2);
            // Initiate PayMob
            const payRes = await axios.post(`${API_URL}/paymob/checkout`,
                { plan: selectedPlan },
                { headers: { Authorization: `Bearer ${res.data.token}` } }
            );
            setIframeUrl(payRes.data.iframeUrl);
        } catch (err) {
            setError(err.response?.data?.error || (isEn ? 'Registration failed' : 'فشل التسجيل'));
        }
        setLoading(false);
    };

    const handleSkipPayment = () => {
        // Allow entering app during trial without payment
        onSuccess(token, tenant);
    };

    const InputField = ({ k, label, type = 'text', placeholder }) => (
        <div className="space-y-1">
            <label className="text-xs font-bold text-brand-muted">{label}</label>
            <div dir="ltr">
                <input type={type} value={form[k]} onChange={e => set(k, e.target.value)}
                    placeholder={placeholder} required
                    className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-accent text-brand-egg text-left" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4" dir={isEn ? 'ltr' : 'rtl'}>
            <div className="w-full max-w-md space-y-5">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                            <span className="text-brand-bg font-black text-sm">O</span>
                        </div>
                        <span className="font-black text-brand-egg text-xl">Omni<span className="font-light">Flow</span></span>
                    </div>
                    <p className="text-brand-muted text-sm">
                        {isEn ? '14-day free trial · No charge today' : 'تجربة مجانية 14 يوم · لا يتم الخصم اليوم'}
                    </p>
                </div>

                {/* Selected plan badge */}
                <div className="flex items-center justify-between p-3 rounded-xl border"
                    style={{ background: plan.bgColor, borderColor: plan.color + '40' }}>
                    <div>
                        <p className="text-xs font-black" style={{ color: plan.color }}>
                            {isEn ? plan.nameEn : plan.nameAr}
                        </p>
                        <p className="text-[10px] text-brand-muted">{isEn ? '14-day free trial' : 'تجربة مجانية 14 يوم'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-brand-egg">${plan.price}<span className="text-brand-muted font-normal text-xs">/{isEn?'mo':'شهر'}</span></p>
                        <button onClick={onBack} className="text-[10px] text-brand-muted hover:text-brand-accent underline">
                            {isEn ? 'Change plan' : 'تغيير الباقة'}
                        </button>
                    </div>
                </div>

                {/* Steps */}
                <div className="flex items-center gap-2">
                    {[isEn?'Account':'الحساب', isEn?'Payment':'الدفع'].map((s, i) => (
                        <React.Fragment key={i}>
                            <div className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg transition-all ${step === i+1 ? 'bg-brand-accent text-brand-bg' : step > i+1 ? 'text-brand-accent' : 'text-brand-muted'}`}>
                                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px]">{i+1}</span>
                                {s}
                            </div>
                            {i === 0 && <div className={`flex-1 h-px ${step > 1 ? 'bg-brand-accent' : 'bg-brand-border/30'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step 1 — Account */}
                {step === 1 && (
                    <form onSubmit={handleRegister} className="glass rounded-2xl p-6 space-y-4">
                        <InputField k="name" label={isEn ? 'Full name' : 'الاسم الكامل'} placeholder={isEn ? 'Ahmed Mohamed' : 'أحمد محمد'} />
                        <InputField k="email" label={isEn ? 'Email' : 'البريد الإلكتروني'} type="email" placeholder="ahmed@company.com" />
                        <InputField k="password" label={isEn ? 'Password' : 'كلمة المرور'} type="password" placeholder="••••••••" />
                        <InputField k="confirmPassword" label={isEn ? 'Confirm password' : 'تأكيد كلمة المرور'} type="password" placeholder="••••••••" />

                        {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}

                        <button type="submit" disabled={loading}
                            className="w-full bg-brand-accent text-brand-bg py-3 rounded-xl font-black hover:opacity-90 transition-all disabled:opacity-50 text-sm">
                            {loading ? (isEn ? 'Creating account...' : 'جاري إنشاء الحساب...') : (isEn ? 'Continue to payment →' : 'متابعة للدفع ←')}
                        </button>

                        <p className="text-center text-xs text-brand-muted">
                            {isEn ? 'Already have an account? ' : 'لديك حساب؟ '}
                            <button type="button" onClick={onLogin} className="text-brand-accent font-bold hover:underline">
                                {isEn ? 'Sign in' : 'تسجيل الدخول'}
                            </button>
                        </p>
                    </form>
                )}

                {/* Step 2 — Payment */}
                {step === 2 && (
                    <div className="glass rounded-2xl p-6 space-y-4">
                        <div className="text-center space-y-1">
                            <p className="font-black text-brand-egg">{isEn ? 'Add payment method' : 'أضف طريقة الدفع'}</p>
                            <p className="text-xs text-brand-muted">{isEn ? 'Your card will not be charged until your 14-day trial ends' : 'لن يتم خصم أي مبلغ حتى انتهاء فترة الـ 14 يوم'}</p>
                        </div>

                        {iframeUrl ? (
                            <iframe src={iframeUrl} width="100%" height="420"
                                className="rounded-xl border border-brand-border/20 bg-white"
                                title="PayMob Payment" />
                        ) : (
                            <div className="flex items-center justify-center h-32">
                                <div className="w-8 h-8 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-[10px] text-brand-muted justify-center">
                            <span>🔒</span>
                            <span>{isEn ? 'Secured by PayMob · PCI-DSS compliant' : 'مؤمَّن بواسطة PayMob · متوافق مع PCI-DSS'}</span>
                        </div>

                        <button onClick={handleSkipPayment}
                            className="w-full text-xs text-brand-muted hover:text-brand-accent transition-colors underline text-center">
                            {isEn ? 'Skip for now — add card later' : 'تخطَّ الآن — أضف الكارت لاحقاً'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Login Page ────────────────────────────────────────────────────────────────
export const LoginPage = ({ lang = 'ar', onSuccess, onRegister }) => {
    const isEn = lang === 'en';
    const [form, setForm] = React.useState({ email: '', password: '' });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/login`, form);
            localStorage.setItem('omni_token', res.data.token);
            onSuccess(res.data.token, res.data.tenant);
        } catch (err) {
            setError(err.response?.data?.error || (isEn ? 'Login failed' : 'فشل تسجيل الدخول'));
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4" dir={isEn ? 'ltr' : 'rtl'}>
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                            <span className="text-brand-bg font-black text-sm">O</span>
                        </div>
                        <span className="font-black text-brand-egg text-xl">Omni<span className="font-light">Flow</span></span>
                    </div>
                    <p className="text-brand-muted text-sm">{isEn ? 'Sign in to your workspace' : 'تسجيل الدخول لمساحة عملك'}</p>
                </div>

                <form onSubmit={handleLogin} className="glass rounded-2xl p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-brand-muted">{isEn ? 'Email' : 'البريد الإلكتروني'}</label>
                        <div dir="ltr">
                            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                                placeholder="ahmed@company.com" required
                                className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-accent text-brand-egg text-left" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-brand-muted">{isEn ? 'Password' : 'كلمة المرور'}</label>
                        <div dir="ltr">
                            <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                                placeholder="••••••••" required
                                className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-accent text-brand-egg text-left" />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}

                    <button type="submit" disabled={loading}
                        className="w-full bg-brand-accent text-brand-bg py-3 rounded-xl font-black hover:opacity-90 transition-all disabled:opacity-50 text-sm">
                        {loading ? (isEn ? 'Signing in...' : 'جاري الدخول...') : (isEn ? 'Sign in →' : 'دخول ←')}
                    </button>

                    <p className="text-center text-xs text-brand-muted">
                        {isEn ? "Don't have an account? " : 'لا تملك حساباً؟ '}
                        <button type="button" onClick={onRegister} className="text-brand-accent font-bold hover:underline">
                            {isEn ? 'Start free trial' : 'ابدأ التجربة المجانية'}
                        </button>
                    </p>
                </form>

                <p className="text-center text-[10px] text-brand-muted opacity-50">
                    {isEn ? 'Secured with 256-bit encryption' : 'مؤمَّن بتشفير 256-bit'}
                </p>
            </div>
        </div>
    );
};

export { PLANS };
