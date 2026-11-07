import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
const configured=Boolean(SUPABASE_URL&&SUPABASE_ANON_KEY);
let supabase=null;
const $=id=>document.getElementById(id);let user=null, profile=null;
const snackNames=['Popcorn','Sour Patch Kids','M&M’s','Skittles','Twizzlers','Nerds','Reese’s','Nachos','Icee','Soda'];let picked=new Set();
function show(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));window.scrollTo(0,0)}
document.querySelectorAll('[data-show]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.show)));
function status(id,message){$(id).textContent=message}
function renderSnacks(){ $('snacks').replaceChildren();snackNames.forEach(s=>{const b=document.createElement('button');b.type='button';b.textContent=s;b.classList.toggle('on',picked.has(s));b.setAttribute('aria-pressed',picked.has(s));b.onclick=()=>{picked.has(s)?picked.delete(s):picked.add(s);renderSnacks()};$('snacks').appendChild(b)})}
renderSnacks();
async function login(provider){if(!supabase){status('loginstatus','Account connections are not configured yet. Add your Supabase project settings to enable secure sign-in.');return}status('loginstatus','Redirecting to '+(provider==='google'?'Google':'X')+'…');const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:location.origin+'/account/'}});if(error)status('loginstatus',error.message)}
$('google').onclick=()=>login('google');$('twitter').onclick=()=>login('twitter');
async function getProfile(){const {data,error}=await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle();if(error)throw error;profile=data;return data}
async function refresh(){if(!supabase){show('welcome');return}try{const {data:{session},error}=await supabase.auth.getSession();if(error)throw error;user=session?.user||null;if(!user){show('welcome');return}await getProfile();if(profile?.onboarding_complete){renderProfile();show('profile')}else{populateForm();show('setup')}}catch(e){status('loginstatus',e.message);show('signin')}}
function populateForm(){ $('name').value=profile?.display_name||user?.user_metadata?.full_name||user?.user_metadata?.name||'';$('handle').value=profile?.username||'';$('bio').value=profile?.bio||'';picked=new Set(profile?.favorite_snacks||[]);renderSnacks()}
function renderProfile(){const name=profile.display_name||'Movie fan';$('profilename').textContent=name.toUpperCase();$('profilehandle').textContent='@'+profile.username;$('profilebio').textContent=profile.bio||'';$('avatar').textContent=name[0]?.toUpperCase()||'?';$('profilesnacks').replaceChildren();(profile.favorite_snacks||[]).forEach(s=>{const el=document.createElement('span');el.className='tagset-item';el.style.cssText='padding:8px;border:1px solid #d9d0c3;border-radius:3px;font-size:12px';el.textContent=s;$('profilesnacks').appendChild(el)});renderReviews()}
async function renderReviews(){const parent=$('reviewlist');parent.className='empty';parent.replaceChildren();const heading=document.createElement('strong');heading.textContent='Your review cards will live here.';parent.appendChild(heading);const hint=document.createElement('p');hint.className='muted';hint.textContent='Once the card builder is connected, published cards save to this account.';parent.appendChild(hint);if(!supabase)return;const {data,error}=await supabase.from('reviews').select('id,movie_title,review_text,card_image_url,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(60);if(error){hint.textContent='Reviews could not be loaded.';return}if(!data?.length)return;parent.className='';parent.replaceChildren();const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:16px';data.forEach(r=>{const article=document.createElement('article');article.style.cssText='border:1px solid #ddd1c1;padding:10px;background:#fff';if(r.card_image_url){const img=document.createElement('img');img.src=r.card_image_url;img.alt='Review card for '+r.movie_title;img.loading='lazy';img.style.cssText='display:block;width:100%;height:auto';article.appendChild(img)}const title=document.createElement('strong');title.textContent=r.movie_title;article.appendChild(title);grid.appendChild(article)});parent.appendChild(grid)}
$('profileform').addEventListener('submit',async e=>{e.preventDefault();if(!user){status('savestatus','Please sign in first.');return}const username=$('handle').value.trim().toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(username)){status('savestatus','Username must be 3–24 letters, numbers or underscores.');return}const payload={id:user.id,username,display_name:$('name').value.trim(),bio:$('bio').value.trim(),favorite_snacks:[...picked],onboarding_complete:true};status('savestatus','Saving…');const {error}=await supabase.from('profiles').upsert(payload,{onConflict:'id'});if(error){status('savestatus',error.code==='23505'?'That username is already taken.':error.message);return}profile=payload;renderProfile();show('profile')});
$('edit').onclick=()=>{populateForm();show('setup')};$('signout').onclick=async()=>{if(supabase){await supabase.auth.signOut();user=null;profile=null;show('welcome')}};
async function link(provider){if(!supabase){status('profilestatus','Configure account providers first.');return}const {error}=await supabase.auth.linkIdentity({provider,options:{redirectTo:location.origin+'/account/'}});if(error)status('profilestatus',error.message)}
$('linkx').onclick=()=>link('twitter');$('linkgoogle').onclick=()=>link('google');
// The welcome screen must work even when the auth library is unavailable.
// Initialize the account backend only if public project settings exist.
if(configured){
  import('https://esm.sh/@supabase/supabase-js@2').then(({createClient})=>{
    supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
    supabase.auth.onAuthStateChange(()=>{setTimeout(refresh,0)});
    refresh();
  }).catch(()=>{status('loginstatus','Unable to load the sign-in service. Please try again later.');});
}else{
  refresh();
}

