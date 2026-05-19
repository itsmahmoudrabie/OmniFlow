import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()
raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
text = raw.decode('utf-8', errors='replace')

# Remove inline dir= and style= from inputs (the wrapper will handle it)
# Fix: remove dir="ltr" dir="auto" dir={...} attributes from <input> tags
# and remove style={{direction:..., textAlign:...}} from inputs

lines = text.split('\n')
out = []
i = 0
while i < len(lines):
    line = lines[i]
    # Remove dir= attribute from standalone input lines
    if re.match(r'\s*dir="ltr"\s*$', line) or re.match(r'\s*dir={dir}\s*$', line) or re.match(r'\s*dir="auto"\s*$', line):
        # Check if previous lines had <input to confirm this is an input dir attribute
        # Just remove these standalone dir= lines that are part of inputs
        context = '\n'.join(lines[max(0,i-5):i])
        if '<input' in context or '<textarea' in context:
            i += 1
            continue
    # Remove style={{direction:... lines from inputs
    if re.match(r'\s*style=\{\{ direction: [\'"]ltr[\'"], textAlign: [\'"]left[\'"] \}\}\s*$', line):
        context = '\n'.join(lines[max(0,i-5):i])
        if '<input' in context:
            i += 1
            continue
    out.append(line)
    i += 1

text = '\n'.join(out)

# Now wrap remaining inline <input ... dir="ltr" /> single-line inputs
# by removing dir="ltr" from inline inputs (CSS global rule handles it)
text = re.sub(
    r'(<input\b[^>]*?)\s+dir="ltr"(\s*/>)',
    r'\1\2',
    text
)
text = re.sub(
    r'(<input\b[^>]*?)\s+dir="auto"(\s*/>)',
    r'\1\2',
    text
)
text = re.sub(
    r'(<textarea\b[^>]*?)\s+dir="ltr"\s*(\n\s*dir="auto")?\s*(>)',
    r'\1\3',
    text
)

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(text.encode('utf-8'))
print('Done.')
