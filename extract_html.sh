#!/bin/bash
echo "=== EXTRACTING HTML FROM TOKENURI ==="

# Get tokenURI
RAW_URI=$(cast call 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 'tokenURI(uint256)' 1 --rpc-url http://127.0.0.1:8545)

# Convert hex to string (skip Solidity string prefix)
HEX_DATA="${RAW_URI:2}"
python3 -c "
import binascii
hex_str = '$HEX_DATA'
if len(hex_str) >= 128:
    data_bytes = binascii.unhexlify(hex_str[128:])  # Skip length prefix
    uri_str = data_bytes.decode('utf-8', errors='replace')
    
    # Extract base64 JSON
    if 'data:application/json;base64,' in uri_str:
        b64_json = uri_str.split('data:application/json;base64,')[1]
        import base64
        json_bytes = base64.b64decode(b64_json)
        json_str = json_bytes.decode('utf-8', errors='replace')
        
        # Extract animation_url
        if '\"animation_url\":\"' in json_str:
            anim_start = json_str.find('\"animation_url\":\"') + 17
            anim_end = json_str.find('\"', anim_start)
            animation_url = json_str[anim_start:anim_end]
            
            if animation_url.startswith('data:text/html;base64,'):
                html_b64 = animation_url[23:]
                html_bytes = base64.b64decode(html_b64)
                html_content = html_bytes.decode('utf-8', errors='replace')
                
                with open('generated_rug.html', 'w', encoding='utf-8') as f:
                    f.write(html_content)
                
                print('SUCCESS: HTML extracted and saved to generated_rug.html')
                print(f'Size: {len(html_content)} bytes')
                
                # Quick checks
                checks = []
                if '<html' in html_content: checks.append('HTML')
                if 'p5.js' in html_content: checks.append('p5.js')
                if 'TEST_RUG_2025' in html_content: checks.append('test text')
                if 'dl=' in html_content: checks.append('dirt level')
                if 'tl=' in html_content: checks.append('texture level')
                print(f'Contains: {', '.join(checks)}')
            else:
                print('ERROR: animation_url not in expected format')
        else:
            print('ERROR: animation_url not found in JSON')
    else:
        print('ERROR: JSON base64 not found')
else:
    print('ERROR: Hex data too short')
" 2>/dev/null

echo ""
echo "=== RESULT ==="
if [ -f generated_rug.html ]; then
    echo "✓ HTML file created successfully"
    echo "First 20 lines:"
    head -20 generated_rug.html
else
    echo "✗ HTML extraction failed"
fi
