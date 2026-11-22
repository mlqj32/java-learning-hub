/* Browser-only labs. Every chart, checkpoint and summary comes from the lesson function. */
(function () {
  'use strict';
  var U = window.HUB_LAB_UI, models = window.HUB_WORLD_MODELS;
  var flows = {
    boot:['复位取指','启动例程','主循环或调度','虚拟外设输出'],
    control:['温度采样','计算误差','功率限幅','更新温度'], pacer:['提交配置','感知事件','检查等待','虚拟脉冲'],
    interlock:['编辑版本','验证版本','硬件就绪','启动互锁'], calendar:['完整年份','两位编码','差值比较','位宽边界'],
    overflow:['浮点输入','教学截断','范围检查','通道隔离'], units:['冲量单位','速度变化','时间推进','位置偏差'],
    clock:['0.1 秒','定点截断','滴答计数','累计误差'], scheduler:['任务列表','优先级','预算准入','关键任务'],
    link:['地球发送','单程光时','探测器去重','确认返回'], radiation:['编码 7 位','注入扰动','校验综合症','恢复核对'],
    transit:['合成恒星','凌日遮挡','亮度采样','候选与概率'], spectrum:['采样波形','频率投影','功率频谱','来源待核实'],
    archive:['保存字节','读取规格','解码指令','核对输出'], mission:['测量记录','单位检查','年龄检查','决策状态']
  };
  var labels = {finalTemperature:'最终温度 / °C',target:'目标 / °C',samples:'采样数',accepted:'配置已提交',interval:'采用间隔 / 虚拟节拍',pulses:'虚拟脉冲数',unit:'时间单位',protectedMode:'启用保护',blocked:'阻止启动次数',unsafeStarts:'不安全启动次数',naive:'两位年份差',correct:'结果是否正确 / 正确差值',bits:'有符号位宽',limit:'最大正值',wrapped:'模拟回绕结果',integer:'教学截断结果',inRange:'是否可表示',commonModeFailure:'共因失效',impulseNs:'正确冲量 / N·s',trueDeltaV:'正确 Δv / (m/s)',mistakenDeltaV:'误读 Δv / (m/s)',positionErrorMetres:'最终位置差 / m',storedTenth:'存储的 0.1',errorPerTick:'每滴答误差 / s',driftSeconds:'最终时间差 / s',model:'模型',priority:'关键任务优先',guidanceExecuted:'制导任务已执行',used:'已用预算',budget:'总预算',oneWaySeconds:'单程光时 / s',roundTripSeconds:'往返光时 / s',retrySent:'已提前重试',executions:'命令执行次数',received:'接收码字',syndrome:'综合症',decoded:'解码数据',matches:'恢复与原始一致',guaranteed:'处于单错保证范围',depth:'理想凌日深度',illustrativePosterior:'假设分类器后验',conclusion:'证据边界',peak:'最大功率格点',syntheticOrigin:'合成源标签',evidenceOfAliens:'是否证明外星生命',bytesSurvive:'字节仍在',interpretableInModel:'模型接收者可解释',outputs:'输出',expected:'预期输出',unsafeStaleMoves:'过期数据触发 MOVE 次数',holds:'保持次数',validUnit:'末帧单位有效',checkFreshness:'检查新鲜度'};
  Object.assign(labels,{stage:'运行阶段',mode:'运行方式',ramReady:'启动内存初始化完成',outputRegister:'虚拟输出寄存器',servicedEvents:'已服务外部事件',pendingEvent:'仍待处理的事件',booted:'已进入应用',tick:'采样轮次',sensor:'虚拟传感器读数',decision:'达到阈值 23',event:'当前事件 event',desired:'请求配置 desired',physical:'实际配置 physical',version:'当前版本 version',validatedVersion:'已验证版本',allowed:'允许启动',start:'开始年份',end:'结束年份',yyStart:'开始年末两位',yyEnd:'结束年末两位',minimum:'下界',maximum:'上界',value:'测量值 value',nextMathematical:'数学上的下一值',simulatedSigned:'按位宽解释',fractionBits:'小数位数',retrySent:'已提前重发',commandId:'命令编号',flips:'注入错误位数',inTransit:'位于凌日阶段',observed:'观测亮度',real:'实部 real',imaginary:'虚部 imaginary',power:'归一化功率',bytes:'保留的字节',readable:'模型接收者可读',pc:'下一字节位置 pc',opcode:'当前指令 opcode',accumulator:'累加器',time:'记录序号',age:'数据年龄',usable:'数据可用',action:'动作'});
  function fmt(value) { if (typeof value === 'boolean') return value ? '是' : '否'; if (typeof value === 'number') return Number.isInteger(value) ? String(value) : Number(value.toPrecision(8)).toString(); return Array.isArray(value) ? JSON.stringify(value) : String(value); }
  function card(parent,key,value) { var c=U.el('div','wl-stat'); c.appendChild(U.el('dt','',key==='correct'?(typeof value==='number'?'正确年份差':'结果是否正确'):(labels[key]||key))); c.appendChild(U.el('dd','',fmt(value))); parent.appendChild(c); }
  function svgNode(tag, attrs, text) { var n=document.createElementNS('http://www.w3.org/2000/svg',tag); Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,attrs[k]);}); if(text!==undefined)n.textContent=text; return n; }
  function bootDiagram(svg,frame) {
    var state=frame.state;
    function text(x,y,value,color,size){svg.appendChild(svgNode('text',{x:x,y:y,fill:color||'#c7d8ed','font-size':size||16},value));}
    text(24,27,'设备里的计算机：CPU 执行指令，存储器保存程序与状态。','#e3efff',18);
    [['bare-metal','裸机 · 无操作系统',['复位入口','启动例程','应用主循环','外设输出'],72],['RTOS','RTOS · 内核安排任务',['复位入口','启动例程','任务调度','应用任务','外设输出'],174]].forEach(function(lane){
      text(24,lane[3]-15,lane[1],state.mode===lane[0]?'#7dd3fc':'#92a6c1',16);
      var count=lane[2].length,w=count===4?150:120,gap=count===4?23:17;
      lane[2].forEach(function(label,i){var activeStage=state.stage==='镜像拒绝'?'复位入口':['事件检查','采样','计算'].includes(state.stage)?(state.mode==='RTOS'?'应用任务':'应用主循环'):state.stage;var active=state.mode===lane[0]&&label===activeStage,x=24+i*(w+gap);
        svg.appendChild(svgNode('rect',{x:x,y:lane[3],width:w,height:42,rx:9,fill:active?'#1b4260':'#111e31',stroke:active?'#7dd3fc':'#3a4d68','stroke-width':active?2:1}));
        text(x+12,lane[3]+27,label,active?'#f0f9ff':'#a7bcd6',16);
        if(i<count-1)text(x+w+4,lane[3]+27,'→','#91abc9',16);
      });
    });
    text(24,251,'本次：'+(state.mode==='RTOS'?'RTOS':'裸机')+' · 当前阶段：'+state.stage,state.stage==='镜像拒绝'?'#fda4af':'#c7d8ed',17);
  }
  function typeDiagram(svg,frames,index,c) {
    function text(x,y,value,color,size){svg.appendChild(svgNode('text',{x:x,y:y,fill:color||'#d9e7f8','font-size':size||17},value));}
    function box(x,y,w,h,active){svg.appendChild(svgNode('rect',{x:x,y:y,width:w,height:h,rx:12,fill:active?'#18354e':'#101e31',stroke:active?'#7dd3fc':'#3b506d','stroke-width':active?2:1}));}
    if(c.model==='calendar'){
      var years=frames[0].state,diff=frames[1].state,width=frames[2].state,wrap=frames[3].state;
      box(24,20,316,86,index===0);box(366,20,330,86,index===1);
      text(42,46,'完整年份 → 只剩末两位','#aabed8',15);text(42,78,years.start+' → '+years.yyStart+'；'+years.end+' → '+years.yyEnd);
      text(384,46,'跨年差值 · 两种解释','#aabed8',15);text(384,78,'两位：'+diff.naive+'   完整：'+diff.correct,index===1?'#7dd3fc':'#d9e7f8');
      box(24,124,672,118,index>=2);text(42,151,width.bits+' 位有符号整数 · 显式模拟回绕','#aabed8',15);
      text(42,188,'最大值 '+width.limit+'   + 1   →   '+wrap.simulatedSigned,index===3?'#fda4af':'#d9e7f8',20);
      text(42,221,'年份语义丢失 ≠ 固定位宽回绕；它们是两类问题。','#bacbe2',15);
    }else{
      var integer=frames[0].state.integer,inRange=frames[1].state.inRange,now=frames[index].state;
      box(24,18,672,64,index===0);text(42,47,'待转换值 → 教学截断后：'+integer,'#d9e7f8',20);text(42,69,'这里使用向零截断；并非历史事故的舍入规则。','#aabed8',14);
      text(40,113,'16 位有符号整数的可表示范围','#bacbe2',16);
      svg.appendChild(svgNode('rect',{x:110,y:137,width:500,height:18,rx:8,fill:'#1c5265',stroke:'#67e8f9'}));
      var px=110+Math.max(0,Math.min(1,(integer+32768)/65535))*500;
      svg.appendChild(svgNode('circle',{cx:px,cy:146,r:10,fill:inRange?'#7dd3fc':'#fda4af'}));
      text(110,181,'−32768','#aabed8',15);text(550,181,'32767','#aabed8',15);
      text(40,212,index<1?'下一步：检查目标类型边界':inRange?'范围检查通过：可表示':'越过边界：拒绝转换；不能当成有效飞行数据',index<1?'#bacbe2':inRange?'#7dd3fc':'#fda4af',17);
      if(index===2)text(40,244,'主通道：'+now['主通道']+'；备用：'+now['备用通道'],'#bacbe2',16);
    }
  }
  function chart(host, frames, index, c) {
    host.replaceChildren();
    var svg=svgNode('svg',{viewBox:'0 0 720 266',role:'img','aria-label':c.title+'，'+c.yLabel+'，当前第 '+(index+1)+' 个检查点'});
    if(c.model==='boot'){bootDiagram(svg,frames[index]);host.appendChild(svg);return;}
    if(c.model==='calendar'||c.model==='overflow'){typeDiagram(svg,frames,index,c);host.appendChild(svg);return;}
    var categorical=['interlock','radiation','archive','mission','scheduler','link'].includes(c.model);
    var values=categorical?[0]:[]; frames.forEach(function(f){if(Number.isFinite(f.value))values.push(f.value);if(Number.isFinite(f.reference))values.push(f.reference);});
    var lo=Math.min.apply(null,values),hi=Math.max.apply(null,values), pad=(hi-lo)*0.12||1;lo-=pad;hi+=pad;
    function y(v){return 215-(v-lo)/(hi-lo)*170;} function x(i){return 94+i/Math.max(1,frames.length-1)*598;}
    svg.appendChild(svgNode('text',{x:94,y:22,fill:'#c6d4e9','font-size':15},c.yLabel));
    for(var k=0;k<4;k++){var val=lo+(hi-lo)*k/3,yy=y(val);svg.appendChild(svgNode('line',{x1:94,x2:692,y1:yy,y2:yy,stroke:'#243247','stroke-dasharray':'3 5'}));svg.appendChild(svgNode('text',{x:84,y:yy+5,'text-anchor':'end',fill:'#aabbd2','font-size':14},Math.abs(val)>=1000000||Math.abs(val)>0&&Math.abs(val)<0.001?val.toExponential(1):Number(val.toPrecision(4)).toString()));}
    if(categorical){frames.slice(0,index+1).forEach(function(f,i){var base=y(Math.max(lo,Math.min(hi,0))),fy=y(f.value);svg.appendChild(svgNode('rect',{x:x(i)-10,y:Math.min(base,fy),width:20,height:Math.max(3,Math.abs(base-fy)),rx:4,fill:i===index?'#a5b4fc':'#38bdf8',opacity:i===index?1:0.6}));if(Number.isFinite(f.reference))svg.appendChild(svgNode('circle',{cx:x(i),cy:y(f.reference),r:5,fill:'#fbbf24'}));});}
    else {['reference','value'].forEach(function(key){var points=frames.slice(0,index+1).map(function(f,i){return Number.isFinite(f[key])?x(i)+','+y(f[key]):null;}).filter(Boolean);if(points.length)svg.appendChild(svgNode('polyline',{points:points.join(' '),fill:'none',stroke:key==='value'?'#38bdf8':'#fbbf24','stroke-width':key==='value'?3:2,'stroke-dasharray':key==='reference'?'6 5':''}));});}
    var f=frames[index];svg.appendChild(svgNode('line',{x1:x(index),x2:x(index),y1:38,y2:222,stroke:'#a5b4fc',opacity:0.45}));svg.appendChild(svgNode('circle',{cx:x(index),cy:y(f.value),r:6,fill:'#a5b4fc',stroke:'#101a2a','stroke-width':2}));
    [0,Math.floor((frames.length-1)/2),frames.length-1].filter(function(v,i,a){return a.indexOf(v)===i;}).forEach(function(i){svg.appendChild(svgNode('text',{x:x(i),y:241,'text-anchor':'middle',fill:'#aabbd2','font-size':14},c.model==='spectrum'?String(i):String(i+1)));});
    svg.appendChild(svgNode('text',{x:393,y:263,'text-anchor':'middle',fill:'#c6d4e9','font-size':14},c.xLabel));host.appendChild(svg);
  }
  function scene(host, frame, c) {
    host.replaceChildren(); var s=frame.state;
    if(c.model==='pacer'){host.appendChild(U.el('div','wl-event wl-event-'+frame.kind,frame.kind==='pulse'?'● 虚拟刺激':frame.kind==='sense'?'◉ 感知自身事件':frame.kind==='commit'?'▣ 配置事务':'○ 等待中'));host.appendChild(U.el('p','','这是离散事件示意，不是心电图。一个高点不代表真实脉冲形状。'));}
    else if(c.model==='radiation') {Object.keys(s).forEach(function(key){var value=String(s[key]);if(/^[01]{4,7}$/.test(value)){var row=U.el('div','wl-bit-row');row.appendChild(U.el('span','wl-bit-label',key));value.split('').forEach(function(b,i){var bit=U.el('span','wl-bit '+(b==='1'?'one':''),b);bit.title='位置 '+(i+1);row.appendChild(bit);});host.appendChild(row);}});}
    else if(c.model==='archive'){host.appendChild(U.el('p','wl-scene-title','字节档案 → 指令表 → 累加器 → 输出'));var row=U.el('div','wl-bit-row');[1,2,1,c.defaults.flipped?2:3,2,0].forEach(function(b,i){var cell=U.el('span','wl-bit'+(s.pc!==undefined&&i===s.pc?' one':''),String(b));cell.title='字节位置 '+i;row.appendChild(cell);});host.appendChild(row);host.appendChild(U.el('p','','1 加下一操作数 · 2 输出 · 0 停止；当前下一位置见 pc。'));}
    else if(c.model==='mission'){host.appendChild(U.el('div','wl-event',s.action+' · '+(s.usable?'数据满足本模型约束':'单位或年龄不合格')));}
    else {host.appendChild(U.el('p','wl-scene-title',flows[c.model].join(' → ')));}
  }
  function mount(host,c) {
    var root=U.el('section','world-lab'); root.dataset.model=c.model;host.appendChild(root);
    var intro=U.el('div','wl-intro');intro.appendChild(U.el('span','wl-kicker','VIRTUAL FIELD NOTES · 网页虚拟实验'));intro.appendChild(U.el('h3','',c.title));intro.appendChild(U.el('p','','调整参数，在下方原位观察图形与源码。数据完全在网页计算；“下一步”回放实际函数记录的语义检查点。'));root.appendChild(intro);
    var form=U.el('form','wl-settings'), fields={};
    c.fields.forEach(function(f){var label=U.el('label','wl-field');label.appendChild(U.el('span','',f.label));var input;
      if(f.hint==='boolean'){input=U.el('select','');[['true','开启'],['false','关闭']].forEach(function(pair){var option=U.el('option','',pair[1]);option.value=pair[0];input.appendChild(option);});input.value=String(c.defaults[f.key]);}
      else{input=U.el('input','');input.type='number';input.step='any';input.value=String(c.defaults[f.key]);input.required=true;}
      input.dataset.param=f.key;label.appendChild(input);label.appendChild(U.el('small','',f.hint==='boolean'?'比较开启与关闭的因果差异':f.hint));fields[f.key]=input;form.appendChild(label);
    });
    var apply=U.el('button','wl-apply','应用参数并重新计算');apply.type='submit';form.appendChild(apply);root.appendChild(form);
    var error=U.el('p','wl-message');error.setAttribute('role','status');root.appendChild(error);
    var controls=U.el('div','wl-controls');root.appendChild(controls);
    var prev=U.button('上一步',function(){stop();index--;render();}),play=U.button('自动播放',function(){if(timer){stop();return;}if(index>=result.frames.length-1)index=0;timer=window.setInterval(function(){if(index>=result.frames.length-1){stop();return;}index++;render();},700);play.textContent='暂停播放';render();}),next=U.button('下一步',function(){stop();index++;render();}),start=U.button('回到首帧',function(){stop();index=0;render();});
    [prev,play,next,start].forEach(function(b){controls.appendChild(b);});
    var progressLabel=U.el('label','wl-progress');progressLabel.appendChild(U.el('span','','检查点进度'));var progress=U.el('input','');progress.type='range';progress.min=0;progress.step=1;progressLabel.appendChild(progress);var counter=U.el('output','');progressLabel.appendChild(counter);root.appendChild(progressLabel);
    var legendText=c.model==='boot'?'亮色边框：本次选择的运行路径与阶段；两条路径都由处理器执行。':c.model==='calendar'?'蓝色边框：当前检查阶段；年份差与位宽分别呈现。':c.model==='overflow'?'范围条：可表示区间；圆点：截断后的值，越界时停在边缘。':'青色：'+c.actual+(c.reference==='无'?'':' · 黄色：'+c.reference)+'。';
    var viz=U.el('div','wl-viz'),legend=U.el('p','wl-legend',legendText+'窄屏可左右滑动图形。');viz.tabIndex=0;viz.setAttribute('role','region');viz.setAttribute('aria-label','可横向滚动的实验图形');root.appendChild(viz);root.appendChild(legend);
    var sceneHost=U.el('div','wl-scene');root.appendChild(sceneHost);
    var note=U.el('p','wl-note');note.setAttribute('aria-live','polite');root.appendChild(note);
    var panels=U.el('div','wl-panels'),state=U.el('dl','wl-stats');var stateBox=U.el('section','wl-state-box');stateBox.appendChild(U.el('h4','','当前状态'));stateBox.appendChild(state);panels.appendChild(stateBox);
    var codeBox=U.el('section','wl-code-box'),codeTitle=U.el('h4','','对应源码'),codeView=U.el('div','wl-code');codeBox.appendChild(codeTitle);codeBox.appendChild(codeView);panels.appendChild(codeBox);root.appendChild(panels);
    var summaryDetails=U.el('details','wl-details');summaryDetails.appendChild(U.el('summary','','全程计算摘要 · 可与正文运行结果核对'));var summary=U.el('dl','wl-stats');summaryDetails.appendChild(summary);root.appendChild(summaryDetails);
    var inputDetails=U.el('details','wl-details');inputDetails.appendChild(U.el('summary','','本次参数 · 与正文 scenario 的对应关系'));inputDetails.appendChild(U.el('p','','将下面对象替换正文程序的 scenario，再运行，会得到相同摘要。修改程序规则后，请按新规则解释结果。'));var inputCode=U.el('pre','wl-input-code');inputDetails.appendChild(inputCode);root.appendChild(inputDetails);
    var result,index=0,timer=null,dirty=false,activeInput,lines=models[c.model].toString().split('\n');
    function stop(){if(timer)window.clearInterval(timer);timer=null;play.textContent='自动播放';}
    function render(){if(!result)return;index=Math.max(0,Math.min(result.frames.length-1,index));var frame=result.frames[index];progress.max=result.frames.length-1;progress.value=index;counter.textContent=(index+1)+' / '+result.frames.length;prev.disabled=dirty||index===0;next.disabled=dirty||index===result.frames.length-1;play.disabled=dirty;start.disabled=dirty;progress.disabled=dirty;
      chart(viz,result.frames,index,c);scene(sceneHost,frame,Object.assign({},c,{defaults:activeInput}));note.textContent=frame.note;state.replaceChildren();Object.keys(frame.state).forEach(function(key){card(state,key,frame.state[key]);});
      var line=lines.findIndex(function(t){return t.includes(frame.at);});codeTitle.textContent='对应源码 · 第 '+(line+1)+' 行（检查点，非逐指令调试器）';codeView.replaceChildren();lines.slice(Math.max(0,line-3),Math.min(lines.length,line+4)).forEach(function(t,offset){var number=Math.max(0,line-3)+offset;var row=U.el('div','wl-code-line'+(number===line?' active':''));var n=U.el('span','wl-line-number',String(number+1)),text=U.el('span','wl-source');text.innerHTML=window.HL(t,'javascript');row.appendChild(n);row.appendChild(text);codeView.appendChild(row);});
      codeView.dataset.line=line+1;
    }
    function compute(){stop();try{var input={};c.fields.forEach(function(f){var v=fields[f.key].value;if(f.hint==='boolean')input[f.key]=v==='true';else{if(v.trim()===''||!Number.isFinite(Number(v)))throw Error(f.label+'：请输入有限数值。');input[f.key]=Number(v);}});var computed=models[c.model](input);result=computed;activeInput=input;dirty=false;index=0;error.textContent='已按当前参数重新计算。下方回放 '+result.frames.length+' 个检查点；全程摘要可展开核对。';error.classList.remove('invalid');summary.replaceChildren();Object.keys(result.summary).forEach(function(key){card(summary,key,result.summary[key]);});inputCode.textContent=JSON.stringify(input,null,2);render();}catch(e){dirty=true;error.textContent=e.message+' 请修正后重新计算；下方保留上一次有效结果。';error.classList.add('invalid');render();}}
    form.addEventListener('submit',function(e){e.preventDefault();compute();});form.addEventListener('input',function(){stop();dirty=true;error.textContent='参数已修改，点击“应用参数并重新计算”更新下方结果。';render();});
    progress.addEventListener('input',function(){stop();index=Number(progress.value);render();});compute();return stop;
  }
  window.HUB_WORLD_CATALOG.forEach(function(c){var name='world-'+c.model;window.DEMOS[name]={title:c.title,subtitle:'网页图形实验 · 可调参数 · 源码检查点',icon:'spark',mount:function(host){return mount(host,c);}};window.HUB_DEMO_SYSTEM.guides[name]=[c.task,'先改一项参数并重新计算，再用“下一步”核对图形、当前状态和高亮源码。正文程序与本实验调用同一函数。'];});
})();
