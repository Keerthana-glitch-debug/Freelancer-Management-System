const API='/api';
let currentUser=null;

// ── UTILS ──────────────────────────────────────────────────
async function req(method,path,body){
  const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  return r.json();
}
const get=p=>req('GET',p);
const post=(p,b)=>req('POST',p,b);
const put=(p,b)=>req('PUT',p,b);

function toast(msg,ok=true){
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const t=document.createElement('div');
  t.className='toast'+(ok?'':' err');t.textContent=msg;
  document.body.appendChild(t);setTimeout(()=>t.remove(),3500);
}
function showMsg(id,msg,type){const el=document.getElementById(id);if(!el)return;el.textContent=msg;el.className=`msg ${type}`;el.classList.remove('hidden');}
function badge(s){if(!s)return'';const c=s.toLowerCase().replace(/_/g,'-').replace('_','-');return`<span class="badge ${s.toLowerCase().replace(/[^a-z]/g,'_')}">${s.replace(/_/g,' ')}</span>`}
function stars(n){return'★'.repeat(n)+'☆'.repeat(5-n)}
function fmtDate(d){if(!d)return'';return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function openModal(html){document.getElementById('modalContent').innerHTML=html;document.getElementById('modal').classList.remove('hidden');}
function closeModal(){document.getElementById('modal').classList.add('hidden');}
document.getElementById('modal').addEventListener('click',e=>{if(e.target===document.getElementById('modal'))closeModal();});

// ── AUTH ───────────────────────────────────────────────────
function switchTab(tab){
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',(tab==='login'&&i===0)||(tab==='register'&&i===1)));
  document.getElementById('loginForm').classList.toggle('hidden',tab!=='login');
  document.getElementById('registerForm').classList.toggle('hidden',tab!=='register');
  document.getElementById('authMsg').classList.add('hidden');
}
function toggleFreelancerFields(){
  document.getElementById('freelancerFields').classList.toggle('hidden',document.getElementById('regRole').value!=='FREELANCER');
}
async function doLogin(){
  const r=await post('/login',{email:document.getElementById('loginEmail').value,password:document.getElementById('loginPassword').value});
  if(!r.ok){showMsg('authMsg',r.data,'error');return;}
  currentUser=r.data;enterApp();
}
async function doRegister(){
  const body={name:v('regName'),email:v('regEmail'),password:v('regPassword'),role:v('regRole'),wallet:v('regWallet'),skills:v('regSkills'),bio:v('regBio')};
  const r=await post('/register',body);
  if(!r.ok){showMsg('authMsg',r.data,'error');return;}
  showMsg('authMsg','Account created! Please login.','success');switchTab('login');
}
function v(id){const el=document.getElementById(id);return el?el.value:''}

function avatarImg(user, size=40){
  const s=`width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid var(--pink-mid);flex-shrink:0`;
  if(user?.avatar) return `<img src="${user.avatar}" style="${s}" alt="avatar"/>`;
  const initials=(user?.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const colors=['#f48fb1','#e91e8c','#f06292','#ad1457','#880e4f'];
  const bg=colors[(user?.id||0)%colors.length];
  return `<div style="${s};background:${bg};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${Math.round(size*0.36)}px">${initials}</div>`;
}

function fileToBase64(file){
  return new Promise((res,rej)=>{
    if(file.size>2*1024*1024){rej(new Error('Image must be under 2MB'));return;}
    const r=new FileReader();
    r.onload=e=>res(e.target.result);
    r.onerror=()=>rej(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
}
function logout(){currentUser=null;document.getElementById('appScreen').classList.add('hidden');document.getElementById('authScreen').classList.remove('hidden');}
function enterApp(){
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  document.getElementById('navUser').innerHTML=`<div style="display:flex;align-items:center;gap:9px">${avatarImg(currentUser,36)}<div><strong style="display:block;font-size:13px">${currentUser.name}</strong>${badge(currentUser.role)}</div></div><div class="wallet-chip" style="font-size:11px;margin-top:6px">$${currentUser.wallet.toFixed(2)}</div>`;
  buildNav();loadDashboard();
  if(currentUser.role!=='ADMIN')setInterval(refreshUnread,15000);
}
async function refreshUnread(){
  const r=await get(`/users/${currentUser.id}/unread`);
  const el=document.getElementById('msgBadge');
  if(el)el.textContent=r.data?.count>0?r.data.count:'';
}

// ── NAV ────────────────────────────────────────────────────
function buildNav(){
  const links={
    CLIENT:[['🏠','Dashboard','loadDashboard()'],['📋','My Projects','loadMyProjects()'],['➕','Post Project','showPostProject()'],['🔍','Browse Projects','loadOpenProjects()'],['💬','Messages','loadMessages()'],['💳','Transactions','loadMyTransactions()'],['👤','My Profile','loadMyProfile()']],
    FREELANCER:[['🏠','Dashboard','loadDashboard()'],['🔍','Browse Projects','loadOpenProjects()'],['📨','My Bids','loadMyBids()'],['📄','Contracts','loadMyContracts()'],['🛠️','My Work','loadMyWork()'],['💬','Messages','loadMessages()'],['⭐','My Reviews','loadMyReviews()'],['💳','Transactions','loadMyTransactions()'],['👤','My Profile','loadMyProfile()']],
    ADMIN:[['🏠','Dashboard','loadDashboard()'],['👥','All Users','loadAllUsers()'],['📋','All Projects','loadAllProjectsAdmin()'],['⚖️','Disputes','loadAllDisputes()'],['⭐','Reviews','loadAllReviews()'],['💳','Transactions','loadAllTransactions()'],['⬇️','Downloads','loadAdminDownloads()']]
  };
  document.getElementById('navLinks').innerHTML=(links[currentUser.role]||[]).map(([icon,label,fn],i)=>{
    const badge=label==='Messages'?`<span class="nav-badge" id="msgBadge"></span>`:'';
    return`<li><a href="#" onclick="${fn};return false">${icon} ${label}${badge}</a></li>`;}).join('');
  refreshUnread();
}

// ── DASHBOARD ──────────────────────────────────────────────
async function loadDashboard(){
  const pc=document.getElementById('pageContent');
  if(currentUser.role==='ADMIN'){
    const [users,projects,disputes,txs]=await Promise.all([get('/users'),get('/projects'),get('/disputes/open'),get('/transactions')]);
    const totalPaid=txs.data.reduce((s,t)=>s+t.amount,0);
    pc.innerHTML=`<div class="page-header"><h2>Admin Dashboard</h2></div>
    <div class="stat-grid">
      <div class="stat-card"><div class="num">${users.data.length}</div><div class="lbl">Total Users</div></div>
      <div class="stat-card"><div class="num">${users.data.filter(u=>u.role==='CLIENT').length}</div><div class="lbl">Clients</div></div>
      <div class="stat-card"><div class="num">${users.data.filter(u=>u.role==='FREELANCER').length}</div><div class="lbl">Freelancers</div></div>
      <div class="stat-card"><div class="num">${projects.data.length}</div><div class="lbl">Projects</div></div>
      <div class="stat-card"><div class="num">${projects.data.filter(p=>p.status==='PAID').length}</div><div class="lbl">Paid Out</div></div>
      <div class="stat-card"><div class="num" style="color:var(--red)">${disputes.data.length}</div><div class="lbl">Open Disputes</div></div>
      <div class="stat-card"><div class="num">$${totalPaid.toFixed(0)}</div><div class="lbl">Total Volume</div></div>
    </div>
    ${disputes.data.length?`<div class="section-title">⚖️ Open Disputes Needing Action</div>
    ${disputes.data.map(d=>`<div class="alert-banner warn">⚠️ Project #${d.projectId} — ${d.reason?.slice(0,60)} <button class="btn-sm warn" onclick="loadAllDisputes()">Resolve</button></div>`).join('')}`:''}`;
    return;
  }
  if(currentUser.role==='CLIENT'){
    const [mine,open]=await Promise.all([get(`/projects/client/${currentUser.id}`),get('/projects/open')]);
    const u=await get(`/users/${currentUser.id}`);currentUser.wallet=u.data.wallet;
    document.getElementById('navUser').innerHTML=`<div style="display:flex;align-items:center;gap:9px">${avatarImg(currentUser,36)}<div><strong style="display:block;font-size:13px">${currentUser.name}</strong>${badge(currentUser.role)}</div></div><div class="wallet-chip" style="font-size:11px;margin-top:6px">$${currentUser.wallet.toFixed(2)}</div>`;
    const pending=mine.data.filter(p=>['IN_PROGRESS','CONTRACT_SENT'].includes(p.status));
    const alerts=pending.map(p=>`<div class="alert-banner">${p.status==='CONTRACT_SENT'?'📄 Contract sent for':'🔨 Active project:'} <strong>${p.title}</strong><button class="btn-sm pink" onclick="viewProjectDetail(${p.id})">View</button></div>`).join('');
    pc.innerHTML=`<div class="page-header"><h2>Welcome back, ${currentUser.name}!</h2><span class="wallet-chip">💰 $${currentUser.wallet.toFixed(2)}</span></div>
    ${alerts}
    <div class="stat-grid">
      <div class="stat-card"><div class="num">${mine.data.length}</div><div class="lbl">My Projects</div></div>
      <div class="stat-card"><div class="num">${mine.data.filter(p=>p.status==='IN_PROGRESS').length}</div><div class="lbl">In Progress</div></div>
      <div class="stat-card"><div class="num">${mine.data.filter(p=>p.status==='PAID').length}</div><div class="lbl">Completed</div></div>
      <div class="stat-card"><div class="num">${open.data.length}</div><div class="lbl">Open on Platform</div></div>
    </div>
    <div class="page-header"><h2>My Projects</h2><button class="btn-primary" onclick="showPostProject()">+ Post Project</button></div>
    <div class="cards-grid">${mine.data.slice(0,6).map(projectCardClient).join('')||'<p style="color:var(--gray)">No projects yet. Post your first one!</p>'}</div>`;
    return;
  }
  // FREELANCER
  const [open,reviews,myBids,allProjects,contracts]=await Promise.all([
    get('/projects/open'),get(`/freelancers/${currentUser.id}/reviews`),
    get(`/freelancers/${currentUser.id}/bids`),get('/projects'),
    get(`/freelancers/${currentUser.id}/contracts`)
  ]);
  const u=await get(`/users/${currentUser.id}`);currentUser.wallet=u.data.wallet;
  document.getElementById('navUser').innerHTML=`<div style="display:flex;align-items:center;gap:9px">${avatarImg(currentUser,36)}<div><strong style="display:block;font-size:13px">${currentUser.name}</strong>${badge(currentUser.role)}</div></div><div class="wallet-chip" style="font-size:11px;margin-top:6px">$${currentUser.wallet.toFixed(2)}</div>`;
  const avg=reviews.data.length?(reviews.data.reduce((s,r)=>s+r.rating,0)/reviews.data.length).toFixed(1):'—';
  const myWork=allProjects.data.filter(p=>p.assignedId===currentUser.id);
  const pendingContracts=contracts.data.filter(c=>c.status==='PENDING_FREELANCER');
  const activeWork=myWork.filter(p=>['IN_PROGRESS'].includes(p.status));

  const alerts=[
    ...pendingContracts.map(c=>`<div class="alert-banner">📄 Contract waiting for your signature — Project #${c.projectId}<button class="btn-sm success" onclick="loadMyContracts()" style="margin-left:10px">Review & Sign</button></div>`),
    ...activeWork.map(p=>`<div class="alert-banner info">🔨 Active project: <strong>${p.title}</strong> — Submit your work!<button class="btn-sm pink" onclick="viewMyWorkDetail(${p.id})" style="margin-left:10px">Submit Work</button></div>`)
  ].join('');

  pc.innerHTML=`<div class="page-header"><h2>Welcome back, ${currentUser.name}!</h2><span class="wallet-chip">💰 $${currentUser.wallet.toFixed(2)}</span></div>
  ${alerts}
  <div class="stat-grid">
    <div class="stat-card"><div class="num">${open.data.length}</div><div class="lbl">Open Projects</div></div>
    <div class="stat-card"><div class="num">${myBids.data.length}</div><div class="lbl">Bids Placed</div></div>
    <div class="stat-card"><div class="num">${pendingContracts.length}</div><div class="lbl">Pending Contracts</div></div>
    <div class="stat-card"><div class="num">${activeWork.length}</div><div class="lbl">Active Work</div></div>
    <div class="stat-card"><div class="num">${myWork.filter(p=>p.status==='PAID').length}</div><div class="lbl">Completed</div></div>
    <div class="stat-card"><div class="num">${avg!=='—'?avg+'/5':avg}</div><div class="lbl">Avg Rating</div></div>
  </div>
  <div class="page-header"><h2>Open Projects</h2></div>
  <div class="cards-grid">${open.data.slice(0,4).map(projectCardFreelancer).join('')}</div>`;
}

// ── PROJECT CARDS ──────────────────────────────────────────
function projectCardClient(p){
  return`<div class="proj-card">
    <div class="pc-title">${p.title}</div>
    <div class="pc-desc">${(p.description||'').slice(0,70)}${p.description?.length>70?'…':''}</div>
    <div class="pc-meta"><span class="proj-budget">$${p.budget.toFixed(2)}</span>${badge(p.status)}
      <button class="btn-sm pink" onclick="viewProjectDetail(${p.id})">Manage →</button></div>
  </div>`;
}
function projectCardFreelancer(p){
  return`<div class="proj-card">
    <div class="pc-title">${p.title}</div>
    <div class="pc-desc">${(p.description||'').slice(0,70)}${p.description?.length>70?'…':''}</div>
    <div class="pc-meta"><span class="proj-budget">$${p.budget.toFixed(2)}</span>${badge(p.status)}
      <button class="btn-sm pink" onclick="showBidModal(${p.id},'${p.title.replace(/'/g,"\\'")}')">Place Bid</button></div>
  </div>`;
}

// ── MY PROJECTS (CLIENT) ───────────────────────────────────
async function loadMyProjects(){
  const r=await get(`/projects/client/${currentUser.id}`);
  document.getElementById('pageContent').innerHTML=`<div class="page-header"><h2>My Projects</h2>
    <button class="btn-primary" onclick="showPostProject()">+ Post Project</button></div>
    <div class="cards-grid">${r.data.map(projectCardClient).join('')||'<div class="empty-state"><div class="es-icon">📋</div><p>No projects yet.</p></div>'}</div>`;
}

function showPostProject(){
  openModal(`<h3>Post New Project</h3>
    <div class="form-group"><label>Project Title</label><input id="mTitle" placeholder="e.g. Build a React Dashboard"/></div>
    <div class="form-group"><label>Description</label><textarea id="mDesc" placeholder="Describe what you need in detail. Be specific about deliverables, tech stack, timeline..." style="height:100px"></textarea></div>
    <div class="form-group"><label>Budget ($)</label><input type="number" id="mBudget" min="1" placeholder="500"/></div>
    <button class="btn-primary full" onclick="submitProject()" style="margin-top:8px">Post Project</button>`);
}
async function submitProject(){
  const r=await post('/projects',{title:v('mTitle'),description:v('mDesc'),budget:v('mBudget'),clientId:String(currentUser.id)});
  if(!r.ok){toast(r.data,false);return;}
  toast('Project posted!');closeModal();loadMyProjects();
}

// ── PROJECT DETAIL (CLIENT) ────────────────────────────────
async function viewProjectDetail(pid){
  const [pr,bidsR,msR,subsR,contractR]=await Promise.all([
    get(`/projects/${pid}`),get(`/projects/${pid}/bids`),
    get(`/projects/${pid}/milestones`),get(`/projects/${pid}/submissions`),
    get(`/projects/${pid}/contract`)
  ]);
  const p=pr.data,bids=bidsR.data,milestones=msR.data,subs=subsR.data,contract=contractR.data;

  // Workflow stepper
  const steps=[
    {key:'OPEN',icon:'📋',label:'Posted'},
    {key:'CONTRACT_SENT',icon:'📄',label:'Contract'},
    {key:'IN_PROGRESS',icon:'🔨',label:'Working'},
    {key:'COMPLETED',icon:'✅',label:'Done'},
    {key:'PAID',icon:'💰',label:'Paid'}
  ];
  const statusOrder=['OPEN','CONTRACT_SENT','IN_PROGRESS','COMPLETED','PAID','DISPUTED'];
  const curIdx=statusOrder.indexOf(p.status);
  const stepperHtml=`<div class="stepper">${steps.map((s,i)=>{
    const si=statusOrder.indexOf(s.key);
    const cls=si<curIdx?'done':si===curIdx?'active':'';
    return`<div class="step ${cls}"><span class="step-icon">${s.icon}</span><span class="step-label">${s.label}</span></div>`;
  }).join('')}</div>`;

  // Bids section
  let bidsHtml='<p style="color:var(--gray);font-size:13px">No bids yet.</p>';
  if(bids.length){
    const userFetches=await Promise.all(bids.map(b=>get(`/users/${b.freelancerId}`)));
    bidsHtml=bids.map((b,i)=>{
      const u=userFetches[i].data;
      const canContract=p.status==='OPEN';
      return`<div class="bid-item">
        ${avatarImg(u,42)}
        <div class="bid-info"><div class="bi-name">${u.name}</div><div class="bi-skills">${u.skills||'No skills listed'}</div></div>
        <div class="bid-amount">$${b.amount.toFixed(2)}</div>
        ${canContract?`<button class="btn-sm success" onclick="showCreateContract(${pid},${u.id},'${u.name.replace(/'/g,"\\'")}',${p.budget})">Send Contract</button>`:''}
      </div>`;
    }).join('');
  }

  // Contract section
  let contractHtml='';
  if(contract){
    contractHtml=`<div class="section-title">📄 Contract</div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">${badge(contract.status)}<span style="font-size:12px;color:var(--gray)">Revision limit: ${contract.revisionLimit}</span></div>
    <div class="contract-box">${contract.terms}</div>`;
  }

  // Milestones + submissions
  let msHtml='';
  if(milestones.length){
    msHtml=`<div class="section-title">🎯 Milestones</div>`;
    for(const m of milestones){
      const mSubs=subs.filter(s=>s.milestoneId===m.id);
      const latestSub=mSubs[0];
      const cls=m.status==='PAID'||m.status==='APPROVED'?'done':m.status==='SUBMITTED'||m.status==='REVISION_REQUESTED'?'active':'';
      let subHtml='';
      if(latestSub){
        subHtml=`<div class="submission-card latest" style="margin-top:10px">
          <div class="sub-header"><span class="sub-round">Round ${latestSub.revisionRound+1}</span>${badge(latestSub.status)}<span style="font-size:11px;color:var(--gray)">${fmtDate(latestSub.submittedAt)}</span></div>
          <div class="sub-desc">${latestSub.description||'No description.'}</div>
          ${latestSub.externalLink?`<div class="sub-link">🔗 <a href="${latestSub.externalLink}" target="_blank">${latestSub.externalLink}</a></div>`:''}
          ${latestSub.clientNote?`<div class="sub-note">💬 Your feedback: ${latestSub.clientNote}</div>`:''}
          ${latestSub.status==='SUBMITTED'?`<div class="sub-actions">
            <button class="btn-sm success" onclick="reviewSub(${latestSub.id},'APPROVE')">✅ Approve Work</button>
            <button class="btn-sm warn" onclick="reviewSub(${latestSub.id},'REVISION')">↩️ Request Revision</button>
          </div>`:''}
          ${m.status==='APPROVED'?`<button class="btn-sm success" onclick="payMilestone(${m.id})" style="margin-top:8px">💰 Release Payment ($${m.amount.toFixed(2)})</button>`:''}
        </div>`;
      } else if(p.status==='IN_PROGRESS'){
        subHtml=`<div class="info-tip">⏳ Waiting for freelancer to submit work</div>`;
      }
      msHtml+=`<div class="milestone-row ${cls}">
        <div style="font-size:20px">${m.status==='PAID'?'✅':m.status==='APPROVED'?'☑️':m.status==='SUBMITTED'?'📬':'⬜'}</div>
        <div class="ms-info"><div class="ms-title">${m.title}</div><div class="ms-desc">${m.description||''}</div>${subHtml}</div>
        <div class="ms-amount">$${m.amount.toFixed(2)}</div>
      </div>`;
    }
  }

  // Actions
  let actions='';
  if(p.status==='IN_PROGRESS'&&!milestones.length)actions+=`<button class="btn-sm info" onclick="showAddMilestone(${pid})">+ Add Milestone</button>`;
  if(p.status==='COMPLETED')actions+=`<button class="btn-sm success" onclick="payFullProject(${pid})">💰 Pay Full Amount ($${p.budget.toFixed(2)})</button>`;
  if(p.status==='PAID'||p.status==='COMPLETED')actions+=`<button class="btn-sm outline" onclick="showReviewModal(${pid})">⭐ Leave Review</button>`;
  if(['IN_PROGRESS','COMPLETED'].includes(p.status))actions+=`<button class="btn-sm danger" onclick="raiseDispute(${pid})">⚠️ Raise Dispute</button>`;
  if(p.status==='IN_PROGRESS')actions+=`<button class="btn-sm info" onclick="openChatModal(${pid},${p.assignedId})">💬 Message Freelancer</button>`;

  openModal(`<h3>📋 ${p.title}</h3>
    ${stepperHtml}
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px"><span class="proj-budget">$${p.budget.toFixed(2)}</span>${badge(p.status)}</div>
    <p style="font-size:13px;color:var(--gray);margin-bottom:16px">${p.description||''}</p>
    ${actions?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">${actions}</div>`:''}
    <div class="section-title">💼 Bids (${bids.length})</div>${bidsHtml}
    ${contractHtml}
    ${msHtml}`);
}

// Create contract modal
function showCreateContract(pid,fid,fname,budget){
  openModal(`<h3>📄 Create Contract</h3>
    <p style="font-size:13px;color:var(--gray);margin-bottom:14px">Sending contract to <strong>${fname}</strong>. They must agree before work begins.</p>
    <div class="form-group"><label>Contract Terms</label>
      <textarea id="mTerms" style="height:140px" placeholder="Describe the scope of work, deliverables, deadlines, revision policy, and any other terms..."></textarea></div>
    <div class="form-group"><label>Max Revision Rounds</label>
      <select id="mRevLimit"><option value="1">1 revision</option><option value="2">2 revisions</option><option value="3" selected>3 revisions</option><option value="5">5 revisions</option><option value="99">Unlimited</option></select></div>
    <div class="form-group"><label>Add Milestones (optional, comma-separated titles)</label>
      <input id="mMilestoneTitles" placeholder="e.g. Design mockup, Backend API, Final delivery"/></div>
    <button class="btn-primary full" onclick="submitContract(${pid},${fid},${budget})" style="margin-top:8px">Send Contract to Freelancer</button>`);
}
async function submitContract(pid,fid,budget){
  const terms=v('mTerms'),revLimit=v('mRevLimit'),titles=v('mMilestoneTitles');
  const r=await post(`/projects/${pid}/contract`,{freelancerId:String(fid),clientId:String(currentUser.id),terms,revisionLimit:revLimit});
  if(!r.ok){toast(r.data,false);return;}
  // Add milestones if provided
  if(titles.trim()){
    const titleList=titles.split(',').map(t=>t.trim()).filter(Boolean);
    const perMs=(budget/titleList.length).toFixed(2);
    for(let i=0;i<titleList.length;i++){
      await post(`/projects/${pid}/milestones`,{clientId:String(currentUser.id),title:titleList[i],description:'',amount:perMs,order:String(i+1)});
    }
  }
  toast('Contract sent to freelancer!');closeModal();loadMyProjects();
}

async function showAddMilestone(pid){
  const p=(await get(`/projects/${pid}`)).data;
  openModal(`<h3>+ Add Milestone</h3>
    <div class="form-group"><label>Title</label><input id="mMsTitle" placeholder="e.g. Design Phase"/></div>
    <div class="form-group"><label>Description</label><textarea id="mMsDesc" placeholder="What should be delivered?"></textarea></div>
    <div class="form-group"><label>Payment Amount ($)</label><input type="number" id="mMsAmt" min="1" placeholder="200"/></div>
    <button class="btn-primary full" onclick="addMilestone(${pid})">Add Milestone</button>`);
}
async function addMilestone(pid){
  const msr=await get(`/projects/${pid}/milestones`);
  const order=msr.data.length+1;
  const r=await post(`/projects/${pid}/milestones`,{clientId:String(currentUser.id),title:v('mMsTitle'),description:v('mMsDesc'),amount:v('mMsAmt'),order:String(order)});
  if(!r.ok){toast(r.data,false);return;}
  toast('Milestone added!');closeModal();viewProjectDetail(pid);
}

async function reviewSub(subId,action){
  const note=action==='REVISION'?prompt('What needs to be revised? (feedback for freelancer):'):'';
  if(action==='REVISION'&&note===null)return;
  const r=await post(`/submissions/${subId}/review`,{clientId:String(currentUser.id),action,note:note||''});
  if(!r.ok){toast(r.data,false);return;}
  toast(action==='APPROVE'?'Work approved! Release payment when ready.':'Revision requested — freelancer notified.');
  closeModal();loadMyProjects();
}
async function payMilestone(msId){
  if(!confirm('Release payment for this milestone?'))return;
  const r=await post(`/milestones/${msId}/pay`,{clientId:String(currentUser.id)});
  if(!r.ok){toast(r.data,false);return;}
  toast('Payment released!');closeModal();loadDashboard();
}
async function payFullProject(pid){
  if(!confirm('Pay the full project amount?'))return;
  const r=await post(`/projects/${pid}/pay`,{clientId:String(currentUser.id)});
  if(!r.ok){toast(r.data,false);return;}
  toast('Payment released!');closeModal();loadDashboard();
}

function showReviewModal(pid){
  openModal(`<h3>⭐ Leave Review</h3>
    <div class="form-group"><label>Rating</label>
      <select id="mRating"><option>1</option><option>2</option><option>3</option><option selected>4</option><option>5</option></select></div>
    <div class="form-group"><label>Comment</label><textarea id="mComment" placeholder="Share your experience working with this freelancer..."></textarea></div>
    <button class="btn-primary full" onclick="submitReview(${pid})">Submit Review</button>`);
}
async function submitReview(pid){
  const r=await post(`/projects/${pid}/review`,{clientId:String(currentUser.id),rating:v('mRating'),comment:v('mComment')});
  if(!r.ok){toast(r.data,false);return;}
  toast('Review submitted!');closeModal();
}

async function raiseDispute(pid){
  const reason=prompt('Describe the issue:');
  if(!reason)return;
  const r=await post(`/projects/${pid}/dispute`,{raisedById:String(currentUser.id),reason});
  if(!r.ok){toast(r.data,false);return;}
  toast('Dispute raised. Admin will review.');closeModal();
}

// ── BROWSE & BIDS (FREELANCER) ─────────────────────────────
async function loadOpenProjects(){
  const r=await get('/projects/open');
  document.getElementById('pageContent').innerHTML=`<div class="page-header"><h2>Browse Open Projects</h2></div>
    <div class="search-bar">
      <input id="srchKw" placeholder="Search by keyword..." oninput="searchProjects()"/>
      <select id="srchStatus" onchange="filterByStatus()">
        <option value="">All Statuses</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option><option value="PAID">Paid</option>
      </select>
    </div>
    <div id="projList" class="cards-grid">${r.data.map(currentUser.role==='FREELANCER'?projectCardFreelancer:projectCardClient).join('')||'<div class="empty-state"><div class="es-icon">🔍</div><p>No open projects.</p></div>'}</div>`;
}
async function searchProjects(){const kw=v('srchKw').trim();if(!kw){loadOpenProjects();return;}const r=await get(`/projects/search?kw=${encodeURIComponent(kw)}`);document.getElementById('projList').innerHTML=r.data.map(currentUser.role==='FREELANCER'?projectCardFreelancer:projectCardClient).join('')||'<div class="empty-state"><p>No results.</p></div>';}
async function filterByStatus(){const s=v('srchStatus');const r=await get(s?`/projects/status/${s}`:'/projects');document.getElementById('projList').innerHTML=r.data.map(currentUser.role==='FREELANCER'?projectCardFreelancer:projectCardClient).join('')||'<div class="empty-state"><p>No results.</p></div>';}

function showBidModal(pid,title){
  openModal(`<h3>💼 Place a Bid</h3>
    <p style="font-weight:700;margin-bottom:14px;font-size:15px">${title}</p>
    <div class="form-group"><label>Your Bid Amount ($)</label><input type="number" id="mBidAmt" min="1" placeholder="e.g. 450"/></div>
    <p style="font-size:12px;color:var(--gray);margin-top:4px">Tip: Competitive bids with strong profiles win more contracts.</p>
    <button class="btn-primary full" onclick="submitBid(${pid})" style="margin-top:14px">Submit Bid</button>`);
}
async function submitBid(pid){
  const r=await post(`/projects/${pid}/bid`,{freelancerId:String(currentUser.id),amount:v('mBidAmt')});
  if(!r.ok){toast(r.data,false);return;}
  toast('Bid placed successfully!');closeModal();
}

// ── MY BIDS (FREELANCER) ───────────────────────────────────
async function loadMyBids(){
  const [bidsR,allProjects]=await Promise.all([get(`/freelancers/${currentUser.id}/bids`),get('/projects')]);
  const bids=bidsR.data,pm={};allProjects.data.forEach(p=>pm[p.id]=p);
  const rows=bids.map(b=>{
    const p=pm[b.projectId]||{};
    const mine=p.assignedId===currentUser.id;
    const res=!p.status?'—':mine?`<span style="color:var(--green);font-weight:700">✅ Assigned to you!</span>`:p.assignedId&&!mine?`<span style="color:var(--red)">❌ Another freelancer hired</span>`:badge(p.status);
    return`<tr><td>#${p.id||b.projectId}</td><td><strong>${p.title||'—'}</strong></td><td style="font-weight:800;color:var(--pink-deep)">$${b.amount.toFixed(2)}</td><td>$${(p.budget||0).toFixed(2)}</td><td>${res}</td></tr>`;
  });
  document.getElementById('pageContent').innerHTML=`<div class="page-header"><h2>📨 My Bids</h2><span class="wallet-chip">${bids.length} bid${bids.length!==1?'s':''}</span></div>
  ${bids.length?`<div class="table-wrap"><table><thead><tr><th>Project</th><th>Title</th><th>My Bid</th><th>Budget</th><th>Result</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`
  :'<div class="empty-state"><div class="es-icon">📨</div><p>No bids placed yet. Browse open projects!</p></div>'}`;
}

// ── MY CONTRACTS (FREELANCER) ──────────────────────────────
async function loadMyContracts(){
  const r=await get(`/freelancers/${currentUser.id}/contracts`);
  const contracts=r.data;
  let html=`<div class="page-header"><h2>📄 My Contracts</h2></div>`;
  if(!contracts.length){html+='<div class="empty-state"><div class="es-icon">📄</div><p>No contracts yet.</p></div>';document.getElementById('pageContent').innerHTML=html;return;}
  for(const c of contracts){
    const p=(await get(`/projects/${c.projectId}`)).data;
    const isPending=c.status==='PENDING_FREELANCER';
    html+=`<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div><h3 style="margin-bottom:4px">${p.title}</h3><span style="font-size:13px;color:var(--gray)">Budget: $${c.totalAmount.toFixed(2)} · Revisions allowed: ${c.revisionLimit}</span></div>
        ${badge(c.status)}
      </div>
      <div class="contract-box">${c.terms}</div>
      ${isPending?`<div class="alert-banner" style="margin-top:12px">📋 Please review this contract carefully before agreeing.
        <button class="btn-sm success" onclick="agreeContract(${c.id})">✅ I Agree & Sign</button>
      </div>`:''}
      ${c.status==='ACTIVE'?`<button class="btn-sm pink" onclick="viewMyWorkDetail(${p.id})" style="margin-top:10px">Go to Work →</button>`:''}
    </div>`;
  }
  document.getElementById('pageContent').innerHTML=html;
}
async function agreeContract(contractId){
  if(!confirm('By clicking OK you agree to the contract terms and commit to delivering the work.'))return;
  const r=await post(`/contracts/${contractId}/agree`,{freelancerId:String(currentUser.id)});
  if(!r.ok){toast(r.data,false);return;}
  toast('Contract signed! Project is now IN PROGRESS.');loadMyContracts();
}

// ── MY WORK (FREELANCER) ───────────────────────────────────
async function loadMyWork(){
  const allProjects=await get('/projects');
  const myWork=allProjects.data.filter(p=>p.assignedId===currentUser.id);
  let html=`<div class="page-header"><h2>🛠️ My Work</h2><span class="wallet-chip">${myWork.length} project${myWork.length!==1?'s':''}</span></div>`;
  if(!myWork.length){html+='<div class="empty-state"><div class="es-icon">🛠️</div><p>No assigned work yet. Bid on projects to get hired!</p></div>';document.getElementById('pageContent').innerHTML=html;return;}

  const sections=[
    {label:'⏳ Waiting for Contract Sign',statuses:['CONTRACT_SENT']},
    {label:'🔨 Active — Action Required',statuses:['IN_PROGRESS']},
    {label:'✅ Completed',statuses:['COMPLETED','PAID']}
  ];
  sections.forEach(sec=>{
    const list=myWork.filter(p=>sec.statuses.includes(p.status));
    if(!list.length)return;
    html+=`<div class="section-title">${sec.label}</div><div class="cards-grid">${list.map(p=>{
      const tip={CONTRACT_SENT:'Review and sign the contract in My Contracts tab.',IN_PROGRESS:'Submit your work for each milestone.',COMPLETED:'Waiting for client to release payment.',PAID:'All done! Payment received.'}[p.status]||'';
      return`<div class="proj-card" style="border-left:4px solid var(--pink-dark)">
        <div class="pc-title">${p.title}</div>
        <div class="info-tip">${tip}</div>
        <div class="pc-meta" style="margin-top:12px"><span class="proj-budget">$${p.budget.toFixed(2)}</span>${badge(p.status)}
          ${p.status==='IN_PROGRESS'?`<button class="btn-sm pink" onclick="viewMyWorkDetail(${p.id})">Submit Work →</button>`:''}
          ${p.status==='CONTRACT_SENT'?`<button class="btn-sm success" onclick="loadMyContracts()">Sign Contract</button>`:''}
        </div>
      </div>`;
    }).join('')}</div>`;
  });
  document.getElementById('pageContent').innerHTML=html;
}

async function viewMyWorkDetail(pid){
  const [pr,msR,subsR,contractR]=await Promise.all([get(`/projects/${pid}`),get(`/projects/${pid}/milestones`),get(`/projects/${pid}/submissions`),get(`/projects/${pid}/contract`)]);
  const p=pr.data,milestones=msR.data,subs=subsR.data,contract=contractR.data;

  let msHtml='';
  if(milestones.length){
    for(const m of milestones){
      const mSubs=subs.filter(s=>s.milestoneId===m.id);
      const latest=mSubs[0];
      const canSubmit=['PENDING','REVISION_REQUESTED'].includes(m.status);
      let subHistory='';
      if(mSubs.length){
        subHistory=mSubs.slice(0,3).map((s,i)=>`<div class="submission-card ${i===0?'latest':''}">
          <div class="sub-header"><span class="sub-round">Round ${s.revisionRound+1}</span>${badge(s.status)}<span style="font-size:11px;color:var(--gray)">${fmtDate(s.submittedAt)}</span></div>
          <div class="sub-desc">${s.description||''}</div>
          ${s.externalLink?`<div class="sub-link">🔗 <a href="${s.externalLink}" target="_blank">${s.externalLink}</a></div>`:''}
          ${s.clientNote?`<div class="sub-note">💬 Client feedback: <strong>${s.clientNote}</strong></div>`:''}
        </div>`).join('');
      }
      const revCount=contract?contract.revisionLimit:3;
      const usedRevisions=mSubs.length;
      msHtml+=`<div class="milestone-row ${m.status==='PAID'||m.status==='APPROVED'?'done':canSubmit||m.status==='SUBMITTED'?'active':''}">
        <div style="font-size:20px">${m.status==='PAID'?'💰':m.status==='APPROVED'?'✅':m.status==='SUBMITTED'?'⏳':m.status==='REVISION_REQUESTED'?'↩️':'📝'}</div>
        <div class="ms-info">
          <div class="ms-title">${m.title}</div>
          <div class="ms-desc">${m.description||''}</div>
          ${m.status==='SUBMITTED'?`<div class="info-tip">⏳ Waiting for client to review your submission...</div>`:''}
          ${m.status==='REVISION_REQUESTED'?`<div class="info-tip" style="background:#fff3e0;color:var(--orange)">↩️ Client requested revisions. Submit again. (${usedRevisions}/${revCount+1} rounds used)</div>`:''}
          ${m.status==='APPROVED'?`<div class="info-tip" style="background:#e8f5e9;color:var(--green)">✅ Approved! Waiting for payment release.</div>`:''}
          ${m.status==='PAID'?`<div class="info-tip" style="background:#e8f5e9;color:var(--green)">💰 $${m.amount.toFixed(2)} paid to your wallet!</div>`:''}
          ${subHistory}
          ${canSubmit?`<div style="margin-top:10px">
            <button class="btn-sm pink" onclick="showSubmitWork(${m.id},${pid})">📤 Submit Work for This Milestone</button>
          </div>`:''}
        </div>
        <div class="ms-amount">$${m.amount.toFixed(2)}</div>
      </div>`;
    }
  } else {
    msHtml=`<div class="info-tip">⏳ Client hasn't added milestones yet. You can message them.</div>`;
  }

  openModal(`<h3>🛠️ ${p.title}</h3>
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px"><span class="proj-budget">$${p.budget.toFixed(2)}</span>${badge(p.status)}</div>
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button class="btn-sm info" onclick="openChatModal(${pid},${p.clientId})">💬 Message Client</button>
      ${['IN_PROGRESS','COMPLETED'].includes(p.status)?`<button class="btn-sm danger" onclick="raiseDispute(${pid})">⚠️ Raise Dispute</button>`:''}
    </div>
    <div class="section-title">🎯 Milestones</div>${msHtml}`);
}

function showSubmitWork(msId,pid){
  openModal(`<h3>📤 Submit Work</h3>
    <div class="form-group"><label>Description of what you've done</label>
      <textarea id="subDesc" style="height:100px" placeholder="Describe what you built/designed/wrote. Be specific about what was delivered..."></textarea></div>
    <div class="form-group"><label>External Link (GitHub, Google Drive, Figma, etc.)</label>
      <input id="subLink" placeholder="https://github.com/you/project or https://drive.google.com/..."/></div>
    <p style="font-size:12px;color:var(--gray);margin-top:-8px;margin-bottom:14px">Share a link to your deliverable. Make sure it's publicly accessible.</p>
    <button class="btn-primary full" onclick="submitWork(${msId},${pid})">Submit for Review</button>`);
}
async function submitWork(msId,pid){
  const desc=v('subDesc'),link=v('subLink');
  if(!desc.trim()&&!link.trim()){toast('Please provide a description or link.',false);return;}
  const r=await post(`/milestones/${msId}/submit`,{projectId:String(pid),freelancerId:String(currentUser.id),description:desc,link});
  if(!r.ok){toast(r.data,false);return;}
  toast('Work submitted! Waiting for client review.');closeModal();viewMyWorkDetail(pid);
}

// ── MESSAGES ──────────────────────────────────────────────
async function loadMessages(){
  const allProjects=await get('/projects');
  const mine=allProjects.data.filter(p=>p.clientId===currentUser.id||p.assignedId===currentUser.id);
  document.getElementById('pageContent').innerHTML=`<div class="page-header"><h2>💬 Messages</h2></div>
  ${mine.length?`<div class="cards-grid">${mine.map(p=>`<div class="proj-card" onclick="openChatModal(${p.id},${p.clientId===currentUser.id?p.assignedId||0:p.clientId})" style="cursor:pointer">
    <div class="pc-title">💬 ${p.title}</div>
    <div class="pc-meta">${badge(p.status)}<span style="font-size:12px;color:var(--gray)">Click to open chat</span></div>
  </div>`).join('')}</div>`:'<div class="empty-state"><div class="es-icon">💬</div><p>No active projects to message about.</p></div>'}`;
}

async function openChatModal(pid,otherId){
  if(!otherId||otherId===0){toast('No participant to message yet.',false);return;}
  await post(`/projects/${pid}/messages/read`,{userId:String(currentUser.id)});
  const [msgsR,otherR]=await Promise.all([get(`/projects/${pid}/messages`),get(`/users/${otherId}`)]);
  const msgs=msgsR.data,other=otherR.data;

  openModal(`<h3>💬 Chat with ${other.name}</h3>
    <div class="chat-wrap">
      <div class="chat-messages" id="chatMsgs">${msgs.map(m=>{
        const mine=m.senderId===currentUser.id;
        return`<div class="msg-bubble ${mine?'mine':'theirs'}">
          ${m.content}<div class="msg-time">${fmtDate(m.sentAt)}</div>
        </div>`;
      }).join('')||'<p style="color:var(--gray);font-size:13px;text-align:center;margin-top:20px">No messages yet. Say hello!</p>'}</div>
      <div class="chat-input">
        <input id="chatInput" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendChatMsg(${pid},${otherId})"/>
        <button class="btn-sm pink" onclick="sendChatMsg(${pid},${otherId})">Send</button>
      </div>
    </div>`);
  const cm=document.getElementById('chatMsgs');if(cm)cm.scrollTop=cm.scrollHeight;
}
async function sendChatMsg(pid,otherId){
  const content=v('chatInput').trim();if(!content)return;
  const r=await post(`/projects/${pid}/messages`,{senderId:String(currentUser.id),receiverId:String(otherId),content});
  if(!r.ok){toast(r.data,false);return;}
  document.getElementById('chatInput').value='';
  openChatModal(pid,otherId);
}

// ── MY PROFILE (ALL ROLES) ─────────────────────────────────
async function loadMyProfile(){
  const ur=await get(`/users/${currentUser.id}`);
  const u=ur.data;
  currentUser.avatar=u.avatar; // sync
  const isFreelancer=u.role==='FREELANCER';
  let extra='';
  if(isFreelancer){
    const [revR]=await Promise.all([get(`/freelancers/${u.id}/reviews`)]);
    const avg=revR.data.length?(revR.data.reduce((s,r)=>s+r.rating,0)/revR.data.length).toFixed(1):null;
    extra=`<div class="profile-field"><div class="pf-label">Skills</div><div class="pf-val">${u.skills||'<span style="color:var(--gray)">Not set</span>'}</div></div>
    <div class="profile-field"><div class="pf-label">Bio</div><div class="pf-val">${u.bio||'<span style="color:var(--gray)">Not set</span>'}</div></div>
    <div class="profile-field"><div class="pf-label">Avg Rating</div><div class="pf-val">${avg?`<span class="stars">${stars(Math.round(parseFloat(avg)))}</span> ${avg}/5`:'No reviews yet'}</div></div>`;
  }
  document.getElementById('pageContent').innerHTML=`
    <div class="page-header"><h2>👤 My Profile</h2></div>
    <div class="card" style="max-width:560px">
      <div style="display:flex;align-items:center;gap:18px;margin-bottom:22px">
        <div id="profileAvatarWrap" style="position:relative;cursor:pointer" onclick="document.getElementById('avatarFileInput').click()" title="Click to change photo">
          ${avatarImg(u,80)}
          <div style="position:absolute;bottom:0;right:0;background:var(--pink-dark);color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid white">✏️</div>
        </div>
        <div>
          <div style="font-size:19px;font-weight:800">${u.name}</div>
          <div style="margin-top:4px">${badge(u.role)}</div>
          <div style="font-size:12px;color:var(--gray);margin-top:4px">${u.email}</div>
        </div>
      </div>
      <input type="file" id="avatarFileInput" accept="image/*" style="display:none" onchange="uploadAvatar(this)"/>
      <div id="avatarMsg" style="font-size:12px;color:var(--pink-deep);margin-bottom:10px;display:none"></div>
      <div class="profile-field"><div class="pf-label">Wallet</div><div class="pf-val" style="font-weight:700;color:var(--pink-deep)">$${u.wallet.toFixed(2)}</div></div>
      ${extra}
      <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">
        <button class="btn-primary" onclick="showEditProfile()">✏️ Edit Profile</button>
        <button class="btn-outline" onclick="document.getElementById('avatarFileInput').click()">📷 Change Photo</button>
      </div>
    </div>`;
}

async function uploadAvatar(input){
  const file=input.files[0];if(!file)return;
  const msg=document.getElementById('avatarMsg');
  msg.style.display='block';msg.textContent='Uploading...';
  try{
    const base64=await fileToBase64(file);
    const r=await put(`/users/${currentUser.id}/avatar`,{avatar:base64});
    if(!r.ok){msg.textContent='Upload failed: '+r.data;return;}
    currentUser.avatar=base64;
    // Update avatar in page
    document.getElementById('profileAvatarWrap').innerHTML=avatarImg(currentUser,80)+`<div style="position:absolute;bottom:0;right:0;background:var(--pink-dark);color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid white">✏️</div>`;
    // Update sidebar
    document.getElementById('navUser').innerHTML=`<div style="display:flex;align-items:center;gap:9px">${avatarImg(currentUser,36)}<div><strong style="display:block;font-size:13px">${currentUser.name}</strong>${badge(currentUser.role)}</div></div><div class="wallet-chip" style="font-size:11px;margin-top:6px">$${currentUser.wallet.toFixed(2)}</div>`;
    msg.style.color='var(--green)';msg.textContent='✅ Photo updated!';
    setTimeout(()=>msg.style.display='none',2500);
  }catch(e){msg.textContent='Error: '+e.message;}
}

function showEditProfile(){
  openModal(`<h3>✏️ Edit Profile</h3>
    <div style="text-align:center;margin-bottom:18px">
      <div style="display:inline-block;position:relative;cursor:pointer" onclick="document.getElementById('modalAvatarInput').click()">
        ${avatarImg(currentUser,72)}
        <div style="position:absolute;bottom:0;right:0;background:var(--pink-dark);color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white" id="modalAvatarOverlay">📷</div>
      </div>
      <input type="file" id="modalAvatarInput" accept="image/*" style="display:none" onchange="uploadAvatarModal(this)"/>
      <div id="modalAvatarMsg" style="font-size:12px;color:var(--pink-deep);margin-top:6px"></div>
    </div>
    ${currentUser.role!=='CLIENT'?`
    <div class="form-group"><label>Skills</label><input id="mSkills" value="${currentUser.skills||''}"/></div>
    <div class="form-group"><label>Bio</label><textarea id="mBio">${currentUser.bio||''}</textarea></div>`:''}
    <button class="btn-primary full" onclick="submitProfile()">Save Changes</button>`);
}

async function uploadAvatarModal(input){
  const file=input.files[0];if(!file)return;
  const msg=document.getElementById('modalAvatarMsg');
  msg.textContent='Uploading...';
  try{
    const base64=await fileToBase64(file);
    const r=await put(`/users/${currentUser.id}/avatar`,{avatar:base64});
    if(!r.ok){msg.textContent='Failed: '+r.data;return;}
    currentUser.avatar=base64;
    document.querySelector('#modalContent .inline-block img, #modalContent .inline-block div')?.parentElement?.children[0] && 
      (document.querySelector('#modalContent div[style*="inline-block"]').innerHTML=avatarImg(currentUser,72)+`<div style="position:absolute;bottom:0;right:0;background:var(--pink-dark);color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white">📷</div>`);
    // update nav
    document.getElementById('navUser').innerHTML=`<div style="display:flex;align-items:center;gap:9px">${avatarImg(currentUser,36)}<div><strong style="display:block;font-size:13px">${currentUser.name}</strong>${badge(currentUser.role)}</div></div><div class="wallet-chip" style="font-size:11px;margin-top:6px">$${currentUser.wallet.toFixed(2)}</div>`;
    msg.style.color='var(--green)';msg.textContent='✅ Photo updated!';
  }catch(e){msg.textContent='Error: '+e.message;}
}

async function submitProfile(){
  const r=await put(`/users/${currentUser.id}/profile`,{skills:v('mSkills'),bio:v('mBio')});
  if(!r.ok){toast(r.data,false);return;}
  Object.assign(currentUser,r.data);
  toast('Profile updated!');closeModal();loadMyProfile();
}

// ── MY REVIEWS ─────────────────────────────────────────────
async function loadMyReviews(){
  const r=await get(`/freelancers/${currentUser.id}/reviews`);
  const avg=r.data.length?(r.data.reduce((s,x)=>s+x.rating,0)/r.data.length).toFixed(1):null;
  document.getElementById('pageContent').innerHTML=`<div class="page-header"><h2>⭐ My Reviews</h2>${avg?`<span class="wallet-chip">⭐ ${avg}/5</span>`:''}</div>
  ${r.data.length?`<div class="table-wrap"><table><thead><tr><th>Rating</th><th>Comment</th><th>Date</th></tr></thead>
  <tbody>${r.data.map(rv=>`<tr><td><span class="stars">${stars(rv.rating)}</span> ${rv.rating}/5</td><td>${rv.comment||'—'}</td><td>${fmtDate(rv.createdAt)}</td></tr>`).join('')}</tbody></table></div>`
  :'<div class="empty-state"><div class="es-icon">⭐</div><p>No reviews yet.</p></div>'}`;
}

async function loadMyTransactions(){
  const r=await get(`/users/${currentUser.id}/transactions`);
  document.getElementById('pageContent').innerHTML=`<div class="page-header"><h2>💳 Transactions</h2></div>
  ${r.data.length?`<div class="table-wrap"><table><thead><tr><th>ID</th><th>Type</th><th>Amount</th><th>Note</th><th>Date</th></tr></thead>
  <tbody>${r.data.map(t=>{const out=t.fromId===currentUser.id;return`<tr><td>#${t.id}</td>
  <td>${badge(out?'assigned':'paid')}</td>
  <td style="font-weight:800;color:${out?'var(--red)':'var(--green)'}">$${t.amount.toFixed(2)}</td>
  <td>${t.note||''}</td><td>${fmtDate(t.createdAt)}</td></tr>`}).join('')}</tbody></table></div>`
  :'<div class="empty-state"><div class="es-icon">💳</div><p>No transactions yet.</p></div>'}`;
}

// ── ADMIN ──────────────────────────────────────────────────
async function loadAllUsers(){
  const r=await get('/users');
  document.getElementById('pageContent').innerHTML=`<div class="page-header"><h2>👥 All Users</h2></div>
  <div class="table-wrap"><table><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Wallet</th><th>Status</th><th>Action</th></tr></thead>
  <tbody>${r.data.map(u=>`<tr>
  <td><div style="display:flex;align-items:center;gap:10px">${avatarImg(u,34)}<div><div style="font-weight:700">${u.name}</div><div style="font-size:11px;color:var(--gray)">#${u.id}</div></div></div></td>
  <td>${u.email}</td><td>${badge(u.role)}</td>
  <td>$${u.wallet.toFixed(2)}</td>
  <td><span class="badge ${u.active?'active':'cancelled'}">${u.active?'ACTIVE':'INACTIVE'}</span></td>
  <td><button class="btn-sm ${u.active?'danger':'success'}" onclick="toggleUser(${u.id})">${u.active?'Deactivate':'Activate'}</button></td></tr>`).join('')}
  </tbody></table></div>`;
}
async function toggleUser(id){await post(`/users/${id}/toggle`,{});toast('User status updated!');loadAllUsers();}

async function loadAllProjectsAdmin(){
  const r=await get('/projects');
  document.getElementById('pageContent').innerHTML=`<div class="page-header"><h2>📋 All Projects</h2></div>
  <div class="table-wrap"><table><thead><tr><th>ID</th><th>Title</th><th>Budget</th><th>Status</th><th>Client</th><th>Created</th></tr></thead>
  <tbody>${r.data.map(p=>`<tr><td>#${p.id}</td><td>${p.title}</td><td>$${p.budget.toFixed(2)}</td>
  <td>${badge(p.status)}</td><td>#${p.clientId}</td><td>${fmtDate(p.createdAt)}</td></tr>`).join('')}</tbody></table></div>`;
}

async function loadAllDisputes(){
  const r=await get('/disputes');
  document.getElementById('pageContent').innerHTML=`<div class="page-header"><h2>⚖️ Disputes</h2></div>
  ${r.data.length?r.data.map(d=>`<div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
      <div><strong>Project #${d.projectId}</strong> — Raised by User #${d.raisedById}</div>${badge(d.status)}
    </div>
    <p style="font-size:13px;margin-bottom:12px">${d.reason}</p>
    ${d.adminNote?`<div class="sub-note" style="margin-bottom:10px">Admin note: ${d.adminNote}</div>`:''}
    ${d.status==='OPEN'?`<div style="display:flex;gap:8px">
      <button class="btn-sm success" onclick="resolveDispute(${d.id},'RESOLVED_FREELANCER')">✅ Favor Freelancer (Complete Project)</button>
      <button class="btn-sm danger" onclick="resolveDispute(${d.id},'RESOLVED_CLIENT')">❌ Favor Client (Cancel Project)</button>
    </div>`:`<p style="font-size:12px;color:var(--gray)">Resolved: ${fmtDate(d.resolvedAt)}</p>`}
  </div>`).join(''):'<div class="empty-state"><div class="es-icon">⚖️</div><p>No disputes.</p></div>'}`;
}
async function resolveDispute(id,resolution){
  const note=prompt('Admin note (explanation of decision):');if(note===null)return;
  const r=await post(`/disputes/${id}/resolve`,{adminId:String(currentUser.id),resolution,note});
  if(!r.ok){toast(r.data,false);return;}
  toast('Dispute resolved.');loadAllDisputes();
}

async function loadAllReviews(){
  const r=await get('/reviews');
  document.getElementById('pageContent').innerHTML=`<div class="page-header"><h2>⭐ All Reviews</h2></div>
  ${r.data.length?`<div class="table-wrap"><table><thead><tr><th>ID</th><th>Freelancer</th><th>Rating</th><th>Comment</th><th>Date</th></tr></thead>
  <tbody>${r.data.map(rv=>`<tr><td>#${rv.id}</td><td>#${rv.freelancerId}</td><td><span class="stars">${stars(rv.rating)}</span></td><td>${rv.comment||'—'}</td><td>${fmtDate(rv.createdAt)}</td></tr>`).join('')}</tbody></table></div>`
  :'<div class="empty-state"><div class="es-icon">⭐</div><p>No reviews.</p></div>'}`;
}

async function loadAllTransactions(){
  const r=await get('/transactions');
  document.getElementById('pageContent').innerHTML=`<div class="page-header"><h2>💳 All Transactions</h2></div>
  ${r.data.length?`<div class="table-wrap"><table><thead><tr><th>ID</th><th>From</th><th>To</th><th>Amount</th><th>Note</th><th>Date</th></tr></thead>
  <tbody>${r.data.map(t=>`<tr><td>#${t.id}</td><td>#${t.fromId}</td><td>#${t.toId}</td>
  <td style="font-weight:800;color:var(--pink-deep)">$${t.amount.toFixed(2)}</td><td>${t.note||''}</td><td>${fmtDate(t.createdAt)}</td></tr>`).join('')}</tbody></table></div>`
  :'<div class="empty-state"><div class="es-icon">💳</div><p>No transactions.</p></div>'}`;
}

// ── ADMIN DOWNLOADS ────────────────────────────────────────
async function loadAdminDownloads(){
  // Fetch live counts for preview
  const [projects,users,txs,reviews,allProjects]=await Promise.all([
    get('/projects'),get('/users'),get('/transactions'),get('/reviews'),get('/projects')
  ]);
  const subs=allProjects.data.reduce((acc,p)=>acc,[]); // placeholder count
  const totalPaid=txs.data.reduce((s,t)=>s+t.amount,0);

  document.getElementById('pageContent').innerHTML=`
  <div class="page-header"><h2>⬇️ Export & Downloads</h2></div>
  <p style="color:var(--gray);font-size:14px;margin-bottom:24px">Download all platform data as files. All files include real-time data at the moment of download.</p>

  <div class="section-title">📊 Platform Snapshot</div>
  <div class="stat-grid" style="margin-bottom:28px">
    <div class="stat-card"><div class="num">${users.data.length}</div><div class="lbl">Users</div></div>
    <div class="stat-card"><div class="num">${projects.data.length}</div><div class="lbl">Projects</div></div>
    <div class="stat-card"><div class="num">${txs.data.length}</div><div class="lbl">Transactions</div></div>
    <div class="stat-card"><div class="num">$${totalPaid.toFixed(0)}</div><div class="lbl">Total Volume</div></div>
    <div class="stat-card"><div class="num">${reviews.data.length}</div><div class="lbl">Reviews</div></div>
  </div>

  <div class="section-title">📄 Full Report</div>
  <div class="card" style="margin-bottom:24px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:14px">
      <div>
        <h3 style="margin-bottom:6px">💼 Complete Platform Report (HTML)</h3>
        <p style="font-size:13px;color:var(--gray);line-height:1.6">Single file containing everything: all projects with full details, per-project milestones, all work submissions with links and client feedback, contracts, users, transactions, and reviews. Open in browser or print as PDF.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <span style="font-size:12px;background:var(--pink-pale);padding:3px 9px;border-radius:10px;color:var(--pink-deep)">📋 ${projects.data.length} projects</span>
          <span style="font-size:12px;background:var(--pink-pale);padding:3px 9px;border-radius:10px;color:var(--pink-deep)">👥 ${users.data.length} users</span>
          <span style="font-size:12px;background:var(--pink-pale);padding:3px 9px;border-radius:10px;color:var(--pink-deep)">💳 ${txs.data.length} transactions</span>
          <span style="font-size:12px;background:var(--pink-pale);padding:3px 9px;border-radius:10px;color:var(--pink-deep)">⭐ ${reviews.data.length} reviews</span>
        </div>
      </div>
      <a href="/api/export/full-report.html" download class="btn-primary" style="text-decoration:none;white-space:nowrap;padding:12px 22px">⬇️ Download Full Report</a>
    </div>
  </div>

  <div class="section-title">🗂️ Individual CSV Files</div>
  <div class="cards-grid">
    ${dlCard('📋','Projects CSV','All project data: title, description, budget, status, client, assigned freelancer, dates.','projects.csv',projects.data.length,'projects')}
    ${dlCard('👥','Users CSV','All user accounts: name, email, role, wallet balance, skills, bio, active status.','users.csv',users.data.length,'users')}
    ${dlCard('💳','Transactions CSV','All payment records: sender, receiver, amount, note, date.','transactions.csv',txs.data.length,'transactions')}
    ${dlCard('⭐','Reviews CSV','All freelancer reviews: ratings, comments, client/freelancer info.','reviews.csv',reviews.data.length,'reviews')}
    ${dlCard('📤','Submissions CSV','All work submissions: descriptions, external links, revision rounds, client feedback.','submissions.csv','—','submissions')}
  </div>

  <div class="section-title" style="margin-top:8px">💡 How to use</div>
  <div class="card">
    <p style="font-size:13px;color:var(--gray);line-height:1.8">
      <strong>Full Report (HTML):</strong> Open in any browser. Use Ctrl+P / Cmd+P to print or save as PDF. All data is embedded — no internet needed after download.<br>
      <strong>CSV files:</strong> Open directly in Excel, Google Sheets, or any spreadsheet software. Use for analysis, filtering, and reporting.
    </p>
  </div>`;
}

function dlCard(icon,title,desc,file,count,type){
  return`<div class="proj-card" style="display:flex;flex-direction:column;justify-content:space-between">
    <div>
      <div style="font-size:32px;margin-bottom:10px">${icon}</div>
      <div class="pc-title">${title}</div>
      <div class="pc-desc">${desc}</div>
      ${typeof count==='number'?`<span style="font-size:12px;font-weight:700;color:var(--pink-deep)">${count} records</span>`:''}
    </div>
    <a href="/api/export/${file}" download class="btn-primary full" style="text-decoration:none;text-align:center;margin-top:14px;display:block">⬇️ Download .${file.split('.')[1].toUpperCase()}</a>
  </div>`;
}
