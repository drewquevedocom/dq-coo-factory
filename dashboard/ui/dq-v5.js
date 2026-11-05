/* DQ OS v5 additive layer. Runs after dq-biz.js and dq-biz2.js.
   Adds: CEO control (e-stop + modes), diagnostics, voice commands,
   under-jarvis rows, current operations, Director Mode.
   Moves nodes, never recreates them, so app.js listeners survive. */
(function(){
var D=document,$=function(s,r){return (r||D).querySelector(s)};
var W=$('.dqwrap');if(!W||$('.dq-estop'))return;
var cL=$('.dqcol.l'),cC=$('.dqcol.c'),cR=$('.dqcol.r');
if(!cL||!cC||!cR)return;
var RM=matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

function el(t,c,h){var e=D.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function ic(d){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+d+'"/></svg>'}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){
 return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function panel(title,x,cls){
 var p=el('section','panel dqp');
 p.appendChild(el('div','panel-head','<h2>'+title+'</h2>'+
  (x?'<span class="x'+(cls?' '+cls:'')+'">'+x+'</span>':'')));
 var b=el('div','bd');p.appendChild(b);return{p:p,b:b}}
function ld(k,d){try{var v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function toast(m){
 var t=$('#dq-toast');
 if(!t){t=el('div');t.id='dq-toast';
  t.style.cssText='position:fixed;left:50%;bottom:20px;transform:translateX(-50%) translateY(10px);'+
   'background:var(--panel-2);border:1px solid rgba(54,214,245,.3);color:var(--ink);padding:9px 16px;'+
   'border-radius:999px;font-size:12px;z-index:90;opacity:0;pointer-events:none;'+
   'transition:opacity .22s,transform .22s;max-width:90vw';
  D.body.appendChild(t)}
 t.textContent=m;t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';
 clearTimeout(t._h);t._h=setTimeout(function(){t.style.opacity='0';
  t.style.transform='translateX(-50%) translateY(10px)'},2800)}

/* ---------- CEO CONTROL ---------- */
var halted=ld('dq.halt',false),hmode=ld('dq.mode','hitl');
if(halted)D.body.classList.add('dq-halt');
var ceo=panel('CEO Control','HITL','hot');
var estop=el('button','dq-estop');estop.type='button';
estop.innerHTML=ic('M12 2l10 18H2zM12 9v5M12 17.2v.1')+'<span id="dq-eslab">EMERGENCY STOP</span>';
ceo.b.appendChild(estop);
ceo.b.appendChild(el('div','dq-haltnote','All jobs paused. Jarvis will not act.'));
var modes=el('div','dq-modes');modes.setAttribute('role','group');
modes.setAttribute('aria-label','Approval mode');
modes.innerHTML=[['none','NO HITL','reads only'],['hitl','HITL','you approve'],
 ['auto','FULL AUTO','no gate']].map(function(m){
 return '<button class="dq-mode" type="button" data-m="'+m[0]+'" aria-pressed="false"><b>'+
  m[1]+'</b>'+m[2]+'</button>'}).join('');
ceo.b.appendChild(modes);
cL.insertBefore(ceo.p,cL.firstChild);

var MLAB={none:'NO HITL',hitl:'HITL',auto:'FULL AUTO'};
function setMode(m,quiet){
 hmode=m;sv('dq.mode',m);
 modes.querySelectorAll('.dq-mode').forEach(function(b){
  b.setAttribute('aria-pressed',String(b.dataset.m===m))});
 var lab=ceo.p.querySelector('.x');
 if(lab){lab.textContent=MLAB[m];lab.className='x'+(m==='auto'?' hot':m==='hitl'?'':' w')}
 if(!quiet)toast(m==='auto'?'FULL AUTO \u2014 your approval gate is off'
  :m==='none'?'NO HITL \u2014 Jarvis reads but never acts'
  :'HITL \u2014 Jarvis drafts, you approve')}
modes.querySelectorAll('.dq-mode').forEach(function(b){
 b.addEventListener('click',function(){setMode(b.dataset.m)})});

function paintHalt(){
 var l=$('#dq-eslab');if(l)l.textContent=halted?'RESUME SYSTEMS':'EMERGENCY STOP';
 var w=$('#stword');if(w)w.textContent=halted?'HALTED':w.textContent;
 var r=$('#strun');if(r&&halted)r.textContent='all jobs paused';
}
estop.addEventListener('click',function(){
 halted=!halted;sv('dq.halt',halted);
 D.body.classList.toggle('dq-halt',halted);
 paintHalt();setMode(halted?'none':'hitl',true);
 var lab=ceo.p.querySelector('.x');
 if(lab){lab.textContent=MLAB[halted?'none':'hitl'];
  lab.className='x'+(halted?' w':'')}
 toast(halted?'HALTED \u2014 jobs paused, Jarvis will not act'
  :'Resumed \u2014 guards re-armed, HITL on')});
paintHalt();setMode(hmode,true);

/* ---------- DIAGNOSTICS ---------- */
var DIAG=[['AI Model','sy-brain'],['AI Providers','4 connected','ok'],
 ['Voice','sy-voice'],['Connected Apps','dq-conn-src'],
 ['Memory','3,380 entries','ok'],['Storage','/data \u2014 not reported','z'],
 ['Running For','sy-clock']];
var dg=panel('Diagnostics','<span id="dq-dgx">--</span>');
var dgRows=el('div','dq-rows');dg.b.appendChild(dgRows);
cL.appendChild(dg.p);

/* ---------- VOICE COMMANDS ---------- */
var VC=['"Jarvis, daily brief"','"Work the walk-in list"','"What needs me"',
 '"Cash position"','"Score this idea"'];
var vp=panel('Voice Commands','<span id="dq-vhint">mic ready</span>');
vp.b.appendChild(el('div','dq-vbar',
 '<button class="dq-vmic" id="dq-mic" aria-pressed="false" aria-label="Toggle voice">'+
 ic('M9 3h6v11a3 3 0 0 1-6 0zM5 12a7 7 0 0 0 14 0M12 19v3')+'</button>'+
 '<canvas id="dq-vw" aria-hidden="true"></canvas><span class="dq-vst" id="dq-vst">IDLE</span>'));
vp.b.appendChild(el('div','dq-vcmds',VC.map(function(v){
 return '<button class="dq-vc" type="button" data-v="'+esc(v)+'">'+esc(v)+'</button>'}).join('')));
var rw=$('#responseWrap');
if(rw&&rw.parentNode)rw.parentNode.insertBefore(vp.p,rw);else cC.appendChild(vp.p);

/* ---------- UNDER-JARVIS ROWS ---------- */
var DEV=[['Hostinger box','container \u00b7 /data',1,'M4 5h16v11H4zM8 20h8M12 16v4'],
 ['Cloudflare tunnel','guard \u00b7 5m cadence',1,'M6 17a4 4 0 0 1 .6-8A6 6 0 0 1 18 10a3.5 3.5 0 0 1 0 7z'],
 ['818-745-3145','SignalWire \u00b7 trial',1,'M6 3l3 5-2 2a12 12 0 0 0 6 6l2-2 5 3v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z'],
 ['Windows desktop','not paired',0,'M4 6h16v10H4zM2 20h20'],
 ['Phone','not paired',0,'M8 2h8v20H8zM11 19h2']];
var SCH=[['09:00','Uber block','peak morning',''],
 ['12:30','Walk-in prep','print one-pagers, load stands','now'],
 ['15:00','Econstruct check-in','monthly retainer call',''],
 ['23:00','11 PM Club','Screen Zombies Bk1','']];
var TASKS=[['Walk-in list built','40 businesses / 9 Valley cities',100],
 ['One-pagers for no-website leads','21 of 40 qualify',0],
 ['Review stand landing page','copy drafted, page not built',35],
 ['Daily brief cron','09:00 PT / not scheduled',0]];
function taskHtml(t){return '<div class="dq-task"><div class="hd"><b>'+esc(t[0])+
 '</b><span class="pct">'+t[2]+'%</span></div><span>'+esc(t[1])+
 '</span><div class="dq-bar'+(t[2]===0?' w':t[2]===100?' g':'')+'"><i style="width:'+
 Math.max(t[2],2)+'%"></i></div></div>'}
var ur=el('div','dq-urows');
var dv=panel('Connected Devices','3 of 5');
DEV.forEach(function(d){dv.b.appendChild(el('div','dq-dev '+(d[2]?'on':'off'),
 ic(d[3])+'<div style="min-width:0"><div class="nm">'+d[0]+'</div><span class="st">'+
 d[1]+'</span></div><span class="d"></span>'))});
ur.appendChild(dv.p);
var sc=panel('Upcoming Schedule','<span id="dq-dow2">--</span>');
SCH.forEach(function(s){sc.b.appendChild(el('div','dq-sch '+(s[3]||''),
 '<div class="t">'+s[0]+'</div><div class="b"><b>'+s[1]+'</b><span>'+s[2]+'</span></div>'))});
ur.appendChild(sc.p);
var tk=panel('Active Tasks','4');
TASKS.forEach(function(t){tk.b.insertAdjacentHTML('beforeend',taskHtml(t))});
ur.appendChild(tk.p);
cC.appendChild(ur);

/* ---------- CURRENT OPERATIONS ---------- */
var OPS=[['Review stand pilot','plaques arrive Friday',62],
 ['drewquevedo.com AI COO offer','page live, no inbound yet',80],
 ['Econstruct retainer','month 1 of 12',100],
 ['Screen Zombies Bk1','drafting',24]];
var op=panel('Current Operations','4');
OPS.forEach(function(o){op.b.insertAdjacentHTML('beforeend',taskHtml(o))});
var pr=$('.panel.right');
if(pr&&pr.nextSibling)cR.insertBefore(op.p,pr.nextSibling);else cR.appendChild(op.p);

/* ---------- WAVEFORM ---------- */
function wave(c,o){o=o||{};var x=c.getContext('2d'),raf=null,p=Math.random()*10;
 var amp=o.amp==null?.5:o.amp;
 function sz(){var Dr=Math.min(devicePixelRatio||1,2);c.width=Math.max(1,c.clientWidth*Dr);
  c.height=Math.max(1,c.clientHeight*Dr);x.setTransform(Dr,0,0,Dr,0,0)}
 function dr(){var W2=c.clientWidth,H=c.clientHeight;x.clearRect(0,0,W2,H);p+=o.speed||.08;
  var bars=Math.max(5,Math.floor(W2/4)),bw=W2/bars;
  var col=(getComputedStyle(D.documentElement).getPropertyValue('--cyan')||'#36d6f5').trim();
  for(var i=0;i<bars;i++){var env=Math.sin((i/bars)*Math.PI);
   var h=(Math.sin(p+i*.42)*.5+.5)*env*H*amp+(Math.sin(p*1.7+i*.9)*.5+.5)*env*H*amp*.4;
   x.fillStyle=col;x.globalAlpha=.3+env*.6;
   x.fillRect(i*bw,(H-Math.max(1.2,h))/2,Math.max(1,bw-1.3),Math.max(1.2,h))}
  x.globalAlpha=1;raf=requestAnimationFrame(dr)}
 sz();if(!RM)raf=requestAnimationFrame(dr);else dr();
 return{rz:sz,amp:function(a){amp=a}}}
var vw=wave($('#dq-vw'),{amp:.2,speed:.06});

/* ---------- VOICE WIRING ---------- */
var vmode='idle',vcyc=null;
function vpaint(){
 var V={idle:'IDLE',listening:'LISTENING',thinking:'THINKING',speaking:'SPEAKING'};
 var s=$('#dq-vst');if(s)s.textContent=halted?'HALTED':V[vmode];
 var h=$('#dq-vhint');
 if(h)h.textContent=halted?'halted':vmode==='idle'?'mic ready':'live';
 vw.amp(vmode==='idle'?.2:vmode==='listening'?.95:.6)}
$('#dq-mic').addEventListener('click',function(){
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
  var i=$('#input');if(!i)return;
  i.value=b.dataset.v.replace(/^"|"$/g,'');i.focus();toast('Loaded as text \u2014 nothing sent')})});
vpaint();

/* ---------- DIRECTOR MODE ---------- */
var SERVICES=[['site','Website build'],['lseo','Local SEO'],['gbp','Google Business Profile'],
 ['rev','Review stands'],['content','Content engine'],['ads','Paid ads'],['coo','AI COO install']];
var PLAY={
 site:[['Discovery + sitemap','Lead Agent',6],['Copy for 6 pages','Content Agent',20],
  ['Build + deploy','Ops Agent',26],['Schema + speed pass','SEO Agent',12]],
 lseo:[['Keyword + competitor map','SEO Agent',14],['On-page for 6 pages','SEO Agent',16],
  ['Citation cleanup','Ops Agent',10]],
 gbp:[['GBP claim + fill','Ops Agent',8],['Photo + category pass','Content Agent',6]],
 rev:[['Stand artwork + NFC write','Ops Agent',5],['Review request flow','Content Agent',6]],
 content:[['12-post calendar','Content Agent',10],['First 4 posts drafted','Content Agent',14]],
 ads:[['Account + conversion setup','Ops Agent',9],['3 ad variants','Content Agent',8]],
 coo:[['Agent profiles + memory','Ops Agent',18],['Skill pack install','Ops Agent',10],
  ['Owner walkthrough doc','Content Agent',8]]};
var STEPS=['Intake','Scope','Agents','Build','Handoff'];
var DIR={step:0,client:{},scope:[],run:null};
var ov=el('div','dq-ov');ov.id='dq-ov';ov.setAttribute('role','dialog');
ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Director Mode');
D.body.appendChild(ov);

var dirbtn=el('button','dq-dirbtn');dirbtn.type='button';
dirbtn.innerHTML=ic('M12 3l2.4 5.6 6 .5-4.6 4 1.4 5.9L12 15.9 6.8 19l1.4-5.9-4.6-4 6-.5z')+
 '<span>Director Mode</span>';
var strip=$('.status-strip');
if(strip)strip.insertBefore(dirbtn,strip.firstChild);else cC.insertBefore(dirbtn,cC.firstChild);
dirbtn.addEventListener('click',function(){DIR.step=0;renderDir();ov.classList.add('open');
 D.body.style.overflow='hidden'});
function closeDir(){if(DIR.run){clearInterval(DIR.run);DIR.run=null}
 ov.classList.remove('open');ov.innerHTML='';D.body.style.overflow=''}
ov.addEventListener('click',function(e){if(e.target===ov)closeDir()});
addEventListener('keydown',function(e){
 if(e.key==='Escape'&&ov.classList.contains('open'))closeDir()});

function head(){
 return '<div class="dq-sh"><div><h3>DIRECTOR MODE</h3>'+
  '<div class="sub">NEW CLIENT \u00b7 FULL BUILD</div></div>'+
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
   '<div><label>Client / business name</label><input id="dq-name" placeholder="Vallejo Plumbing"></div>'+
   '<div><label>Industry</label><input id="dq-ind" placeholder="Plumbing"></div>'+
   '<div><label>City</label><input id="dq-city" placeholder="Van Nuys, CA"></div>'+
   '<div><label>Current website</label><input id="dq-url" placeholder="none"></div>'+
   '<div><label>Monthly budget</label><select id="dq-bud">'+
    '<option>$500/mo care plan</option><option>$1,000/mo</option>'+
    '<option>$2,500 install + $500/mo</option><option>Not set yet</option></select></div>'+
   '<div><label>Contact</label><input id="dq-ct" placeholder="Name / phone"></div></div>'+
   '<div style="margin-top:12px"><label>Services to build</label><div class="dq-chips" id="dq-svc">'+
   SERVICES.map(function(s){return '<button class="dq-chip" type="button" data-s="'+s[0]+
    '" aria-pressed="false">'+s[1]+'</button>'}).join('')+'</div></div>'+
   '<div style="margin-top:12px"><label>Anything Jarvis should know</label>'+
   '<textarea id="dq-note" placeholder="Owner is 60, hates jargon. Wants calls not forms."></textarea>'+
   '</div></div><div class="dq-sfoot"><span class="note">Nothing is created until you approve the scope.</span>'+
   '<button class="dq-btn vio" id="dq-next" type="button">Generate scope</button></div>';
 } else if(DIR.step===1){
  var tot=DIR.scope.reduce(function(a,c){return a+c[2]},0);
  b='<div class="dq-sb"><div class="dq-gate"><b>Review before anything runs.</b> Full build plan for '+
   esc(DIR.client.name||'the client')+'. Approving assigns the work to your agents.</div>'+
   wsRows(false)+'</div><div class="dq-sfoot"><span class="note">'+DIR.scope.length+
   ' workstreams \u00b7 '+tot+' estimated hours</span>'+
   '<button class="dq-btn" id="dq-back" type="button">Back</button>'+
   '<button class="dq-btn vio" id="dq-next" type="button">Approve and assign</button></div>';
 } else if(DIR.step===2){
  var by={};DIR.scope.forEach(function(w){(by[w[1]]=by[w[1]]||[]).push(w[0])});
  b='<div class="dq-sb"><div class="dq-rows">'+Object.keys(by).map(function(a){
    return '<div class="dq-row"><i class="d ok"></i><span class="k">'+esc(a)+
     '</span><span class="v">'+by[a].length+' workstream'+(by[a].length>1?'s':'')+'</span></div>'
   }).join('')+'</div><div class="dq-gate" style="margin:12px 0 0">'+
   '<b>Standing gates still apply.</b> Agents draft, build and stage. They will not send to the '+
   'client, spend money, publish live, or delete anything without your yes \u2014 even in Full Auto.'+
   '</div></div><div class="dq-sfoot"><span class="note">'+Object.keys(by).length+' agents assigned</span>'+
   '<button class="dq-btn" id="dq-back" type="button">Back</button>'+
   '<button class="dq-btn vio" id="dq-next" type="button">Start build</button></div>';
 } else if(DIR.step===3){
  b='<div class="dq-sb">'+wsRows(true)+'</div><div class="dq-sfoot">'+
   '<span class="note" id="dq-n2">Running</span>'+
   '<button class="dq-btn" id="dq-stop" type="button">Pause</button>'+
   '<button class="dq-btn vio" id="dq-next" type="button" disabled>Handoff</button></div>';
 } else {
  b='<div class="dq-sb"><div class="dq-gate ok"><b>Build complete for '+
   esc(DIR.client.name||'the client')+'.</b> Everything is staged. Nothing is published or sent.</div>'+
   '<div class="dq-rows" style="margin-top:12px">'+
   '<div class="dq-row"><i class="d ok"></i><span class="k">Deliverables</span><span class="v">'+
    DIR.scope.length+' staged</span></div>'+
   '<div class="dq-row"><i class="d ok"></i><span class="k">Client record</span>'+
    '<span class="v">created</span></div>'+
   '<div class="dq-row"><i class="d w"></i><span class="k">Invoice</span>'+
    '<span class="v w">drafted, not sent</span></div>'+
   '<div class="dq-row"><i class="d w"></i><span class="k">Go live</span>'+
    '<span class="v w">waiting on you</span></div>'+
   '<div class="dq-row"><i class="d ok"></i><span class="k">Care plan</span><span class="v">'+
    esc(DIR.client.budget||'not set')+'</span></div></div></div>'+
   '<div class="dq-sfoot"><span class="note">Four items need your approval before the client sees anything.</span>'+
   '<button class="dq-btn" id="dq-cl2" type="button">Close</button>'+
   '<button class="dq-btn vio" id="dq-rev" type="button">Review deliverables</button></div>';
 }
 ov.innerHTML='<div class="dq-sheet">'+head()+b+'</div>';
 wireDir();
}
function wireDir(){
 var x=$('#dq-dx');if(x)x.addEventListener('click',closeDir);
 var c2=$('#dq-cl2');if(c2)c2.addEventListener('click',closeDir);
 D.querySelectorAll('#dq-svc .dq-chip').forEach(function(c){
  c.addEventListener('click',function(){
   c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')==='true'?'false':'true')})});
 var bk=$('#dq-back');if(bk)bk.addEventListener('click',function(){DIR.step--;renderDir()});
 var rv=$('#dq-rev');if(rv)rv.addEventListener('click',function(){
  closeDir();var i=$('#input');
  if(i){i.value='Show me every deliverable staged for '+(DIR.client.name||'the new client')+
   '. Draft only. Do not send, publish or spend.';i.focus()}
  toast('Loaded into the composer \u2014 nothing sent')});
 var sp=$('#dq-stop');if(sp)sp.addEventListener('click',function(){
  if(DIR.run){clearInterval(DIR.run);DIR.run=null;sp.textContent='Resume';toast('Build paused')}
  else{runBuild();sp.textContent='Pause'}});
 var n=$('#dq-next');if(!n)return;
 n.addEventListener('click',function(){
  if(DIR.step===0){
   var nm=($('#dq-name').value||'').trim();
   if(!nm){toast('Give the client a name first');$('#dq-name').focus();return}
   var svc=[];D.querySelectorAll('#dq-svc .dq-chip[aria-pressed="true"]').forEach(function(c){
    svc.push(c.dataset.s)});
   if(!svc.length){toast('Pick at least one service');return}
   DIR.client={name:nm,ind:($('#dq-ind').value||'').trim(),city:($('#dq-city').value||'').trim(),
    url:($('#dq-url').value||'').trim(),budget:$('#dq-bud').value,
    contact:($('#dq-ct').value||'').trim(),note:($('#dq-note').value||'').trim(),svc:svc};
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
  var nt=$('#dq-n2');
  if(nt)nt.textContent=all?'All workstreams complete \u2014 nothing published'
   :(any?'Agents working':'Waiting on upstream work');
  if(all){clearInterval(DIR.run);DIR.run=null;
   var nb=$('#dq-next');if(nb)nb.disabled=false;
   var s2=$('#dq-stop');if(s2)s2.disabled=true;
   toast('Build complete \u2014 nothing sent or published')}},120)}

/* ---------- LIVE REFRESH ---------- */
function txt(id){var e=D.getElementById(id);return e?(e.textContent||'').trim():''}
function bad(s){return /fail|error|invalid|missing|reject|401|403|none|not set|offline|empty/i.test(s)}
function refresh(){
 var faults=0,html='';
 DIAG.forEach(function(d){
  var v,c;
  if(d.length===3){v=d[1];c=d[2]}
  else if(d[1]==='dq-conn-src'){var e=D.getElementById('dq-conn');
   v=e?e.textContent.trim():'--';c=/^(\d+) of (\d+)$/.test(v)?'w':'z'}
  else{v=txt(d[1])||'no signal';c=bad(v)?'b':v==='no signal'?'z':'ok'}
  if(c==='b')faults++;
  html+='<div class="dq-row"><i class="d '+(c==='z'?'':c)+'"></i><span class="k">'+d[0]+
   '</span><span class="v '+c+'">'+esc(v)+'</span></div>'});
 dgRows.innerHTML=html;
 var dx=$('#dq-dgx');
 if(dx){dx.textContent=faults?faults+' fault'+(faults>1?'s':''):'nominal';
  dx.className='x'+(faults?' hot':'')}
 var d2=$('#dq-dow2');
 if(d2)d2.textContent=new Date().toLocaleDateString(undefined,{weekday:'short'});
}
refresh();setInterval(refresh,5000);
var mo=new MutationObserver(refresh);
['sy-brain','sy-voice','sy-clock','dq-conn'].forEach(function(id){
 var e=D.getElementById(id);if(e)mo.observe(e,{childList:true,characterData:true,subtree:true})});
var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){vw.rz()},140)});
})();
