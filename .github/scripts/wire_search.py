from pathlib import Path

files = [Path('index.html'), Path('index-en.html'), Path('index-hi.html')]
include_old = '<script>\nconst CONFIG = {'
include_new = '<script src="assets/search-places.js"></script>\n<script>\nconst CONFIG = {'
start_marker = "  function closeSuggest(){document.querySelectorAll('.search-suggest').forEach(x=>x.hidden=true)}function renderSuggest(input){"
end_marker = "  swap.addEventListener('click',()=>{const x=from.value;from.value=to.value;to.value=x});"
new_block = r'''  function closeSuggest(){document.querySelectorAll('.search-suggest').forEach(x=>x.hidden=true)}
  function escapeAttr(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  function clearPlaceMeta(input){['placeId','canonical','country','iata'].forEach(k=>delete input.dataset[k])}
  function renderSuggest(input){
    if(mode==='hotel')return;
    const box=input.closest('.field').querySelector('.search-suggest'),q=input.value.trim();
    let items=[];
    if(mode==='flight'&&window.TUTU_PLACES){
      const kind=input===from?'from':'to';
      const found=q?TUTU_PLACES.search(q,6):TUTU_PLACES.popularFor(kind);
      items=found.map(p=>{const d=TUTU_PLACES.display(p);return {value:d.name,main:d.name,meta:d.meta,id:p.id,canonical:p.canonical,country:p.country,iata:p.iata.join(',')}})
    }else{
      const nq=q.toLocaleLowerCase();
      items=(places[mode]||[]).filter(x=>(x[0]+' '+x[1]).toLocaleLowerCase().includes(nq)).slice(0,6).map(x=>({value:x[0],main:x[0],meta:x[1]}))
    }
    box.innerHTML=items.map(x=>'<button type="button" class="suggest-item" data-value="'+escapeAttr(x.value)+'"'+(x.id?' data-place-id="'+escapeAttr(x.id)+'" data-canonical="'+escapeAttr(x.canonical)+'" data-country="'+escapeAttr(x.country)+'" data-iata="'+escapeAttr(x.iata)+'"':'')+'><span class="suggest-main">'+x.main+'</span><span class="suggest-meta">'+x.meta+'</span></button>').join('');
    box.hidden=!items.length
  }
  [from,to].forEach(input=>{input.addEventListener('focus',()=>{closeSuggest();renderSuggest(input)});input.addEventListener('input',()=>{clearPlaceMeta(input);renderSuggest(input)});input.closest('.field').querySelector('.search-suggest').addEventListener('click',e=>{const item=e.target.closest('.suggest-item');if(!item)return;input.value=item.dataset.value;clearPlaceMeta(input);if(item.dataset.placeId){input.dataset.placeId=item.dataset.placeId;input.dataset.canonical=item.dataset.canonical||'';input.dataset.country=item.dataset.country||'';input.dataset.iata=item.dataset.iata||''}item.closest('.search-suggest').hidden=true})});
  swap.addEventListener('click',()=>{const keys=['placeId','canonical','country','iata'],x=from.value,meta={};keys.forEach(k=>meta[k]=from.dataset[k]||'');from.value=to.value;to.value=x;keys.forEach(k=>{const v=to.dataset[k]||'';if(v)from.dataset[k]=v;else delete from.dataset[k];if(meta[k])to.dataset[k]=meta[k];else delete to.dataset[k]})});'''

for path in files:
    text = path.read_text(encoding='utf-8')
    if 'assets/search-places.js' not in text:
        if include_old not in text:
            raise SystemExit(f'Main script marker not found: {path}')
        text = text.replace(include_old, include_new, 1)
    if start_marker not in text:
        raise SystemExit(f'Autocomplete start not found: {path}')
    start = text.index(start_marker)
    end = text.index(end_marker, start) + len(end_marker)
    text = text[:start] + new_block + text[end:]
    path.write_text(text, encoding='utf-8')

db = Path('assets/search-places.js')
text = db.read_text(encoding='utf-8')
text = text.replace("['KG','Бишкек','Bishkek','बिश्केक','BSZ','Frunze Фрунзе',1]", "['KG','Бишкек','Bishkek','बिश्केक','FRU','Manas Frunze Фрунзе',1]")
text = text.replace("['KG','Баткен','Batken','बतकेन','БAT','',4]", "['KG','Баткен','Batken','बतकेन','BTC','',4]")
db.write_text(text, encoding='utf-8')

for path in files:
    text = path.read_text(encoding='utf-8')
    assert text.count('assets/search-places.js') == 1, path
    assert 'TUTU_PLACES.search(q,6)' in text, path
