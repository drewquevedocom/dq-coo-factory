/* ============================================================
   DQ OS - the whole business layer, one file.
   Replaces dq-biz.js, dq-biz2.js, dq-v5.js, dq-v6.js, dq-v7.js.
   Runs after app.js, next-moves.js and dq-core.js.

   Rules it keeps:
   - Moves existing nodes, never recreates them, so every app.js
     listener and every id survives.
   - Owns its own root nodes. app.js overwrites document.body.className,
     so nothing here depends on body classes except the halt flag,
     which is re-applied on every refresh.
   - Exits quietly if the expected DOM is not there.
   ============================================================ */
(function(){
'use strict';
var D=document,$=function(s,r){return (r||D).querySelector(s)};
var grid=$('main.grid');
if(!grid||$('.dqwrap'))return;
var pL=$('.panel.control'),pC=$('.panel.center'),pR=$('.panel.right');
if(!pL||!pC||!pR)return;
var RM=matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- helpers ---------- */
function el(t,c,h){var e=D.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function ic(d){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+d+'"/></svg>'}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){
 return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function txt(id){var e=D.getElementById(id);return e?(e.textContent||'').trim():''}
function bad(s){return /fail|error|invalid|missing|reject|401|403|none|not set|offline|empty/i.test(s)}
function good(s){return s&&!bad(s)}
function ld(k,d){try{var v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function money(v){return '$'+Math.round(v).toLocaleString()}
function panel(title,x,cls){
 var p=el('section','panel');
 p.appendChild(el('div','panel-head','<h2>'+title+'</h2>'+
  (x?'<span class="dq-x'+(cls?' '+cls:'')+'">'+x+'</span>':'')));
 var b=el('div','dq-bd');p.appendChild(b);return{p:p,b:b}}
var _t;
function toast(m){
 var t=D.getElementById('dq-toast');
 if(!t){t=el('div');t.id='dq-toast';D.body.appendChild(t)}
 t.textContent=m;t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';
 clearTimeout(_t);_t=setTimeout(function(){t.style.opacity='0';
  t.style.transform='translateX(-50%) translateY(10px)'},2800)}

/* ---------- data ---------- */
var MRR={now:1000,target:20000,debt:40000};
var FUNNEL=[['PROSPECTS',40],['NO WEBSITE',21],['CONTACTED',0],['DEMO',0],['CLOSED',0]];
var UNITS=[['drewquevedo.com','$249-499/mo','ok'],['Review plaques','shipping','w'],
 ['Econstruct','$1,000/mo','ok'],['LASO Imaging','variable','ok'],['AgentIQ','for sale','z']];
var DEV=[['Hostinger box','container / data',1,'M4 5h16v11H4zM8 20h8M12 16v4'],
 ['Cloudflare tunnel','guard every 5m',1,'M6 17a4 4 0 0 1 .6-8A6 6 0 0 1 18 10a3.5 3.5 0 0 1 0 7z'],
 ['818-745-3145','SignalWire trial',1,'M6 3l3 5-2 2a12 12 0 0 0 6 6l2-2 5 3v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z'],
 ['Windows desktop','not paired',0,'M4 6h16v10H4zM2 20h20'],
 ['Phone','not paired',0,'M8 2h8v20H8zM11 19h2']];
var SCH=[['09:00','Uber block','peak morning',''],
 ['11:00','Walk-ins','5 doors, one street','now'],
 ['15:30','Uber block','evening peak',''],
 ['23:00','11 PM Club','Screen Zombies Bk1','']];
var TASKS=[['Walk-in list','40 built / 21 qualify',100],
 ['Business cards','at the printer',70],
 ['Report tool','live',100],
 ['drewquevedo.com/free','not built yet',0]];
var OPS=[['Review plaque pilot','cards print today',70],
 ['AI GMB offer','$249 intro / $499',85],
 ['Econstruct retainer','month 1 of 12',100],
 ['Screen Zombies Bk1','drafting',24]];
var IDEAS=[[92,'Review tap plaques'],[88,'AI GMB system'],[74,'Screen Zombies'],[71,'Dr. Doomscroll']];
var READY=[['Walk-in list','40 built','ok'],['Cards','at printer','w'],
 ['Report tool','live','ok'],['Landing page','not built','b'],
 ['Plaques','in hand','ok'],['Script','written','ok']];
var GUARDS=[['tunnel-guard','every 5m','ok'],['hooks-guard','every 5m','ok'],
 ['dashboard-guard','every 5m','ok'],['daily brief','not set','b']];
var GATES=[['Send to client','blocked','b'],['Spend money','blocked','b'],
 ['Publish live','blocked','b'],['Delete files','blocked','b'],
 ['Account settings','blocked','b'],['Read and draft','allowed','ok']];
var CORE_ROWS=[['AI Core','sy-runtime'],['Brain','sy-brain'],['Voice','sy-voice'],
 ['Profile','sy-profile'],['Gateway','sy-gw'],['Clock','sy-clock']];
var DIAG_ROWS=[['AI Model','sy-brain'],['AI Providers','4 connected','ok'],
 ['Voice','sy-voice'],['Connected apps','8 of 12','w'],
 ['Memory','3,380 entries','ok'],['Storage','not reported','z'],['Running for','sy-clock']];
var VC=['"Jarvis, daily brief"','"Work the walk-in list"','"What needs me"','"Cash position"'];
var AGENTS=[
 ['Lead Agent','sy-gw','idle \u2014 no list loaded','M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4'],
 ['Content Agent','sy-brain','idle','M5 4h11l3 3v13H5zM8.5 11h7M8.5 15h4.5'],
 ['SEO Agent','sy-brain','idle','M4 18V9M10 18V5M16 18v-6M22 18v-9'],
 ['Ops Agent','sy-runtime','guards armed \u00b7 5m cadence','M12 2l8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6z'],
 ['Voice Agent','sy-voice','','M9 3h6v11a3 3 0 0 1-6 0zM5 12a7 7 0 0 0 14 0'],
 ['R&amp;D Scout','sy-profile','standby','M12 3a9 9 0 1 0 9 9M12 3v9l6.4 6.4']];

/* ---------- state ---------- */
var halted=ld('dq.halt',false),hmode=ld('dq.mode','hitl');
var MLAB={none:'NO HITL',hitl:'HITL',auto:'FULL AUTO'};

/* ---------- build the three columns ---------- */
var wrap=el('div','dqwrap'),cL=el('div','dqcol l'),cC=el('div','dqcol c'),cR=el('div','dqcol r');
wrap.appendChild(cL);wrap.appendChild(cC);wrap.appendChild(cR);
/* attach NOW: getElementById only finds nodes that are in the document,
   and everything below moves existing panels into these columns. */
grid.appendChild(wrap);

/* ===== LEFT: CEO control ===== */
var ceo=panel('CEO Control','HITL');
var estop=el('button','dq-estop');estop.type='button';
estop.innerHTML=ic('M12 2l10 18H2zM12 9v5M12 17.2v.1')+'<span id="dq-eslab">EMERGENCY STOP</span>';
ceo.b.appendChild(estop);
ceo.b.appendChild(el('div','dq-haltnote','All jobs paused. Jarvis will not act.'));
var modes=el('div','dq-modes');
modes.setAttribute('role','group');modes.setAttribute('aria-label','Approval mode');
modes.innerHTML=[['none','NO HITL','reads only'],['hitl','HITL','you approve'],
 ['auto','FULL AUTO','no gate']].map(function(m){
 return '<button class="dq-mode" type="button" data-m="'+m[0]+'" aria-pressed="false"><b>'+
  m[1]+'</b>'+m[2]+'</button>'}).join('');
ceo.b.appendChild(modes);
cL.appendChild(ceo.p);

/* revenue */
var pct=Math.round(MRR.now/MRR.target*100);
var rev=panel('Revenue Pulse',pct+'% to goal');
rev.b.appendChild(el('div','dq-rev','<b>'+money(MRR.now)+'</b><span>of '+money(MRR.target)+' MRR</span>'));
rev.b.appendChild(el('div','dq-bar','<i style="width:'+Math.max(pct,2)+'%"></i>'));
rev.b.appendChild(el('div','dq-kpis',
 '<div class="dq-kpi dn"><b>'+money(MRR.debt)+'</b><span>DEBT</span></div>'+
 '<div class="dq-kpi"><b>3</b><span>CLIENTS TO GO</span></div>'+
 '<div class="dq-kpi up"><b>21</b><span>NO-WEBSITE LEADS</span></div>'+
 '<div class="dq-kpi am"><b id="dq-dday">--</b><span>NEXT WALK DAY</span></div>'));
cL.appendChild(rev.p);

/* leads */
var mx=FUNNEL[0][1]||1;
var lp=panel('Leads Pulse','Valley / 9 cities');
FUNNEL.forEach(function(f){lp.b.appendChild(el('div','dq-f',
 '<span class="lb">'+f[0]+'</span><div class="tr"><i style="width:'+
 Math.round(f[1]/mx*100)+'%"></i><span class="ct">'+f[1]+'</span></div>'))});
cL.appendChild(lp.p);

/* units */
var bu=panel('Business Units','5');
bu.b.appendChild(el('div','dq-tiles',UNITS.map(function(u){
 return '<div class="dq-tile"><div class="h"><i class="'+u[2]+'"></i>'+esc(u[0])+
  '</div><span>'+esc(u[1])+'</span></div>'}).join('')));
cL.appendChild(bu.p);

/* ai core */
var aco=panel('AI Core Overview','<span id="dq-corex">--</span>');
var coreRows=el('div','dq-rows');aco.b.appendChild(coreRows);
cL.appendChild(aco.p);

/* diagnostics */
var dg=panel('Diagnostics','<span id="dq-dgx">--</span>');
var dgRows=el('div','dq-rows');dg.b.appendChild(dgRows);
cL.appendChild(dg.p);

/* keep the original control panel last, it holds links and tools */
cL.appendChild(pL);

/* ===== CENTRE ===== */
cC.appendChild(pC);

/* glass cards over the stage */
var stage=D.getElementById('reactor');
if(stage){
 stage.appendChild(el('div','dq-glass dq-g1',
  '<h4>Right now</h4><p id="dq-focus">reading the board</p>'+
  '<span class="mt" id="dq-focusmt"></span>'));
 stage.appendChild(el('div','dq-glass dq-g3',
  '<h4>To goal</h4><div class="big">'+money(MRR.now)+'</div>'+
  '<span class="mt">of '+money(MRR.target)+' / 3 clients</span>'));
 stage.appendChild(el('div','dq-glass dq-g4',
  '<h4>Top ideas</h4><div class="big am">'+IDEAS[0][0]+'</div>'+
  '<span class="mt">'+esc(IDEAS[0][1])+'</span>'));
 stage.appendChild(el('div','dq-badge','PULSE <b id="dq-bpm">52</b> BPM'));
}

/* move the command grid under the core */
var cmds=D.getElementById('cmds');
var rw=D.getElementById('responseWrap');
if(cmds&&rw&&rw.parentNode)rw.parentNode.insertBefore(cmds,rw);

/* voice bar between the commands and the response */
var vbar=el('div','dq-vbar',
 '<button class="dq-vmic" id="dq-mic" aria-pressed="false" aria-label="Toggle voice">'+
 ic('M9 3h6v11a3 3 0 0 1-6 0zM5 12a7 7 0 0 0 14 0M12 19v3')+'</button>'+
 '<canvas id="dq-vw" aria-hidden="true"></canvas><span class="dq-vst" id="dq-vst">IDLE</span>');
var vcmds=el('div','dq-vcmds',VC.map(function(v){
 return '<button class="dq-vc" type="button" data-v="'+esc(v)+'">'+esc(v)+'</button>'}).join(''));
if(rw&&rw.parentNode){rw.parentNode.insertBefore(vbar,rw);rw.parentNode.insertBefore(vcmds,rw)}

/* rows under the core */
var urows=el('div','dq-grid2');
var dv=panel('Connected Devices','3 of 5');
DEV.forEach(function(d){dv.b.appendChild(el('div','dq-dev '+(d[2]?'on':'off'),
 ic(d[3])+'<div style="min-width:0"><div class="nm">'+d[0]+'</div><span class="st">'+
 d[1]+'</span></div><span class="d"></span>'))});
urows.appendChild(dv.p);
var sc=panel('Upcoming Schedule','<span id="dq-dow">--</span>');
SCH.forEach(function(s){sc.b.appendChild(el('div','dq-sch '+(s[3]||''),
 '<div class="t">'+s[0]+'</div><div><b>'+s[1]+'</b><em>'+s[2]+'</em></div>'))});
urows.appendChild(sc.p);
var tk=panel('Active Tasks',String(TASKS.length));
TASKS.forEach(function(t){tk.b.insertAdjacentHTML('beforeend',
 '<div class="dq-task"><div class="hd"><b>'+esc(t[0])+'</b><span class="pct">'+t[2]+
 '%</span></div><span>'+esc(t[1])+'</span><div class="dq-bar'+
 (t[2]===0?' w':t[2]===100?' g':'')+'"><i style="width:'+Math.max(t[2],2)+'%"></i></div></div>')});
urows.appendChild(tk.p);
cC.appendChild(urows);

/* readiness + gates + jobs */
var grid2=el('div','dq-grid2');
var rp=panel('Today Readiness','<span id="dq-ready">--</span>');
rp.b.appendChild(el('div','dq-tiles',READY.map(function(r){
 return '<div class="dq-tile"><div class="h"><i class="'+r[2]+'"></i>'+esc(r[0])+
  '</div><span>'+esc(r[1])+'</span></div>'}).join('')));
grid2.appendChild(rp.p);
var gp=panel('Standing Gates','5 locked','w');
gp.b.appendChild(el('div','dq-tiles',GATES.map(function(g){
 return '<div class="dq-tile"><div class="h"><i class="'+g[2]+'"></i>'+esc(g[0])+
  '</div><span>'+esc(g[1])+'</span></div>'}).join('')));
grid2.appendChild(gp.p);
var jp=panel('Scheduled Jobs','3 of 4 armed','w');
jp.b.appendChild(el('div','dq-tiles',GUARDS.map(function(g){
 return '<div class="dq-tile"><div class="h"><i class="'+g[2]+'"></i>'+esc(g[0])+
  '</div><span>'+esc(g[1])+'</span></div>'}).join('')));
grid2.appendChild(jp.p);
cC.appendChild(grid2);

/* ===== RIGHT: four boxes ===== */
/* 1. Needs You - the live panel, with the system grid and log moved out */
var sysBox=null,logEls=[];
var sg=pR.querySelector('.sysgrid'),lg=D.getElementById('log'),
    ll=pR.querySelector('.log-lbl'),db=D.getElementById('done-block');
var hh=pR.querySelector('.panel-head h2');
if(hh)hh.textContent='Needs You';
cR.appendChild(pR);

/* 2. Agents Live Work */
var at=panel('Agents Live Work','<span id="dq-agc">--</span>');
AGENTS.forEach(function(a){at.b.appendChild(el('div','dq-ag',
 '<span class="d"></span><span class="ag-ic">'+ic(a[3])+'</span>'+
 '<div style="min-width:0"><div class="nm">'+a[0]+
 '</div><em data-src="'+a[1]+'" data-idle="'+esc(a[2])+'">--</em></div>'+
 '<canvas class="dq-spark" aria-hidden="true"></canvas>'))});
cR.appendChild(at.p);

/* 3. Current Operations */
var op=panel('Current Operations',String(OPS.length));
OPS.forEach(function(o){op.b.insertAdjacentHTML('beforeend',
 '<div class="dq-task"><div class="hd"><b>'+esc(o[0])+'</b><span class="pct">'+o[2]+
 '%</span></div><span>'+esc(o[1])+'</span><div class="dq-bar'+(o[2]===100?' g':'')+
 '"><i style="width:'+Math.max(o[2],2)+'%"></i></div></div>')});
cR.appendChild(op.p);

/* 4. System, log and ideas */
var sb=panel('System &amp; Ideas','<span id="dq-sysx">--</span>');
if(sg)sb.b.appendChild(sg);
sb.b.appendChild(el('div','dq-strip',IDEAS.map(function(i){
 return '<div class="dq-st '+(i[0]>=85?'g':i[0]>=65?'a':'z')+'"><b>'+i[0]+
  '</b><span>'+esc(i[1].slice(0,13))+'</span></div>'}).join('')));
if(ll)sb.b.appendChild(ll);
if(lg)sb.b.appendChild(lg);
if(db)sb.b.appendChild(db);
cR.appendChild(sb.p);


/* ---------- topbar: wordmark, clock, alerts, director ---------- */
(function(){
 var wm=$('.wordmark'),sb=$('.sub');
 if(wm)wm.textContent='DQ OS';
 if(sb)sb.textContent='COMMAND CENTER';
 var br=$('.brand');
 if(br){
  var ck=el('div','dq-clock','<div class="cd" id="dq-cd">\u2014</div>'+
   '<div class="ct" id="dq-ct">--:--:--</div>');
  br.parentNode.insertBefore(ck,br.nextSibling);
  function two(n){return n<10?'0'+n:''+n}
  function tick(){
   var d=new Date(),h=d.getHours(),ap=h>=12?'pm':'am',hh=h%12||12;
   var a=D.getElementById('dq-ct'),b=D.getElementById('dq-cd');
   if(a)a.textContent=two(hh)+':'+two(d.getMinutes())+':'+two(d.getSeconds())+' '+ap;
   if(b)b.textContent=d.toLocaleDateString(undefined,
    {weekday:'long',month:'long',day:'numeric'});
  }
  tick();setInterval(tick,1000);
 }
})();


var strip=$('.status-strip'),A=null;
if(strip){
 var dirbtn=el('button','dq-dirbtn');dirbtn.type='button';
 dirbtn.innerHTML=ic('M12 3l2.4 5.6 6 .5-4.6 4 1.4 5.9L12 15.9 6.8 19l1.4-5.9-4.6-4 6-.5z')+
  '<span>Director Mode</span>';
 strip.insertBefore(dirbtn,strip.firstChild);
 dirbtn.addEventListener('click',openDir);

 A=el('div','dq-alerts');A.setAttribute('role','status');A.setAttribute('aria-live','polite');
 A.innerHTML=[['hitl','HITL','M12 3l8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V7z'],
  ['sms','TEXT','M4 5h16v10H9l-5 4z'],
  ['call','CALL','M6 3l3 5-2 2a12 12 0 0 0 6 6l2-2 5 3v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z'],
  ['mail','MAIL','M3 6h18v12H3zM3 7l9 6 9-6']].map(function(c){
  return '<button class="dq-cell" type="button" data-k="'+c[0]+'" title="'+c[1]+'">'+
   ic(c[2])+'<span class="n" id="dqn-'+c[0]+'">0</span><em>'+c[1]+'</em></button>'}).join('');
 strip.appendChild(A);
 A.addEventListener('click',function(e){
  var b=e.target.closest('.dq-cell');if(!b)return;
  var k=b.getAttribute('data-k'),i=D.getElementById('input');if(!i)return;
  i.value=k==='hitl'?'List everything waiting on me. Draft only, do not send or spend.'
   :k==='sms'?'Summarise texts in /data/hooks/inbox.jsonl. Do not reply to anyone.'
   :k==='call'?'List calls in /data/hooks/inbox.jsonl. Do not call anyone back.'
   :'Summarise unread mail. Draft only, do not send.';
  i.focus();toast('Loaded into the composer \u2014 nothing sent')});
}

/* ---------- Next Moves: collapsible ---------- */
var ul=D.getElementById('open-list'),moreBtn=null;
if(ul&&ul.parentNode){
 ul.classList.add('dq-fold');
 moreBtn=el('button','dq-more');moreBtn.type='button';
 moreBtn.addEventListener('click',function(){ul.classList.toggle('dq-fold');fold()});
 ul.parentNode.insertBefore(moreBtn,ul.nextSibling);
}
function fold(){
 if(!ul||!moreBtn)return;
 var n=ul.children.length,hid=n-3;
 if(n<=3){moreBtn.style.display='none';ul.classList.remove('dq-fold');return}
 moreBtn.style.display='';
 moreBtn.textContent=ul.classList.contains('dq-fold')?('SHOW '+hid+' MORE'):'SHOW LESS';
}

/* ---------- Needs You: approve / defer cards ---------- */
/* next-moves.js owns this list, so decorating is idempotent and re-runs
   on every refresh. A card the user has acted on keeps its state. */
var acted=ld('dq.acted',{});
function decorate(){
 if(!ul)return;
 Array.prototype.forEach.call(ul.children,function(li){
  if(li.getAttribute('data-dq')==='1')return;
  li.setAttribute('data-dq','1');
  var raw=(li.textContent||'').replace(/\s+/g,' ').trim().replace(/^\d+[.)\s]*/,'');
  var cut=raw.indexOf('. ');
  var title=cut>8?raw.slice(0,cut):raw;
  var sub=cut>8?raw.slice(cut+2):'';
  if(title.length>74){sub=title.slice(74)+(sub?' '+sub:'');title=title.slice(0,74)}
  var key=title.slice(0,40);
  li.innerHTML='<div class="dq-need"><p>'+esc(title)+'</p>'+
   (sub?'<span class="mt">'+esc(sub)+'</span>':'')+
   '<div class="dq-act"><button type="button" class="ok" data-k="'+esc(key)+
   '">\u2713 Approve</button><button type="button" class="no" data-k="'+esc(key)+
   '">Defer</button></div></div>';
  if(acted[key])settle(li,acted[key]);
 })}
function settle(li,how){
 var row=li.querySelector('.dq-act');if(!row)return;
 li.classList.add('dq-settled');
 row.innerHTML='<span class="dq-said" style="color:var(--'+
  (how==='ok'?'green':'dim')+')">'+(how==='ok'?'approved \u2014 queued':'deferred')+'</span>';
}
if(ul)ul.addEventListener('click',function(e){
 var b=e.target.closest('[data-k]');if(!b)return;
 var how=b.classList.contains('ok')?'ok':'no';
 var key=b.getAttribute('data-k');
 acted[key]=how;sv('dq.acted',acted);
 settle(b.closest('li'),how);
 toast(how==='ok'?'Approved \u2014 handed to the agents':'Deferred');
 refresh();
});

/* ---------- modes and halt ---------- */
function setMode(m,quiet){
 hmode=m;sv('dq.mode',m);
 modes.querySelectorAll('.dq-mode').forEach(function(b){
  b.setAttribute('aria-pressed',String(b.dataset.m===m))});
 var lab=ceo.p.querySelector('.dq-x');
 if(lab){lab.textContent=MLAB[m];
  lab.className='dq-x'+(m==='auto'?' hot':m==='none'?' w':'')}
 if(!quiet)toast(m==='auto'?'FULL AUTO \u2014 your approval gate is off'
  :m==='none'?'NO HITL \u2014 Jarvis reads but never acts'
  :'HITL \u2014 Jarvis drafts, you approve')}
modes.querySelectorAll('.dq-mode').forEach(function(b){
 b.addEventListener('click',function(){setMode(b.dataset.m)})});
function paintHalt(){
 D.body.classList.toggle('dq-halt',halted);
 var l=D.getElementById('dq-eslab');
 if(l)l.textContent=halted?'RESUME SYSTEMS':'EMERGENCY STOP';
 var w=D.getElementById('stword');
 if(w&&halted)w.textContent='HALTED';
 var r=D.getElementById('strun');
 if(r&&halted)r.textContent='all jobs paused';
}
estop.addEventListener('click',function(){
 halted=!halted;sv('dq.halt',halted);
 paintHalt();setMode(halted?'none':'hitl',true);
 toast(halted?'HALTED \u2014 jobs paused, Jarvis will not act'
  :'Resumed \u2014 guards re-armed, HITL on')});

/* ---------- voice waveform ---------- */
function wave(c,o){o=o||{};var x=c.getContext('2d'),raf=null,p=Math.random()*10;
 var amp=o.amp==null?.5:o.amp;
 function sz(){var Dr=Math.min(devicePixelRatio||1,2);
  c.width=Math.max(1,c.clientWidth*Dr);c.height=Math.max(1,c.clientHeight*Dr);
  x.setTransform(Dr,0,0,Dr,0,0)}
 function dr(){var W=c.clientWidth,H=c.clientHeight;x.clearRect(0,0,W,H);p+=o.speed||.08;
  var bars=Math.max(5,Math.floor(W/4)),bw=W/bars;
  var col=(getComputedStyle(D.documentElement).getPropertyValue('--cyan')||'#36d6f5').trim();
  for(var i=0;i<bars;i++){var env=Math.sin((i/bars)*Math.PI);
   var h=(Math.sin(p+i*.42)*.5+.5)*env*H*amp+(Math.sin(p*1.7+i*.9)*.5+.5)*env*H*amp*.4;
   x.fillStyle=col;x.globalAlpha=.3+env*.6;
   x.fillRect(i*bw,(H-Math.max(1.2,h))/2,Math.max(1,bw-1.3),Math.max(1.2,h))}
  x.globalAlpha=1;raf=requestAnimationFrame(dr)}
 sz();if(!RM)raf=requestAnimationFrame(dr);else dr();
 return{rz:sz,amp:function(a){amp=a}}}
var vw=wave(D.getElementById('dq-vw'),{amp:.2,speed:.06});
D.querySelectorAll('.dq-spark').forEach(function(c){
 wave(c,{amp:.5,speed:.06+Math.random()*.05})});
var vmode='idle',vcyc=null;
function vpaint(){
 var V={idle:'IDLE',listening:'LISTENING',thinking:'THINKING',speaking:'SPEAKING'};
 var s=D.getElementById('dq-vst');if(s)s.textContent=halted?'HALTED':V[vmode];
 vw.amp(vmode==='idle'?.2:vmode==='listening'?.95:.6)}
D.getElementById('dq-mic').addEventListener('click',function(){
 if(halted){toast('System halted \u2014 resume first');return}
 var m=this;
 if(vmode==='idle'){clearTimeout(vcyc);vmode='listening';
  m.setAttribute('aria-pressed','true');vpaint();
  vcyc=setTimeout(function(){vmode='thinking';vpaint();
   vcyc=setTimeout(function(){vmode='speaking';vpaint();
    vcyc=setTimeout(function(){vmode='idle';
     m.setAttribute('aria-pressed','false');vpaint()},4200)},2800)},3600);
  toast('Listening');
 }else{clearTimeout(vcyc);vmode='idle';m.setAttribute('aria-pressed','false');vpaint()}});
D.querySelectorAll('.dq-vc').forEach(function(b){
 b.addEventListener('click',function(){
  var i=D.getElementById('input');if(!i)return;
  i.value=b.dataset.v.replace(/^"|"$/g,'');i.focus();
  toast('Loaded as text \u2014 nothing sent')})});

/* ---------- director mode ---------- */
var SERVICES=[['site','Website build'],['lseo','Local SEO'],['gbp','Google Business Profile'],
 ['rev','Review plaques'],['content','Content engine'],['ads','Paid ads'],['coo','AI COO install']];
var PLAY={
 site:[['Discovery + sitemap','Lead Agent',6],['Copy for 6 pages','Content Agent',20],
  ['Build + deploy','Ops Agent',26],['Schema + speed pass','SEO Agent',12]],
 lseo:[['Keyword + competitor map','SEO Agent',14],['On-page for 6 pages','SEO Agent',16],
  ['Citation cleanup','Ops Agent',10]],
 gbp:[['GBP claim + fill','Ops Agent',8],['Photo + category pass','Content Agent',6]],
 rev:[['Plaque artwork + NFC write','Ops Agent',5],['Review request flow','Content Agent',6]],
 content:[['12-post calendar','Content Agent',10],['First 4 posts drafted','Content Agent',14]],
 ads:[['Account + conversion setup','Ops Agent',9],['3 ad variants','Content Agent',8]],
 coo:[['Agent profiles + memory','Ops Agent',18],['Skill pack install','Ops Agent',10],
  ['Owner walkthrough doc','Content Agent',8]]};
var STEPS=['Intake','Scope','Agents','Build','Handoff'];
var DIR={step:0,client:{},scope:[],run:null};
var ov=el('div','dq-ov');ov.id='dq-ov';
ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
ov.setAttribute('aria-label','Director Mode');
D.body.appendChild(ov);
ov.addEventListener('click',function(e){if(e.target===ov)closeDir()});
addEventListener('keydown',function(e){
 if(e.key==='Escape'&&ov.classList.contains('open'))closeDir()});
function openDir(){DIR.step=0;renderDir();ov.classList.add('open');D.body.style.overflow='hidden'}
function closeDir(){if(DIR.run){clearInterval(DIR.run);DIR.run=null}
 ov.classList.remove('open');ov.innerHTML='';D.body.style.overflow=''}
function dhead(){
 return '<div class="dq-sh"><div><h3>DIRECTOR MODE</h3>'+
  '<div class="sub2">NEW CLIENT &middot; FULL BUILD</div></div>'+
  '<button class="cl" id="dq-dx" type="button" aria-label="Close">'+
  ic('M6 6l12 12M18 6L6 18')+'</button></div><div class="dq-steps">'+
  STEPS.map(function(s,i){var c=i<DIR.step?'done':i===DIR.step?'on':'';
   return '<div class="dq-stp '+c+'"><span class="n">'+(i<DIR.step?'\u2713':(i+1))+
    '</span><span class="l">'+s+'</span></div>'}).join('')+'</div>'}
function wsRows(pctMode){
 return '<div class="dq-ws"><div class="dq-whead"><span>Workstream</span><span>Agent</span>'+
  '<span>Progress</span><span style="text-align:right">'+(pctMode?'%':'Hrs')+'</span></div>'+
  DIR.scope.map(function(w,i){
   return '<div class="dq-wrow" data-w="'+i+'"><div class="t"><b>'+esc(w[0])+'</b><span>'+
    esc(w[3])+'</span></div><div class="who"><i></i>'+esc(w[1])+'</div>'+
    '<div class="dq-bar"><i style="width:0%"></i></div><div class="pc">'+
    (pctMode?'0%':w[2]+'h')+'</div></div>'}).join('')+'</div>'}
function renderDir(){
 var b='';
 if(DIR.step===0){
  b='<div class="dq-sb"><div class="dq-fgrid">'+
   '<div><label>Client name</label><input id="dq-name" placeholder="Vallejo Plumbing"></div>'+
   '<div><label>Industry</label><input id="dq-ind" placeholder="Plumbing"></div>'+
   '<div><label>City</label><input id="dq-city" placeholder="Van Nuys, CA"></div>'+
   '<div><label>Current website</label><input id="dq-url" placeholder="none"></div>'+
   '<div><label>Plan</label><select id="dq-bud">'+
    '<option>$249/mo intro, then $499</option><option>$499/mo</option>'+
    '<option>$2,500 install + $500/mo</option><option>Not set yet</option></select></div>'+
   '<div><label>Contact</label><input id="dq-ct" placeholder="Name / phone"></div></div>'+
   '<div style="margin-top:11px"><label>Services to build</label><div class="dq-chips" id="dq-svc">'+
   SERVICES.map(function(s){return '<button class="dq-chip" type="button" data-s="'+s[0]+
    '" aria-pressed="false">'+s[1]+'</button>'}).join('')+'</div></div>'+
   '<div style="margin-top:11px"><label>Anything Jarvis should know</label>'+
   '<textarea id="dq-note" placeholder="Owner is 60, hates jargon. Wants calls not forms."></textarea>'+
   '</div></div><div class="dq-sfoot">'+
   '<span class="note2">Nothing is created until you approve the scope.</span>'+
   '<button class="dq-btn vio" id="dq-next" type="button">Generate scope</button></div>';
 } else if(DIR.step===1){
  var tot=DIR.scope.reduce(function(a,c){return a+c[2]},0);
  b='<div class="dq-sb"><div class="dq-gate"><b>Review before anything runs.</b> Full build plan for '+
   esc(DIR.client.name||'the client')+'. Approving assigns the work.</div>'+wsRows(false)+
   '</div><div class="dq-sfoot"><span class="note2">'+DIR.scope.length+' workstreams &middot; '+
   tot+' estimated hours</span>'+
   '<button class="dq-btn" id="dq-back" type="button">Back</button>'+
   '<button class="dq-btn vio" id="dq-next" type="button">Approve and assign</button></div>';
 } else if(DIR.step===2){
  var by={};DIR.scope.forEach(function(w){(by[w[1]]=by[w[1]]||[]).push(w[0])});
  b='<div class="dq-sb"><div class="dq-rows">'+Object.keys(by).map(function(a){
    return '<div class="dq-row"><i class="d ok"></i><span class="k">'+esc(a)+
     '</span><span class="v">'+by[a].length+' workstream'+(by[a].length>1?'s':'')+'</span></div>'
   }).join('')+'</div><div class="dq-gate" style="margin:11px 0 0">'+
   '<b>Standing gates still apply.</b> Agents draft, build and stage. They will not send to the '+
   'client, spend money, publish live, or delete anything without your yes \u2014 even in Full Auto.'+
   '</div></div><div class="dq-sfoot"><span class="note2">'+Object.keys(by).length+
   ' agents assigned</span>'+
   '<button class="dq-btn" id="dq-back" type="button">Back</button>'+
   '<button class="dq-btn vio" id="dq-next" type="button">Start build</button></div>';
 } else if(DIR.step===3){
  b='<div class="dq-sb">'+wsRows(true)+'</div><div class="dq-sfoot">'+
   '<span class="note2" id="dq-n2">Running</span>'+
   '<button class="dq-btn" id="dq-stop" type="button">Pause</button>'+
   '<button class="dq-btn vio" id="dq-next" type="button" disabled>Handoff</button></div>';
 } else {
  b='<div class="dq-sb"><div class="dq-gate ok"><b>Build complete for '+
   esc(DIR.client.name||'the client')+'.</b> Everything is staged. Nothing published or sent.</div>'+
   '<div class="dq-rows" style="margin-top:11px">'+
   '<div class="dq-row"><i class="d ok"></i><span class="k">Deliverables</span><span class="v">'+
    DIR.scope.length+' staged</span></div>'+
   '<div class="dq-row"><i class="d ok"></i><span class="k">Client record</span>'+
    '<span class="v">created</span></div>'+
   '<div class="dq-row"><i class="d w"></i><span class="k">Invoice</span>'+
    '<span class="v w">drafted, not sent</span></div>'+
   '<div class="dq-row"><i class="d w"></i><span class="k">Go live</span>'+
    '<span class="v w">waiting on you</span></div>'+
   '<div class="dq-row"><i class="d ok"></i><span class="k">Plan</span><span class="v">'+
    esc(DIR.client.budget||'not set')+'</span></div></div></div>'+
   '<div class="dq-sfoot"><span class="note2">Four items need your approval before the client '+
   'sees anything.</span><button class="dq-btn" id="dq-cl2" type="button">Close</button>'+
   '<button class="dq-btn vio" id="dq-rev" type="button">Review deliverables</button></div>';
 }
 ov.innerHTML='<div class="dq-sheet">'+dhead()+b+'</div>';
 wireDir();
}
function wireDir(){
 var x=D.getElementById('dq-dx');if(x)x.addEventListener('click',closeDir);
 var c2=D.getElementById('dq-cl2');if(c2)c2.addEventListener('click',closeDir);
 D.querySelectorAll('#dq-svc .dq-chip').forEach(function(c){
  c.addEventListener('click',function(){
   c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')==='true'?'false':'true')})});
 var bk=D.getElementById('dq-back');
 if(bk)bk.addEventListener('click',function(){DIR.step--;renderDir()});
 var rv=D.getElementById('dq-rev');
 if(rv)rv.addEventListener('click',function(){
  closeDir();var i=D.getElementById('input');
  if(i){i.value='Show me every deliverable staged for '+(DIR.client.name||'the new client')+
   '. Draft only. Do not send, publish or spend.';i.focus()}
  toast('Loaded into the composer \u2014 nothing sent')});
 var sp=D.getElementById('dq-stop');
 if(sp)sp.addEventListener('click',function(){
  if(DIR.run){clearInterval(DIR.run);DIR.run=null;sp.textContent='Resume';toast('Build paused')}
  else{runBuild();sp.textContent='Pause'}});
 var n=D.getElementById('dq-next');if(!n)return;
 n.addEventListener('click',function(){
  if(DIR.step===0){
   var nm=(D.getElementById('dq-name').value||'').trim();
   if(!nm){toast('Give the client a name first');D.getElementById('dq-name').focus();return}
   var svc=[];D.querySelectorAll('#dq-svc .dq-chip[aria-pressed="true"]').forEach(function(c){
    svc.push(c.dataset.s)});
   if(!svc.length){toast('Pick at least one service');return}
   DIR.client={name:nm,budget:D.getElementById('dq-bud').value};
   DIR.scope=[];
   svc.forEach(function(s){
    var lab=SERVICES.filter(function(z){return z[0]===s})[0][1];
    (PLAY[s]||[]).forEach(function(w){DIR.scope.push([w[0],w[1],w[2],lab,0])})});
   DIR.step=1;renderDir();return}
  if(DIR.step===1){DIR.step=2;renderDir();return}
  if(DIR.step===2){DIR.step=3;renderDir();runBuild();return}
  if(DIR.step===3){DIR.step=4;renderDir();return}})}
function runBuild(){
 if(DIR.run)clearInterval(DIR.run);
 var rows=ov.querySelectorAll('.dq-wrow');
 DIR.run=setInterval(function(){
  var all=true,any=false;
  for(var i=0;i<DIR.scope.length;i++){
   var w=DIR.scope[i],r=rows[i];if(!r)continue;
   var prev=i>0?DIR.scope[i-1][4]:100;
   if(w[4]<100){all=false;
    if(prev>40){w[4]=Math.min(100,w[4]+(4+Math.random()*7));any=true}}
   var pc=Math.round(w[4]);
   r.querySelector('.dq-bar i').style.width=pc+'%';
   r.querySelector('.pc').textContent=pc+'%';
   r.className='dq-wrow'+(pc>=100?' done':pc>0?' run':'')}
  var nt=D.getElementById('dq-n2');
  if(nt)nt.textContent=all?'All workstreams complete \u2014 nothing published'
   :(any?'Agents working':'Waiting on upstream work');
  if(all){clearInterval(DIR.run);DIR.run=null;
   var nb=D.getElementById('dq-next');if(nb)nb.disabled=false;
   var s2=D.getElementById('dq-stop');if(s2)s2.disabled=true;
   toast('Build complete \u2014 nothing sent or published')}},120)}

/* ---------- live refresh ---------- */
function rowsInto(host,rows){
 var faults=0,html='';
 rows.forEach(function(r){
  var v,c;
  if(r.length===3){v=r[1];c=r[2]}
  else{v=txt(r[1])||'no signal';c=bad(v)?'b':(v==='no signal'?'z':'ok')}
  if(c==='b')faults++;
  html+='<div class="dq-row"><i class="d '+(c==='z'?'':c)+'"></i><span class="k">'+r[0]+
   '</span><span class="v '+c+'">'+esc(v)+'</span></div>'});
 host.innerHTML=html;return faults}
function refresh(){
 /* core + diagnostics */
 var cf=rowsInto(coreRows,CORE_ROWS);
 var cx=D.getElementById('dq-corex');
 if(cx){cx.textContent=cf?cf+' fault'+(cf>1?'s':''):'nominal';
  cx.className='dq-x'+(cf?' hot':' g')}
 var df=rowsInto(dgRows,DIAG_ROWS);
 var dx=D.getElementById('dq-dgx');
 if(dx){dx.textContent=df?df+' fault'+(df>1?'s':''):'nominal';
  dx.className='dq-x'+(df?' hot':' g')}
 /* agents */
 var live=0;
 at.b.querySelectorAll('.dq-ag').forEach(function(row){
  var m=row.querySelector('em'),v=txt(m.getAttribute('data-src'));
  var idle=m.getAttribute('data-idle')||'';
  row.classList.remove('on','bad');
  if(halted){m.textContent='halted';return}
  if(v&&bad(v)){row.classList.add('bad');m.textContent='blocked \u2014 '+v}
  else if(good(v)){row.classList.add('on');live++;m.textContent=idle||v}
  else m.textContent='no signal'});
 var ac=D.getElementById('dq-agc');
 if(ac)ac.textContent=live+' of '+AGENTS.length;
 var sx=D.getElementById('dq-sysx');
 if(sx){var vf=bad(txt('sy-voice'))?1:0;
  sx.textContent=vf?'1 fault':'nominal';sx.className='dq-x'+(vf?' hot':' g')}
 /* alerts from the real moves count */
 if(A){
  var n=parseInt(txt('moves-count'),10);if(isNaN(n))n=0;
  if(ul)n=Math.max(0,n-ul.querySelectorAll('li.dq-settled').length);
  var C={hitl:n,sms:0,call:0,mail:null},tot=0;
  for(var k in C){var e=D.getElementById('dqn-'+k);if(!e)continue;
   var v2=C[k];e.textContent=v2===null?'\u2014':String(v2);
   if(typeof v2==='number')tot+=v2;
   e.parentNode.classList.toggle('off',v2===null||v2===0)}
  A.setAttribute('data-t',String(!tot?0:tot>=8?3:tot>=4?2:1))}
 /* focus card from the first open move */
 var ft=D.getElementById('dq-focus');
 if(ft&&ul){var li=ul.querySelector('li');
  var s=li?(li.textContent||'').replace(/\s+/g,' ').replace(/^\d+\s*/,'').trim():'';
  ft.textContent=s||'Board is clear.';
  var fm=D.getElementById('dq-focusmt');
  if(fm)fm.textContent=ul.children.length?('1 of '+ul.children.length+' blocking you'):'nothing blocking'}
 /* readiness header */
 var ready=0;
 rp.b.querySelectorAll('.dq-tile .h i').forEach(function(i){
  if(i.classList.contains('ok'))ready++});
 var rd=D.getElementById('dq-ready');
 if(rd){rd.textContent=ready+' of '+READY.length+' ready';
  rd.className='dq-x'+(ready>=5?' g':ready>=3?' w':' hot')}
 /* dates */
 var d=new Date(),dw=D.getElementById('dq-dow');
 if(dw)dw.textContent=d.toLocaleDateString(undefined,{weekday:'short'});
 var dd=D.getElementById('dq-dday');
 if(dd){var f=new Date(d);f.setHours(0,0,0,0);
  while(f.getDay()!==2)f.setDate(f.getDate()+1);
  var n2=Math.round((f-new Date(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);
  dd.textContent=n2===0?'today':n2+'d'}
 /* bpm readout */
 var bp=D.getElementById('dq-bpm');
 if(bp)bp.textContent=halted?38:(vmode==='speaking'?96:vmode==='thinking'?78:
  vmode==='listening'?66:52);
 paintHalt();decorate();fold();
}

/* ---------- go ---------- */
setMode(hmode,true);paintHalt();vpaint();refresh();
setInterval(refresh,5000);
var mo=new MutationObserver(refresh);
['moves-count','sy-gw','sy-brain','sy-voice','sy-profile','sy-runtime','sy-clock'].forEach(function(id){
 var e=D.getElementById(id);if(e)mo.observe(e,{childList:true,characterData:true,subtree:true})});
if(ul)mo.observe(ul,{childList:true,subtree:true,characterData:true});
var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){vw.rz()},150)});
})();
