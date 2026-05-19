import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()
raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
text = raw.decode('utf-8', errors='replace')

# Fix renderField calls that have no commas between props
# Pattern: {renderField({key:val key2:val2})} -> {renderField({key:val, key2:val2})}
# The issue: our conversion removed commas. Add them back.

# Find all {renderField({...})} blocks and fix commas inside
def fix_commas_in_renderfn(m):
    inner = m.group(1)
    # Add comma after each prop value before next prop key
    # prop-value ends with: string", number, ), true, false, then space then identifier:
    inner = re.sub(
        r'("(?:[^"\\]|\\.)*")\s+(\w+:)',
        r'\1, \2',
        inner
    )
    inner = re.sub(
        r"('(?:[^'\\]|\\.)*')\s+(\w+:)",
        r'\1, \2',
        inner
    )
    inner = re.sub(
        r'(\))\s+(\w+:)',
        r'\1, \2',
        inner
    )
    inner = re.sub(
        r'(true|false)\s+(\w+:)',
        r'\1, \2',
        inner
    )
    return '{renderField({' + inner + '})}'

text = re.sub(
    r'\{renderField\(\{([\s\S]*?)\}\)\}',
    fix_commas_in_renderfn,
    text
)

# Also convert remaining <Field .../> (that weren't converted yet) to renderField calls
def jsx_field_to_fn(m):
    inner = m.group(1)
    # Parse props: handle multiline
    # prop="val" -> prop:"val"
    inner = re.sub(r'(\w+)="([^"]*)"', r'\1:"\2"', inner)
    inner = re.sub(r"(\w+)='([^']*)'", r"\1:'\2'", inner)
    # prop={expr} -> prop:(expr), handle nested {}
    def repl_brace(m2):
        return m2.group(1) + ':(' + m2.group(2) + ')'
    inner = re.sub(r'(\w+)=\{((?:[^{}]|\{[^{}]*\})*)\}', repl_brace, inner)
    # bare boolean props
    inner = re.sub(r'\b(required|secret|disabled)\b(?!\s*[:(])', r'\1:true', inner)
    # collapse whitespace and add commas
    tokens = re.split(r'\s+', inner.strip())
    props = []
    for t in tokens:
        if not t:
            continue
        if t.endswith(','):
            t = t[:-1]
        props.append(t)
    # Join with commas (each token is already key:value)
    result = ', '.join(props)
    return '{renderField({' + result + '})}'

remaining = re.compile(r'<Field\b((?:[^>]|\n)*?)/>', re.DOTALL)
count_before = len(remaining.findall(text))
text = remaining.sub(jsx_field_to_fn, text)
count_after = len(re.findall(r'<Field\b', text))
print(f'Converted {count_before} remaining <Field/> usages, {count_after} left')

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(text.encode('utf-8'))
print('Done.')
