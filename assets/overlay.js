(()=>{
  if(window.__wpNavUpgrade)return;window.__wpNavUpgrade=true;
  const style=document.createElement('style');style.textContent=`
  #wp-mini-nav{position:relative;z-index:9999;background:#f7f1e6;color:#181715;border-bottom:1px solid #d9d0bf;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;gap:clamp(8px,2vw,24px);padding:11px 12px;flex-wrap:wrap}
  #wp-mini-nav a{text-decoration:none;color:#171717;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:clamp(10px,1.7vw,12px);padding:7px 5px;border-bottom:2px solid transparent}
  #wp-mini-nav a:hover,#wp-mini-nav a:focus-visible{border-color:#c12b25}#wp-mini-nav a.wp-featured{color:#b32f2b}
  @media(max-width:520px){#wp-mini-nav{gap:4px 12px;padding:6px 6px}#wp-mini-nav a{font-size:10px}}
  /* Restraint: only card wrappers, not source photos or the PNG rendering layers. */
  .profile-editor{border-radius:14px!important}.account-panel{border-radius:14px!important}
  `;document.head.appendChild(style);
  function mount(){if(document.querySelector('#wp-mini-nav'))return;
    const bar=document.createElement('nav');bar.id='wp-mini-nav';bar.setAttribute('aria-label','What\'s Poppin main navigation');
    bar.innerHTML='<a href="/">Create card</a><a href="/flow/">Flow ↗</a><a href="/account/">Profile preview</a><a class="wp-featured" href="/movie-mondays/">Movie Mondays</a>';
    const root=document.getElementById('root');if(root)root.before(bar);else document.body.prepend(bar);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();