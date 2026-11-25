import json
import subprocess
import tempfile
import unittest
from pathlib import Path
import sys

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from process import order_points, process_image


class ImagePipelineTests(unittest.TestCase):
    def test_cli_writes_one_json_line_to_stdout(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "input.png"
            cv2.imwrite(str(source), np.full((40, 50, 3), 255, dtype=np.uint8))
            result = subprocess.run([
                sys.executable, str(Path(__file__).resolve().parents[1] / "process.py"),
                "--input", str(source), "--output", str(root / "output.png"),
                "--mode", "color", "--steps-dir", str(root / "steps"),
            ], capture_output=True, text=True, encoding="utf-8", check=False)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(len(result.stdout.strip().splitlines()), 1)
            self.assertTrue(json.loads(result.stdout)["ok"])
            self.assertEqual(result.stderr, "")

    def test_four_document_conditions(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ("skewed", "dark", "shadow", "clear"):
                canvas = np.full((480, 640, 3), 190, dtype=np.uint8)
                corners = np.array([[120, 55], [500, 80], [470, 420], [85, 390]], dtype=np.int32)
                cv2.fillConvexPoly(canvas, corners, (245, 245, 245))
                cv2.polylines(canvas, [corners], True, (20, 20, 20), 6)
                cv2.putText(canvas, "SMARTSCAN", (190, 245), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (10, 10, 10), 3)
                if name == "dark":
                    canvas = (canvas * 0.55).astype(np.uint8)
                if name == "shadow":
                    shade = canvas.copy()
                    cv2.fillConvexPoly(shade, np.array([[330, 80], [500, 80], [470, 420], [390, 410]]), (55, 55, 55))
                    canvas = cv2.addWeighted(shade, 0.35, canvas, 0.65, 0)
                source, output = root / f"{name}.png", root / f"{name}-out.png"
                cv2.imwrite(str(source), canvas)
                result = process_image(str(source), str(output), "color", 50, 150, 5, 11,
                                       str(root / f"{name}-steps"))
                self.assertTrue(result["ok"], name)
                self.assertEqual(len(result["steps"]), 4, name)
                self.assertTrue(output.is_file(), name)

    def test_orders_four_corners_clockwise_from_top_left(self):
        points = np.array([[90, 80], [10, 10], [10, 80], [90, 10]], dtype=np.float32)
        ordered = order_points(points)
        np.testing.assert_array_equal(ordered, np.array([[10, 10], [90, 10], [90, 80], [10, 80]], dtype=np.float32))

    def test_processes_all_modes_and_writes_four_steps(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = np.full((300, 400, 3), 245, dtype=np.uint8)
            cv2.rectangle(source, (65, 35), (335, 265), (10, 10, 10), 5)
            cv2.putText(source, "SMARTSCAN", (95, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
            input_path = root / "input.png"
            cv2.imwrite(str(input_path), source)

            for mode in ("color", "gray", "bw"):
                result = process_image(str(input_path), str(root / f"{mode}.png"), mode,
                                       50, 150, 5, 11, str(root / mode))
                self.assertTrue(result["ok"])
                self.assertTrue(Path(root / f"{mode}.png").is_file())
                self.assertEqual(len(result["steps"]), 4)
                self.assertTrue(all(Path(step).is_file() for step in result["steps"]))
                self.assertEqual(result["mode"], mode)

    def test_no_document_contour_returns_original_with_warning(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = np.full((80, 100, 3), 255, dtype=np.uint8)
            input_path, output_path = root / "input.png", root / "out.png"
            cv2.imwrite(str(input_path), source)
            result = process_image(str(input_path), str(output_path), "gray", 50, 150, 5, 11,
                                   str(root / "steps"))
            self.assertTrue(result["ok"])
            self.assertFalse(result["found"])
            self.assertTrue(result["warning"])
            np.testing.assert_array_equal(cv2.imread(str(output_path)), source)

    def test_corrupt_image_raises_clear_error(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "broken.jpg"
            source.write_text("not an image", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "IMAGE_READ_FAILED"):
                process_image(str(source), str(Path(directory) / "out.jpg"), "color",
                              50, 150, 5, 11, str(Path(directory) / "steps"))


if __name__ == "__main__":
    unittest.main()
