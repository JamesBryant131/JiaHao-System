'use strict';
const root=document.querySelector('#root'),api=(window.JIAHAO_API||'').replace(/\/$/,'');
const sessionKey='jh-campus:'+api+':'+location.pathname,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let token=sessionStorage.getItem(sessionKey)||'',s=null,tab='任务区',group='每日任务',mode='注册',query='',order='desc',busy=false,draft=null;
const button=(label,op,id='',more='')=>'<button data-op="'+op+'" data-id="'+esc(id)+'" '+more+'>'+esc(label)+'</button>';
const tag=v=>'<small>'+esc(v)+'</small>';
const title=v=>'<h3>'+esc(v)+'</h3>';
const line=(a,b)=>'<article><div>'+a+'</div><aside>'+b+'</aside></article>';
const input=(label,name,attrs='required maxlength="36"')=>'<label>'+label+'<input name="'+name+'" '+attrs+'></label>';
const desc='<label>完成条件<textarea name="desc" required maxlength="240" rows="3" placeholder="在校园里做什么算完成？"></textarea></label>';
const value=label=>input(label,'value','type="number" min="1" max="9999" step="1" required');
const shell=v=>'<header><div class="brand"><i>ϟ</i>嘉豪系统</div><span class="online"><b></b>CAMPUS SERVER</span></header><main>'+v+'</main><footer><span>JIAHAO SYSTEM ✦ 校园服</span><span>v2.0</span></footer>';
function notice(msg){const node=document.querySelector('#msg');if(node)node.textContent=msg}
async function call(op,data={}){
 const res=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({op,...data})});
 const json=await res.json();if(!res.ok){if(res.status===401&&token){token='';s=null;sessionStorage.removeItem(sessionKey);render()}throw Error(json.error||'请求失败。')}return json;
}
function login(){return '<section class="landing"><div class="poster"><div class="posterTag">JIAHAO SYSTEM</div><h1>嘉豪系统<span class="period">.</span></h1><strong class="slogan">校园服 · 宿主接入</strong><div class="art"><div class="burst"></div><button type="button" class="frog" data-op="quote" aria-label="点击嘉豪奶蛙听语录"><img src="mascot.png" alt="黑衣嘉豪奶蛙"></button><div class="speech" aria-live="polite">点我，听嘉豪说。</div></div></div><div class="auth"><div class="window">HOST TERMINAL</div><div class="pad"><div class="tabs">'+['注册','登录'].map(m=>button(m,'mode',m,m===mode?'class="active"':'')).join('')+'</div><h2>'+mode+'宿主</h2><form id="auth">'+input('用户名','name','required maxlength="24" autocomplete="username"')+input('密码','password','type="password" required minlength="6" maxlength="128" autocomplete="'+(mode==='登录'?'current-password':'new-password')+'"')+'<button class="primary">'+mode+'并接入</button></form><p id="msg" role="status">'+(api?'':'校园服尚未连接。站长请按 README 配置后端地址。')+'</p><a href="?legacy">打开旧版单机存档</a></div></div></section>'}
function taskRows(){
 const daily=group==='每日任务',needle=query.trim().toLowerCase(),list=(daily?s.daily:s.posts).filter(x=>(x.title+' '+x.desc+' '+x.value+' '+(x.author||'')).toLowerCase().includes(needle)).sort((a,b)=>order==='asc'?a.value-b.value:b.value-a.value);
 return list.map(x=>{let action;if(daily){const done=s.p.done.includes(x.id);action=button(done?'今日已结算':'完成并结算','daily',x.id,done?'disabled':'class="green"')}else{action=x.author===s.name?button('撤回并退款','cancel',x.id):button('完成并领取','claim',x.id,'class="green"');if(s.p.admin&&x.author!==s.name)action+=button('撤销悬赏','cancel',x.id)}
 return line(tag((daily?'系统派发':'发布者 · '+x.author)+' / '+x.value+' 豪意值')+title(x.title)+'<p>'+esc(x.desc)+'</p>',action)}).join('')||'<p class="empty">'+(needle?'没有匹配任务。':daily?'今日暂无任务。':'还没有玩家悬赏。你可以去任务发布区发出第一条。')+'</p>'
}
function tasks(){return '<div class="tabs">'+['每日任务','玩家悬赏'].map(m=>button(m,'group',m,m===group?'class="active"':'')).join('')+'</div><div class="tools"><input id="search" aria-label="搜索任务" placeholder="搜索任务、发布者或豪意值" value="'+esc(query)+'"><select id="sort" aria-label="按豪意值排序"><option value="desc">豪意值从高到低</option><option value="asc" '+(order==='asc'?'selected':'')+'>豪意值从低到高</option></select></div><p class="hint">'+(group==='每日任务'?'每天北京时间零点随机派发三项，每项限结算一次。':'全服共享。完成任务的第一位宿主领取悬赏。')+'</p><div id="rows">'+taskRows()+'</div>'}
function rewards(){return '<h3>我的衣橱</h3><div class="closet">'+(s.p.owned.map(x=>button((s.p.equipped[x.slot]===x.id?'已穿戴 · ':'穿戴 · ')+x.title,'wear',x.id)).join('')||'衣橱暂空，兑换后即可穿戴。')+'</div><h3>系统奖励</h3>'+s.items.map(x=>{const have=s.p.owned.some(y=>y.id===x.id),cost=Math.ceil(x.value*(s.p.discount?.5:1));return line(tag(x.slot)+title(x.title),button(have?'已收藏':cost+' 豪意值 · 兑换','buy',x.id,have||cost>s.p.balance?'disabled':'class="green"'))}).join('')}
function publish(){return '<p>发布后，所有宿主都能在「玩家悬赏」看到任务。奖励从你的余额预扣，未被领取前可以撤回。</p><form id="post">'+input('任务名称','title')+desc+value('悬赏豪意值')+'<button class="primary">预览并确认发布</button></form>'}
function admin(){return '<h3>每日任务池</h3><form id="addDaily">'+input('任务名称','title')+desc+value('完成奖励')+'<button>添加每日任务</button></form>'+s.catalog.map(x=>line(esc(x.title)+' · '+x.value,button('移除','rmDaily',x.id))).join('')+'<h3>奖励管理</h3><form id="addItem">'+input('装扮名称','title')+'<label>部位<select name="slot"><option>衣服</option><option>墨镜</option><option>配饰</option></select></label>'+value('兑换价格')+'<button>上架奖励</button></form>'+s.items.map(x=>line(esc(x.title)+' · '+x.value,button('下架','rmItem',x.id))).join('')+'<h3>管理员</h3><p>'+s.admins.map(esc).join('、')+'</p><form id="role">'+input('已注册用户名','target','required maxlength="24"')+'<label>权限<select name="role"><option value="yes">授予管理员</option><option value="no">撤销管理员</option></select></label><button>更新权限</button></form>'}
function render(){if(!s){root.innerHTML=shell(login());return}if(tab==='管理区'&&!s.p.admin)tab='任务区';
 const tabs=['任务区','系统奖励区','任务发布区','随机奇遇',...(s.p.admin?['管理区']:[])];
 const content=tab==='任务区'?tasks():tab==='系统奖励区'?rewards():tab==='任务发布区'?publish():tab==='管理区'?admin():'<h3>最近一次奇遇</h3><p>'+esc(s.p.event)+'</p><p class="hint">随机派发双倍豪意、巡演红包或装扮半价券。下次检查时间 '+new Date(s.p.next).toLocaleTimeString('zh-CN')+'</p>';
 root.innerHTML=shell('<section class="status"><div><small>HOST / '+(s.p.admin?'ADMIN':'PLAYER')+'</small><h2>'+esc(s.name)+'</h2><p>'+s.p.owned.filter(x=>s.p.equipped[x.slot]===x.id).map(x=>esc(x.title)).join(' · ')+'</p></div><div><small>豪意值</small><h2>'+s.p.balance+'</h2></div>'+button('新手指南','guide')+button('退出','logout')+'</section><nav>'+tabs.map(t=>button(t,'tab',t,t===tab?'class="active"':'')).join('')+'</nav><section class="gamepanel"><h2>'+tab+'</h2><p id="msg" role="status"></p>'+content+'</section>')}
async function perform(op,data={},message=''){if(busy)return;busy=true;try{const res=await call(op,data);if(op==='logout'){token='';s=null;mode='登录';sessionStorage.removeItem(sessionKey)}else{if(res.token){token=res.token;sessionStorage.setItem(sessionKey,token)}s=res;if(op==='post'){tab='任务区';group='玩家悬赏';query=''}}render();notice(message);if(op==='register')openGuide();if(op==='welcomeGift')showGiftStatus()}catch(e){notice(e.message)}finally{busy=false}}
root.addEventListener('input',e=>{if(e.target.id==='search'){query=e.target.value;document.querySelector('#rows').innerHTML=taskRows()}});
root.addEventListener('change',e=>{if(e.target.id==='sort'){order=e.target.value;document.querySelector('#rows').innerHTML=taskRows()}});
root.addEventListener('click',e=>{const el=e.target.closest('[data-op]');if(!el)return;const {op,id}=el.dataset;if(op==='quote'){sayQuote(el);return}if(op==='guide'){openGuide();return}if(busy)return;
 if(op==='mode'){mode=id;render();return}if(op==='tab'){tab=id;render();return}if(op==='group'){group=id;query='';render();return}
 if(['rmDaily','rmItem','cancel'].includes(op)&&!confirm('确认移除这项内容？未领取悬赏的豪意值将退回。'))return;
 if(['rmDaily','rmItem'].includes(op)){void perform('remove',{kind:op==='rmDaily'?'daily':'item',id},'已移除。');return}
 void perform(op,{id},op==='logout'?'':'操作成功。')});
root.addEventListener('submit',e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f));if(d.value)d.value=Number(d.value);
 if(f.id==='auth'){if(!api){notice('校园服尚未配置后端地址，请查看 README。');return}void perform(mode==='注册'?'register':'login',d);return}
 if(f.id==='post'){if(confirm('发布「'+d.title+'」并预扣 '+d.value+' 豪意值？'))void perform('post',d,'悬赏已向全服发布。');return}
 if(f.id==='role'){if(confirm('确认变更 '+d.target+' 的管理员权限？'))void perform('role',{target:d.target,enable:d.role==='yes'},'权限已更新。');return}
 void perform('add',{...d,kind:f.id==='addDaily'?'daily':'item'},'已添加。')});
const quotes = [
 '黑帽衫束脚裤，我叫嘉豪你记住。','十年前的仇，难道不报了吗？','凡人与我，本就不同。','好戏，才刚刚开始。',
 '耳机一戴，谁都不爱；口罩一摘，气场全开。','不是雨天配嘉豪，是嘉豪自带下雨天。','孤独是强者必须付出的代价，巅峰只剩寒风。',
 '我本不想出手，是你们逼我的。','不是我太强，只是对手太过平庸。','这副躯体限制了我的真正力量。',
 '眼界狭隘，自然看不懂我的格局。','等你走到我的高度，再来与我对话。','浅薄之人，只会拘泥眼前琐事。',
 '大家都说嘉豪在雨里会跑步，我怎么在雨里跑了两圈都没看到。',
 '豪力不足的嘉豪才需要雨中起舞，真正的嘉豪神只坐在希沃白板前查股票。',
 '别人书包里：书、笔……我书包里：手机、烟、她的照片、她的皮筋（老子不想跪榴莲）。'
];
let quoteIndex = 0;
function sayQuote(button) {
  button.nextElementSibling.textContent = quotes[quoteIndex];
  quoteIndex = (quoteIndex + 1) % quotes.length;
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    button.getAnimations().forEach(animation => animation.cancel());
    button.animate([0,-5,4,-2,0].map(x => ({transform:'translateX('+x+'px)'})), {duration:230});
  }
}
const guide = document.createElement('dialog');
guide.className = 'guide';
guide.setAttribute('aria-labelledby','guide-title');
guide.innerHTML = `<h2 id="guide-title">新手指南</h2><p>第一次来？先收下嘉豪奶蛙的见面礼。</p>
<section><h3>来自嘉豪奶蛙的馈赠</h3><p>嘉豪大礼包 · 200 豪意值 · 每个账号限领一次</p>
<button class="green" data-gift>打开礼包</button><p data-feedback role="status"></p></section>
<ul><li><b>赚豪意值</b>　每天北京时间零点换一批校园任务。现实中做完，再回任务区结算。</li>
<li><b>接玩家悬赏</b>　搜索任务，或按豪意值排序。第一个完成并结算的宿主拿到奖励。</li>
<li><b>发布任务</b>　写清完成条件和赏金。赏金从余额预扣，没人领取前可撤回并退款。</li>
<li><b>兑换装扮</b>　在系统奖励区兑换衣服、墨镜和配饰，点衣橱里的物品换装。</li>
<li><b>遇见奇遇</b>　留意双倍豪意、半价券和随机红包。换设备时登录原校园账号即可继续。</li></ul>
<button data-close>返回校园服</button>`;
document.body.append(guide);
const gift = guide.querySelector('[data-gift]');
const feedback = guide.querySelector('[data-feedback]');
function showGiftStatus() {
  gift.disabled = Boolean(s?.p.welcomeGiftClaimed);
  gift.textContent = gift.disabled ? '礼包已领取' : '打开礼包';
  feedback.textContent = gift.disabled ? '已结算，当前余额 '+s.p.balance+' 豪意值。' : '';
}
function openGuide() {
  if (!s || guide.open) return;
  showGiftStatus();
  guide.showModal();
}
guide.querySelector('[data-close]').onclick = () => guide.close();
gift.onclick = async () => {
  if (!s || gift.disabled) return;
  if (busy) {feedback.textContent='正在同步，请稍后再点一次。'; return}
  gift.disabled=true;
  await perform('welcomeGift');
  if (!s) {guide.close();return}
  if (!s.p.welcomeGiftClaimed) {
    gift.disabled=false;
    feedback.textContent='领取未确认，请重试。';
  }
};
render();if(token&&api)void perform('view');
setInterval(async()=>{if(!s||busy||document.hidden)return;busy=true;try{const before=s;s=await call('view');if(before.p.admin!==s.p.admin){render();return}if(tab==='任务区'){document.querySelector('#rows').innerHTML=taskRows()}if(tab==='随机奇遇'||tab==='系统奖励区')render();const wallet=document.querySelector('.status div:nth-child(2) h2');if(wallet)wallet.textContent=s.p.balance;if(before.p.event!==s.p.event)notice(s.p.event)}catch(e){notice(e.message)}finally{busy=false}},5000);
