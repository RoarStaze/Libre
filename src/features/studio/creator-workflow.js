function repo(){ return window.__LIBRE__?.repository || null; }
function currentDraftId(){ return document.querySelector('[data-draft-id]')?.dataset.draftId || null; }

function notify(message){
  let node=document.querySelector('.creator-workflow-toast');
  if(!node){ node=document.createElement('div'); node.className='creator-workflow-toast'; document.body.append(node); }
  node.textContent=message;
  node.dataset.visible='true';
  clearTimeout(notify.timer);
  notify.timer=setTimeout(()=>node.dataset.visible='false',2800);
}

function refreshStudio(draftId){
  if(!draftId) return;
  location.hash=`#/studio/${encodeURIComponent(draftId)}?refresh=${Date.now()}`;
}

function loadBitmap(file){
  if('createImageBitmap' in window) return createImageBitmap(file);
  return new Promise((resolve,reject)=>{
    const image=new Image();
    const url=URL.createObjectURL(file);
    image.onload=()=>{ URL.revokeObjectURL(url); resolve(image); };
    image.onerror=()=>{ URL.revokeObjectURL(url); reject(new Error('Libre could not read that image.')); };
    image.src=url;
  });
}

async function createThumbnailData(file){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPG, or WebP image.');
  if(file.size>12*1024*1024) throw new Error('Choose an image smaller than 12 MB. Libre compresses it for the local build.');

  const image=await loadBitmap(file);
  const sourceWidth=image.width || image.naturalWidth;
  const sourceHeight=image.height || image.naturalHeight;
  if(!sourceWidth || !sourceHeight) throw new Error('Libre could not determine the image dimensions.');

  const width=1280;
  const height=720;
  const targetRatio=width/height;
  const sourceRatio=sourceWidth/sourceHeight;
  let sx=0,sy=0,sw=sourceWidth,sh=sourceHeight;
  if(sourceRatio>targetRatio){ sw=sourceHeight*targetRatio; sx=(sourceWidth-sw)/2; }
  else { sh=sourceWidth/targetRatio; sy=(sourceHeight-sh)/2; }

  const canvas=document.createElement('canvas');
  canvas.width=width; canvas.height=height;
  const context=canvas.getContext('2d',{alpha:false});
  context.imageSmoothingEnabled=true;
  context.imageSmoothingQuality='high';
  context.drawImage(image,sx,sy,sw,sh,0,0,width,height);
  image.close?.();

  let data=canvas.toDataURL('image/webp',.86);
  if(data.length>2_650_000) data=canvas.toDataURL('image/webp',.72);
  if(data.length>2_650_000) data=canvas.toDataURL('image/jpeg',.78);
  if(data.length>2_800_000) throw new Error('That image is still too large after optimization. Try a simpler or smaller image.');
  return data;
}

function openObjectEditor(draftId,objectId){
  const repository=repo();
  const draft=repository?.getDraft(draftId);
  const object=draft?.objects.find((entry)=>entry.id===objectId);
  if(!object) return notify('Knowledge object not found.');
  if(object.metadataLocked) return notify('Libre-discovered source metadata is locked. Remove it instead of rewriting it.');

  const dialog=document.createElement('dialog');
  dialog.className='creator-edit-dialog';
  const form=document.createElement('form');
  form.method='dialog';
  const heading=document.createElement('h2'); heading.textContent='Edit knowledge object';
  const label=document.createElement('label'); label.textContent='Text / title';
  const textarea=document.createElement('textarea'); textarea.value=object.title||''; textarea.required=true; textarea.rows=6;
  const actions=document.createElement('div'); actions.className='creator-edit-actions';
  const cancel=document.createElement('button'); cancel.type='button'; cancel.className='quiet-button'; cancel.textContent='Cancel';
  const save=document.createElement('button'); save.type='submit'; save.className='primary-button'; save.textContent='Save changes';
  actions.append(cancel,save); form.append(heading,label,textarea,actions); dialog.append(form); document.body.append(dialog);
  cancel.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  form.addEventListener('submit',(event)=>{
    event.preventDefault();
    try{
      repository.updateDraftObject(draftId,objectId,{title:textarea.value.trim()});
      dialog.close(); refreshStudio(draftId);
    }catch(error){ notify(error.message); }
  });
  dialog.showModal(); textarea.focus(); textarea.setSelectionRange(textarea.value.length,textarea.value.length);
}

function moveReaderPath(draftId,objectId,direction){
  const repository=repo();
  const draft=repository?.getDraft(draftId);
  if(!draft) return;
  const path=[...draft.readerPath];
  const index=path.indexOf(objectId);
  if(index<0) return;
  if(direction==='remove') path.splice(index,1);
  else {
    const next=direction==='up'?index-1:index+1;
    if(next<0 || next>=path.length) return;
    [path[index],path[next]]=[path[next],path[index]];
  }
  repository.setReaderPath(draftId,path);
  refreshStudio(draftId);
}

document.addEventListener('change',async(event)=>{
  const input=event.target.closest?.('[data-thumbnail-file]');
  if(!input) return;
  const file=input.files?.[0];
  const draftId=currentDraftId();
  if(!file || !draftId) return;
  input.disabled=true;
  try{
    notify('Optimizing thumbnail to 16:9…');
    const thumbnail=await createThumbnailData(file);
    repo().updateDraft(draftId,{thumbnail});
    notify('Thumbnail saved.');
    refreshStudio(draftId);
  }catch(error){ notify(error.message || 'Thumbnail could not be saved.'); input.disabled=false; }
});

document.addEventListener('click',(event)=>{
  const editSpace=event.target.closest?.('[data-edit-space]');
  if(editSpace){
    event.preventDefault();
    try{
      const draft=repo().createEditDraft(editSpace.dataset.editSpace);
      location.hash=`#/studio/${encodeURIComponent(draft.id)}`;
    }catch(error){ notify(error.message); }
    return;
  }

  const removeThumbnail=event.target.closest?.('[data-thumbnail-remove]');
  if(removeThumbnail){
    const draftId=currentDraftId();
    if(draftId){ repo().updateDraft(draftId,{thumbnail:null}); refreshStudio(draftId); }
    return;
  }

  const editObject=event.target.closest?.('[data-edit-draft-object]');
  if(editObject){ openObjectEditor(currentDraftId(),editObject.dataset.editDraftObject); return; }

  const removeObject=event.target.closest?.('[data-remove-draft-object]');
  if(removeObject){
    const draftId=currentDraftId();
    if(draftId && confirm('Remove this object from the draft? Its Reader Path step and connected draft relationships will also be removed.')){
      try{ repo().removeDraftObject(draftId,removeObject.dataset.removeDraftObject); refreshStudio(draftId); }
      catch(error){ notify(error.message); }
    }
    return;
  }

  const removeRelation=event.target.closest?.('[data-remove-draft-relation]');
  if(removeRelation){
    const draftId=currentDraftId();
    if(draftId){
      try{ repo().removeDraftRelation(draftId,removeRelation.dataset.removeDraftRelation); refreshStudio(draftId); }
      catch(error){ notify(error.message); }
    }
    return;
  }

  const up=event.target.closest?.('[data-reader-path-up]');
  if(up){ moveReaderPath(currentDraftId(),up.dataset.readerPathUp,'up'); return; }
  const down=event.target.closest?.('[data-reader-path-down]');
  if(down){ moveReaderPath(currentDraftId(),down.dataset.readerPathDown,'down'); return; }
  const removePath=event.target.closest?.('[data-reader-path-remove]');
  if(removePath){ moveReaderPath(currentDraftId(),removePath.dataset.readerPathRemove,'remove'); }
});
