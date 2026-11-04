from pathlib import Path
import unittest
from build_browser import build,ROOT

class BrowserBuildTests(unittest.TestCase):
    def test_tracked_single_file_matches_sources_and_has_no_server_dependency(self):
        html=build()
        self.assertEqual((ROOT.parents[1]/'public/article-editor/index.html').read_text(),html)
        self.assertNotIn('src="/editor.js"',html)
        self.assertIn('Content-Security-Policy',html)
        self.assertIn('id="database-url"',html)
        self.assertNotIn('localStorage',html)
        self.assertNotIn('sessionStorage',html)

if __name__=='__main__':unittest.main()
