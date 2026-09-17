# Landing regression checks

Run from the repository root with Node.js, Python 3.10+ and the Python Playwright package. Browser scripts use Chromium at `/usr/bin/chromium`; adjust that executable path for your environment.

```sh
node tests/landing-data.cjs . /tmp/landing-data.json
python3 tests/landing-browser.py . /tmp/landing-browser
python3 tests/landing-calendar.py . /tmp/landing-calendar
python3 tests/landing-edges.py . /tmp/landing-edges /path/to/v24-baseline
```

The last argument to landing-edges.py is optional. Supply the v24 baseline to assert the exact 40px desktop ticket movement. A shorter browser smoke run accepts a comma-separated viewport list, for example `390,1440` as the third argument.

The offline fixture serves actual local assets and records outgoing navigation. It replaces `window.location.assign` in the fixture only, not in production code. External resources are blocked. These checks do not book tickets, test payment, contact Tutu or guarantee inventory. Tests write reports/screenshots to the given output directory, not the repository.
