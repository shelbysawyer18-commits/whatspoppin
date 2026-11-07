import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './wp-config.js';
let cached;
export async function db(){
  if(!cached)cached=import('https://esm.sh/@supabase/supabase-js@2.57.4').then(m=>m.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}}));
  return cached;
}
export async function currentUser(){const client=await db();const {data,error}=await client.auth.getUser();if(error && !/session missing/i.test(error.message))throw error;return data.user}
export async function oauth(provider,link=false){const client=await db(); const opts={redirectTo:location.origin+'/account/'};
 if(link){const {error}=await client.auth.linkIdentity({provider,options:opts});if(error)throw error;return}
 const {error}=await client.auth.signInWithOAuth({provider,options:opts});if(error)throw error;
}
export function initials(s){return (s||'?').trim().slice(0,1).toUpperCase()||'?'}
export const imageUrl=(path)=>SUPABASE_URL+'/storage/v1/object/public/wp-review-images/'+path.split('/').map(encodeURIComponent).join('/');
