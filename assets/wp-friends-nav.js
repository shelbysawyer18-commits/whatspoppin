// Only add a Friends link to the existing app navigation. Never create a second bar.
(()=>{
 function mount(){const nav=document.querySelector('.app-shell-nav');if(!nav||nav.querySelector('[data-wp-friends]'))return;
 const a=document.createElement('a');a.dataset.wpFriends='1';a.href='/friends/';a.textContent='Friends';a.className='wp-friends-tab';a.setAttribute('aria-label','Friends');
 nav.appendChild(a);
 }
 const css=document.createElement('style');css.textContent='.app-shell-nav .wp-friends-tab{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:9px 13px;border:1.5px solid #171412;text-decoration:none;font-weight:800;font-size:13px;color:#171412;background:#fff8ea}.app-shell-nav .wp-friends-tab:hover{background:#eac574}@media(max-width:600px){.app-shell-nav .wp-friends-tab{font-size:12px;padding:8px 10px}}';document.head.appendChild(css);
 new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});mount();
})();
