import http.server
import socketserver
import os

PORT = 5000
DIRECTORY = "."

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("0.0.0.0", PORT), NoCacheHTTPRequestHandler) as httpd:
        print(f"Servidor rodando em http://0.0.0.0:{PORT}")
        httpd.serve_forever()
