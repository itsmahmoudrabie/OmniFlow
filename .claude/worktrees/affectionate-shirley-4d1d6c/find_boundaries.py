import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
filepath = r'dashboard-react\src\App.jsx'
with open(filepath, 'rb') as f:
    raw = f.read()

camps_start = raw.find(b'const CampaignsManager')
quick_start = raw.find(b'const QuickRepliesManager')
auto_start = raw.find(b'const AutomationsManager')
analytics_start = raw.find(b'const AnalyticsDashboard')
tpl_start = raw.find(b'const TemplatesManager')

print(f'CampaignsManager: {camps_start}')
print(f'QuickRepliesManager: {quick_start}')
print(f'AutomationsManager: {auto_start}')
print(f'AnalyticsDashboard: {analytics_start}')
print(f'TemplatesManager: {tpl_start}')

# Find return blocks inside each
for name, start, end in [
    ('Campaigns', camps_start, quick_start),
    ('QuickReplies', quick_start, auto_start - 200),  # before TRIGGER_TYPES
    ('Automations', auto_start, raw.find(b'const AbandonedCartsManager')),
    ('Analytics', analytics_start, len(raw)),
    ('Templates', tpl_start, raw.find(b'const ShopifyOrders')),
]:
    ret = raw.find(b'\n    return (', start, end)
    if ret > 0:
        print(f'{name} return at: {ret}')
        print(f'  Context: {raw[ret:ret+80]}')
