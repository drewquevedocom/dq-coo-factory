/* DQ OS v6 - fit + fill. Runs after dq-v5.js.
   Reorganises the right rail into four boxes, caps tall lists,
   and fills the centre dead space with compact info tiles. */
(function(){
var D=document,$=function(s,r){return (r||D).querySelector(s)};
var W=$('.dqwrap');if(!W||$('.dq-v6'))return;
var cL=$('.dqcol.l'),cC=$('.dqcol.c'),cR=$('.dqcol.r');
if(!cL||!cC||!cR)return;
D.body.classList.add('dq-v6');

function el(t,c,h){var e=D.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){
 return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function panel(title,x,cls,mini){
 var p=el('section','panel dqp'+(mini?' dq-mini':''));
 p.appendChild(el('div','panel-head','<h2>'+title+'</h2>'+
  (x?'<span class="x'+(cls?' '+cls:'')+'">'+x+'</span>':'')));
 var b=el('div','bd');p.appendChild(b);return{p:p,b:b}}
function txt(id){var e=D.getElementById(id);return e?(e.textContent||'').trim():''}
function bad(s){return /fail|error|invalid|missing|reject|401|403|none|not set|offline|empty/i.test(s)}

/* ---------- cap the tall lists so the page fits ---------- */
['#open-list','#done-list','#log','#toolsList'].forEach(function(s){
 var e=$(s);if(e)e.classList.add('dq-cap')});
cR.querySelectorAll('.panel .bd').forEach(function(b){b.classList.add('dq-cap')});

/* ---------- merge the left column into fewer, denser panels ---------- */
/* Business Units + Connected collapse into compact strips */
(function(){
 var units=cL.querySelectorAll('.dq-unit');
 if(units.length){
  var host=units[0].parentNode;
  host.classList.add('dq-cap');
 }
})();

/* ---------- centre: fill the dead space ---------- */
var MONEY=[['$1,000','MRR NOW','z'],['$20,000','TARGET',''],['3','CLIENTS TO GO','a'],
 ['$40,000','DEBT','r'],['$3,500','PIPELINE','g'],['2d','TO FRIDAY','a']];
var mp=panel('Money At A Glance','path to 20k');
mp.b.appendChild(el('div','dq-strip',MONEY.map(function(m){
 return '<div class="dq-st '+m[2]+'"><b>'+m[0]+'</b><span>'+m[1]+'</span></div>'}).join('')));

var WORK=[['Walk-in list','40 built / 21 qualify','ok'],
 ['One-pagers','0 of 21 written','w'],
 ['Review stands','plaques Friday','w'],
 ['Landing page','copy only','w'],
 ['Daily brief','not scheduled','b'],
 ['Hooks inbox','0 messages','ok']];
var wp=panel('Friday Readiness','<span id="dq-ready">--</span>','w');
wp.b.appendChild(el('div','dq-tiles',WORK.map(function(w){
 return '<div class="dq-tile"><div class="h"><i class="'+w[2]+'"></i>'+esc(w[0])+
  '</div><span>'+esc(w[1])+'</span></div>'}).join('')));

var cr=el('div','dq-centre-rows');
cr.appendChild(mp.p);cr.appendChild(wp.p);
var ur=cC.querySelector('.dq-urows');
if(ur)cC.insertBefore(cr,ur);else cC.appendChild(cr);

/* ---------- right rail: exactly four boxes ---------- */
/* box 1 = Next Moves (existing, live). box 2 = Agents Live Work (existing).
   box 3 = Current Operations (existing). box 4 = new Pipeline + Ideas. */
var pr=$('.panel.right'),opPanel=null,agPanel=null;
cR.querySelectorAll('.panel.dqp').forEach(function(p){
 var h=p.querySelector('h2');if(!h)return;
 var t=(h.textContent||'').toLowerCase();
 if(t.indexOf('current operations')>=0)opPanel=p;
 if(t.indexOf('agent team')>=0||t.indexOf('agents live')>=0){agPanel=p;
  h.textContent='Agents Live Work'}
});
/* fold the pipeline and idea panels into one fourth box */
var fourth=panel('Pipeline &amp; Ideas','<span id="dq-p4">--</span>');
var oldFunnel=null,oldIdeas=null;
cR.querySelectorAll('.panel.dqp').forEach(function(p){
 var h=p.querySelector('h2');if(!h)return;
 var t=(h.textContent||'').toLowerCase();
 if(t.indexOf('lead pipeline')>=0)oldFunnel=p;
 if(t.indexOf('idea factory')>=0)oldIdeas=p});
if(oldFunnel){
 var rows=oldFunnel.querySelectorAll('.dq-f');
 var strip=el('div','dq-strip');
 rows.forEach(function(r){
  var lb=r.querySelector('.lb'),ct=r.querySelector('.ct');
  if(!lb||!ct)return;
  var n=parseInt(ct.textContent,10)||0;
  strip.appendChild(el('div','dq-st '+(n>0?'':'z'),
   '<b>'+n+'</b><span>'+esc(lb.textContent.trim())+'</span>'))});
 fourth.b.appendChild(strip);
 oldFunnel.remove();
}
if(oldIdeas){
 var ideas=oldIdeas.querySelectorAll('.dq-idea');
 var tiles=el('div','dq-tiles');
 var shown=0;
 ideas.forEach(function(i){
  if(shown>=4)return;shown++;
  var sc=i.querySelector('.sc'),nm=i.querySelector('.nm');
  if(!sc||!nm)return;
  var v=parseInt(sc.textContent,10)||0;
  tiles.appendChild(el('div','dq-tile',
   '<div class="h"><i class="'+(v>=85?'ok':v>=65?'w':'')+'"></i>SCORE '+v+
   '</div><span>'+esc(nm.textContent.trim())+'</span>'))});
 fourth.b.appendChild(tiles);
 oldIdeas.remove();
}
cR.appendChild(fourth.p);

/* order the rail: Next Moves, Agents, Current Operations, Pipeline+Ideas */
[pr,agPanel,opPanel,fourth.p].forEach(function(p){if(p)cR.appendChild(p)});
/* anything else left in the rail folds into the fourth box's tail */
cR.querySelectorAll(':scope > .panel').forEach(function(p){
 if(p!==pr&&p!==agPanel&&p!==opPanel&&p!==fourth.p)p.remove()});

/* ---------- live refresh ---------- */
function refresh(){
 var ready=0,tot=6;
 var tiles=wp.b.querySelectorAll('.dq-tile .h i');
 tiles.forEach(function(i){if(i.classList.contains('ok'))ready++});
 var r=$('#dq-ready');
 if(r){r.textContent=ready+' of '+tot+' ready';
  r.className='x'+(ready>=5?'':ready>=3?' w':' hot')}
 var hv=txt('sy-voice');
 if(hv){var vt=mp.b;void vt}
 var p4=$('#dq-p4');
 if(p4){var n=cR.querySelectorAll('.dq-st:not(.z)').length;
  p4.textContent=n+' live'}
 /* hooks tile tracks the real inbox count if the page ever exposes it */
 var hk=D.getElementById('dq-hooks-count');
 if(hk){var t=wp.b.querySelectorAll('.dq-tile')[5];
  if(t)t.querySelector('span').textContent=hk.textContent.trim()+' messages'}
}
refresh();setInterval(refresh,5000);
})();
