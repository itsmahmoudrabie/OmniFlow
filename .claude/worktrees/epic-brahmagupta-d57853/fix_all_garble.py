import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Build cp1256 tables
cp1256_fwd = {}  # byte -> unicode char
cp1256_rev = {}  # unicode char -> byte
for b in range(256):
    try:
        ch = bytes([b]).decode('cp1256')
        cp1256_fwd[b] = ch
        cp1256_rev[ch] = b
    except:
        pass

# Build a comprehensive mapping: garbled_bytes -> correct_bytes
# For every Arabic UTF-8 char U+0600-U+06FF (2-byte: high_byte in D8-DB, low in 80-BF):
# If those 2 bytes (as cp1256) produce valid UTF-8 when re-encoded, map back
replacements = {}

for high in [0xD8, 0xD9, 0xDA, 0xDB]:
    for low in range(0x80, 0xC0):
        correct_utf8 = bytes([high, low])
        # Verify it's valid UTF-8
        try:
            correct_char = correct_utf8.decode('utf-8')
        except:
            continue

        # What does cp1256 say about byte `high`?
        high_unicode = cp1256_fwd.get(high)
        if high_unicode is None:
            continue
        # What does cp1256 say about byte `low`?
        low_unicode = cp1256_fwd.get(low)
        if low_unicode is None:
            continue

        # Encode those unicode chars as UTF-8 -> garbled form
        try:
            garbled_bytes = (high_unicode + low_unicode).encode('utf-8')
        except:
            continue

        # Only add if garbled != correct (no-op replacements not needed)
        if garbled_bytes != correct_utf8:
            replacements[garbled_bytes] = correct_utf8

print(f'Total replacement patterns: {len(replacements)}')

# Show a few examples
examples = list(replacements.items())[:10]
for garbled, correct in examples:
    garbled_str = garbled.decode('utf-8')
    correct_str = correct.decode('utf-8')
    print(f'  {garbled.hex()} ({repr(garbled_str)}) -> {correct.hex()} ({correct_str})')

# Apply to file
filepath = r'F:\art-edges-tool\art edges WA\.claude\worktrees\affectionate-shirley-4d1d6c\dashboard-react\src\App.jsx'
with open(filepath, 'rb') as f:
    content = f.read()

original_len = len(content)
total_fixes = 0

# Sort by length (longest first to avoid partial replacements)
sorted_replacements = sorted(replacements.items(), key=lambda x: -len(x[0]))

for garbled, correct in sorted_replacements:
    n = content.count(garbled)
    if n > 0:
        content = content.replace(garbled, correct)
        total_fixes += n
        garbled_str = garbled.decode('utf-8', errors='replace')
        correct_str = correct.decode('utf-8', errors='replace')
        if n > 5:
            print(f'  Fixed {n}x: {garbled.hex()} -> {correct.hex()}  ({repr(garbled_str)} -> {correct_str})')

print(f'\nTotal fixes: {total_fixes}')
print(f'File size: {original_len} -> {len(content)}')

# Verify it's still valid UTF-8
try:
    content.decode('utf-8')
    print('UTF-8 validity: OK')
except Exception as e:
    print(f'UTF-8 error: {e}')

with open(filepath, 'wb') as f:
    f.write(content)
print('Saved.')
