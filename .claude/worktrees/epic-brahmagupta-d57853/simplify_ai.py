import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()
raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
text = raw.decode('utf-8', errors='replace')

# ── 1. Onboarding: Remove Gemini key step from welcome checklist ─────────────
text = text.replace(
    """{
                                        icon: '🤖', title: isEn ? 'AI Key (Optional)' : 'مفتاح AI (اختياري)',
                                        desc: isEn ? 'Gemini API key for AI auto-replies (free tier available)' : 'مفتاح Gemini API للرد الآلي (متاح مجاناً)',
                                        link: 'https://aistudio.google.com/app/apikey', linkText: isEn ? 'Get free Gemini key →' : 'احصل على مفتاح Gemini مجاني →'
                                    },""",
    ""
)

# ── 2. Onboarding form: Remove gemini_api_key from initial state ─────────────
text = text.replace(
    "gemini_api_key: '', server_url: ''",
    "server_url: ''"
)

# ── 3. Onboarding step 2: Remove Gemini key box entirely ────────────────────
text = text.replace(
    """                            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                <p className="text-[10px] font-black text-purple-400 mb-1">{isEn ? 'AI Auto-Reply (Free)' : 'الرد الآلي بالذكاء الاصطناعي (مجاني)'}</p>
                                <Field k="gemini_api_key" label="Gemini API Key" placeholder="AIzaSy..." secret optional
                                    hint="" />
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                                    className="text-[10px] text-purple-400 font-bold hover:underline mt-1 inline-block">
                                    {isEn ? 'Get free key from Google AI Studio →' : 'احصل على مفتاح مجاني من Google AI Studio →'}
                                </a>
                            </div>""",
    ""
)

# ── 4. App Settings: Remove openai_key from state ────────────────────────────
text = text.replace(
    "        openai_key: '',\n",
    ""
)

# ── 5. App Settings: Replace ai_model state default, remove model selector ──
text = text.replace(
    "        ai_enabled: false, ai_model: 'gemini-2.0-flash', ai_instruction: '',",
    "        ai_enabled: false, ai_instruction: '',"
)

# ── 6. App Settings: Remove model selector section ───────────────────────────
# Remove the <select> for ai_model
old_model_selector = """                        <select value={ws.ai_model || 'gemini-2.0-flash'} onChange={e => set('ai_model', e.target.value)}
                            className="w-full bg-brand-input border border-brand-border/30 rounded-xl px-3 py-2.5 text-xs outline-none text-brand-egg focus:border-brand-accent">
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                            <option value="gpt-4o">GPT-4o (OpenAI)</option>
                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                        </select>"""
if old_model_selector in text:
    text = text.replace(old_model_selector, "")
    print("Removed model selector")

# ── 7. App Settings: Remove OpenAI key field ────────────────────────────────
text = text.replace(
    "                    {(ws.ai_model || '').startsWith('gpt') && renderField({label:\"OpenAI API Key\", field:\"openai_key\", placeholder:\"sk-...\", secret:true})}",
    ""
)

# ── 8. App Settings: Remove Gemini subtitle reference ───────────────────────
text = text.replace(
    "name=\"Gemini AI\" subtitle={ws.ai_model || 'gemini-2.0-flash'}",
    "name=\"AI Assistant\""
)
text = text.replace(
    "<p className=\"text-[10px] text-brand-muted uppercase tracking-wider mt-0.5\">{(ws.ai_model || 'gemini-2.0-flash').toUpperCase()}</p>",
    "<p className=\"text-[10px] text-brand-muted uppercase tracking-wider mt-0.5\">POWERED BY GROQ</p>"
)

# ── 9. App Settings: Send ai_enabled + features, not ai_model/openai_key ────
text = text.replace(
    """                ai_instruction: ws.ai_instruction,
                ai_enabled: ws.ai_enabled,
                ai_auto_reply: ws.ai_auto_reply,""",
    """                ai_instruction: ws.ai_instruction,
                ai_enabled: ws.ai_enabled,
                ai_auto_reply: ws.ai_auto_reply,
                ai_draft_mode: ws.ai_draft_mode,
                ai_auto_tag_vip: ws.ai_auto_tag_vip,"""
)

# ── 10. Dashboard header: GROQ-powered badge in AI toggle ────────────────────
# No change needed, toggle already says "AI Auto-Reply"

# ── 11. Remove any label referencing "gemini" or "openai" in settings ───────
text = re.sub(r"subtitle=\{[^}]*gemini[^}]*\}", 'subtitle="OmniFlow AI"', text, flags=re.IGNORECASE)

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(text.encode('utf-8'))
print('Done.')
