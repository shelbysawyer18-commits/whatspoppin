import {db,currentUser,oauth,initials,imageUrl} from '/assets/wp-auth.js';
const $=id=>document.getElementById(id);const setStatus=s=>{$('status').textContent=s||''};
const switchView=(show)=>{for(const id of ['guest','home'])$(id).hidden=id!==show;$('loading').hidden=true};
$('choose').onclick=()=>{$('providers').hidden=false};
$('google').onclick=()=>run(()=>oauth('google'));$('x').onclick=()=>run(()=>oauth('x'));
$('linkGoogle').onclick=()=>run(()=>oauth('google',true));$('linkX').onclick=()=>run(()=>oauth('x',true));
$('logout').onclick=()=>run(async()=>{(await db()).auth.signOut().then(()=>location.href='/')});
async function run(f){try{setStatus('Connecting…');await f()}catch(e){setStatus(e.message||'Could not connect')}}
function showCard(review){let a=document.createElement('article');a.className='card';const img=document.createElement('img');img.src=imageUrl(review.card_path);img.alt=`Review card: ${review.movie_title}`;img.loading='lazy';a.append(img);let title=document.createElement('h3');title.textContent=review.movie_title;a.append(title);let details=document.createElement('p');details.textContent=[review.score?review.score+'/5 bags':null,new Date(review.created_at).toLocaleDateString()].filter(Boolean).join(' · ');a.append(details);return a}
async function load(){try{const c=await db(),user=await currentUser();if(!user){switchView('guest');return}
 const {data:p,error:pe}=await c.from('profiles').select('id,username,display_name,bio,avatar_url').eq('user_id',user.id).maybeSingle();
 if(pe)console.warn('Existing profile:',pe);
 // First login goes to the original full snack/profile editor, not a duplicate form.
 if(!p){location.replace('/#profile');return;}
 switchView('home');$('display').textContent=p?.display_name||user.user_metadata?.full_name||user.user_metadata?.name||'Movie fan';$('handle').textContent=p?.username?'@'+p.username:'';$('bio').textContent=p?.bio||'';
 const photo=p?.avatar_url||user.user_metadata?.avatar_url||user.user_metadata?.picture;
 if(photo){const image=document.createElement('img');image.src=photo;image.alt='Your avatar';image.onerror=()=>{$('avatar').textContent=initials($('display').textContent)};$('avatar').replaceChildren(image)}else $('avatar').textContent=initials($('display').textContent);
 if(p?.id){const {data:pref}=await c.from('profile_concessions').select('name,sentiment').eq('profile_id',p.id).eq('sentiment','favorite');$('favorites').replaceChildren(...(pref||[]).map(row=>{const x=document.createElement('span');x.textContent=row.name;return x}))}
 const {data:reviews,error:re}=await c.from('wp_review_cards').select('id,movie_title,score,card_path,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
 $('cards').replaceChildren();if(re){$('cards').innerHTML='<div class="empty">Your review gallery needs the database setup included in the ZIP. Your existing movie drafts are still safe.</div>';console.warn(re);return}
 $('count').textContent=(reviews||[]).length+' saved';
 if(!reviews?.length){$('cards').innerHTML='<div class="empty">No exported review cards yet. Create a card, then download or view its PNG while signed in. It will automatically be saved here.</div>';return}
 $('cards').append(...reviews.map(showCard));
 }catch(e){$('loading').textContent='Could not load your profile.';setStatus(e.message||'Try refreshing');switchView('guest')}}
load();
