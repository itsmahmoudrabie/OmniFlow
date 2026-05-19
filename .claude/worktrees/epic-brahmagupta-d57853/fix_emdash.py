filepath = r'F:\art-edges-tool\art edges WA\.claude\worktrees\affectionate-shirley-4d1d6c\dashboard-react\src\App.jsx'

with open(filepath, 'rb') as f:
    content = f.read()

fixes = [
    (b'\xc3\xa2\xe2\x82\xac\x22', b'\xe2\x80\x94'),
    (b'\xc3\x82\xc2\xb7', b'\xc2\xb7'),
]

total = 0
for old, new in fixes:
    n = content.count(old)
    if n:
        content = content.replace(old, new)
        total += n
        print(f'Fixed {n}x')

with open(filepath, 'wb') as f:
    f.write(content)
print(f'Total: {total}')
