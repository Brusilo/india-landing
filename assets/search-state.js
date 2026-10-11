/* Carry trip-planning choices once when switching RU/EN/HI.
   Reloads and fresh visits always begin with the default empty Flight form.
   State stays in memory during ordinary use and never goes to localStorage. */
(function(root){
  'use strict';
  const HANDOFF='india-landing-language-handoff-v2';
  const LEGACY='india-landing-search-state-v1';
  const ALLOWED=['hotel','flight','train','bus','tour'];
  const MAX_AGE_MS=120000;

  function readIncoming(){
    let raw=null;
    try{
      raw=root.sessionStorage.getItem(HANDOFF);
      // Consume before restoring a single field: F5 cannot replay the transfer.
      root.sessionStorage.removeItem(HANDOFF);
    }catch(_){return null}
    if(!raw||raw.length>24000)return null;
    try{
      const transfer=JSON.parse(raw);
      if(transfer?.version!==2||
         transfer.target!==root.location.pathname||
         !Number.isFinite(transfer.createdAt)||
         transfer.createdAt>Date.now()+5000||
         Date.now()-transfer.createdAt>MAX_AGE_MS)return null;
      const data=transfer.state;
      return data&&data.version===1&&
             typeof data==='object'&&!Array.isArray(data) ? data:null;
    }catch(_){return null}
  }

  let memory=readIncoming()||{version:1};
  // Discard persistent snapshots created by the old implementation.
  for(const type of ['localStorage','sessionStorage']){
    try{root[type]?.removeItem(LEGACY)}catch(_){}
  }

  function read(){return memory}
  function patch(changes){memory={...memory,...changes,version:1}}
  root.TUTU_SEARCH_PERSIST={
    read,
    saveStandard(standard,standardMode){
      if(!['hotel','flight','train','bus'].includes(standardMode))return;
      patch({standard,standardMode});
    },
    saveTour(tour){patch({tour})},
    setActive(mode){if(ALLOWED.includes(mode))patch({activeMode:mode})}
  };

  // Explicit language navigation is the ONLY point at which state is written.
  document.addEventListener('click',e=>{
    const anchor=e.target.closest?.('.lang a[hreflang]');
    if(!anchor||e.defaultPrevented||e.button!==0||
       e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    let destination;
    try{destination=new URL(anchor.href,root.location.href)}catch(_){return}
    if(destination.origin!==root.location.origin||
       !/\/(?:index|index-ru|index-hi)\.html$/.test(destination.pathname)||
       destination.pathname===root.location.pathname)return;

    // Flush the most recently edited fields before navigating away.
    root.TUTU_SAVE_STANDARD_NOW?.();
    root.TUTU_SAVE_TOUR_NOW?.();
    const mode=document.querySelector('.transport .tours-tab.is-active')
      ?'tour':document.querySelector('form.search-v2')?.dataset.mode;
    if(ALLOWED.includes(mode))root.TUTU_SEARCH_PERSIST.setActive(mode);

    try{
      const transfer=JSON.stringify({
        version:2,target:destination.pathname,createdAt:Date.now(),state:read()
      });
      if(transfer.length<=24000)root.sessionStorage.setItem(HANDOFF,transfer);
    }catch(_){/* Session storage blocked: ordinary navigation still works */}
  },true);
})(window);
