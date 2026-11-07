import {db,currentUser} from './wp-auth.js';
const notice=t=>{let e=document.getElementById('wp-save-toast');if(!e){e=document.createElement('div');e.id='wp-save-toast';Object.assign(e.style,{position:'fixed',bottom:'18px',right:'18px',zIndex:999999,background:'#171412',color:'#fff',font:'13px Arial',padding:'12px 16px',borderRadius:'7px',maxWidth:'min(340px,90vw)'});document.body.append(e)}e.textContent=t;setTimeout(()=>{if(e.textContent===t)e.remove()},6000)};
window.addEventListener('wp:card-exported',async event=>{
 const {png,draft}=event.detail||{};if(!png||!draft?.movie?.title)return;
 let user;try{user=await currentUser()}catch{return}if(!user)return;
 try{
   const client=await db();
   const resp=await fetch(png); const blob=await resp.blob();
   if(blob.size>9e6){notice('PNG is ready, but too large to save to your online profile.');return}
   const id=crypto.randomUUID(),path=`${user.id}/${id}.png`;
   const upload=await client.storage.from('wp-review-images').upload(path,blob,{contentType:'image/png',upsert:false});
   if(upload.error)throw upload.error;
   const words=Array.isArray(draft.words)?draft.words.map(x=>String(x||'').toLowerCase().trim()).filter(Boolean):[];
   const payload={id,user_id:user.id,movie_title:String(draft.movie.title),tmdb_id:draft.movie.tmdbId||null,movie_year:draft.movie.releaseYear?String(draft.movie.releaseYear):null,score:draft.bagScore||null,words,card_path:path};
   const saved=await client.from('wp_review_cards').insert(payload);
   if(saved.error){await client.storage.from('wp-review-images').remove([path]);throw saved.error}
   notice('Your review card was saved to your Profile.');
 }catch(e){console.warn('Online review save:',e);notice('PNG saved. Online profile save needs the database setup — see the ZIP instructions.')}
});
