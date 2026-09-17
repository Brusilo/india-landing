from pathlib import Path

js = Path('assets/search-v2.js')
text = js.read_text(encoding='utf-8')
old_pref = """  function preferredPlaces(role){
    const ids=mode==='hotel'
      ?['ru-moscow','ru-saint-petersburg','ru-sochi','in-delhi','in-mumbai','ru-kazan']
      :role==='from'
        ?['in-delhi','in-mumbai','in-bengaluru','ru-moscow','ru-saint-petersburg','ru-kazan']
        :['ru-moscow','ru-saint-petersburg','ru-kazan','ru-sochi','in-delhi','in-mumbai'];
    return ids.map(id=>TUTU_PLACES.byId.get(id)).filter(Boolean);
  }
"""
new_pref = """  function preferredPlaces(role){
    let ids;
    if(mode==='hotel'){
      ids=['ru-moscow','ru-saint-petersburg','ru-sochi','in-delhi','in-mumbai','ru-kazan'];
    }else if(mode==='flight'){
      ids=role==='from'
        ?['in-delhi','in-mumbai','in-bengaluru','ru-moscow','ru-saint-petersburg','ru-kazan']
        :['ru-moscow','ru-saint-petersburg','ru-kazan','ru-sochi','in-delhi','in-mumbai'];
    }else{
      ids=role==='from'
        ?['ru-moscow','ru-saint-petersburg','ru-kazan','ru-sochi','ru-samara','ru-nizhny-novgorod']
        :['ru-moscow','ru-saint-petersburg','ru-kazan','ru-sochi','ru-samara','ru-yekaterinburg'];
    }
    return ids.map(id=>TUTU_PLACES.byId.get(id)).filter(Boolean);
  }
"""
old_results = "    const results=(q?TUTU_PLACES.search(q,6):preferredPlaces(role)).slice(0,6);"
new_results = "    const pool=q?TUTU_PLACES.search(q,30):preferredPlaces(role);\n    const results=pool.filter(p=>!window.TUTU_LINKS||window.TUTU_LINKS.supports(mode,p)).slice(0,6);"
if old_pref not in text:
    raise SystemExit('preferredPlaces block not found')
if old_results not in text:
    raise SystemExit('results line not found')
text = text.replace(old_pref, new_pref, 1).replace(old_results, new_results, 1)
js.write_text(text, encoding='utf-8')

for name in ['index.html','index-en.html','index-hi.html']:
    p=Path(name)
    s=p.read_text(encoding='utf-8')
    s=s.replace('assets/tutu-link-builder.js?v=20260917-tutu-links-1','assets/tutu-link-builder.js?v=20260917-tutu-links-2')
    s=s.replace('assets/search-v2.js?v=20260917-tutu-links-1','assets/search-v2.js?v=20260917-tutu-links-2')
    p.write_text(s,encoding='utf-8')
