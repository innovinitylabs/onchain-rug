import base64, urllib.parse, json, gzip
import sys

# Read the tokenURI from file
hex_data = open('/tmp/tokenuri_2.txt').read().strip()
if hex_data.startswith('0x'):
    hex_data = hex_data[2:]
bytes_data = bytes.fromhex(hex_data)
decoded = bytes_data.decode('utf-8', errors='ignore')
json_str = decoded.split('data:application/json;base64,')[1]
metadata = json.loads(base64.b64decode(json_str).decode('utf-8'))

print('=== NFT METADATA ===')
print(f'Name: {metadata["name"]}')
print(f'Description: {metadata["description"]}')
print(f'Image: {metadata["image"]}')
print()

# Decode the HTML
html_b64 = metadata['animation_url'].split('data:text/html;base64,')[1]
html = base64.b64decode(html_b64).decode('utf-8', errors='ignore')
html = urllib.parse.unquote(html)

print('=== FULL HTML ===')
print(html)
print()

# Extract and decode the script content
start = html.find('base64,') + 7
end = html.find('"%></script>')
if end == -1:
    end = html.find('%22%3E%3C%2Fscript%3E')

if start > 0 and end > start:
    b64_content = html[start:end]
    print('=== SCRIPT BASE64 CONTENT FOUND ===')
    try:
        # Decode base64
        compressed_data = base64.b64decode(b64_content)
        
        # Try to decompress (since we uploaded gzipped content)
        try:
            script_content = gzip.decompress(compressed_data).decode('utf-8', errors='ignore')
            print('✅ SUCCESS: Decompressed gzipped script!')
        except:
            # If not gzipped, decode directly
            script_content = compressed_data.decode('utf-8', errors='ignore')
            print('Script was not gzipped, decoded directly')
        
        print('Script (first 500 chars):')
        print(script_content[:500])
        print()
        
        if 'function' in script_content or 'rug' in script_content.lower() or 'p5' in script_content.lower():
            print('✅ SUCCESS: Script contains code!')
        else:
            print('❌ ERROR: Script does not contain expected code')
            
        # Check for specific patterns
        if 'VALIPOKKANN' in script_content:
            print('✅ SUCCESS: Script contains the text "VALIPOKKANN"!')
        if 'seed' in script_content.lower():
            print('✅ SUCCESS: Script contains seed-related code!')
            
    except Exception as e:
        print(f'Error decoding script: {e}')
        print('Raw b64 content length:', len(b64_content))
else:
    print('❌ ERROR: Could not find script content')
