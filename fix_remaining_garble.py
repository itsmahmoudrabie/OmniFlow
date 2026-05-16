import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Build cp1256 reverse table
cp1256_rev = {}
for b in range(256):
    try:
        ch = bytes([b]).decode('cp1256')
        cp1256_rev[ch] = b
    except:
        pass

# Build cp1256 forward table too
cp1256_fwd = {}
for b in range(256):
    try:
        ch = bytes([b]).decode('cp1256')
        cp1256_fwd[b] = ch
    except:
        pass

filepath = r'F:\art-edges-tool\art edges WA\.claude\worktrees\affectionate-shirley-4d1d6c\dashboard-react\src\App.jsx'

with open(filepath, 'rb') as f:
    raw = f.read()

# The garbling mechanism for REMAINING garbled text:
# Original UTF-8 bytes D8 XX or D9 XX were treated as cp1256 bytes and re-encoded as UTF-8
# Each original byte B becomes cp1256_fwd[B] character, then re-encoded as UTF-8
#
# To reverse: take garbled UTF-8, decode to unicode, map each unicode char back via cp1256_rev
# to get original cp1256 byte, then decode THOSE bytes as UTF-8 to get correct Arabic

# Find the two garbled lines and their byte ranges
# Line 1658: pendingCarts + garbled Arabic + correct Arabic
# Line 2439: isEn ternary with garbled Arabic translation

# Let's find the exact byte positions
line1_marker = b'>{pendingCarts}</span> '
line2_marker = b"Trigger \xe2\x86\x92 Wait \xe2\x86\x92 Act automatically on any event.'"

pos1 = raw.find(line1_marker)
pos2 = raw.find(line2_marker)

print(f'Line 1 garbled start position: {pos1 + len(line1_marker)}')
print(f'Line 2 garbled start position: {pos2 + len(line2_marker) + 4}')  # skip ': '

# Extract garbled portion of line 1 (until em-dash U+2014 = E2 80 94)
start1 = pos1 + len(line1_marker)
emdash = b'\xe2\x80\x94'
end1 = raw.find(emdash, start1)

garbled1_bytes = raw[start1:end1]
print(f'\nGarbled line 1 bytes ({len(garbled1_bytes)}): {garbled1_bytes.hex()}')
print(f'Decoded: {garbled1_bytes.decode("utf-8", errors="replace")!r}')

# Try to reverse the cp1256 encoding
garbled1_unicode = garbled1_bytes.decode('utf-8', errors='replace')
cp_bytes1 = bytearray()
ok = True
for ch in garbled1_unicode:
    if ch == '�':
        print(f'  Replacement char found - bad UTF-8')
        ok = False
        break
    b = cp1256_rev.get(ch)
    if b is not None:
        cp_bytes1.append(b)
    else:
        print(f'  Cannot reverse: {repr(ch)} U+{ord(ch):04X}')
        ok = False
        # Try to handle DA BE = U+06BE which is not in cp1256
        # In some Arabic encodings, this might be a specific byte
        cp_bytes1.append(0xBE)  # best guess

try:
    result1 = cp_bytes1.decode('utf-8')
    print(f'\nReversed line 1: {result1!r}')
except Exception as e:
    print(f'Decode error: {e}')
    print(f'cp bytes: {cp_bytes1.hex()}')

# Now do line 2 - find the Arabic part after ': '
start2_search = pos2 + len(line2_marker)
# Find the ': ' separator
sep = raw.find(b"': '", start2_search)
if sep >= 0:
    start2 = sep + 4  # skip ': '
    end2 = raw.find(b"'}", start2)
    garbled2_bytes = raw[start2:end2]
    print(f'\nGarbled line 2 bytes ({len(garbled2_bytes)}): {garbled2_bytes.hex()}')
    print(f'Decoded: {garbled2_bytes.decode("utf-8", errors="replace")!r}')

    garbled2_unicode = garbled2_bytes.decode('utf-8', errors='replace')
    cp_bytes2 = bytearray()
    for ch in garbled2_unicode:
        b = cp1256_rev.get(ch)
        if b is not None:
            cp_bytes2.append(b)
        else:
            print(f'  Cannot reverse: {repr(ch)} U+{ord(ch):04X}')
    try:
        result2 = cp_bytes2.decode('utf-8')
        print(f'Reversed line 2: {result2!r}')
    except Exception as e:
        print(f'Line 2 decode error: {e}, bytes: {cp_bytes2.hex()}')
