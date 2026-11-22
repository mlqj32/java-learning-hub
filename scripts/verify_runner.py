"""Verify static serving and absence of native code execution APIs.
Actual Java/Python/SQL runs are tested in the browser.
"""
import threading
import unittest
import urllib.error
import urllib.request
import serve


class StaticPreviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = serve.ThreadingHTTPServer(('127.0.0.1', 0), serve.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = 'http://127.0.0.1:' + str(cls.server.server_port)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_page_and_worker(self):
        with urllib.request.urlopen(self.base + '/') as response:
            self.assertIn(b'runner.js', response.read())
        with urllib.request.urlopen(self.base + '/assets/js/virtual-worker.js') as response:
            self.assertIn(b'loadPyodide', response.read())

    def test_no_execution_api(self):
        for path in ['/api/runner', '/api/run']:
            with self.assertRaises(urllib.error.HTTPError) as caught:
                urllib.request.urlopen(self.base + path)
            self.assertEqual(caught.exception.code, 404)
        request = urllib.request.Request(self.base + '/api/run', data=b'{"code":"print(42)"}', method='POST')
        with self.assertRaises(urllib.error.HTTPError) as caught:
            urllib.request.urlopen(request)
        self.assertEqual(caught.exception.code, 405)

    def test_wasm_type_and_cache(self):
        request = urllib.request.Request(self.base + '/assets/vendor/sql.js/sql-wasm.wasm', method='HEAD')
        with urllib.request.urlopen(request) as response:
            self.assertEqual(response.headers.get_content_type(), 'application/wasm')
            self.assertEqual(response.headers['Cache-Control'], 'public, max-age=86400')
            self.assertGreater(int(response.headers['Content-Length']), 100_000)


if __name__ == '__main__':
    unittest.main(verbosity=2)
