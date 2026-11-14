Dev tools (not shipped in the APK/EXE/web builds: .github is excluded).
tests/        Playwright regression suites. Run everything: bash .github/dev-tools/run-all.sh
f1..f19       earlier feature suites (kept as they were; f17/f4_static updated to current behaviour)
f5            board/canvas suite: the shortcut checks now click the item's own centre (deterministic), 53/53
r_*           rebuilt suites: motion, media player, internet status, growth toolkit, cell tabs/docx/frames, every view + guide at phone width
ex1, ex2      visual identity explorer (sources, keys, famous sites tab)
el1.js        desktop embedded browser, run inside real Electron: electron binary + xvfb-run, see comments inside
monkey.py     random click fuzzing: python3 monkey.py <seed...>
