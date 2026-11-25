"""Giao diện dòng lệnh cho pipeline xử lý ảnh SmartScan."""

import argparse
import json
import os
import sys


def bounded_integer(name, minimum, maximum, odd=False):
    def parse(value):
        try:
            number = int(value)
        except ValueError as error:
            raise argparse.ArgumentTypeError(f"{name} phải là số nguyên.") from error

        if number < minimum or number > maximum:
            raise argparse.ArgumentTypeError(f"{name} phải nằm trong {minimum}–{maximum}.")
        if odd and number % 2 == 0:
            raise argparse.ArgumentTypeError(f"{name} phải là số lẻ.")
        return number

    return parse


def build_parser():
    parser = argparse.ArgumentParser(description="Xử lý ảnh tài liệu SmartScan.")
    parser.add_argument("--input", required=True, help="Đường dẫn ảnh gốc.")
    parser.add_argument("--output", required=True, help="Đường dẫn ảnh kết quả.")
    parser.add_argument("--mode", choices=("color", "gray", "bw"), required=True)
    parser.add_argument("--canny-low", type=bounded_integer("canny-low", 0, 255), default=50)
    parser.add_argument("--canny-high", type=bounded_integer("canny-high", 0, 255), default=150)
    parser.add_argument("--kernel", type=bounded_integer("kernel", 3, 11, odd=True), default=5)
    parser.add_argument("--block-size", type=bounded_integer("block-size", 3, 51, odd=True), default=11)
    parser.add_argument("--steps-dir", required=True, help="Thư mục ảnh trung gian.")
    return parser


def order_points(points):
    import numpy as np

    points = np.asarray(points, dtype="float32").reshape(4, 2)
    ordered = np.zeros((4, 2), dtype="float32")
    sums = points.sum(axis=1)
    differences = np.diff(points, axis=1).reshape(-1)
    ordered[0] = points[np.argmin(sums)]
    ordered[2] = points[np.argmax(sums)]
    ordered[1] = points[np.argmin(differences)]
    ordered[3] = points[np.argmax(differences)]
    return ordered


def _write_image(cv2, path, image):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    if not cv2.imwrite(path, image):
        raise ValueError("IMAGE_WRITE_FAILED")


def process_image(input_path, output_path, mode, canny_low, canny_high,
                  kernel, block_size, steps_dir):
    import cv2
    import numpy as np

    image = cv2.imread(input_path, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("IMAGE_READ_FAILED")

    height, width = image.shape[:2]
    scale = min(1.0, 2000.0 / max(height, width))
    if scale < 1.0:
        image = cv2.resize(image, (round(width * scale), round(height * scale)),
                           interpolation=cv2.INTER_AREA)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (kernel, kernel), 0)
    edges = cv2.Canny(blurred, canny_low, canny_high)
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    document = None
    image_area = image.shape[0] * image.shape[1]
    for contour in contours:
        if cv2.contourArea(contour) < image_area * 0.10:
            break
        perimeter = cv2.arcLength(contour, True)
        polygon = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
        if len(polygon) == 4 and cv2.isContourConvex(polygon):
            document = order_points(polygon.reshape(4, 2))
            break

    os.makedirs(steps_dir, exist_ok=True)
    step_paths = [os.path.join(steps_dir, name) for name in
                  ("01-gray-blur.png", "02-canny.png", "03-contour.png", "04-rectified.png")]
    _write_image(cv2, step_paths[0], blurred)
    _write_image(cv2, step_paths[1], edges)
    overlay = image.copy()
    found = document is not None
    if found:
        cv2.polylines(overlay, [document.astype("int32")], True, (40, 180, 90), 3)
        top_left, top_right, bottom_right, bottom_left = document
        target_width = max(np.linalg.norm(bottom_right - bottom_left),
                           np.linalg.norm(top_right - top_left))
        target_height = max(np.linalg.norm(top_right - bottom_right),
                            np.linalg.norm(top_left - bottom_left))
        target_width, target_height = max(1, round(target_width)), max(1, round(target_height))
        destination = np.array([[0, 0], [target_width - 1, 0],
                                [target_width - 1, target_height - 1],
                                [0, target_height - 1]], dtype="float32")
        matrix = cv2.getPerspectiveTransform(document, destination)
        rectified = cv2.warpPerspective(image, matrix, (target_width, target_height))
    else:
        rectified = image.copy()

    _write_image(cv2, step_paths[2], overlay)
    _write_image(cv2, step_paths[3], rectified)
    if found:
        if mode == "gray":
            result = cv2.cvtColor(rectified, cv2.COLOR_BGR2GRAY)
        elif mode == "bw":
            result_gray = cv2.cvtColor(rectified, cv2.COLOR_BGR2GRAY)
            max_block = min(result_gray.shape[:2])
            max_block = max_block if max_block % 2 else max_block - 1
            if max_block < 3:
                _, result = cv2.threshold(result_gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            else:
                adaptive_block = min(block_size, max_block)
                result = cv2.adaptiveThreshold(result_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                               cv2.THRESH_BINARY, adaptive_block, 2)
        else:
            result = rectified
    else:
        result = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)

    _write_image(cv2, output_path, result)
    output_height, output_width = result.shape[:2]
    return {"ok": True, "found": found,
            "warning": None if found else "Không tìm thấy viền tài liệu; giữ nguyên ảnh gốc.",
            "steps": step_paths, "output": output_path, "width": output_width,
            "height": output_height, "mode": mode}


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.canny_low >= args.canny_high:
        parser.error("canny-low phải nhỏ hơn canny-high.")

    try:
        result = process_image(args.input, args.output, args.mode, args.canny_low,
                               args.canny_high, args.kernel, args.block_size, args.steps_dir)
    except ImportError:
        print("OPEN_CV_MISSING: Hãy cài server/python/requirements.txt.", file=sys.stderr)
        return 1
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 2
    except Exception:
        print("IMAGE_PROCESSING_FAILED", file=sys.stderr)
        return 3
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
