// ---------- Photo gallery: category filters + lightbox ----------
(function(){
  // keep the filter bar pinned just under the sticky header
  const setHdr = () => document.documentElement.style.setProperty('--hdr', document.querySelector('header').offsetHeight + 'px');
  setHdr(); window.addEventListener('resize', setHdr);

  const chips = document.querySelectorAll('.ph-filters .chip');
  const cats = document.querySelectorAll('.ph-cat');

  function applyFilter(filter, scroll){
    chips.forEach(c => {
      const on = c.dataset.filter === filter;
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    cats.forEach(cat => { cat.hidden = !(filter === 'all' || cat.dataset.cat === filter); });
    if(scroll){
      const body = document.querySelector('.ph-body');
      const headerH = document.querySelector('header').offsetHeight + document.querySelector('.ph-filters').offsetHeight;
      window.scrollTo({ top: body.getBoundingClientRect().top + window.scrollY - headerH, behavior: 'smooth' });
    }
  }
  chips.forEach(c => c.addEventListener('click', () => {
    applyFilter(c.dataset.filter, true);
    try { history.replaceState(null, '', c.dataset.filter === 'all' ? 'gallery.html' : '#' + c.dataset.filter); } catch(e){}
  }));
  // Support deep links like gallery.html#pool (category) — photo links (#photo=id) are handled below
  const hash = location.hash.replace('#','');
  if(hash && document.querySelector('.ph-cat[data-cat="' + hash + '"]')) applyFilter(hash, false);

  // ---------- Lightbox ----------
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  const lbCount = document.getElementById('lbCount');
  let list = [], idx = 0;

  function visibleItems(){
    return Array.from(document.querySelectorAll('.ph-cat:not([hidden]) .ph-item'));
  }
  function show(i){
    idx = (i + list.length) % list.length;
    const a = list[idx];
    const img = a.querySelector('img');
    lbImg.src = a.dataset.full;
    lbImg.alt = img.alt;
    const catName = a.closest('.ph-cat').querySelector('h2').textContent;
    lbCap.textContent = catName + ' — ' + img.alt;
    lbCount.textContent = (idx + 1) + ' / ' + list.length;
    try { history.replaceState(null, '', '#photo=' + a.dataset.id); } catch(e){}
    closeShare();
    // preload neighbours
    [idx + 1, idx - 1].forEach(n => { const p = list[(n + list.length) % list.length]; if(p){ const im = new Image(); im.src = p.dataset.full; } });
  }
  function open(a){
    list = visibleItems();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    show(list.indexOf(a));
  }
  function close(){
    lb.hidden = true;
    document.body.style.overflow = '';
    lbImg.removeAttribute('src');
    closeShare();
    try { history.replaceState(null, '', location.pathname + location.search); } catch(e){}
  }

  document.querySelectorAll('.ph-item').forEach(a => a.addEventListener('click', e => { e.preventDefault(); open(a); }));
  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', e => { e.stopPropagation(); show(idx - 1); });
  document.getElementById('lbNext').addEventListener('click', e => { e.stopPropagation(); show(idx + 1); });
  lb.addEventListener('click', e => { if(e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if(lb.hidden) return;
    if(e.key === 'Escape'){ if(!shareMenu.hidden) closeShare(); else close(); }
    else if(e.key === 'ArrowRight') show(idx + 1);
    else if(e.key === 'ArrowLeft') show(idx - 1);
  });

  // Swipe on touch screens
  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if(x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if(Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  // ---------- Sharing ----------
  // Each photo has a small share page at /p/<id>.html carrying that photo's
  // preview (og:image), so WhatsApp/Facebook show the right picture.
  const SITE_URL = 'https://fairway-residence.vercel.app'; // change when thefairwayresidence.com goes live
  const shareBtn = document.getElementById('lbShare');
  const shareMenu = document.getElementById('shareMenu');
  const toast = document.getElementById('shareToast');
  const canNative = !!navigator.share;

  function current(){
    const a = list[idx];
    const url = SITE_URL + '/p/' + a.dataset.id + '.html';
    const text = a.querySelector('img').alt + ' — The Fairway Residence, Nyeri';
    return { a, url, text };
  }
  function closeShare(){
    if(!shareMenu) return;
    shareMenu.hidden = true;
    shareBtn.setAttribute('aria-expanded', 'false');
  }
  function flash(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(flash.t);
    flash.t = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  async function imageFile(a){
    const src = a.dataset.full;
    if(/^https?:/.test(src) && !src.startsWith(location.origin)) return null; // external host — can't attach
    const res = await fetch(src);
    const blob = await res.blob();
    return new File([blob], a.dataset.id + '.jpg', { type: blob.type || 'image/jpeg' });
  }

  shareBtn.addEventListener('click', e => {
    e.stopPropagation();
    if(!shareMenu.hidden){ closeShare(); return; }
    const { a, url, text } = current();
    const u = encodeURIComponent(url), t = encodeURIComponent(text);
    shareMenu.querySelector('[data-share="whatsapp"]').href = 'https://wa.me/?text=' + t + '%20' + u;
    shareMenu.querySelector('[data-share="facebook"]').href = 'https://www.facebook.com/sharer/sharer.php?u=' + u;
    shareMenu.querySelector('[data-share="x"]').href = 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u;
    shareMenu.querySelector('[data-share="native"]').hidden = !canNative;
    const external = /^https?:/.test(a.dataset.full);
    shareMenu.querySelector('[data-share="image"]').hidden = !(canNative && navigator.canShare && !external);
    shareMenu.hidden = false;
    shareBtn.setAttribute('aria-expanded', 'true');
  });
  shareMenu.addEventListener('click', async e => {
    e.stopPropagation();
    const el = e.target.closest('[data-share]');
    if(!el) return;
    const { a, url, text } = current();
    const kind = el.dataset.share;
    if(kind === 'native'){
      try { await navigator.share({ title: 'The Fairway Residence', text, url }); } catch(err){}
      closeShare();
    } else if(kind === 'image'){
      try {
        const file = await imageFile(a);
        if(file && navigator.canShare({ files: [file] })){
          await navigator.share({ files: [file], text: text + ' ' + url });
        } else {
          await navigator.share({ title: 'The Fairway Residence', text, url });
        }
      } catch(err){}
      closeShare();
    } else if(kind === 'copy'){
      try { await navigator.clipboard.writeText(url); flash('Link copied'); }
      catch(err){ window.prompt('Copy this link:', url); }
      closeShare();
    } else {
      setTimeout(closeShare, 100); // let the link open first
    }
  });
  document.addEventListener('click', e => {
    if(shareMenu && !shareMenu.hidden && !shareMenu.contains(e.target) && e.target !== shareBtn) closeShare();
  });

  // Open a photo straight away when arriving from a shared link (#photo=<id>)
  const m = location.hash.match(/^#photo=([\w-]+)/);
  if(m){
    const target = document.querySelector('.ph-item[data-id="' + m[1] + '"]');
    if(target) open(target);
  }
})();
