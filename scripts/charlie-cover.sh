#!/usr/bin/env bash
set -euo pipefail

# Imports Charlie's cover: copies IMG_0464.HEIC into the repo (if needed) and writes IMG_0464.jpg.
# Run from macOS Terminal (not Cursor's sandbox) if copying from ~/Downloads, or drop the HEIC
# into pictures/PRP/Charlie/ first, then run: npm run charlie:cover

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST_DIR="${REPO_ROOT}/pictures/PRP/Charlie"
HEIC_NAME="IMG_0464.HEIC"
JPG_NAME="IMG_0464.jpg"
HEIC_DEST="${DEST_DIR}/${HEIC_NAME}"
JPG_DEST="${DEST_DIR}/${JPG_NAME}"

mkdir -p "${DEST_DIR}"

if [[ -f "${HEIC_DEST}" ]]; then
  echo "Using existing ${HEIC_DEST}"
else
  SRC="${CHARLIE_COVER_HEIC:-${HOME}/Downloads/${HEIC_NAME}}"
  if [[ ! -f "${SRC}" ]]; then
    echo "Missing source HEIC." >&2
    echo "Either copy ${HEIC_NAME} into:" >&2
    echo "  ${DEST_DIR}/" >&2
    echo "Or set CHARLIE_COVER_HEIC to the full path of the file, then run again." >&2
    exit 1
  fi
  echo "Copying ${SRC} -> ${HEIC_DEST}"
  if ! cp "${SRC}" "${HEIC_DEST}" 2>/dev/null; then
    echo "" >&2
    echo "Could not read ${SRC} (macOS privacy often blocks automated access to Downloads)." >&2
    echo "Fix one of these, then run: npm run charlie:cover" >&2
    echo "  1) Drag ${HEIC_NAME} into: ${DEST_DIR}/" >&2
    echo "  2) Or run this script from Terminal.app (outside Cursor), same command." >&2
    echo "  3) Or set CHARLIE_COVER_HEIC to a readable path, e.g. after you moved the file." >&2
    exit 1
  fi
fi

TMP_JPG="${JPG_DEST}.tmp.jpg"
echo "Converting HEIC to JPEG -> ${TMP_JPG}"
sips -s format jpeg "${HEIC_DEST}" --out "${TMP_JPG}" >/dev/null

echo "Resizing for web and PDF (max edge 1600px, JPEG quality 78) -> ${JPG_DEST}"
sips -Z 1600 -s format jpeg -s formatOptions 78 "${TMP_JPG}" --out "${JPG_DEST}" >/dev/null
rm -f "${TMP_JPG}"

ls -la "${JPG_DEST}"
echo "Done."
