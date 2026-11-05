/* DQ OS v7 - split the giant right panel into four real boxes,
   drop the v6 caps that clipped the left column, add centre panels. */
(function(){
var D=document,$=function(s,r){return (r||D).querySelector(s)};
var W=$('.dqwrap');if(!W||D.body.classList.contains('dq-v7'))return;
var cL=$('.dqcol.l'),cC=$('.dqcol.c'),cR=$('.dqcol.r');
if(!cL||!cC||!cR)return;
D.body.classList.add('dq-v7');

function el(t,c,h){var e=D.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){
 return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function panel(title,x,cls){
 var p=el('section','panel dqp');
 p.appendChild(el('div','panel-head','<h2>'+title+'</h2>'+
  (x?'<span class="x'+(cls?' '+cls:'')+'">'+x+'</span>':'')));
 var b=el('div','bd');p.appendChild(b);return{p:p,b:b}}
function txt(id){var e=D.getElementById(id);return e?(e.textContent||'').trim():''}
function bad(s){return /fail|error|invalid|missing|reject|401|403|none|not set|offline|empty/i.test(s)}

/* ---- 1. undo v6's caps everywhere except two scroll lists ---- */
D.querySelectorAll('.dq-cap').forEach(function(e){
 if(e.id!=='log'&&e.id!=='toolsList')e.classList.remove('dq-cap')});

/* ---- 2. split .panel.right: Next Moves stays, system + log move out ---- */
var pr=$('.panel.right');
var sysBox=null;
if(pr){
 var sg=pr.querySelector('.sysgrid'),lg=D.getElementById('log'),
     ll=pr.querySelector('.log-lbl'),db=D.getElementById('done-block');
 if(sg){
  sysBox=panel('System &amp; Log','<span id="dq-sysx">--</span>');
  sysBox.b.appendChild(sg);
  if(ll)sysBox.b.appendChild(ll);
  if(lg)sysBox.b.appendChild(lg);
  if(db)sysBox.b.appendChild(db);
 }
 var h=pr.querySelector('.panel-head h2');
 if(h)h.textContent='Needs You';
}

/* ---- 3. find the panels we already have ---- */
var agP=null,opP=null,p4=null;
cR.querySelectorAll('.panel').forEach(function(p){
 var hh=p.querySelector('h2');if(!hh)return;
 var t=(hh.textContent||'').toLowerCase();
 if(t.indexOf('agent')>=0)agP=p;
 else if(t.indexOf('current operations')>=0)opP=p;
 else if(t.indexOf('pipeline')>=0)p4=p});

/* ---- 4. rebuild the rail as exactly four boxes ---- */
var keep=[pr,agP,opP,p4||sysBox].filter(Boolean);
/* fold whatever is left over into the fourth box before dropping it */
var spare=[];
cR.querySelectorAll(':scope > .panel').forEach(function(p){
 if(keep.indexOf(p)<0)spare.push(p)});
if(p4&&sysBox){
 /* both exist: put the system rows inside the pipeline box */
 var bd=p4.querySelector('.bd');
 if(bd)sysBox.b.childNodes.length&&Array.prototype.slice.call(sysBox.b.childNodes)
  .forEach(function(n){bd.appendChild(n)});
}
spare.forEach(function(p){p.remove()});
keep.forEach(function(p){cR.appendChild(p)});

/* ---- 5. extra centre panels to fill the space the small core freed ---- */
var cr=cC.querySelector('.dq-centre-rows');
if(cr){
 var UNITS=[['drewquevedo.com','$2,500 + $500/mo','ok'],['Review Stands','pilot Friday','w'],
  ['Econstruct','$1,000/mo','ok'],['LASO Imaging','variable','ok'],
  ['AgentIQ','winding down','z']];
 var bu=panel('Business Units','5');
 bu.b.appendChild(el('div','dq-tiles',UNITS.map(function(u){
  return '<div class="dq-tile"><div class="h"><i class="'+u[2]+'"></i>'+esc(u[0])+
   '</div><span>'+esc(u[1])+'</span></div>'}).join('')));
 cr.appendChild(bu.p);

 var GATES=[['Send to client','blocked','b'],['Spend money','blocked','b'],
  ['Publish live','blocked','b'],['Delete files','blocked','b'],
  ['Account settings','blocked','b'],['Read / draft','allowed','ok']];
 var gp=panel('Standing Gates','<span id="dq-gx">5 locked</span>');
 gp.b.appendChild(el('div','dq-tiles',GATES.map(function(g){
  return '<div class="dq-tile"><div class="h"><i class="'+g[2]+'"></i>'+esc(g[0])+
   '</div><span>'+esc(g[1])+'</span></div>'}).join('')));
 cr.appendChild(gp.p);

 var GUARDS=[['tunnel-guard','every 5m','ok'],['hooks-guard','every 5m','ok'],
  ['dashboard-guard','every 5m','ok'],['daily brief','not set','b']];
 var jp=panel('Scheduled Jobs','3 of 4 armed','w');
 jp.b.appendChild(el('div','dq-tiles',GUARDS.map(function(g){
  return '<div class="dq-tile"><div class="h"><i class="'+g[2]+'"></i>'+esc(g[0])+
   '</div><span>'+esc(g[1])+'</span></div>'}).join('')));
 cr.appendChild(jp.p);
}

/* ---- 6. live refresh for the new box headers ---- */
function refresh(){
 var sx=$('#dq-sysx');
 if(sx){var v=txt('sy-voice'),f=v&&bad(v)?1:0;
  sx.textContent=f?'1 fault':'nominal';sx.className='x'+(f?' hot':'')}
}
refresh();setInterval(refresh,5000);
})();
