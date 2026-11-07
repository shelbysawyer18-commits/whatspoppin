import {db,currentUser,imageUrl,initials} from '/assets/wp-auth.js';
const $=id=>document.getElementById(id);
let client=null,user=null,connections=[],selected=null;
const say=s=>{$('feedback').textContent=s||''};
const el=(tag,cls,content)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(content!=null)n.textContent=String(content);return n};
const safeImg=(path)=>typeof path==='string'&&/^[0-9a-f-]{36}\/[A-Za-z0-9._/-]+$/.test(path)&&!path.includes('..')?imageUrl(path):null;
function button(label,handler,secondary=false){const b=el('button',secondary?'secondary':'',label);b.type='button';b.addEventListener('click',handler);return b}
function avatar(p){const url=typeof p.avatar_url==='string'&&/^https:\/\//.test(p.avatar_url)?p.avatar_url:null;
 if(url){const img=el('img','avatar');img.src=url;img.alt='';img.referrerPolicy='no-referrer';img.onerror=()=>img.replaceWith(el('span','avatar fallback',initials(p.display_name||p.username)));return img}
 return el('span','avatar fallback',initials(p.display_name||p.username));}
function name(p){return p.display_name||p.username||'Movie fan'}
function connected(p){return connections.find(c=>(c.requester===p.user_id||c.recipient===p.user_id))}
function relation(p){const r=connected(p);if(!r)return null;if(r.status==='accepted')return 'Friends';return r.requester===user?.id?'Request sent':'Respond to request'}
function personRow(p){const row=el('div','person');row.append(avatar(p));const info=el('div','person-info');info.append(el('strong','',name(p)),el('span','',p.username?'@'+p.username:''));row.append(info);
 const actions=el('div','person-actions');actions.append(button('View profile',()=>openProfile(p.user_id),true));
 if(user&&user.id!==p.user_id){const r=connected(p);if(!r)actions.append(button('Add Friend',()=>sendRequest(p.user_id)));
 else if(r.status==='pending'&&r.recipient===user.id){actions.append(button('Accept',()=>accept(r.id)));actions.append(button('Decline',()=>remove(r.id),true))}
 else if(r.status==='pending')actions.append(el('span','counter','Pending'));
 else actions.append(button('Remove friend',()=>remove(r.id),true));}
 row.append(actions);return row;}
async function rpc(name,args){const {data,error}=await client.rpc(name,args);if(error)throw error;return data||[]}
async function search(){const q=$('search').value.trim();if(q.length<2){say('Enter at least two characters to search.');return}say('Searching…');try{const rows=await rpc('wp_find_people',{q});$('matches').replaceChildren(...rows.map(personRow));if(!rows.length)$('matches').append(el('p','empty','No matching profiles yet.'));say('')}catch(e){console.error(e);say('Could not search profiles. Check that the Friends SQL was run in Supabase.')}}
async function syncFriends(){if(!user)return;const {data,error}=await client.from('wp_friends').select('id,requester,recipient,status,created_at').or(`requester.eq.${user.id},recipient.eq.${user.id}`).limit(500);if(error)throw error;connections=data||[];
 const pending=connections.filter(x=>x.recipient===user.id&&x.status==='pending');const accepted=connections.filter(x=>x.status==='accepted');
 $('requestCount').textContent=String(pending.length);$('friendCount').textContent=String(accepted.length);
 const ids=[...new Set([...pending.map(x=>x.requester),...accepted.map(x=>x.requester===user.id?x.recipient:x.requester)])];const results=await Promise.all(ids.map(async id=>(await rpc('wp_person',{user_uuid:id}))[0]||null));const people=new Map(results.filter(Boolean).map(p=>[p.user_id,p]));
 $('requests').replaceChildren(...pending.map(x=>people.get(x.requester)).filter(Boolean).map(personRow));if(!pending.length)$('requests').append(el('p','empty','No pending requests.'));
 $('friends').replaceChildren(...accepted.map(x=>people.get(x.requester===user.id?x.recipient:x.requester)).filter(Boolean).map(personRow));if(!accepted.length)$('friends').append(el('p','empty','No mutual friends yet. Find people above.'));
}
async function refresh(){try{await syncFriends();if($('search').value.trim().length>=2)await search();if(selected)await openProfile(selected)}catch(e){console.error(e);say(e.message||'Could not refresh friends')}}
async function sendRequest(id){if(!user){location.href='/account/';return}try{const {error}=await client.from('wp_friends').insert({requester:user.id,recipient:id,status:'pending'});if(error)throw error;say('Friend request sent.');await refresh()}catch(e){say(e.code==='23505'?'A request already exists between you.':(e.message||'Could not send friend request.'))}}
async function accept(id){try{const {error}=await client.from('wp_friends').update({status:'accepted'}).eq('id',id);if(error)throw error;say('You are now friends.');await refresh()}catch(e){say(e.message||'Could not accept request')}}
async function remove(id){try{const {error}=await client.from('wp_friends').delete().eq('id',id);if(error)throw error;say('Connection removed.');await refresh()}catch(e){say(e.message||'Could not remove request')}}
async function openProfile(id){selected=id;$('personSection').hidden=false;$('person').replaceChildren(el('p','empty','Loading public profile…'));$('cards').replaceChildren();$('personSection').scrollIntoView({behavior:'smooth',block:'start'});
 try{const p=(await rpc('wp_person',{user_uuid:id}))[0];if(!p){$('person').replaceChildren(el('p','empty','Profile unavailable.'));return}const head=el('div','person-head');head.append(avatar(p));const info=el('div');info.append(el('h2','',name(p)));if(p.username)info.append(el('p','',`@${p.username}`));if(p.bio)info.append(el('p','',p.bio));head.append(info);if(user?.id!==id){const r=connected(p);if(!r)head.append(button('Add Friend',()=>sendRequest(id)));
 else if(r.status==='pending'&&r.recipient===user?.id)head.append(button('Accept',()=>accept(r.id)));
 else head.append(el('span','counter',relation(p)));}
 $('person').replaceChildren(head);
 const {data,error}=await client.from('wp_review_cards').select('id,movie_title,score,card_path,created_at').eq('user_id',id).order('created_at',{ascending:false}).limit(200);if(error)throw error;
 if(!data?.length){$('cards').append(el('p','empty','No public review cards yet.'));return}
 for(const review of data){const box=el('article','review');const url=safeImg(review.card_path);if(url){const im=el('img');im.src=url;im.loading='lazy';im.alt=`Review card for ${review.movie_title}`;box.append(im)}else box.append(el('p','empty','Image unavailable'));
 box.append(el('h3','',review.movie_title));box.append(el('p','',`${review.score||'—'}/5 bags · ${new Date(review.created_at).toLocaleDateString()}`));$('cards').append(box)}
 }catch(e){console.error(e);$('person').replaceChildren(el('p','empty','Could not load this public profile.'));say(e.message||'Please try again.')}}
$('find').addEventListener('click',search);$('search').addEventListener('keydown',e=>{if(e.key==='Enter')search()});$('back').addEventListener('click',()=>{$('personSection').hidden=true;selected=null});
(async()=>{try{client=await db();user=await currentUser();$('loggedOut').hidden=!!user;$('signedIn').hidden=false;$('membersOnly').hidden=!user;$('friendListSection').hidden=!user;
 if(user)await syncFriends();const target=new URLSearchParams(location.search).get('user');if(target&&/^[0-9a-f-]{36}$/i.test(target))await openProfile(target);
 }catch(e){console.error(e);say(e.message||'Could not load community.')}})();
