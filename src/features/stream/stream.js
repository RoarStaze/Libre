import { rankCandidates } from './ranking.js';
import { renderSignal } from './signals.js';
import { icon } from '../../shared/icons.js';

const modeLabels = {
  'for-you':'For You','following':'Following','latest':'Latest','deep-dive':'Deep Dive','discover':'Discover','trending':'Trending'
};

export function renderStream({ graph, state, mode='for-you' }) {
  const objects = graph.objects;
  const profile = {
    followedTopics: state.following.filter((id)=>id.startsWith('topic-')),
    followedCreators: state.following.filter((id)=>id.startsWith('creator-')),
    saved: state.library.saved,
    negative: state.negative,
    algorithm: state.algorithm
  };
  let ranked = rankCandidates(profile, objects, graph.relations);
  if (mode==='following') ranked=ranked.filter((entry)=>profile.followedCreators.includes(entry.object.creatorId)||(entry.object.topicIds||[]).some((id)=>profile.followedTopics.includes(id)));
  if (mode==='latest') ranked=[...ranked].sort((a,b)=>(b.object.createdAt||0)-(a.object.createdAt||0));
  if (mode==='deep-dive') ranked=[...ranked].sort((a,b)=>(b.object.depth||b.object.sourceCount||0)-(a.object.depth||a.object.sourceCount||0));
  if (mode==='discover') ranked=[...ranked].sort((a,b)=>{
    const aOverlap=(a.object.topicIds||[]).some((id)=>profile.followedTopics.includes(id));
    const bOverlap=(b.object.topicIds||[]).some((id)=>profile.followedTopics.includes(id));
    return Number(aOverlap)-Number(bOverlap)||b.score-a.score;
  });
  if (mode==='trending') ranked=[...ranked].sort((a,b)=>(b.object.popularity||0)-(a.object.popularity||0));
  if (!ranked.length) ranked=rankCandidates({...profile,followedTopics:[],followedCreators:[]},objects,graph.relations);

  return `<section class="stream-shell" data-stream-mode="${mode}">
    <div class="stream-intro">
      <div class="stream-intro-copy">
        <h1>Knowledge is not a feed. <span>It is a place you can enter.</span></h1>
        <p>Follow the evidence, branch into opposing views, build Trails, inspect claims, and keep the original source attached as ideas move.</p>
      </div>
      <div class="stream-orbit" aria-hidden="true"><i class="orbit-node"></i><i class="orbit-node"></i><i class="orbit-node"></i></div>
    </div>
    <div class="stream-controls" role="tablist" aria-label="Stream mode">
      ${Object.entries(modeLabels).map(([id,label])=>`<button class="mode-chip" role="tab" aria-selected="${mode===id}" data-stream-mode="${id}">${label}</button>`).join('')}
      <button class="quiet-button algorithm-shortcut" data-route="/algorithm">${icon('settings',16)} My Algorithm</button>
    </div>
    <div class="knowledge-stream" aria-label="Knowledge Stream">${ranked.slice(0,16).map((entry)=>renderSignal(entry,graph)).join('')}</div>
  </section>`;
}
