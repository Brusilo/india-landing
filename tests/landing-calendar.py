"""Calendar month boundaries and passenger limits, across all locales."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse, parse_qs
import datetime, json, sys
from fixture import load
root=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
checks=[]
def ok(value, message):
    assert value, message
    checks.append(message)
today=datetime.date.today()
if today.month==12:
    start=datetime.date(today.year,12,31);end=datetime.date(today.year+1,1,1)
else:
    end=datetime.date(today.year,today.month+1,1);start=end-datetime.timedelta(days=1)
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for lang,file in [('ru','index.html'),('en','index-en.html'),('hi','index-hi.html')]:
        for width in [390,1440]:
            page=browser.new_page(viewport={'width':width,'height':950})
            missing,errors=load(page,root,file)
            page.locator('.transport button').nth(0).click()
            field=page.locator('[data-role="destination"] input');field.fill('Moscow')
            page.locator('[data-trigger="date"]').click()
            page.locator(f'[data-date="{start.isoformat()}"]').click()
            ok(page.locator('.v2-calendar').is_visible(),f'{lang}/{width} incomplete hotel range stays open')
            page.locator('.cal-nav[data-step="1"]').click()
            page.locator(f'[data-date="{end.isoformat()}"]').click()
            ok(not page.locator('.v2-calendar').is_visible(),f'{lang}/{width} cross-month range closes')
            page.locator('[data-trigger="pax"]').click()
            page.locator('[data-person="child"][data-step="1"]').click()
            page.locator('[data-child-age="0"]').select_option('0')
            page.locator('[data-person="child"][data-step="1"]').click()
            page.locator('[data-child-age="1"]').select_option('6')
            ok(page.locator('[data-child-age="0"]').input_value()=='0',f'{lang}/{width} infant age survives re-render')
            for _ in range(5):page.locator('[data-person="adult"][data-step="1"]').click()
            ok(page.locator('[data-person="adult"][data-step="1"]').is_disabled(),f'{lang}/{width} adult limit disables control')
            ok(page.locator('[data-person="child"][data-step="1"]').is_disabled(),f'{lang}/{width} child limit disables control')
            page.locator('[data-trigger="pax"]').click()
            page.locator('.v2-submit').click()
            url=page.evaluate('window.__qaNavigations.at(-1)');query=parse_qs(urlparse(url).query)
            ok(query.get('room[0]')==['7.0.6'],f'{lang}/{width} hotel ages and adults retained')
            ok(query.get('check_in')==[start.isoformat()] and query.get('check_out')==[end.isoformat()],f'{lang}/{width} cross-month URL dates')
            page.locator('[data-trigger="date"]').click()
            page.locator(f'[data-date="{start.isoformat()}"]').click()
            page.locator(f'[data-date="{start.isoformat()}"]').click()
            ok(page.locator('.v2-calendar').is_visible(),f'{lang}/{width} same-day range not accepted as overnight stay')
            page.locator('.v2-submit').click()
            ok(len(page.evaluate('window.__qaAlerts'))==1,f'{lang}/{width} incomplete range gives localized validation')
            ok(not errors and not missing,f'{lang}/{width} no runtime or asset errors')
            page.close()
    browser.close()
report={'assertions':len(checks),'allPassed':True,'checks':checks}
(out/'calendar-results.json').write_text(json.dumps(report,indent=2));print('PASS',len(checks),'calendar/passenger checks')
