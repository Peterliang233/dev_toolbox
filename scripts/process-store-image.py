#!/usr/bin/env python3
"""
Create Chrome Web Store promo images from a source screenshot.

Requirements (as provided by user):
- Output size: 1280x800 or 640x400
- JPEG or 24-bit PNG (no alpha)

This script outputs 24-bit PNG (RGB, no alpha) and baseline JPEG by default.
"""

from __future__ import annotations

import argparse
from pathlib import Path


def center_crop_to_aspect(img, target_aspect: float):
  w, h = img.size
  if w <= 0 or h <= 0:
    raise ValueError("invalid image dimensions")

  src_aspect = w / h
  if abs(src_aspect - target_aspect) < 1e-6:
    return img

  if src_aspect > target_aspect:
    # too wide: crop width
    new_w = int(round(h * target_aspect))
    left = (w - new_w) // 2
    box = (left, 0, left + new_w, h)
  else:
    # too tall: crop height
    new_h = int(round(w / target_aspect))
    top = (h - new_h) // 2
    box = (0, top, w, top + new_h)

  return img.crop(box)


def save_rgb_png(img, out_path: Path):
  # Enforce 24-bit PNG (RGB, no alpha).
  rgb = img.convert("RGB")
  out_path.parent.mkdir(parents=True, exist_ok=True)
  rgb.save(out_path, format="PNG", optimize=True)

def save_rgb_jpeg(img, out_path: Path):
  rgb = img.convert("RGB")
  out_path.parent.mkdir(parents=True, exist_ok=True)
  # Baseline JPEG (non-progressive) for maximum compatibility.
  rgb.save(
    out_path,
    format="JPEG",
    quality=92,
    optimize=True,
    progressive=False,
    subsampling=0,
  )


def main():
  ap = argparse.ArgumentParser()
  ap.add_argument(
    "--src",
    default="public/icons/store_source.png",
    help="source image path (PNG/JPEG supported by Pillow)",
  )
  ap.add_argument(
    "--out-dir",
    default="public/icons",
    help="output directory",
  )
  ap.add_argument(
    "--prefix",
    default="store_promo",
    help="output filename prefix",
  )
  ap.add_argument(
    "--formats",
    default="png,jpg",
    help="comma-separated output formats: png,jpg",
  )
  args = ap.parse_args()

  src_path = Path(args.src)
  out_dir = Path(args.out_dir)
  prefix = args.prefix
  formats = [s.strip().lower() for s in str(args.formats).split(",") if s.strip()]
  if not formats:
    raise SystemExit("--formats must not be empty")

  try:
    from PIL import Image
  except Exception as e:
    raise SystemExit(
      "Pillow (PIL) is required. Try: python3 -m pip install Pillow"
    ) from e

  if not src_path.exists():
    raise SystemExit(f"source image not found: {src_path}")

  img = Image.open(src_path)
  img.load()

  target_aspect = 1280 / 800  # 1.6 (also matches 640/400)
  cropped = center_crop_to_aspect(img, target_aspect)

  # High quality downscale.
  resample = getattr(Image, "Resampling", Image).LANCZOS

  for w, h in [(1280, 800), (640, 400)]:
    resized = cropped.resize((w, h), resample=resample)
    if "png" in formats:
      out_path = out_dir / f"{prefix}_{w}x{h}.png"
      save_rgb_png(resized, out_path)
      print(f"wrote {out_path}")
    if "jpg" in formats or "jpeg" in formats:
      out_path = out_dir / f"{prefix}_{w}x{h}.jpg"
      save_rgb_jpeg(resized, out_path)
      print(f"wrote {out_path}")


if __name__ == "__main__":
  main()
