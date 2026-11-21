"""Giao diện dòng lệnh cho pipeline xử lý ảnh SmartScan."""

import argparse
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


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.canny_low >= args.canny_high:
        parser.error("canny-low phải nhỏ hơn canny-high.")

    try:
        import cv2  # noqa: F401 — xác nhận OpenCV đã được cài trước khi xử lý.
    except ImportError:
        print("Thiếu OpenCV. Hãy cài server/python/requirements.txt.", file=sys.stderr)
        return 1

    print("Pipeline OpenCV chưa được triển khai.", file=sys.stderr)
    return 3


if __name__ == "__main__":
    raise SystemExit(main())
