import React, { useState } from 'react';
import { Zap, Check, Star } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : `${window.location.origin}/api`;

const PLANS = [
    {
        id: 'starter',
        nameEn: 'Starter',
        nameAr: 'المبتدئ',
        price: 29,
        color: '#8CC850',
        featuresAr: [
            '1,000 محادثة/شهر',
            'رقم واتساب واحد',
            '2 أعضاء',
            'ربط Shopify',
        ],
        featuresEn: [
            '1,000 conversations/mo',
            '1 WhatsApp number',
            '2 team members',
            'Shopify integration',
        ],
    },
    {
        id: 'growth',
        nameEn: 'Growth',
        nameAr: 'النمو',
        price: 79,
        color: '#FF6B35',
        badgeAr: 'الأكثر شيوعاً',
        badgeEn: 'Most Popular',
        featuresAr: [
            '5,000 محادثة/شهر',
            '3 أرقام واتساب',
            '10 أعضاء',
            'أتمتة كاملة',
            'إرسال جماعي',
        ],
        featuresEn: [
            '5,000 conversations/mo',
            '3 WhatsApp numbers',
            '10 team members',
            'Full automation',
            'Broadcast campaigns',
        ],
    },
    {
        id: 'pro',
        nameEn: 'Pro',
        nameAr: 'الاحترافي',
        price: 149,
        color: '#93C5FD',
        featuresAr: [
            'محادثات غير محدودة',
            '10 أرقام واتساب',
            'فريق غير محدود',
            'AI مخصص',
        ],
        featuresEn: [
            'Unlimited conversations',
            '10 WhatsApp numbers',
            'Unlimited team',
            'Custom AI',
        ],
    },
];

export const PricingPage = ({ lang = 'ar', onSkip }) => {
    const isEn = lang === 'en';
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [error, setError] = useState('');

    const handleSelectPlan = async (planId) => {
        setLoadingPlan(planId);
        setError('');
        try {
            const token = localStorage.getItem('omni_token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const { data } = await axios.post(
                `${API_URL}/billing/create-charge`,
                { plan: planId },
                { headers }
            );
            if (data.confirmation_url) {
                window.location.href = data.confirmation_url;
            } else {
                setError(isEn ? 'No confirmation URL returned.' : 'لم يتم إرجاع رابط التأكيد.');
                setLoadingPlan(null);
            }
        } catch (err) {
            const msg = err.response?.data?.error || (isEn ? 'Failed to create charge.' : 'فشل إنشاء الاشتراك.');
            setError(msg);
            setLoadingPlan(null);
        }
    };

    return (
        <div
            className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 gap-10"
            dir={isEn ? 'ltr' : 'rtl'}
        >
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Zap size={28} className="text-brand-accent" />
                    <span className="text-2xl font-black text-brand-egg">OmniFlow</span>
                </div>
                <h1 className="text-3xl font-black text-brand-egg">
                    {isEn ? 'Choose your plan' : 'اختر خطتك'}
                </h1>
                <p className="text-brand-muted text-sm">
                    {isEn
                        ? '7-day free trial included with every plan'
                        : 'تجربة مجانية 7 أيام مع كل خطة'}
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-3 text-sm font-bold">
                    {error}
                </div>
            )}

            {/* Plan Cards */}
            <div className="flex flex-col md:flex-row gap-5 w-full max-w-4xl">
                {PLANS.map((plan) => {
                    const isLoading = loadingPlan === plan.id;
                    const features = isEn ? plan.featuresEn : plan.featuresAr;
                    const name = isEn ? plan.nameEn : plan.nameAr;
                    const badge = isEn ? plan.badgeEn : plan.badgeAr;

                    return (
                        <div
                            key={plan.id}
                            className="flex-1 rounded-2xl border p-6 flex flex-col gap-5 relative"
                            style={{
                                background: 'color-mix(in srgb, var(--color-brand-card) 80%, transparent)',
                                borderColor: badge ? plan.color : 'color-mix(in srgb, var(--color-brand-card) 50%, transparent)',
                                boxShadow: badge ? `0 0 0 2px ${plan.color}33` : 'none',
                            }}
                        >
                            {/* Popular badge */}
                            {badge && (
                                <div
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black"
                                    style={{ background: plan.color, color: '#003223' }}
                                >
                                    <Star size={10} className="inline mr-1 mb-0.5" />
                                    {badge}
                                </div>
                            )}

                            {/* Plan name + price */}
                            <div>
                                <div
                                    className="text-xs font-black uppercase tracking-widest mb-1"
                                    style={{ color: plan.color }}
                                >
                                    {name}
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="text-4xl font-black text-brand-egg">${plan.price}</span>
                                    <span className="text-brand-muted text-sm mb-1">
                                        {isEn ? '/mo' : '/شهر'}
                                    </span>
                                </div>
                            </div>

                            {/* Features */}
                            <ul className="space-y-2 flex-1">
                                {features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-brand-egg">
                                        <Check size={14} style={{ color: plan.color, flexShrink: 0 }} />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <button
                                onClick={() => handleSelectPlan(plan.id)}
                                disabled={!!loadingPlan}
                                className="w-full py-3 rounded-xl font-black text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: plan.color,
                                    color: '#003223',
                                }}
                            >
                                {isLoading
                                    ? (isEn ? 'Loading...' : 'جارٍ التحميل...')
                                    : (isEn ? 'Start 7-day trial →' : 'ابدأ تجربة 7 أيام ←')}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Skip link */}
            {onSkip && (
                <button
                    onClick={onSkip}
                    className="text-brand-muted text-sm hover:text-brand-egg transition-colors underline underline-offset-2"
                >
                    {isEn ? 'Continue with free trial' : 'متابعة بالتجربة المجانية'}
                </button>
            )}
        </div>
    );
};

export default PricingPage;
