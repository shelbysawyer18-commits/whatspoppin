import {db,currentUser,oauth} from './wp-auth.js';
// Do not obscure callback URLs while an OAuth redirect is resolving.
if(!location.hash.startsWith('#access_token') && !location.search.includes('code=')){
  (async()=>{try{const u=await currentUser();if(u)return;}catch(e){console.warn('Auth status:',e)}
    // All visitors see a single sign-in screen until they choose to browse as a guest.
    const gate=document.createElement('div');gate.id='wp-gate';gate.innerHTML=`<div class="inner"><h1>WHAT'S <span>POPPIN?</span></h1><p>Your movies and snacks reviewed</p><button id="wp-gate-open">Sign In / Sign Up</button><div class="choices" id="wp-gate-choices"><button id="wp-gate-google">Continue with Google</button><button id="wp-gate-x">Continue with X</button></div><div class="error" id="wp-gate-error" role="status"></div><div class="small"><button id="wp-gate-guest">Explore without an account</button></div></div>`;
    document.body.append(gate);
    gate.querySelector('#wp-gate-open').onclick=()=>{gate.querySelector('#wp-gate-choices').classList.toggle('is-open');gate.querySelector('#wp-gate-open').style.display='none'};
    gate.querySelector('#wp-gate-guest').onclick=()=>gate.remove();
    const go=p=>async()=>{try{await oauth(p)}catch(e){gate.querySelector('#wp-gate-error').textContent=e.message||'Could not connect. Try again.'}};
    gate.querySelector('#wp-gate-google').onclick=go('google');gate.querySelector('#wp-gate-x').onclick=go('x');
  })();
}
