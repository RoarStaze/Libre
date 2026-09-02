const now = Date.now();
const day = 86_400_000;

const objects = [
  { id:'creator-vale', type:'person', title:'Mara Vale', handle:'maravale', bio:'Independent archival researcher mapping declassified intelligence programs.', topics:['topic-intelligence','topic-history'], avatar:'MV', createdAt: now-day*500, popularity:83 },
  { id:'creator-chen', type:'person', title:'Elias Chen', handle:'echen', bio:'Science writer focused on disputed claims, replication, and primary sources.', topics:['topic-consciousness','topic-science'], avatar:'EC', createdAt: now-day*380, popularity:74 },
  { id:'creator-rhodes', type:'person', title:'Nia Rhodes', handle:'niarhodes', bio:'Historian of secrecy, institutions, and Cold War research programs.', topics:['topic-history','topic-intelligence'], avatar:'NR', createdAt: now-day*620, popularity:68 },

  { id:'topic-intelligence', type:'topic', title:'Government & Intelligence', slug:'government-intelligence', description:'Programs, archives, institutions, oversight, and declassified records.', popularity:91 },
  { id:'topic-consciousness', type:'topic', title:'Consciousness', slug:'consciousness', description:'Perception, cognition, altered states, and contested research.', popularity:88 },
  { id:'topic-science', type:'topic', title:'Frontier Science', slug:'frontier-science', description:'Unusual scientific claims examined through sources, replication, and criticism.', popularity:79 },
  { id:'topic-history', type:'topic', title:'Hidden History', slug:'hidden-history', description:'Forgotten, suppressed, obscure, or rediscovered historical material.', popularity:86 },

  { id:'space-stargate', type:'publication', title:'Stargate: What the Declassified Record Actually Shows', subtitle:'A source-first map of the U.S. government remote-viewing program—and the gap between existence and effectiveness.', creatorId:'creator-vale', topicIds:['topic-intelligence','topic-consciousness'], format:'investigation', evidenceState:'disputed', sourceCount:18, claimCount:9, readMinutes:21, createdAt:now-day*3, updatedAt:now-day, popularity:96, depth:94, summary:'The program existed. The harder question is whether the experiments produced reliable information. This Space separates program history from performance claims.', heroMode:'constellation', readerPath:['block-stargate-intro','doc-stargate-report','claim-stargate-existed','claim-remote-viewing-effective','event-stargate-1972','event-stargate-1995'], tags:['CIA','remote viewing','declassified'] },
  { id:'space-mkultra', type:'publication', title:'MKULTRA Without the Mythology', subtitle:'The documented program, the surviving record, and claims that outrun the evidence.', creatorId:'creator-rhodes', topicIds:['topic-intelligence','topic-history'], format:'investigation', evidenceState:'established', sourceCount:31, claimCount:12, readMinutes:34, createdAt:now-day*7, updatedAt:now-day*2, popularity:94, depth:98, summary:'A layered reconstruction of what is documented, what was destroyed, and what remains disputed.', heroMode:'timeline', readerPath:['block-mkultra-intro','doc-mkultra-hearing','claim-mkultra-existed','claim-mkultra-mindcontrol','event-mkultra-1953','event-mkultra-1977'], tags:['MKULTRA','CIA','Cold War'] },
  { id:'space-bioresonance', type:'publication', title:'Bioelectromagnetic Effects: Signal, Noise, and Speculation', subtitle:'A claim-by-claim review of what external electromagnetic stimulation can and cannot establish.', creatorId:'creator-chen', topicIds:['topic-science','topic-consciousness'], format:'evidence-map', evidenceState:'preliminary', sourceCount:24, claimCount:14, readMinutes:27, createdAt:now-day*1, updatedAt:now-day*1, popularity:89, depth:92, summary:'From TMS to microwave auditory effects: real mechanisms, disputed extrapolations, and where the evidence breaks.', heroMode:'spectrum', readerPath:['block-em-intro','claim-elf-calcium','source-blackman-1982','claim-frey-effect','source-frey-review','claim-remote-control'] , tags:['EMF','neuroscience','resonance']},
  { id:'space-antikythera', type:'publication', title:'The Antikythera Mechanism Was More Capable Than Most People Realize', subtitle:'A mechanical computer reconstructed from fragments, inscriptions, and astronomy.', creatorId:'creator-rhodes', topicIds:['topic-history','topic-science'], format:'visual-explainer', evidenceState:'supported', sourceCount:16, claimCount:7, readMinutes:18, createdAt:now-day*12, updatedAt:now-day*4, popularity:82, depth:85, summary:'Trace the evidence from corroded fragments to the reconstructed gearing model.', heroMode:'artifact', readerPath:['block-anti-intro','claim-anti-computer','source-anti-nature','event-anti-1901'], tags:['ancient technology','Greece','astronomy'] },

  { id:'claim-stargate-existed', type:'claim', title:'The U.S. government funded and operated remote-viewing research programs for decades.', creatorId:'creator-vale', topicIds:['topic-intelligence'], evidenceState:'established', sourceCount:7, supportCount:7, contradictCount:0, createdAt:now-day*3, popularity:88 },
  { id:'claim-remote-viewing-effective', type:'claim', title:'Remote viewing produced operationally useful information at a reliable rate.', creatorId:'creator-vale', topicIds:['topic-consciousness','topic-intelligence'], evidenceState:'disputed', sourceCount:9, supportCount:4, contradictCount:5, createdAt:now-day*3, popularity:93 },
  { id:'claim-mkultra-existed', type:'claim', title:'MKULTRA was a real CIA research program involving behavior modification and human experimentation.', creatorId:'creator-rhodes', topicIds:['topic-intelligence','topic-history'], evidenceState:'established', sourceCount:11, supportCount:11, contradictCount:0, createdAt:now-day*7, popularity:95 },
  { id:'claim-mkultra-mindcontrol', type:'claim', title:'MKULTRA achieved dependable remote control of complex human behavior.', creatorId:'creator-rhodes', topicIds:['topic-intelligence'], evidenceState:'unverified', sourceCount:8, supportCount:2, contradictCount:6, createdAt:now-day*7, popularity:97 },
  { id:'claim-elf-calcium', type:'claim', title:'Certain ELF or ELF-modulated exposures produced frequency-dependent calcium-ion efflux changes in chick brain tissue in vitro.', creatorId:'creator-chen', topicIds:['topic-science'], evidenceState:'preliminary', sourceCount:6, supportCount:4, contradictCount:2, createdAt:now-day, popularity:79 },
  { id:'claim-frey-effect', type:'claim', title:'Pulsed radio-frequency exposure can produce an auditory perception under specific conditions.', creatorId:'creator-chen', topicIds:['topic-science'], evidenceState:'established', sourceCount:8, supportCount:8, contradictCount:0, createdAt:now-day, popularity:81 },
  { id:'claim-remote-control', type:'claim', title:'The documented bioelectromagnetic effects demonstrate precise long-range control of complex thoughts or behavior.', creatorId:'creator-chen', topicIds:['topic-science','topic-consciousness'], evidenceState:'unverified', sourceCount:10, supportCount:1, contradictCount:9, createdAt:now-day, popularity:92 },
  { id:'claim-anti-computer', type:'claim', title:'The Antikythera mechanism implemented a sophisticated geared model of astronomical cycles.', creatorId:'creator-rhodes', topicIds:['topic-history','topic-science'], evidenceState:'supported', sourceCount:6, supportCount:6, contradictCount:0, createdAt:now-day*12, popularity:76 },

  { id:'doc-stargate-report', type:'document', title:'An Evaluation of Remote Viewing: Research and Applications', creatorId:'creator-vale', topicIds:['topic-intelligence','topic-consciousness'], publisher:'American Institutes for Research', year:1995, pages:183, evidenceState:'established', provenance:'public report', createdAt:now-day*3, popularity:87 },
  { id:'passage-stargate-conclusion', type:'document_passage', title:'Evaluation conclusion excerpt', parentId:'doc-stargate-report', page:3, excerpt:'The reviewers reached different judgments about whether the laboratory results established a paranormal phenomenon.', createdAt:now-day*3, popularity:80 },
  { id:'doc-mkultra-hearing', type:'document', title:'Project MKULTRA, the CIA’s Program of Research in Behavioral Modification', creatorId:'creator-rhodes', topicIds:['topic-intelligence','topic-history'], publisher:'U.S. Senate', year:1977, pages:185, evidenceState:'established', provenance:'public congressional hearing', createdAt:now-day*7, popularity:91 },
  { id:'passage-mkultra-records', type:'document_passage', title:'Testimony on destroyed records', parentId:'doc-mkultra-hearing', page:10, excerpt:'The surviving record is incomplete because many files were destroyed before later investigations.', createdAt:now-day*7, popularity:85 },
  { id:'source-blackman-1982', type:'source', title:'Effects of ELF fields on calcium-ion efflux from chick brain tissue', creatorId:'creator-chen', topicIds:['topic-science'], publisher:'Bioelectromagnetics research literature', year:1982, evidenceState:'preliminary', sourceKind:'peer-reviewed study', createdAt:now-day, popularity:73 },
  { id:'source-frey-review', type:'source', title:'Review literature on the microwave auditory effect', creatorId:'creator-chen', topicIds:['topic-science'], publisher:'biomedical literature', year:2021, evidenceState:'supported', sourceKind:'review', createdAt:now-day, popularity:71 },
  { id:'source-anti-nature', type:'source', title:'Reconstruction research on the Antikythera mechanism', creatorId:'creator-rhodes', topicIds:['topic-history','topic-science'], publisher:'Nature / related scholarship', year:2021, evidenceState:'supported', sourceKind:'research article', createdAt:now-day*12, popularity:69 },

  { id:'video-stargate-hearing', type:'video', title:'Archive Briefing: The 1995 Stargate Evaluation', creatorId:'creator-vale', topicIds:['topic-intelligence'], duration:'18:42', transcript:true, sourceCount:5, createdAt:now-day*5, popularity:84, summary:'Walk through the competing evaluator conclusions without collapsing them into one verdict.' },
  { id:'dataset-cia-readingroom', type:'dataset', title:'CIA Reading Room: Stargate Document Index', creatorId:'creator-vale', topicIds:['topic-intelligence'], rows:12140, sourceCount:1, createdAt:now-day*18, popularity:66, summary:'A searchable index of released documents connected to Stargate-era material.' },
  { id:'debate-rv-evidence', type:'debate', title:'Did the Stargate experiments establish anomalous cognition?', creatorId:'creator-chen', topicIds:['topic-consciousness'], evidenceState:'disputed', proCount:12, conCount:15, sourceCount:21, createdAt:now-day*2, popularity:90 },

  { id:'trail-mind-programs', type:'trail', title:'Cold War Mind Programs: Start With the Documents', creatorId:'creator-vale', topicIds:['topic-intelligence','topic-history'], steps:['doc-mkultra-hearing','space-mkultra','doc-stargate-report','space-stargate','debate-rv-evidence'], readMinutes:58, createdAt:now-day*4, popularity:93, summary:'A guided route from primary documents to the claims people often make from them.' },
  { id:'collection-source-first', type:'collection', title:'Primary Sources Before Theories', creatorId:'creator-chen', topicIds:['topic-intelligence','topic-science'], items:['doc-mkultra-hearing','doc-stargate-report','source-blackman-1982','source-frey-review'], createdAt:now-day*8, popularity:78 },

  { id:'event-stargate-1972', type:'timeline_event', title:'SRI remote-viewing research begins', year:1972, topicIds:['topic-intelligence'], createdAt:now-day*3, popularity:64 },
  { id:'event-stargate-1995', type:'timeline_event', title:'AIR evaluation and program termination', year:1995, topicIds:['topic-intelligence'], createdAt:now-day*3, popularity:67 },
  { id:'event-mkultra-1953', type:'timeline_event', title:'MKULTRA formally approved', year:1953, topicIds:['topic-intelligence'], createdAt:now-day*7, popularity:72 },
  { id:'event-mkultra-1977', type:'timeline_event', title:'Senate hearing examines MKULTRA records', year:1977, topicIds:['topic-intelligence','topic-history'], createdAt:now-day*7, popularity:74 },
  { id:'event-anti-1901', type:'timeline_event', title:'Antikythera wreck discovered', year:1901, topicIds:['topic-history'], createdAt:now-day*12, popularity:61 },

  { id:'block-stargate-intro', type:'quote', title:'Existence is documented. Effectiveness remains contested.', body:'Libre separates those two questions so the evidence for one is not silently used as evidence for the other.', createdAt:now-day*3 },
  { id:'block-mkultra-intro', type:'quote', title:'A real program can accumulate unreal claims.', body:'Start with what the surviving record establishes, then trace where later interpretations diverge.', createdAt:now-day*7 },
  { id:'block-em-intro', type:'quote', title:'Biological effect is not the same claim as precise behavioral control.', body:'This Space keeps mechanism, measured effect, extrapolation, and speculation on separate layers.', createdAt:now-day },
  { id:'block-anti-intro', type:'quote', title:'The machine is astonishing enough without inventing capabilities it did not have.', body:'Reconstruction begins with fragments, inscriptions, and gear ratios.', createdAt:now-day*12 }
];

const relations = [
  { id:'r1', fromId:'space-stargate', toId:'doc-stargate-report', type:'cites' },
  { id:'r2', fromId:'claim-stargate-existed', toId:'doc-stargate-report', type:'supports' },
  { id:'r3', fromId:'claim-remote-viewing-effective', toId:'doc-stargate-report', type:'cites' },
  { id:'r4', fromId:'passage-stargate-conclusion', toId:'doc-stargate-report', type:'part_of' },
  { id:'r5', fromId:'doc-stargate-report', toId:'event-stargate-1995', type:'related_to' },
  { id:'r6', fromId:'event-stargate-1972', toId:'event-stargate-1995', type:'preceded_by' },
  { id:'r7', fromId:'space-stargate', toId:'claim-stargate-existed', type:'explains' },
  { id:'r8', fromId:'space-stargate', toId:'claim-remote-viewing-effective', type:'questions' },
  { id:'r9', fromId:'debate-rv-evidence', toId:'claim-remote-viewing-effective', type:'responds_to' },
  { id:'r10', fromId:'video-stargate-hearing', toId:'doc-stargate-report', type:'derived_from' },
  { id:'r11', fromId:'dataset-cia-readingroom', toId:'space-stargate', type:'related_to' },
  { id:'r12', fromId:'trail-mind-programs', toId:'space-stargate', type:'part_of' },
  { id:'r13', fromId:'space-mkultra', toId:'doc-mkultra-hearing', type:'cites' },
  { id:'r14', fromId:'claim-mkultra-existed', toId:'doc-mkultra-hearing', type:'supports' },
  { id:'r15', fromId:'claim-mkultra-mindcontrol', toId:'doc-mkultra-hearing', type:'cites' },
  { id:'r16', fromId:'passage-mkultra-records', toId:'doc-mkultra-hearing', type:'part_of' },
  { id:'r17', fromId:'space-mkultra', toId:'claim-mkultra-existed', type:'explains' },
  { id:'r18', fromId:'space-mkultra', toId:'claim-mkultra-mindcontrol', type:'questions' },
  { id:'r19', fromId:'event-mkultra-1953', toId:'event-mkultra-1977', type:'preceded_by' },
  { id:'r20', fromId:'space-mkultra', toId:'space-stargate', type:'related_to' },
  { id:'r21', fromId:'space-bioresonance', toId:'claim-elf-calcium', type:'explains' },
  { id:'r22', fromId:'claim-elf-calcium', toId:'source-blackman-1982', type:'supports' },
  { id:'r23', fromId:'space-bioresonance', toId:'claim-frey-effect', type:'explains' },
  { id:'r24', fromId:'claim-frey-effect', toId:'source-frey-review', type:'supports' },
  { id:'r25', fromId:'space-bioresonance', toId:'claim-remote-control', type:'questions' },
  { id:'r26', fromId:'claim-remote-control', toId:'claim-frey-effect', type:'derived_from' },
  { id:'r27', fromId:'claim-remote-control', toId:'claim-elf-calcium', type:'derived_from' },
  { id:'r28', fromId:'claim-remote-control', toId:'space-stargate', type:'related_to' },
  { id:'r29', fromId:'space-antikythera', toId:'claim-anti-computer', type:'explains' },
  { id:'r30', fromId:'claim-anti-computer', toId:'source-anti-nature', type:'supports' },
  { id:'r31', fromId:'event-anti-1901', toId:'space-antikythera', type:'related_to' },
  { id:'r32', fromId:'trail-mind-programs', toId:'doc-mkultra-hearing', type:'part_of' },
  { id:'r33', fromId:'trail-mind-programs', toId:'space-mkultra', type:'part_of' },
  { id:'r34', fromId:'trail-mind-programs', toId:'doc-stargate-report', type:'part_of' },
  { id:'r35', fromId:'collection-source-first', toId:'doc-mkultra-hearing', type:'part_of' },
  { id:'r36', fromId:'collection-source-first', toId:'doc-stargate-report', type:'part_of' },
  { id:'r37', fromId:'collection-source-first', toId:'source-blackman-1982', type:'part_of' },
  { id:'r38', fromId:'collection-source-first', toId:'source-frey-review', type:'part_of' }
];

export function createSeedGraph() {
  return {
    objects: objects.map((object) => ({ ...object })),
    relations: relations.map((relation) => ({ ...relation }))
  };
}
