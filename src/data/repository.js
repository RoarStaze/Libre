import { createSeedGraph } from '../domain/seed.js';
import { derivePublicationEvidence, recalculateDraftEvidence } from '../domain/evidence.js';

const KEY = 'libre-continuum-state-v1';

function uid(prefix='id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

export function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

function initialState() {
  return {
    graph: createSeedGraph(),
    comments: [],
    reports: [],
    following: [],
    negative: [],
    library: { saved: [], readLater: [], liked: [], history: [], collections: [] },
    algorithm: { discovery: 55, depth: 68, freshness: 50, unfamiliar: 40, obscure: 52 },
    account: null,
    accounts: [],
    anonymous: null,
    drafts: [],
    trailProgress: {},
    theme: 'dark'
  };
}

export function createRepository({ storage = globalThis.localStorage } = {}) {
  let state;
  try { state = JSON.parse(storage.getItem(KEY)) || initialState(); }
  catch { state = initialState(); }

  const persist = () => storage.setItem(KEY, JSON.stringify(state));
  const listeners = new Set();
  const getState = () => structuredClone(state);
  const emit = () => { persist(); for (const listener of listeners) listener(getState()); };

  function applyDraftEvidence(draft) {
    const assessed = recalculateDraftEvidence(draft);
    draft.objects = assessed.objects;
    draft.updatedAt = Date.now();
    return draft;
  }

  function getAnonymousIdentity() {
    if (!state.anonymous) {
      const suffix = Math.floor(1000 + Math.random()*9000);
      state.anonymous = { id: uid('anon'), displayName:`Anonymous ${suffix}`, isAnonymous:true };
      emit();
    }
    return structuredClone(state.anonymous);
  }

  function addComment({ scopeType, scopeId, body, parentId = null, alias = null }) {
    const author = state.account ? { id: state.account.id, displayName:state.account.displayName, isAnonymous:false } : getAnonymousIdentity();
    const comment = { id:uid('comment'), scopeType, scopeId, body:String(body).trim(), parentId, author:{...author, displayName:alias || author.displayName}, votes:0, createdAt:Date.now(), editedAt:null };
    state.comments.push(comment); emit(); return structuredClone(comment);
  }

  const listComments = (scopeType, scopeId) => structuredClone(state.comments.filter((comment) => comment.scopeType === scopeType && comment.scopeId === scopeId));

  function voteComment(commentId, delta=1) {
    const comment = state.comments.find((entry) => entry.id === commentId);
    if (comment) { comment.votes += delta; emit(); }
    return comment ? structuredClone(comment) : null;
  }

  function reportContent({ targetType, targetId, reason }) {
    const report = { id:uid('report'), targetType, targetId, reason, status:'open', createdAt:Date.now(), reporterId: state.account?.id || getAnonymousIdentity().id };
    state.reports.push(report); emit(); return structuredClone(report);
  }

  function saveObject(id, bucket='saved') { const target = state.library[bucket] || state.library.saved; if (!target.includes(id)) target.unshift(id); emit(); }
  function unsaveObject(id, bucket='saved') { const target = state.library[bucket] || state.library.saved; const index = target.indexOf(id); if (index >= 0) target.splice(index,1); emit(); }
  function followEntity(id) { if (!state.following.includes(id)) state.following.push(id); emit(); }
  function unfollowEntity(id) { state.following = state.following.filter((entry) => entry !== id); emit(); }
  function negativeFeedback(id) { if (!state.negative.includes(id)) state.negative.push(id); emit(); }
  function updateAlgorithm(patch) { state.algorithm = { ...state.algorithm, ...patch }; emit(); }
  function addHistory(id) { state.library.history = [id, ...state.library.history.filter((entry) => entry !== id)].slice(0,100); emit(); }

  function signUp({ email, password, displayName }) {
    if (!email || !password || password.length < 6) throw new Error('A valid email and 6+ character password are required.');
    if (state.accounts.some((account) => account.email.toLowerCase() === email.toLowerCase())) throw new Error('Account already exists.');
    const account = { id:uid('user'), email, password, displayName:displayName || email.split('@')[0], joinedAt:Date.now(), role:'member' };
    state.accounts.push(account); state.account = { ...account }; emit(); return structuredClone(state.account);
  }
  function signIn({ email, password }) {
    const account = state.accounts.find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password);
    if (!account) throw new Error('Email or password did not match.');
    state.account = { ...account }; emit(); return structuredClone(state.account);
  }
  function signOut() { state.account = null; emit(); }
  const canPublish = () => Boolean(state.account && !state.account.isAnonymous);

  function createDraft({ title='Untitled Space', topicId=null, forkedFrom=null }={}) {
    if (!canPublish()) throw new Error('Sign in to create a publishable Space.');
    const draft = { id:uid('draft'), title, subtitle:'', summary:'', topicId, creatorId:state.account.id, objects:[], relations:[], readerPath:[], forkedFrom, createdAt:Date.now(), updatedAt:Date.now() };
    state.drafts.unshift(draft); emit(); return structuredClone(draft);
  }
  function getDraft(id) { const draft = state.drafts.find((entry) => entry.id === id); return draft ? structuredClone(draft) : null; }
  function updateDraft(id, patch) { const draft = state.drafts.find((entry) => entry.id === id); if (!draft) return null; Object.assign(draft, patch, {updatedAt:Date.now()}); emit(); return structuredClone(draft); }
  function addDraftObject(draftId, object) {
    const draft = state.drafts.find((entry) => entry.id === draftId);
    if (!draft) throw new Error('Draft not found.');
    const { evidenceState: _ignoredEvidenceState, evidenceAssessment: _ignoredAssessment, ...creatorFields } = object;
    const created = { id:uid(object.type || 'object'), ...creatorFields };
    draft.objects.push(created);
    applyDraftEvidence(draft);
    emit();
    return structuredClone(draft.objects.find((entry) => entry.id === created.id));
  }
  function addDraftRelation(draftId, relation) {
    const draft = state.drafts.find((entry) => entry.id === draftId);
    if (!draft) throw new Error('Draft not found.');
    const created={id:uid('relation'),...relation};
    draft.relations.push(created);
    applyDraftEvidence(draft);
    emit();
    return structuredClone(created);
  }
  function setReaderPath(draftId, path) { const draft=state.drafts.find((entry)=>entry.id===draftId); if (!draft) throw new Error('Draft not found.'); draft.readerPath=[...path]; emit(); return [...draft.readerPath]; }
  function publishDraft(draftId) {
    if (!canPublish()) throw new Error('Sign in to publish.');
    const draft = state.drafts.find((entry) => entry.id === draftId); if (!draft) throw new Error('Draft not found.');
    applyDraftEvidence(draft);
    const spaceId = uid('space');
    const publicationEvidence = derivePublicationEvidence(draft.objects);
    const publication = { id:spaceId, type:'publication', title:draft.title, subtitle:draft.subtitle, summary:draft.summary, creatorId:state.account.id, topicIds:draft.topicId?[draft.topicId]:[], format:'knowledge-space', evidenceState:publicationEvidence, evidenceAssessment:{method:'libre-auto-v1',derivedFromClaims:true}, sourceCount:draft.objects.filter((o)=>['source','document'].includes(o.type)).length, claimCount:draft.objects.filter((o)=>o.type==='claim').length, readMinutes:Math.max(3, Math.ceil(draft.objects.length*1.5)), createdAt:Date.now(), updatedAt:Date.now(), popularity:1, depth:70, readerPath:draft.readerPath, forkedFrom:draft.forkedFrom };
    state.graph.objects.push(publication, ...draft.objects);
    state.graph.relations.push(...draft.relations, ...draft.readerPath.map((objectId, index)=>({id:uid('relation'),fromId:spaceId,toId:objectId,type:'part_of',order:index})));
    if (draft.forkedFrom) state.graph.relations.push({id:uid('relation'),fromId:spaceId,toId:draft.forkedFrom,type:'forked_from'});
    state.drafts = state.drafts.filter((entry)=>entry.id!==draftId); emit(); return structuredClone(publication);
  }

  function createCollection({ title, visibility='private' }) { const collection={id:uid('collection'),title,visibility,items:[],createdAt:Date.now()}; state.library.collections.push(collection); emit(); return structuredClone(collection); }
  function addToCollection(collectionId, objectId) { const collection=state.library.collections.find((entry)=>entry.id===collectionId); if (!collection) return null; if(!collection.items.includes(objectId)) collection.items.push(objectId); emit(); return structuredClone(collection); }
  function setTrailProgress(trailId, stepIndex) { state.trailProgress[trailId]=stepIndex; emit(); }
  function setTheme(theme) { state.theme=theme; emit(); }
  function reset() { state=initialState(); emit(); }
  function subscribe(listener){ listeners.add(listener); return ()=>listeners.delete(listener); }

  return { getState, subscribe, getAnonymousIdentity, addComment, listComments, voteComment, reportContent, saveObject, unsaveObject, followEntity, unfollowEntity, negativeFeedback, updateAlgorithm, addHistory, signUp, signIn, signOut, canPublish, createDraft, getDraft, updateDraft, addDraftObject, addDraftRelation, setReaderPath, publishDraft, createCollection, addToCollection, setTrailProgress, setTheme, reset };
}
