#!/usr/bin/env python3
"""
Simple HTTP server to serve the mint-ui.html file for testing
Usage: python serve-mint-ui.py
Then open http://localhost:8000/mint-ui.html
"""

import http.server
import socketserver
import os

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With')
        super().end_headers()

def main():
    os.chdir('/Users/valipokkann/Developer/onchain_rugs/onchain-rug')

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("🚀 Mint UI Server Started!")
        print(f"📱 Open: http://localhost:{PORT}/mint-ui.html")
        print("🔧 Features:")
        print("   • Dynamic contract discovery")
        print("   • Custom parameter controls")
        print("   • Full algorithm integration")
        print("   • No Scripty.sol dependency")
        print("\nPress Ctrl+C to stop the server")
        httpd.serve_forever()

if __name__ == "__main__":
    main()
