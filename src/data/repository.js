import { createSeedGraph } from '../domain/seed.js';
import { derivePublicationEvidence, recalculateDraftEvidence } from '../domain/evidence.js';

const KEY = 'libre-continuum-state-v1';
const MAX_LOCAL_THUMBNAIL_LENGTH = 2_800_000;

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

  state.drafts ||= [];
  state.graph ||= createSeedGraph();
  state.graph.objects ||= [];
  state.graph.relations ||= [];

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

  function publicationById(id) {
    return state.graph.objects.find((entry)=>entry.id===id && entry.type==='publication') || null;
  }

  function canEditPublication(publicationId) {
    const publication=publicationById(publicationId);
    return Boolean(state.account && publication && publication.creatorId===state.account.id);
  }

  function requireDraftOwner(id) {
    const draft=state.drafts.find((entry)=>entry.id===id);
    if(!draft) throw new Error('Draft not found.');
    if(!state.account || draft.creatorId!==state.account.id) throw new Error('You can only edit your own draft.');
    return draft;
  }

  function validateThumbnail(value) {
    if(value == null || value === '') return null;
    const thumbnail=String(value);
    if(thumbnail.length > MAX_LOCAL_THUMBNAIL_LENGTH) throw new Error('Thumbnail is too large for local Libre. Use an image under about 2 MB.');
    if(!/^data:image\/(?:png|jpe?g|webp);base64,/i.test(thumbnail) && !/^https?:\/\//i.test(thumbnail)) throw new Error('Thumbnail must be a PNG, JPEG, WebP, or image URL.');
    return thumbnail;
  }

  function createDraft({ title='Untitled Space', topicId=null, forkedFrom=null }={}) {
    if (!canPublish()) throw new Error('Sign in to create a publishable Space.');
    const draft = { id:uid('draft'), title, subtitle:'', summary:'', thumbnail:null, topicId, creatorId:state.account.id, objects:[], relations:[], readerPath:[], forkedFrom, sourceDiscovery:null, editingPublicationId:null, originalObjectIds:[], createdAt:Date.now(), updatedAt:Date.now() };
    state.drafts.unshift(draft); emit(); return structuredClone(draft);
  }

  function publicationObjectIds(publication) {
    if(Array.isArray(publication.objectIds) && publication.objectIds.length) return [...new Set(publication.objectIds)];
    const seeds=new Set([...(publication.readerPath||[]), ...(publication.evidenceAssessment?.claimAssessments||[]).map((entry)=>entry.claimId).filter(Boolean)]);
    const allowed=new Set(['supports','contradicts','cites','derived_from','explains','questions','related_to']);
    for(let pass=0; pass<3; pass++) {
      let changed=false;
      for(const relation of state.graph.relations) {
        if(!allowed.has(relation.type)) continue;
        if(seeds.has(relation.fromId) && !seeds.has(relation.toId)) { seeds.add(relation.toId); changed=true; }
        if(seeds.has(relation.toId) && !seeds.has(relation.fromId)) { seeds.add(relation.fromId); changed=true; }
      }
      if(!changed) break;
    }
    return [...seeds].filter((id)=>{
      const object=state.graph.objects.find((entry)=>entry.id===id);
      return object && !['publication','person','topic'].includes(object.type);
    });
  }

  function createEditDraft(publicationId) {
    const publication=publicationById(publicationId);
    if(!publication || !state.account || publication.creatorId!==state.account.id) throw new Error('You can only edit knowledge you created.');
    const existing=state.drafts.find((entry)=>entry.editingPublicationId===publicationId && entry.creatorId===state.account.id);
    if(existing) return structuredClone(existing);
    const objectIds=publicationObjectIds(publication);
    const objectSet=new Set(objectIds);
    const objects=state.graph.objects.filter((object)=>objectSet.has(object.id)).map((object)=>structuredClone(object));
    const relations=state.graph.relations.filter((relation)=>{
      if(relation.spaceId===publicationId && relation.type!=='part_of' && relation.type!=='forked_from') return true;
      return objectSet.has(relation.fromId) && objectSet.has(relation.toId) && relation.type!=='part_of';
    }).map((relation)=>structuredClone(relation));
    const orderedPartOf=state.graph.relations.filter((relation)=>relation.fromId===publicationId && relation.type==='part_of').sort((a,b)=>(a.order||0)-(b.order||0)).map((relation)=>relation.toId);
    const draft={
      id:uid('draft'),
      title:publication.title,
      subtitle:publication.subtitle||'',
      summary:publication.summary||'',
      thumbnail:publication.thumbnail||null,
      topicId:publication.topicIds?.[0]||null,
      creatorId:state.account.id,
      objects,
      relations,
      readerPath:[...(publication.readerPath?.length?publication.readerPath:orderedPartOf)],
      forkedFrom:publication.forkedFrom||null,
      sourceDiscovery:publication.sourceDiscovery||publication.evidenceAssessment?.sourceDiscovery||null,
      editingPublicationId:publication.id,
      originalObjectIds:[...objectIds],
      createdAt:Date.now(),
      updatedAt:Date.now()
    };
    state.drafts.unshift(draft); emit(); return structuredClone(draft);
  }

  function getDraft(id) {
    const draft=state.drafts.find((entry)=>entry.id===id);
    if(!draft || !state.account || draft.creatorId!==state.account.id) return null;
    return structuredClone(draft);
  }

  function updateDraft(id, patch) {
    const draft=requireDraftOwner(id);
    const { creatorId:_creator, editingPublicationId:_editing, originalObjectIds:_original, ...safePatch }=patch||{};
    if(Object.prototype.hasOwnProperty.call(safePatch,'thumbnail')) safePatch.thumbnail=validateThumbnail(safePatch.thumbnail);
    Object.assign(draft, safePatch, {updatedAt:Date.now()}); emit(); return structuredClone(draft);
  }

  function addDraftObject(draftId, object) {
    const draft=requireDraftOwner(draftId);
    const { evidenceState: _ignoredEvidenceState, evidenceAssessment: _ignoredAssessment, creatorId:_ignoredCreator, ...creatorFields } = object;
    const created = { id:uid(object.type || 'object'), ...creatorFields, creatorId:state.account.id };
    draft.objects.push(created);
    applyDraftEvidence(draft);
    emit();
    return structuredClone(draft.objects.find((entry) => entry.id === created.id));
  }

  function updateDraftObject(draftId, objectId, patch={}) {
    const draft=requireDraftOwner(draftId);
    const object=draft.objects.find((entry)=>entry.id===objectId);
    if(!object) throw new Error('Knowledge object not found.');
    if(object.metadataLocked) throw new Error('Libre-discovered source metadata is locked. Remove it instead of rewriting its provenance.');
    const { id:_id,type:_type,creatorId:_creator,evidenceState:_state,evidenceAssessment:_assessment,autoDiscovered:_auto,metadataLocked:_locked,...safePatch }=patch;
    Object.assign(object,safePatch);
    applyDraftEvidence(draft); emit(); return structuredClone(object);
  }

  function removeDraftObject(draftId, objectId) {
    const draft=requireDraftOwner(draftId);
    const index=draft.objects.findIndex((entry)=>entry.id===objectId);
    if(index<0) return false;
    draft.objects.splice(index,1);
    draft.relations=draft.relations.filter((relation)=>relation.fromId!==objectId && relation.toId!==objectId);
    draft.readerPath=draft.readerPath.filter((id)=>id!==objectId);
    applyDraftEvidence(draft); emit(); return true;
  }

  function addDraftRelation(draftId, relation) {
    const draft=requireDraftOwner(draftId);
    const created={id:uid('relation'),...relation};
    draft.relations.push(created);
    applyDraftEvidence(draft);
    emit();
    return structuredClone(created);
  }

  function removeDraftRelation(draftId, relationId) {
    const draft=requireDraftOwner(draftId);
    const before=draft.relations.length;
    draft.relations=draft.relations.filter((relation)=>relation.id!==relationId);
    if(draft.relations.length===before) return false;
    applyDraftEvidence(draft); emit(); return true;
  }

  function importDiscoveredSources(draftId, bundle={}) {
    const draft=requireDraftOwner(draftId);
    let addedSources=0;
    let addedRelations=0;
    let contextualSources=0;
    let supportingSources=0;
    let challengingSources=0;

    for(const discovery of bundle.discoveries||[]) {
      const claim=draft.objects.find((object)=>object.id===discovery.claimId && object.type==='claim');
      if(!claim) continue;
      for(const candidate of discovery.candidates||[]) {
        const canonicalKey=candidate.canonicalKey || candidate.doi || candidate.url || `${candidate.title}|${candidate.year||''}`;
        let source=draft.objects.find((object)=>object.autoDiscovered && object.canonicalKey===canonicalKey);
        if(!source) {
          const {id:_providerId,evidenceState:_ignoredState,evidenceAssessment:_ignoredAssessment,...fields}=candidate;
          source={
            id:uid('source'),
            ...fields,
            type:'source',
            canonicalKey,
            autoDiscovered:true,
            discoveredBy:'libre-source-discovery-v1',
            discoveredAt:Date.now(),
            metadataLocked:true,
            addedBy:state.account.id
          };
          draft.objects.push(source);
          addedSources++;
        }

        let relationType='cites';
        if(candidate.stance==='supports' && Number(candidate.stanceConfidence)>=.64) relationType='supports';
        else if(candidate.stance==='contradicts' && Number(candidate.stanceConfidence)>=.64) relationType='contradicts';
        if(relationType==='supports') supportingSources++;
        else if(relationType==='contradicts') challengingSources++;
        else contextualSources++;

        if(!draft.relations.some((relation)=>relation.fromId===claim.id && relation.toId===source.id && relation.type===relationType)) {
          draft.relations.push({id:uid('relation'),fromId:claim.id,toId:source.id,type:relationType,autoDiscovered:true,createdAt:Date.now()});
          addedRelations++;
        }
      }
    }

    draft.sourceDiscovery={
      method:'libre-source-discovery-v1',
      searchedAt:Date.now(),
      claimsSearched:Number(bundle.claimsSearched||0),
      providerSuccesses:Number(bundle.providerSuccesses||0),
      providerFailures:[...(bundle.providerFailures||[])],
      addedSources,
      addedRelations,
      supportingSources,
      challengingSources,
      contextualSources
    };
    applyDraftEvidence(draft);
    emit();
    return structuredClone(draft.sourceDiscovery);
  }

  function setReaderPath(draftId, path) {
    const draft=requireDraftOwner(draftId);
    const validIds=new Set(draft.objects.map((entry)=>entry.id));
    draft.readerPath=[...path].filter((id,index,array)=>validIds.has(id) && array.indexOf(id)===index);
    draft.updatedAt=Date.now(); emit(); return [...draft.readerPath];
  }

  function publishDraft(draftId) {
    if (!canPublish()) throw new Error('Sign in to publish.');
    const draft=requireDraftOwner(draftId);
    applyDraftEvidence(draft);
    const publicationEvidence = derivePublicationEvidence(draft.objects);
    const claimAssessments=draft.objects.filter((o)=>o.type==='claim').map((o)=>({claimId:o.id,state:o.evidenceState,confidence:o.evidenceAssessment?.confidence||0}));
    const existing=draft.editingPublicationId ? publicationById(draft.editingPublicationId) : null;
    if(draft.editingPublicationId && (!existing || existing.creatorId!==state.account.id)) throw new Error('You can only edit knowledge you created.');
    const spaceId=existing?.id || uid('space');
    const now=Date.now();
    const publication = {
      ...(existing||{}),
      id:spaceId,type:'publication',title:draft.title,subtitle:draft.subtitle,summary:draft.summary,thumbnail:validateThumbnail(draft.thumbnail),creatorId:state.account.id,
      topicIds:draft.topicId?[draft.topicId]:[],format:'knowledge-space',evidenceState:publicationEvidence,
      evidenceAssessment:{method:'libre-auto-v2',frameworkVersion:2,derivedFromClaims:true,claimAssessments,sourceDiscovery:draft.sourceDiscovery||null},
      sourceCount:draft.objects.filter((o)=>['source','document','dataset'].includes(o.type)).length,
      claimCount:draft.objects.filter((o)=>o.type==='claim').length,
      readMinutes:Math.max(3, Math.ceil(draft.objects.length*1.5)),createdAt:existing?.createdAt||now,updatedAt:now,popularity:existing?.popularity||1,depth:existing?.depth||70,
      readerPath:[...draft.readerPath],forkedFrom:draft.forkedFrom,sourceDiscovery:draft.sourceDiscovery||null,
      objectIds:draft.objects.map((object)=>object.id),revision:(existing?.revision||0)+1
    };

    if(existing) {
      const oldIds=new Set(draft.originalObjectIds?.length?draft.originalObjectIds:publicationObjectIds(existing));
      const currentIds=new Set(publication.objectIds);
      const otherPublications=state.graph.objects.filter((object)=>object.type==='publication' && object.id!==spaceId);
      state.graph.objects=state.graph.objects.filter((object)=>{
        if(object.id===spaceId) return false;
        if(!oldIds.has(object.id) || currentIds.has(object.id)) return true;
        return otherPublications.some((other)=>Array.isArray(other.objectIds) && other.objectIds.includes(object.id));
      });
      state.graph.relations=state.graph.relations.filter((relation)=>{
        if(relation.spaceId===spaceId) return false;
        if(relation.fromId===spaceId && ['part_of','forked_from'].includes(relation.type)) return false;
        if(oldIds.has(relation.fromId) && oldIds.has(relation.toId)) return false;
        return true;
      });
    }

    for(const object of draft.objects) {
      const index=state.graph.objects.findIndex((entry)=>entry.id===object.id);
      if(index>=0) state.graph.objects[index]=structuredClone(object);
      else state.graph.objects.push(structuredClone(object));
    }
    state.graph.objects.push(publication);
    state.graph.relations.push(...draft.relations.map((relation)=>({...relation,spaceId})), ...draft.readerPath.map((objectId, index)=>({id:uid('relation'),fromId:spaceId,toId:objectId,type:'part_of',order:index,spaceId})));
    if (draft.forkedFrom) state.graph.relations.push({id:uid('relation'),fromId:spaceId,toId:draft.forkedFrom,type:'forked_from',spaceId});
    state.drafts = state.drafts.filter((entry)=>entry.id!==draftId); emit(); return structuredClone(publication);
  }

  function createCollection({ title, visibility='private' }) { const collection={id:uid('collection'),title,visibility,items:[],createdAt:Date.now()}; state.library.collections.push(collection); emit(); return structuredClone(collection); }
  function addToCollection(collectionId, objectId) { const collection=state.library.collections.find((entry)=>entry.id===collectionId); if (!collection) return null; if(!collection.items.includes(objectId)) collection.items.push(objectId); emit(); return structuredClone(collection); }
  function setTrailProgress(trailId, stepIndex) { state.trailProgress[trailId]=stepIndex; emit(); }
  function setTheme(theme) { state.theme=theme; emit(); }
  function reset() { state=initialState(); emit(); }
  function subscribe(listener){ listeners.add(listener); return ()=>listeners.delete(listener); }

  return { getState, subscribe, getAnonymousIdentity, addComment, listComments, voteComment, reportContent, saveObject, unsaveObject, followEntity, unfollowEntity, negativeFeedback, updateAlgorithm, addHistory, signUp, signIn, signOut, canPublish, canEditPublication, createDraft, createEditDraft, getDraft, updateDraft, addDraftObject, updateDraftObject, removeDraftObject, addDraftRelation, removeDraftRelation, importDiscoveredSources, setReaderPath, publishDraft, createCollection, addToCollection, setTrailProgress, setTheme, reset };
}
