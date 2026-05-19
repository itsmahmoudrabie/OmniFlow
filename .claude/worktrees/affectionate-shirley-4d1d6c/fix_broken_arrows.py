import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()
raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
text = raw.decode('utf-8', errors='replace')

# Fix broken arrow functions: e = dir="ltr" > -> e =>
# Also fix: e= dir="ltr" >  (no space before =)
count = 0

# Pattern: {e = dir="ltr" > or {e= dir="ltr" >
text, n = re.subn(r'(\w+)\s*=\s*dir="ltr"\s*>', r'\1 =>', text)
count += n
text, n = re.subn(r'(\w+)\s*=\s*dir="auto"\s*>', r'\1 =>', text)
count += n

print(f'Fixed {count} broken arrow functions')

# Also remove any stray dir="ltr" on its own line inside input blocks
# (from previous scripts that added dir as separate line)
lines = text.split('\n')
out = []
skip_next = False
for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped == 'dir="ltr"' or stripped == 'dir="auto"':
        # Check context: if inside an input/textarea block, skip it
        context = '\n'.join(lines[max(0,i-8):i])
        if '<input' in context or '<textarea' in context:
            count += 1
            continue
    out.append(line)

text = '\n'.join(out)
print(f'Total fixes: {count}')

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(text.encode('utf-8'))
print('Done.')
