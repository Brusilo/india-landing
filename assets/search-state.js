/* Shared RU/EN/HI search form state, including the selected tab.
   Only trip planning selections are stored on the user's device. */
(function(root){
  'use strict';
  const KEY='india-landing-search-state-v1';
  const allowed=['hotel','flight','train','bus','tour'];
  let memory={version:1};
  function decode(raw){
    if(!raw||raw.length>20000)return null;
    try{
      const obj=JSON.parse(raw);
      return obj&&typeof obj==='object'&&!Array.isArray(obj)&&obj.version===1?obj:null;
    }catch(_){return null}
  }
  function readStore(type){
    try{return decode(root[type]?.getItem(KEY))}catch(_){return null}
  }
  function read(){
    // A session fallback works in browsers that partition/deny localStorage.
    // Never overwrite a newer snapshot with a stale one during navigation.
    const options=[memory,readStore('localStorage'),readStore('sessionStorage')]
      .filter(value=>value&&value.version===1);
    const best=options.reduce((a,b)=>Number(b.updatedAt||0)>Number(a.updatedAt||0)?b:a,{version:1});
    memory=best;
    return best;
  }
  function patch(changes){
    const next=Object.assign({},read(),changes,{version:1,updatedAt:Date.now()});
    memory=next;
    const value=JSON.stringify(next);
    for(const type of ['localStorage','sessionStorage']){
      try{root[type]?.setItem(KEY,value)}catch(_){/* storage may be disabled */}
    }
  }
  root.TUTU_SEARCH_PERSIST={
    read,
    saveStandard(standard,standardMode){
      if(!['hotel','flight','train','bus'].includes(standardMode))return;
      patch({standard,standardMode});
    },
    saveTour(tour){patch({tour})},
    setActive(mode){
      if(allowed.includes(mode))patch({activeMode:mode});
    }
  };
  // Persist the latest DOM-backed state synchronously before a language URL
  // navigation. pagehide remains a secondary safeguard.
  document.addEventListener('click',function(e){
    if(!e.target.closest('.lang a[hreflang]'))return;
    root.TUTU_SAVE_STANDARD_NOW?.();
    root.TUTU_SAVE_TOUR_NOW?.();
    const tour=document.querySelector('.transport .tours-tab.is-active');
    const current=tour?'tour':document.querySelector('form.search-v2')?.dataset.mode;
    if(current)root.TUTU_SEARCH_PERSIST.setActive(current);
  },true);
})(window);
