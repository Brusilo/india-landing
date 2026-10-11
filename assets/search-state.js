/* Shared RU / EN / HI search state. The browser keeps only form selections,
   not payment or personal data. One origin and one storage key for all pages. */
(function(root){
  'use strict';
  const KEY='india-landing-search-state-v1';
  const allowed=['hotel','flight','train','bus','tour'];
  function read(){
    try{
      const raw=root.localStorage.getItem(KEY);
      if(!raw||raw.length>20000)return {version:1};
      const parsed=JSON.parse(raw);
      return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&parsed.version===1
        ?parsed:{version:1};
    }catch(_){return {version:1}}
  }
  function patch(changes){
    try{
      const next=Object.assign({},read(),changes,{version:1});
      root.localStorage.setItem(KEY,JSON.stringify(next));
    }catch(_){/* private browsing/storage blocked: form still works normally */}
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
})(window);
