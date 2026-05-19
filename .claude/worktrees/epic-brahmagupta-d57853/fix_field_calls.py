import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('dashboard-react/src/App.jsx', 'rb') as f:
    raw = f.read()
raw = raw.replace(b'\r\r\n', b'\n').replace(b'\r\n', b'\n').replace(b'\r', b'\n')
text = raw.decode('utf-8', errors='replace')

# Convert <Field prop1="v1" prop2={v2} /> to {Field({prop1:"v1", prop2:v2})}
# We need to handle multiline Field tags

def convert_field_tag(m):
    tag_inner = m.group(1)  # everything between <Field and />

    # Parse JSX props into a dict-like string for function call
    # Convert prop="value" -> prop:"value"
    # Convert prop={expr} -> prop:expr
    # Convert prop (boolean) -> prop:true

    props_str = tag_inner.strip()

    # Replace JSX prop syntax with JS object syntax
    result = re.sub(r'(\w+)=\{([^}]*(?:\{[^}]*\}[^}]*)*)\}', r'\1:(\2)', props_str)
    result = re.sub(r'(\w+)="([^"]*)"', r'\1:"\2"', result)
    result = re.sub(r"(\w+)='([^']*)'", r"\1:'\2'", result)
    # Handle bare boolean props like "required"
    result = re.sub(r'(?<![:\w])(\w+)(?=\s+\w+=|\s*$)', lambda m2: m2.group(1)+':true' if m2.group(1) not in ('true','false') and not m2.group(1)[0].isupper() else m2.group(0), result)

    return '{Field({' + result + '})}'

# Actually, the JSX->function conversion is complex. Let's use a simpler approach:
# Move Field definitions OUTSIDE the parent components by defining them as factory functions.

# Simpler fix: just use React.memo or define Field outside.
# ACTUALLY SIMPLEST: rename Field to renderField and call as {renderField({...})}

# Step 1: rename Field definitions to renderField
text = text.replace(
    'const Field = ({ label, k, placeholder, required, hint }) =>',
    'const renderField = ({ label, k, placeholder, required, hint }) =>'
)
text = text.replace(
    'const Field = ({ label, field, placeholder = \'\', type = \'text\', secret = false }) =>',
    'const renderField = ({ label, field, placeholder = \'\', type = \'text\', secret = false }) =>'
)

# Also handle the dir variant that was partially changed
text = re.sub(
    r"const Field = \(\{ label, field, placeholder = '', (?:dir = '[^']*', )?type = 'text', secret = false \}\) =>",
    "const renderField = ({ label, field, placeholder = '', type = 'text', secret = false }) =>",
    text
)

# Step 2: convert <Field prop ... /> to {renderField({prop ...})}
# Find all <Field ... /> occurrences (possibly multiline)
def replace_field_jsx(text):
    # Match <Field ...props... /> including multiline
    pattern = re.compile(r'<Field\b((?:[^>]|\n)*?)/>', re.DOTALL)
    count = 0

    def to_fn_call(m):
        nonlocal count
        inner = m.group(1)
        # Convert JSX props to JS object props
        # prop="value" -> prop:"value"
        inner = re.sub(r'(\w+)="([^"]*)"', r'\1:"\2"', inner)
        # prop='value' -> prop:'value'
        inner = re.sub(r"(\w+)='([^']*)'", r"\1:'\2'", inner)
        # prop={expr} -> prop:(expr)  -- handle nested braces
        def replace_brace_prop(m2):
            return m2.group(1) + ':(' + m2.group(2) + ')'
        inner = re.sub(r'(\w+)=\{((?:[^{}]|\{[^{}]*\})*)\}', replace_brace_prop, inner)
        # bare prop (boolean) -> prop:true
        inner = re.sub(r'(?<!\w)(\b(?:required|secret|disabled|readOnly)\b)(?!\s*[=:])', r'\1:true', inner)
        # clean up whitespace
        inner = ' '.join(inner.split())
        count += 1
        return '{renderField({' + inner + '})}'

    result = pattern.sub(to_fn_call, text)
    print(f'Converted {count} <Field /> usages to renderField({{}})')
    return result

text = replace_field_jsx(text)

with open('dashboard-react/src/App.jsx', 'wb') as f:
    f.write(text.encode('utf-8'))
print('Done.')
