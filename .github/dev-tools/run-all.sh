#!/bin/bash
# Full regression for My Smart Assistant. Needs: python3 + playwright (+ Pillow, python-docx optional), chromium.
# Usage: bash .github/dev-tools/run-all.sh            (motion off, the default for tests)
#        MSA_MOTION=full bash .github/dev-tools/run-all.sh   (animations on, what users get)
# The embedded-browser test (el1.js) needs Electron + xvfb; see the header of tests/el1.js.
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"; python3 -m http.server 8765 >/dev/null 2>&1 & SRV=$!
sleep 1
mkdir -p /tmp/bdimg && python3 - <<'PY'
from PIL import Image
for i in range(8): Image.new('RGB',(160+i*10,120+i*8),(30*i%255,90,200-20*i)).save('/tmp/bdimg/i%d.png'%i)
PY
cd "$ROOT/.github/dev-tools/tests"; : > /tmp/reg.log
for t in f1 f2 f3 f4_static f5 f6 f7 f8 f9 f10 f11 f12 f13 f14 f15 f16 f17 f18 f19 r_motion r_media r_net r_growth r_cell r_views r_sched ex1 ex2; do
  r=$(timeout 280 python3 $t.py 2>&1 | grep -E "passed|FAIL|Traceback" | head -4 | tr '\n' ' '); echo "$t: $r" | tee -a /tmp/reg.log
done
kill $SRV 2>/dev/null
echo "---- anything not 'N/N passed' is a problem:"; grep -v -E ": ([0-9]+)/\1 passed *$" /tmp/reg.log || echo none
