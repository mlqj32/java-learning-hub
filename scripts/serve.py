"""Optional static preview server. Code runs in the browser, never on this server."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

ROOT = Path(__file__).resolve().parents[1]


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.wasm': 'application/wasm'}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # Pinned runtime assets are large; use normal HTTP caching.
        self.send_header('Cache-Control', 'public, max-age=86400' if self.path.startswith('/assets/vendor/') else 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def do_GET(self):
        if self.path.startswith('/api/'):
            self.send_error(404, 'No execution API. Runtimes live in the browser.')
        else:
            super().do_GET()

    def do_POST(self):
        self.send_error(405, 'Static files only. Code execution is browser-side.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8766)
    config = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', config.port), Handler)
    print(f'Static preview: http://127.0.0.1:{config.port}/#/playground', flush=True)
    print('No native code execution. Deploy to any HTTP(S) static host.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
