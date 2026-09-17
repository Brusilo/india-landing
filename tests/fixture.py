from pathlib import Path
from urllib.parse import urlparse, unquote
import mimetypes

def load(page, root, filename, navigation=True):
    missing=[];errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    def serve(route):
        u=urlparse(route.request.url)
        if u.netloc!='landing.test':route.abort();return
        p=(Path(root)/unquote(u.path.lstrip('/'))).resolve()
        if not p.is_file() or not p.is_relative_to(Path(root).resolve()):
            missing.append(str(p));route.fulfill(status=404,body='Missing local fixture');return
        ct=mimetypes.guess_type(str(p))[0] or 'application/octet-stream'
        if p.suffix=='.js' and navigation:
            body=p.read_text().replace('window.location.assign(', 'window.__qaNavigate(')
            route.fulfill(body=body,content_type=ct)
        else:route.fulfill(path=str(p),content_type=ct)
    page.route('**/*',serve)
    html=(Path(root)/filename).read_text()
    html=html.replace('<head>','<head><base href="https://landing.test/"><script>window.__qaNavigations=[];window.__qaNavigate=(url)=>window.__qaNavigations.push(String(url));window.__qaAlerts=[];window.alert=(msg)=>window.__qaAlerts.push(String(msg));</script>',1)
    page.set_content(html,wait_until='load');page.evaluate('document.fonts.ready')
    return missing,errors
