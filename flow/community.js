import {db,imageUrl} from '/assets/wp-auth.js';

// Public review-card discovery. This file never writes to the database.
const $ = id => document.getElementById(id);
const status = $('communityStatus');
let reviews = [];
let chosenWord = '';

const normalize = value => String(value ?? '').trim().toLocaleLowerCase('en-US');
const wordsFor = review => [...new Set((Array.isArray(review.words) ? review.words : [])
  .map(normalize).filter(w => w && w.length <= 40))];
const safeImageUrl = path => {
  if (typeof path !== 'string' || !/^[0-9a-f-]{36}\/[a-zA-Z0-9._/-]+$/i.test(path) || path.includes('..')) return null;
  return imageUrl(path);
};
function show(id) { window.wpFlowShow?.(id); }
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
let fetchEpoch=0;
async function loadReviews() {
  const epoch=++fetchEpoch;
  status.textContent = 'Loading community reviews…';
  try {
    const client = await db();
    const entries = [];
    // Supabase paginates at 1,000 rows by default. Avoid silently treating
    // the first page as the entire community.
    const pageSize = 500;
    for (let page = 0; page < 20; page++) {
      const { data, error } = await client.from('wp_review_cards')
        .select('id,user_id,movie_title,tmdb_id,score,words,card_path,created_at')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      entries.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }
    if(epoch!==fetchEpoch)return;
    reviews = entries.filter(row => row && typeof row.movie_title === 'string');
    const counts = new Map();
    for (const review of reviews) for (const word of wordsFor(review)) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    window.wpFlowSetWords?.(ranked.map(([word,count]) => ({word,count})));
    status.textContent = ranked.length
      ? `${reviews.length.toLocaleString()} public review cards · ${ranked.length} different words · word size reflects review count`
      : 'No community review words yet. Publish a review card with three words to start Flow.';
  } catch (error) {
    console.error('Flow could not read public community reviews', error);
    if(epoch===fetchEpoch)window.wpFlowSetWords?.([]);
    if(epoch===fetchEpoch)status.textContent = 'Community reviews could not load. Please refresh to try again.';
  }
}
function movieGroups(word) {
  const groups = new Map();
  for (const review of reviews) {
    if (!wordsFor(review).includes(word)) continue;
    const movieKey = review.tmdb_id ? `tmdb:${review.tmdb_id}` : `title:${normalize(review.movie_title)}`;
    if (!groups.has(movieKey)) groups.set(movieKey, { title: review.movie_title, tmdbId: review.tmdb_id, items: [] });
    groups.get(movieKey).items.push(review);
  }
  return [...groups.values()].sort((a,b) => b.items.length - a.items.length || a.title.localeCompare(b.title));
}
// The actual exported What's Poppin? review PNG is the artwork for each result.
// Never substitute TMDB posters or fabricated artwork.
function makeReviewImage(review) {
  const frame = element('div', 'flow-review-preview');
  const src = safeImageUrl(review.card_path);
  if (!src) {
    frame.append(element('span', 'missing', 'Review image unavailable'));
    return frame;
  }
  const img = new Image();
  img.alt = `Review card for ${review.movie_title}`;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', () => frame.replaceChildren(element('span', 'missing', 'Review image unavailable')));
  img.src = src;
  frame.append(img);
  return frame;
}
window.wpFlowOpenCommunity = function(rawWord) {
  const word = normalize(rawWord);
  chosenWord = word;
  const matches = reviews.filter(review => wordsFor(review).includes(word));
  $('resultWord').textContent = word;
  $('matchCount').textContent = `${matches.length} ${matches.length === 1 ? 'review card' : 'review cards'}`;
  $('filmStatus').textContent = matches.length ? '' : 'No published review cards for this word yet.';
  const grid = $('filmGrid');
  grid.replaceChildren();
  for (const review of matches) {
    const card = element('button', 'film flow-review-result');
    card.type = 'button';
    card.setAttribute('aria-label', `View community reviews for ${review.movie_title}`);
    card.append(makeReviewImage(review));
    card.append(element('h3', '', review.movie_title));
    const subtitle = Number.isInteger(review.score) ? `${review.score}/5 bags · View reviews` : 'View reviews';
    card.append(element('small', '', subtitle));
    card.addEventListener('click', () => {
      // Keep the existing movie detail view: it shows all saved reviews for this film.
      const group = movieGroups(word).find(group => group.items.some(item => item.id === review.id));
      if (group) openMovie(group);
    });
    grid.append(card);
  }
  show('results');
};
function openMovie(movie) {
  const host = $('movieDetail');
  host.replaceChildren();
  const wrap = element('div', 'flow-community-details');
  wrap.append(element('div', 'kicker', `COMMUNITY REVIEWS / ${chosenWord.toUpperCase()}`));
  wrap.append(element('h2', '', movie.title));
  wrap.append(element('p', 'status', `${movie.items.length} published ${movie.items.length === 1 ? 'card' : 'cards'} that use “${chosenWord}”`));
  const cards = element('div', 'flow-card-gallery');
  for (const review of movie.items) {
    const card = element('article', 'flow-real-card');
    const src = safeImageUrl(review.card_path);
    if (src) {
      const img = new Image();
      img.loading = 'lazy';
      img.alt = `What's Poppin? review card for ${review.movie_title}`;
      img.src = src;
      card.append(img);
    } else card.append(element('p', 'status', 'Card image unavailable'));
    const meta = element('div', 'flow-real-meta');
    if (Number.isInteger(review.score)) meta.append(element('strong', '', `${review.score}/5 bags`));
    const date = new Date(review.created_at);
    if (!Number.isNaN(date.valueOf())) meta.append(element('span', '', date.toLocaleDateString()));
    if(review.user_id){const author=element('a','flow-review-author','View reviewer profile');author.href='/friends/?user='+encodeURIComponent(review.user_id);meta.append(author)}
    card.append(meta);
    cards.append(card);
  }
  wrap.append(cards);
  host.append(wrap);
  show('movie');
}
// Keep rendering in the same Flow screens; no overlay covering site navigation.
const css = document.createElement('style');
css.textContent = `.flow-review-result{min-width:0}.flow-review-preview{width:100%;aspect-ratio:8/5;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1.5px solid #171412;background:#fff8ea;box-shadow:3px 4px 0 #17141216}.flow-review-preview img{display:block;width:100%;height:100%;object-fit:contain}.flow-review-result:hover .flow-review-preview,.flow-review-result:focus-visible .flow-review-preview{border-color:#c4282b}.flow-review-preview .missing{font-size:12px;color:#6b6258;text-align:center;padding:10px}.flow-card-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:20px;margin-top:25px}.flow-real-card{min-width:0;border:1.5px solid #171412;background:#fff8ea;padding:12px;box-shadow:4px 4px 0 #17141213}.flow-real-card img{display:block;width:100%;height:auto;aspect-ratio:8/5;object-fit:contain;background:#f3ead8}.flow-real-meta{display:flex;gap:12px;justify-content:space-between;color:#6b6258;margin-top:10px;font-size:12px}.flow-community-details h2{font-family:Arial Black,sans-serif;font-size:clamp(27px,5vw,48px);margin:12px 0}`;
document.head.append(css);
let latestLoad=0;
async function refreshIfNeeded(force=false){if(!force && Date.now()-latestLoad<25000)return;latestLoad=Date.now();await loadReviews()}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshIfNeeded()});
window.addEventListener('focus',()=>refreshIfNeeded());
window.addEventListener('pageshow',()=>refreshIfNeeded());
refreshIfNeeded(true);
