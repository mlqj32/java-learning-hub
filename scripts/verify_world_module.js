/* Domain assertions, counterexamples, and canonical source/runner consistency. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={console,setTimeout,clearTimeout,setInterval,clearInterval};ctx.window=ctx;vm.createContext(ctx);
for(const match of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"?]+)/g))if(!match[1].endsWith('/app.js'))vm.runInContext(fs.readFileSync(path.join(root,match[1]),'utf8'),ctx,{filename:match[1]});
const catalog=ctx.HUB_WORLD_CATALOG,models=ctx.HUB_WORLD_MODELS;
const defaults=Object.fromEntries(catalog.map(c=>[c.model,c.defaults]));
let checks=0;function run(key,patch={}){checks++;return models[key]({...defaults[key],...patch});}function summary(k,p){return run(k,p).summary;}
function near(a,b,tol=1e-8){assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);}
const chapters=ctx.CONTENT.world.chapters;assert.equal(chapters.length,14);assert.equal(catalog.length,15);
let frames=0,chars=chapters.reduce((n,c)=>n+c.content.length,0);
for(const c of catalog){
 const chapter=chapters.find(x=>x.id===(c.chapterId||c.id)),result=run(c.model),source=models[c.model].toString();
 assert.ok(chapter.content.includes(source),c.id+': lesson must contain exact model source');
 assert.ok(chapter.practice.answer && chapter.content.length>2500,c.id+': depth and exercise');
 assert.ok(ctx.DEMOS['world-'+c.model] && ctx.HUB_DEMO_SYSTEM.guides['world-'+c.model],c.id);
 assert.match(chapter.content,/## 自测|## 最后一个自测/);assert.match(chapter.content,/https:\/\//);
 assert.equal(ctx.MD.render(chapter.content).toc.filter(x=>x.level===2).length,(chapter.content.match(/^## /gm)||[]).length,c.id+': headings must render, including on Windows');
 const code=Array.from(chapter.content.matchAll(/```javascript\n([\s\S]*?)```/g),m=>m[1]).find(code=>code.includes(source));
 assert.ok(code,c.id+': matching standalone code');
 assert.deepEqual(JSON.parse(JSON.stringify(ctx.HUB_RUNTIME_OPTIONS.inspect(code,'javascript'))),{stdin:false,args:false,main:false},c.id+': no unused input fields');
 let output='';new Function('console','input','args',code)({log:s=>output+=s},'',[]);
 assert.deepEqual(JSON.parse(output),JSON.parse(JSON.stringify(result.summary)),c.id+': runner output and chart use same computation');
 assert.ok(result.frames.length>0);
 for(const f of result.frames){frames++;assert.ok(source.split('\n').some(line=>line.includes(f.at)),c.id+': unmapped checkpoint '+f.at);assert.ok(f.note&&Object.keys(f.state).length);assert.ok(Number.isFinite(f.value));if(f.reference!==undefined)assert.ok(Number.isFinite(f.reference));}
}
for(const rtos of [false,true]) for(const interrupts of [false,true]) for(const validImage of [false,true]) for(let ticks=1;ticks<=6;ticks++){
 const result=run('boot',{rtos,interrupts,validImage,ticks}),s=result.summary;
 assert.equal(s.booted,validImage);assert.equal(s.ramReady,validImage);assert.equal(s.samples,validImage?ticks:0);
 assert.equal(s.servicedEvents,validImage&&interrupts&&ticks>=2?1:0);assert.equal(s.pendingEvent,validImage&&!interrupts&&ticks>=2);
 assert.equal(s.outputRegister,validImage&&ticks>=3?1:0);
 assert.equal(s.mode,rtos?'RTOS':'bare-metal');
 if(validImage) assert.ok(result.frames.findIndex(f=>f.state.stage==='启动例程')<result.frames.findIndex(f=>f.state.stage==='采样'));
 else assert.deepEqual(Array.from(result.frames,f=>f.state.stage),['复位入口','镜像拒绝']);
}
assert.equal(summary('pacer').pulses,3);assert.equal(summary('pacer',{sensing:false}).pulses,6);assert.equal(summary('pacer',{interval:1}).accepted,false);assert.equal(summary('pacer',{confirmed:false}).interval,6);
assert.equal(summary('interlock').unsafeStarts,0);assert.equal(summary('interlock').blocked,1);assert.equal(summary('interlock',{protected:false}).unsafeStarts,1);
assert.equal(summary('calendar').naive,-99);assert.equal(summary('calendar').correct,1);assert.equal(summary('calendar').wrapped,-2147483648);assert.equal(summary('calendar',{bits:8}).wrapped,-128);assert.equal(summary('calendar',{start:2001,end:2002}).naive,1);
for(const [value,inRange] of [[32767,true],[32768,false],[-32768,true],[-32769,false]])assert.equal(summary('overflow',{value}).inRange,inRange);
assert.equal(summary('overflow').commonModeFailure,true);assert.equal(summary('overflow',{sameBackup:false}).commonModeFailure,false);
near(summary('units').positionErrorMetres,689.6443230521);near(summary('units',{mass:1000}).positionErrorMetres,summary('units').positionErrorMetres/2);near(summary('units',{coast:20000}).positionErrorMetres,summary('units').positionErrorMetres*2);near(summary('units',{impulse:0}).positionErrorMetres,0);
near(summary('clock').driftSeconds,0.343322753926234,1e-7);near(summary('clock',{hours:10}).driftSeconds,summary('clock').driftSeconds/10);assert.equal(summary('clock',{hours:0}).driftSeconds,0);
assert.equal(summary('scheduler').guidanceExecuted,true);assert.equal(summary('scheduler',{priority:false}).guidanceExecuted,false);assert.equal(summary('scheduler',{priority:false,extra:0}).guidanceExecuted,true);
assert.equal(summary('link').executions,1);assert.equal(summary('link',{deduplicate:false}).executions,2);assert.equal(summary('link',{wait:30}).retrySent,false);near(summary('link').roundTripSeconds,2*225000000/299792.458);
for(const flips of [0,1])assert.equal(summary('radiation',{flips}).matches,true);assert.equal(summary('radiation',{flips:1,protected:false}).matches,false);assert.equal(summary('radiation',{flips:2}).matches,false);assert.equal(summary('radiation',{flips:2}).syndrome,6);assert.equal(summary('radiation',{flips:2}).guaranteed,false);
near(summary('transit').depth,0.01);near(summary('transit',{ratio:0.05}).depth,0.0025);near(summary('transit').illustrativePosterior,90/189);near(summary('transit',{baseRate:0.001}).illustrativePosterior,9/108.9);
assert.equal(summary('spectrum').peak,5);assert.equal(summary('spectrum',{noise:2}).peak,11);assert.deepEqual(JSON.parse(JSON.stringify(run('spectrum').frames)),JSON.parse(JSON.stringify(run('spectrum',{terrestrial:false}).frames)));assert.equal(summary('spectrum',{terrestrial:false}).evidenceOfAliens,false);
assert.equal(summary('archive').outputs[0],5);assert.equal(summary('archive',{flipped:true}).outputs[0],4);assert.equal(summary('archive',{specification:false}).bytesSurvive,true);assert.equal(summary('archive',{specification:false}).interpretableInModel,false);
assert.equal(summary('mission').holds,1);assert.equal(summary('mission').unsafeStaleMoves,0);assert.equal(summary('mission',{freshness:false}).unsafeStaleMoves,1);assert.equal(summary('mission',{validUnit:false}).holds,2);
for(const c of catalog)for(const f of c.fields){
 if(f.hint==='boolean'){assert.throws(()=>run(c.model,{[f.key]:'false'}),c.model+': strict boolean');continue;}
 for(const value of [NaN,Infinity,-Infinity])assert.throws(()=>run(c.model,{[f.key]:value}),c.model+': finite '+f.key);
}
for(const [key,patch] of [['control',{delay:1.5}],['calendar',{bits:16}],['pacer',{interval:0}],['radiation',{flips:3}],['clock',{fractionBits:7}],['transit',{baseRate:0}],['spectrum',{bin:15}],['mission',{maxAge:0}]])assert.throws(()=>run(key,patch));
const report={chapters:chapters.length,canonicalRunnablePrograms:catalog.length,labs:catalog.length,checkpoints:frames,domainCalls:checks,contentCharacters:chars,assertions:'Domain outputs, boundaries, counterexamples, strict inputs, boot variants, code/lab consistency and no unused runner controls passed.'};
console.log(JSON.stringify(report,null,2));if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2));
