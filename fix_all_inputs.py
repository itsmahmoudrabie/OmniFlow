import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()
raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
text = raw.decode('utf-8', errors='replace')

# Find all <input ...> blocks (possibly multiline) that don't have dir= and aren't special types
# Strategy: find every <input block, check if it has dir=, if not inject dir="ltr" before the closing />

def fix_inputs(text):
    result = []
    i = 0
    count = 0
    while i < len(text):
        # Find next <input
        idx = text.find('<input', i)
        if idx == -1:
            result.append(text[i:])
            break
        result.append(text[i:idx])
        # Find the closing /> of this input tag
        end = idx + 6
        depth = 0
        while end < len(text):
            if text[end] == '<' and depth == 0 and end > idx + 6:
                break  # hit another tag without closing
            if text[end:end+2] == '/>':
                end += 2
                break
            end += 1
        tag = text[idx:end]
        # Skip special types
        if re.search(r'type=["\'](?:file|color|checkbox|radio|hidden)["\']', tag):
            result.append(tag)
            i = end
            continue
        # Skip if already has dir=
        if 'dir=' in tag:
            result.append(tag)
            i = end
            continue
        # Add dir="ltr" before the closing />
        tag = re.sub(r'(\s*/>)$', '\n                                        dir="ltr"\\1', tag)
        result.append(tag)
        count += 1
        i = end
    print(f'Fixed {count} inputs')
    return ''.join(result)

def fix_textareas(text):
    result = []
    i = 0
    count = 0
    while i < len(text):
        idx = text.find('<textarea', i)
        if idx == -1:
            result.append(text[i:])
            break
        result.append(text[i:idx])
        # Find closing > (not />)
        end = idx + 9
        while end < len(text):
            if text[end] == '>':
                end += 1
                break
            end += 1
        tag = text[idx:end]
        if 'dir=' not in tag:
            tag = re.sub(r'(\s*>)$', '\n                                        dir="ltr"\\1', tag)
            count += 1
        result.append(tag)
        i = end
    print(f'Fixed {count} textareas')
    return ''.join(result)

text = fix_inputs(text)
text = fix_textareas(text)

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(text.encode('utf-8'))
print('Done.')
