const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,Number.isFinite(value)?value:min));

const STOPWORDS=new Set('a an and are as at be been being but by can could did do does for from had has have how if in into is it its may might more most no not of on or our should than that the their then there these they this those to under up was were what when where which who will with would your'.split(' '));

function normalizeText(value='') {
  return String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function stem(token) {
  return token.replace(/(ization|ational|fulness|iveness|ments|ingly|edly|ing|ed|ies|es|s)$/,'').replace(/i$/,'y');
}
function tokens(value='') {
  return [...new Set(normalizeText(value).split(' ').filter((token)=>token.length>=3&&!STOPWORDS.has(token)).map(stem).filter((token)=>token.length>=3))];
}
function keyTerms(value='',limit=10) {
  return tokens(value).sort((a,b)=>b.length-a.length).slice(0,limit);
}
function normalizeDoi(value='') {
  return String(value||'').toLowerCase().trim().replace(/^https?:\/\/(dx\.)?doi\.org\//,'').replace(/^doi:\s*/,'').replace(/[?#].*$/,'');
}
function first(value) { return Array.isArray(value)?value[0]:value; }
function dateYear(value) {
  if (!value) return null;
  if (Number.isFinite(Number(value))) return Number(value);
  const parsed=Number(String(value).slice(0,4));
  return Number.isFinite(parsed)?parsed:null;
}
function safeUrl(value='') { try { return new URL(value).href; } catch { return String(value||''); } }

export function buildSourceQueries({claim,publication={},topics=[]}={}) {
  const claimText=String(claim?.title||claim?.body||'').trim();
  const terms=keyTerms(claimText,10);
  const topicTerms=keyTerms((topics||[]).join(' '),4);
  const pubTerms=keyTerms(`${publication.title||''} ${publication.summary||''}`,5);
  const queries=[
    claimText.slice(0,280),
    [...terms.slice(0,8)].join(' '),
    [...terms.slice(0,6),...topicTerms.slice(0,2)].join(' '),
    [...terms.slice(0,5),...pubTerms.slice(0,3)].join(' ')
  ].map((query)=>query.replace(/\s+/g,' ').trim()).filter((query)=>query.length>8);
  return [...new Set(queries)].slice(0,4);
}

function inferKind(type='',provider='') {
  const raw=normalizeText(type);
  if (raw.includes('meta analysis')) return 'meta-analysis';
  if (raw.includes('systematic review')) return 'systematic review';
  if (raw.includes('randomized') || raw.includes('clinical trial')) return 'randomized controlled trial';
  if (raw.includes('preprint')) return 'preprint';
  if (raw.includes('dataset') || raw.includes('data set')) return 'dataset';
  if (raw.includes('review')) return 'review';
  if (raw.includes('journal') || raw.includes('article')) return 'journal article';
  if (raw.includes('report')) return provider==='federal-register'?'government document':'report';
  if (provider==='federal-register') return 'government document';
  if (provider==='internet-archive') return 'archival record';
  return raw || 'unknown';
}

export function normalizeSourceCandidate(input={}) {
  const provider=String(input.provider||'unknown');
  const doi=normalizeDoi(input.doi);
  const title=String(first(input.title)||'Untitled source').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const abstract=String(input.abstract||input.description||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const sourceKind=inferKind(input.sourceKind||input.type||input.resourceType,provider);
  const url=safeUrl(input.url || (doi?`https://doi.org/${doi}`:'') || input.id || '');
  const peerReviewed=input.peerReviewed ?? ['journal article','systematic review','meta-analysis','randomized controlled trial','review'].includes(sourceKind);
  const primary=input.primary ?? ['journal article','randomized controlled trial','dataset','government document','archival record'].includes(sourceKind);
  const official=input.official ?? provider==='federal-register';
  const retracted=Boolean(input.retracted || input.isRetracted || input.is_retracted);
  const authors=Array.isArray(input.authors)?input.authors.filter(Boolean):input.author?[String(input.author)]:[];
  const year=dateYear(input.year||input.publicationYear||input.publication_date||input.published);
  const canonicalKey=doi?`doi:${doi}`:url?`url:${url.toLowerCase().replace(/\/$/,'')}`:`title:${normalizeText(title)}|${year||''}`;

  return {
    id:String(input.id||doi||url||canonicalKey),
    provider,
    type:'source',
    title,
    abstract,
    doi,
    url,
    publisher:String(input.publisher||input.containerTitle||input.repository||''),
    authors,
    year,
    sourceKind,
    peerReviewed:Boolean(peerReviewed),
    primary:Boolean(primary),
    official:Boolean(official),
    retracted,
    citationCount:Math.max(0,Number(input.citationCount||input.citedByCount||0)),
    openAccess:Boolean(input.openAccess||input.isOpenAccess),
    fullTextAvailable:Boolean(input.fullTextAvailable||input.fullTextUrl),
    fullTextUrl:input.fullTextUrl||'',
    canonicalKey,
    providerRecord:input.providerRecord||null
  };
}

function overlapScore(needle,haystack) {
  const a=tokens(needle),b=new Set(tokens(haystack));
  if(!a.length||!b.size)return 0;
  return a.filter((token)=>b.has(token)).length/a.length;
}

const CONTRADICTION_CUES=[
  'no evidence','not support','does not support','did not support','failed to replicate','failure to replicate','no significant','null result','not associated','no association','did not produce','does not produce','contradict','refute','inconsistent with'
];
const SUPPORT_CUES=[
  'supports','supported','demonstrates','demonstrated','observed','found that','produced','caused','associated with','evidence for','confirmed','replicated','increased','decreased','effect of','effects of'
];

function inferStance(candidate,claimText,relevance) {
  const body=normalizeText(`${candidate.title} ${candidate.abstract}`);
  const contradiction=CONTRADICTION_CUES.some((cue)=>body.includes(normalizeText(cue)));
  const support=SUPPORT_CUES.some((cue)=>body.includes(normalizeText(cue)));
  if (contradiction && relevance>=.32) return {stance:'contradicts',stanceConfidence:clamp(.62+relevance*.3)};
  if (support && relevance>=.38) return {stance:'supports',stanceConfidence:clamp(.55+relevance*.36)};
  if (relevance>=.72) return {stance:'supports',stanceConfidence:.58};
  return {stance:'context',stanceConfidence:clamp(.35+relevance*.35)};
}

export function rankSourceCandidate(input,claimText='') {
  const candidate=normalizeSourceCandidate(input);
  const titleCoverage=overlapScore(claimText,candidate.title);
  const bodyCoverage=overlapScore(claimText,`${candidate.title} ${candidate.abstract}`);
  const exactPhrase=normalizeText(candidate.title).includes(normalizeText(claimText)) || normalizeText(candidate.abstract).includes(normalizeText(claimText));
  const relevance=clamp(.08 + titleCoverage*.47 + bodyCoverage*.38 + (exactPhrase?.12:0));
  const {stance,stanceConfidence}=inferStance(candidate,claimText,relevance);
  const typeQuality={
    'meta-analysis':.98,'systematic review':.95,'randomized controlled trial':.92,'journal article':.78,'review':.83,
    'government document':.9,'archival record':.82,'dataset':.78,'report':.66,'preprint':.48,'unknown':.4
  }[candidate.sourceKind] ?? .52;
  const citationSignal=Math.min(.08,Math.log10(candidate.citationCount+1)*.025);
  const metadataSignal=[candidate.doi,candidate.publisher,candidate.year,candidate.authors.length,candidate.abstract].filter(Boolean).length/5;
  let rankScore=relevance*.58 + typeQuality*.22 + stanceConfidence*.08 + metadataSignal*.08 + citationSignal;
  if(candidate.retracted) rankScore*=.05;
  if(candidate.sourceKind==='preprint') rankScore*=.88;
  return {...candidate,relevance:Number(relevance.toFixed(3)),stance,stanceConfidence:Number(stanceConfidence.toFixed(3)),rankScore:Number(clamp(rankScore).toFixed(3))};
}

export function dedupeSourceCandidates(candidates=[]) {
  const best=new Map();
  for(const raw of candidates) {
    const candidate=normalizeSourceCandidate(raw);
    const key=candidate.canonicalKey;
    const score=Number(raw.rankScore||0);
    const existing=best.get(key);
    if(!existing || score>Number(existing.rankScore||0)) best.set(key,{...candidate,...raw,canonicalKey:key});
  }
  return [...best.values()];
}

function crossrefItems(payload={}) {
  return (payload.message?.items||[]).map((item)=>normalizeSourceCandidate({
    provider:'crossref',id:item.DOI||item.URL,title:first(item.title),abstract:item.abstract,doi:item.DOI,
    publisher:item.publisher,year:first(item.published?.['date-parts'])?.[0],type:item.type,
    citationCount:item['is-referenced-by-count'],url:item.URL,
    authors:(item.author||[]).map((author)=>[author.given,author.family].filter(Boolean).join(' ')),
    retracted:Boolean(item.relation?.['is-retracted-by']?.length || item['update-to']?.some?.((entry)=>String(entry.type||'').toLowerCase().includes('retract')))
  }));
}
function dataciteItems(payload={}) {
  return (payload.data||[]).map((entry)=>{
    const a=entry.attributes||{};
    return normalizeSourceCandidate({provider:'datacite',id:entry.id,title:first(a.titles)?.title||first(a.titles),abstract:first(a.descriptions)?.description,doi:a.doi||entry.id,publisher:a.publisher?.name||a.publisher,year:a.publicationYear,type:a.types?.resourceType||a.types?.resourceTypeGeneral,citationCount:a.citationCount,url:a.url,authors:(a.creators||[]).map((creator)=>creator.name),openAccess:Boolean(a.rightsList?.some?.((right)=>String(right.rightsIdentifier||'').toLowerCase().includes('cc')))});
  });
}
function europePmcItems(payload={}) {
  return (payload.resultList?.result||[]).map((item)=>normalizeSourceCandidate({provider:'europe-pmc',id:item.doi||item.pmid||item.id,title:item.title,abstract:item.abstractText,doi:item.doi,publisher:item.journalTitle||item.journalInfo?.journal?.title,year:item.pubYear,type:item.pubTypeList?.pubType?.join(' ')||'journal article',citationCount:item.citedByCount,url:item.doi?`https://doi.org/${item.doi}`:`https://europepmc.org/article/${item.source||'MED'}/${item.pmid||item.id}`,authors:(item.authorList?.author||[]).map((author)=>author.fullName),peerReviewed:!String(item.pubType||'').toLowerCase().includes('preprint'),primary:true}));
}
function archiveItems(payload={}) {
  return (payload.response?.docs||[]).map((item)=>normalizeSourceCandidate({provider:'internet-archive',id:item.identifier,title:item.title,abstract:first(item.description),publisher:first(item.collection)||'Internet Archive',year:item.date,type:item.mediatype==='texts'?'archival record':item.mediatype,url:item.identifier?`https://archive.org/details/${item.identifier}`:'',authors:Array.isArray(item.creator)?item.creator:[item.creator].filter(Boolean),primary:true}));
}
function federalRegisterItems(payload={}) {
  return (payload.results||[]).map((item)=>normalizeSourceCandidate({provider:'federal-register',id:item.document_number,title:item.title,abstract:item.abstract,publisher:(item.agencies||[]).map((a)=>a.name).join(', ')||'Federal Register',year:item.publication_date,type:'government document',url:item.html_url||item.pdf_url,official:true,primary:true}));
}

async function fetchJson(fetchImpl,url,options={}) {
  const response=await fetchImpl(url,{headers:{Accept:'application/json'},...options});
  if(!response.ok) throw new Error(`${response.status} from ${new URL(url).hostname}`);
  return response.json();
}

async function queryProvider(provider,query,fetchImpl) {
  if(provider==='crossref') {
    const url=`https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=8&select=DOI,title,abstract,publisher,published,type,is-referenced-by-count,URL,author,relation`;
    return crossrefItems(await fetchJson(fetchImpl,url));
  }
  if(provider==='datacite') {
    const url=`https://api.datacite.org/dois?query=${encodeURIComponent(query)}&page%5Bsize%5D=8&sort=relevance`;
    return dataciteItems(await fetchJson(fetchImpl,url));
  }
  if(provider==='europe-pmc') {
    const url=`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=8&resultType=core`;
    return europePmcItems(await fetchJson(fetchImpl,url));
  }
  if(provider==='internet-archive') {
    const q=`(${query.replace(/[():]/g,' ')}) AND mediatype:(texts)`;
    const url=`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=creator&fl%5B%5D=description&fl%5B%5D=date&fl%5B%5D=collection&fl%5B%5D=mediatype&rows=8&page=1&output=json`;
    return archiveItems(await fetchJson(fetchImpl,url));
  }
  if(provider==='federal-register') {
    const url=`https://www.federalregister.gov/api/v1/documents.json?per_page=8&order=relevance&conditions%5Bterm%5D=${encodeURIComponent(query)}`;
    return federalRegisterItems(await fetchJson(fetchImpl,url));
  }
  return [];
}

function chooseProviders(claimText,publication={}) {
  const haystack=normalizeText(`${claimText} ${publication.title||''} ${publication.summary||''}`);
  const providers=['crossref','datacite'];
  if(/brain|medical|biolog|neuro|health|clinical|cell|protein|drug|disease|electromagnetic|frequency|auditory|psycholog/.test(haystack)) providers.push('europe-pmc');
  if(/government|cia|fbi|military|program|declassified|archive|history|historical|intelligence|senate|congress|cold war|uap|ufo/.test(haystack)) providers.push('internet-archive','federal-register');
  return [...new Set(providers)];
}

/**
 * Best-effort public-web discovery for the local build. It intentionally fails open at the
 * provider level (one provider can be down) but reports failures so publishing can fail closed
 * only when every discovery provider is unavailable.
 */
export async function discoverSourcesForClaim({claim,publication={},topics=[],fetchImpl=globalThis.fetch,maxSources=10}={}) {
  if(!claim?.title) return {claimId:claim?.id,candidates:[],providers:[],failures:['Claim has no canonical text.']};
  if(typeof fetchImpl!=='function') return {claimId:claim.id,candidates:[],providers:[],failures:['No network fetch implementation available.']};
  const queries=buildSourceQueries({claim,publication,topics});
  const query=queries[0] || claim.title;
  const providers=chooseProviders(claim.title,publication);
  const settled=await Promise.allSettled(providers.map(async(provider)=>({provider,items:await queryProvider(provider,query,fetchImpl)})));
  const failures=[];
  const raw=[];
  settled.forEach((result,index)=>{
    if(result.status==='fulfilled') raw.push(...result.value.items);
    else failures.push(`${providers[index]}: ${result.reason?.message||'request failed'}`);
  });
  const ranked=dedupeSourceCandidates(raw.map((candidate)=>rankSourceCandidate(candidate,claim.title)))
    .map((candidate)=>rankSourceCandidate(candidate,claim.title))
    .filter((candidate)=>candidate.relevance>=.36 && candidate.rankScore>=.38 && !candidate.retracted)
    .sort((a,b)=>b.rankScore-a.rankScore)
    .slice(0,maxSources);
  return {claimId:claim.id,candidates:ranked,providers,failures,queries};
}

export async function discoverSourcesForDraft(draft,{fetchImpl=globalThis.fetch,maxSourcesPerClaim=10,topics=[]}={}) {
  const claims=(draft?.objects||[]).filter((object)=>object.type==='claim');
  const publication={title:draft?.title||'',summary:draft?.summary||draft?.subtitle||''};
  if(!claims.length) return {discoveries:[],providerFailures:[],providerSuccesses:0,claimsSearched:0};
  const results=await Promise.all(claims.map((claim)=>discoverSourcesForClaim({claim,publication,topics,fetchImpl,maxSources:maxSourcesPerClaim})));
  const providerFailures=results.flatMap((result)=>result.failures||[]);
  const attempted=results.reduce((sum,result)=>sum+(result.providers?.length||0),0);
  const providerSuccesses=Math.max(0,attempted-providerFailures.length);
  return {discoveries:results,providerFailures,providerSuccesses,claimsSearched:claims.length};
}
