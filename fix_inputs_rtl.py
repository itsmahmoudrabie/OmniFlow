import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()

raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
text = raw.decode('utf-8', errors='replace')

# Add dir="ltr" and text-left to all <input> elements that don't already have dir=
# and are not type=file/color/number/checkbox/radio/hidden
def fix_input(m):
    tag = m.group(0)
    # skip special types
    if re.search(r'type=["\'](?:file|color|checkbox|radio|hidden)["\']', tag):
        return tag
    # already has dir= attribute
    if 'dir=' in tag:
        return tag
    # add dir="ltr" before the closing /> or >
    tag = re.sub(r'(\s*/>)', r'\n                    dir="ltr"\n                \1', tag, count=1)
    if tag == m.group(0):  # if no /> try >
        tag = re.sub(r'(?<!\/)>$', r'\n                    dir="ltr"\n                >', tag, count=1)
    return tag

# Fix className on inputs: add text-left if not present
def add_text_left(tag):
    if 'text-left' in tag or 'dir=' in tag:
        return tag
    # find className="..." and append text-left
    tag = re.sub(r'(className=["\'][^"\']*?)(["\'])', lambda m2: m2.group(1) + ' text-left' + m2.group(2), tag, count=1)
    return tag

lines = text.split('\n')
out = []
for line in lines:
    # For input lines, add dir="ltr" if not present and not special type
    if '<input' in line and 'dir=' not in line:
        if not re.search(r'type=["\'](?:file|color|checkbox|radio|hidden)["\']', line):
            # inline single-line input
            if '/>' in line or re.search(r'<input[^>]*>', line):
                line = re.sub(r'(<input\b[^>]*?)(/>|>(?!=))',
                    lambda m: m.group(1) + ' dir="ltr" ' + m.group(2), line, count=1)
    # For textarea lines, add dir="auto" if not present (textarea content can be Arabic or English)
    if '<textarea' in line and 'dir=' not in line:
        line = re.sub(r'(<textarea\b)', r'\1 dir="auto" ', line, count=1)
    out.append(line)

text = '\n'.join(out)

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(text.encode('utf-8'))

print('Done.')
