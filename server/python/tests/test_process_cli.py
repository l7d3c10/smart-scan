import subprocess
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "process.py"


class ProcessCliTests(unittest.TestCase):
    def test_rejects_even_kernel_size(self):
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--input", "input.jpg",
                "--output", "output.jpg",
                "--mode", "color",
                "--kernel", "4",
            ],
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 2)
        self.assertIn("kernel", result.stderr.lower())


if __name__ == "__main__":
    unittest.main()
