document.addEventListener('click',(event)=>{
  const backButton=event.target.closest('[data-space-back]');
  if(backButton){
    event.preventDefault();
    history.back();
    return;
  }
  const forwardButton=event.target.closest('[data-space-forward]');
  if(forwardButton){
    event.preventDefault();
    history.forward();
  }
});

window.addEventListener('keydown',(event)=>{
  if(event.altKey && event.key==='ArrowLeft'){
    event.preventDefault();
    history.back();
  }
  if(event.altKey && event.key==='ArrowRight'){
    event.preventDefault();
    history.forward();
  }
});
