import {db,imageUrl} from '/assets/wp-auth.js';
// Prefer actual user-submitted review cards for word discovery. If none exist,
// keep the existing functioning curated poster discovery experience.
const modal=document.createElement('div');modal.hidden=true;
modal.style.cssText='position:fixed;inset:0;overflow:auto;background:#f3ead8;z-index:200000;padding:22px;color:#171412;font:14px Arial,sans-serif';
modal.innerHTML='<div style="max-width:1100px;margin:0 auto"><button id="wp-community-back" style="padding:12px;border:1px solid #111;background:#fff8e8;font-weight:900;cursor:pointer">← Back to Flow</button><h2 id="wp-community-title" style="font-size:clamp(30px,7vw,65px)"></h2><p>Real review cards posted by the What’s Poppin? community.</p><div id="wp-community-cards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));gap:14px"></div></div>';
document.body.append(modal);modal.querySelector('#wp-community-back').onclick=()=>modal.hidden=true;
const bypass=new WeakSet();
document.addEventListener('click',async e=>{const word=e.target.closest?.('.word');if(!word)return;
 if(bypass.has(word)){bypass.delete(word);return;}
 const selected=word.textContent.trim().toLowerCase();if(!selected)return;
 e.stopImmediatePropagation();e.preventDefault();
 try{const client=await db();const {data,error}=await client.from('wp_review_cards').select('movie_title,card_path,words,score').contains('words',[selected]).limit(36);if(error||!data?.length){bypass.add(word);word.click();return;}
 modal.querySelector('#wp-community-title').textContent=selected.toUpperCase();const grid=modal.querySelector('#wp-community-cards');grid.replaceChildren();
 data.forEach(r=>{const item=document.createElement('article');item.style.cssText='border:1px solid #cdbb9b;background:#fff8eb;padding:10px;border-radius:8px';const image=document.createElement('img');image.src=imageUrl(r.card_path);image.alt='Community review of '+r.movie_title;image.style.cssText='width:100%;height:auto;aspect-ratio:8/5;object-fit:contain';const label=document.createElement('strong');label.textContent=r.movie_title;item.append(image,label);grid.append(item)});
 modal.hidden=false;
 }catch(e){console.warn('Community Flow unavailable, falling back to discovery:',e);bypass.add(word);word.click()}
},true);
