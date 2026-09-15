import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {validatePlan} from './planning.mjs';
import {parseScene,compile,html} from './scene.mjs';
const example=new URL('../examples/test-fixtures/clarification-home/',import.meta.url);
const read=async name=>JSON.parse(await readFile(new URL(name,example),'utf8'));
const originals=await Promise.all(['requirements-model.json','page-plan.json','scene.json'].map(read));
function fixture(){const [m,p,s]=structuredClone(originals);return {m,p,s:parseScene(s)};}
const run=f=>validatePlan(f.m,f.p,f.s);
const reject=(f,pattern)=>{const result=run(f);assert.equal(result.ok,false,JSON.stringify(result));assert.match(result.errors.join('\n'),pattern);};
test('complete answered example passes with provenance hashes',()=>{const r=run(fixture());assert.equal(r.ok,true);assert.equal(r.semanticReview,'required');assert.match(r.hashes.scene,/^[a-f0-9]{64}$/);});
test('upstream plan can be checked before scene exists',()=>{const f=fixture();assert.equal(validatePlan(f.m,f.p).stage,'plan-checked');});
test('blocking open question stops complete output',()=>{const f=fixture();Object.assign(f.m.questions[0],{status:'open'});delete f.m.questions[0].answer;delete f.m.questions[0].answerSourceId;reject(f,/Blocking question unresolved/);});
test('deferred is not answered',()=>{const f=fixture();Object.assign(f.m.questions[0],{status:'deferred',reason:'等待用户回复'});delete f.m.questions[0].answer;delete f.m.questions[0].answerSourceId;reject(f,/Blocking question unresolved/);});
test('recommendation cannot serve as sourced answer',()=>{const f=fixture();f.m.questions[0].answerSourceId='none';reject(f,/Answer lacks/);});
test('unread or reference answers are rejected',()=>{for(const change of [{read:false},{kind:'reference'}]){const f=fixture();Object.assign(f.m.sources[1],change);reject(f,/Answer lacks/);}});
test('reference material cannot silently become confirmed',()=>{const f=fixture();f.m.sources[0].kind='reference';reject(f,/Confirmed requirement lacks/);});
test('duplicates and unknown sources fail',()=>{const f=fixture();f.m.requirements.push(structuredClone(f.m.requirements[0]));f.m.requirements[0].sourceIds=['missing'];reject(f,/Duplicate requirement id/);reject(f,/Unknown source/);});
test('unknown affected requirement fails',()=>{const f=fixture();f.m.questions[0].affectedRequirementIds=['R999'];reject(f,/Unknown affected/);});
test('confirmed scope omissions cannot be called complete',()=>{const f=fixture();f.p.includedRequirementIds.pop();f.p.expressions.pop();reject(f,/Uncovered in-scope/);});
test('unconfirmed requirements cannot be rendered as rules',()=>{for(const status of ['reference','unresolved']){const f=fixture();f.m.requirements[2].status=status;reject(f,/Unconfirmed requirement included/);}});
test('assumptions must be disclosed in scene',()=>{const f=fixture();f.m.requirements[1].status='assumption';reject(f,/Assumption not disclosed/);f.s.assumptions.push(f.m.requirements[1].statement);assert.equal(run(f).ok,true);});
test('out-of-scope included requirement fails',()=>{const f=fixture();f.m.requirements[0].inScope=false;reject(f,/Out-of-scope/);});
test('unmapped extra button and notes fail',()=>{const f=fixture();f.s.pages[0].widgets.push({...f.s.pages[0].widgets[4],key:'subscribe'});f.s.pages[0].notes.push({key:'upsell',title:'订阅',lines:['购买']});reject(f,/Unmapped scene widget/);reject(f,/Unmapped scene note/);});
test('unplanned downstream page fails',()=>{const f=fixture();f.s.pages.push({...structuredClone(f.s.pages[0]),key:'files',name:'Files'});reject(f,/Unplanned scene page/);});
test('missing controls, notes and mismatched pages fail',()=>{const f=fixture();f.p.expressions[2].widgetKeys=['missing'];f.p.expressions[2].noteKeys=['missing'];f.p.pages[0].name='Other';reject(f,/Missing scene widget/);reject(f,/Missing scene note/);reject(f,/Planned page missing/);});
test('a requirement cannot disappear from expressions',()=>{const f=fixture();f.p.expressions.pop();reject(f,/No expression for requirement/);});
test('note-only cannot smuggle in a control',()=>{const f=fixture();f.p.expressions[2].method='note-only';reject(f,/note-only cannot create/);});
test('exact copy catches punctuation, whitespace and newline changes',()=>{for(const suffix of [' ','。','\n']){const f=fixture();f.s.pages[0].widgets[4].text+=suffix;reject(f,/Exact copy mismatch/);}});
test('exact note copy checks the particular target line',()=>{const f=fixture();f.s.pages[0].notes[2].lines[0]='1、先连接打印机。';reject(f,/Exact copy mismatch/);});
test('wrong profile and frame size fail',()=>{const f=fixture();f.s.noteProfile='default';reject(f,/noteProfile/);f.s.noteProfile='android-review';f.s.pages[0].widgets[0].width=390;reject(f,/Review frame/);});
test('android profile changes compiled text styles and preserves keys',()=>{const f=fixture(),pages=compile(f.s),items=pages[0].items;const title=items.find(w=>w.key==='note-document-title'),body=items.find(w=>w.key==='note-document-body');assert.equal(title.patch.fontSize,10.5);assert.equal(body.patch.fontSize,9);assert.equal(body.patch.fontFamily,'Arial');assert.equal(body.patch.textColor,'#333333');assert.ok(html(f.s,pages).includes('font-size:9pt'));f.s.noteProfile='default';assert.deepEqual(items.map(w=>w.key),compile(f.s)[0].items.map(w=>w.key));});
test('house review is the cross-product alias and allows long 360px boards',()=>{const f=fixture();f.p.template.profile='house-review';f.s.noteProfile='house-review';f.s.pages[0].widgets[0].height=724;const result=validatePlan(f.m,f.p,f.s),items=compile(f.s)[0].items;assert.equal(result.ok,true);assert.equal(items.find(w=>w.key==='note-document-title').patch.fontSize,10.5);assert.equal(items.find(w=>w.key==='note-document-body').patch.fontFamily,'Arial');});
test('house review requires one aligned numbered marker pair per note',()=>{const f=fixture();f.p.decorations=f.p.decorations.filter(d=>!['marker-4-ring','marker-4-text'].includes(d.widgetKey));f.s.pages[0].widgets=f.s.pages[0].widgets.filter(w=>!['marker-4-ring','marker-4-text'].includes(w.key));reject(f,/numbered marker pair/);const g=fixture();g.s.pages[0].widgets.find(w=>w.key==='marker-4-ring').y+=8;reject(g,/Numbered marker not aligned/);});
function qualityFixture(){
 const f=fixture();f.m.version=2;f.p.version=2;f.s.version=2;
 f.m.context={productKey:'quality-check',platform:'android',taskType:'single-page',decisionMode:'source-led',inputCompleteness:'detailed'};
 f.m.sources.push({id:'house-pattern',kind:'reference',locator:'skills/prototype-requirement-writer/references/rp-pattern-library.md#Home',read:true});
 const meta=[['display','low',false],['state','low',false],['navigation','medium',false],['display','low',false]];
 f.m.requirements.forEach((r,i)=>Object.assign(r,{ruleState:'current',ruleType:i===2?'behavior':'display',category:meta[i][0],criticality:meta[i][1],visualChange:meta[i][2]}));
 f.p.referenceSelections=[{pageKey:'home',primarySourceId:'house-pattern',pattern:'Home / 主任务入口',borrowedAspects:['module-density','control-patterns','requirement-structure'],reason:'使用脱敏页面模式核对结构、控件和说明颗粒度。',prohibitedInheritances:['业务文案、设备规则和按钮结果']}];
 Object.assign(f.p.pages[0],{pageType:'screen'});Object.assign(f.p.pages[0].boards[0],{stateType:'primary'});
 f.s.pages[0].widgets.find(w=>w.key==='app-title').componentRole='app-bar';
 f.s.pages[0].widgets.find(w=>w.key==='device-status').componentRole='feedback';
 f.s.pages[0].widgets.find(w=>w.key==='print-document').componentRole='button';
 f.s.pages[0].widgets.splice(4,0,{key:'status-icon',shape:'Ellipse',componentRole:'icon',text:'!',x:310,y:164,width:24,height:24,fontFamily:'Arial',fontSize:10,textColor:'#FFFFFF',fill:'#3758CC',borderColor:'#3758CC',borderWidth:1,cornerRadius:0});
 f.p.expressions[1].widgetKeys.push('status-icon');
 const coverage={purpose:{requirementIds:['R001'],aspects:['purpose','display']},connection:{requirementIds:['R002'],aspects:['purpose','display']},document:{requirementIds:['R003'],aspects:['entry','trigger','result','cancel-return']},scope:{requirementIds:['R004'],aspects:['purpose','display']}};
 for(const n of f.s.pages[0].notes)n.coverage=coverage[n.key];
 return f;
}
test('version 2 quality-gated reference-driven page passes',()=>{const r=run(qualityFixture());assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.warnings.some(w=>w.includes('Legacy v1')),false);});
test('version 2 requires an actual per-page reference',()=>{const f=qualityFixture();f.p.referenceSelections=[];reject(f,/Missing page reference selection/);const g=qualityFixture();g.m.sources.find(s=>s.id==='house-pattern').locator='examples/test-fixtures/legacy/scene.json';reject(g,/Test fixture cannot/);});
test('direct RP replica requires page-level read, render and fidelity evidence',()=>{const f=qualityFixture();const source=f.m.sources.find(s=>s.id==='house-pattern');source.locator='C:/authorized/reference.rp';Object.assign(f.p.referenceSelections[0],{mode:'direct-rp-replica',replicaDimensions:['layout-topology','module-density','state-boards','control-composition'],evidence:{sourcePage:'主页',widgetsRead:true,nativeRendered:true}});assert.equal(run(f).ok,true);const g=structuredClone(f);g.p.referenceSelections[0].evidence.nativeRendered=false;reject(g,/read and native-render evidence/);const h=structuredClone(f);h.p.referenceSelections[0].replicaDimensions=['layout-topology','module-density','state-boards'];assert.throws(()=>run(h));});
test('version 2 blocks assumption overload and high-consequence assumptions',()=>{const f=qualityFixture();Object.assign(f.m.context,{taskType:'full-product',inputCompleteness:'minimal'});for(const r of f.m.requirements.slice(1))r.status='assumption';f.m.requirements.push({...structuredClone(f.m.requirements[3]),id:'R005',status:'assumption',statement:'新增低风险展示假设。'});f.p.includedRequirementIds.push('R005');f.p.expressions.push({...structuredClone(f.p.expressions[3]),requirementId:'R005'});const r=validatePlan(f.m,f.p);assert.equal(r.ok,false);assert.match(r.errors.join('\n'),/Assumption overload/);const g=qualityFixture();Object.assign(g.m.requirements[2],{status:'assumption',criticality:'high'});g.s.assumptions.push(g.m.requirements[2].statement);reject(g,/High-consequence requirement cannot/);});
test('version 2 enforces note behavior coverage and semantic component roles',()=>{const f=qualityFixture();f.s.pages[0].notes.find(n=>n.key==='document').coverage.aspects=['entry','result'];reject(f,/lacks trigger/);const g=qualityFixture();delete g.s.pages[0].widgets.find(w=>w.key==='status-icon').componentRole;reject(g,/lacks componentRole/);const h=qualityFixture();h.s.pages[0].widgets.find(w=>w.key==='status-icon').componentRole='feedback';reject(h,/at least four semantic component roles/);});
test('version 2 requires visual material changes to be drawn',()=>{const f=qualityFixture();f.m.requirements[2].visualChange=true;reject(f,/requires static-board/);});
function frameworkScreenshotFixture(stage='final'){
 const f=qualityFixture();
 f.m.context.workflowProfile='framework-screenshot';
 f.m.sources.push(
  {id:'product-framework',kind:'user',inputRole:'product-framework',locator:'inputs/product-framework.png',read:true},
  {id:'competitor-home',kind:'reference',inputRole:'competitor-screenshot',locator:'inputs/competitor-home.png',read:true},
  {id:'page-inventory-approved',kind:'user',inputRole:'page-inventory-approval',locator:'request.md#页面清单确认',read:true},
  {id:'page-visual-approved',kind:'user',inputRole:'page-visual-approval',locator:'request.md#页面画面确认',read:true}
 );
 f.p.stage=stage;
 f.p.gates={pageInventory:{status:'approved',sourceId:'page-inventory-approved'},pageVisual:stage==='final'?{status:'approved',sourceId:'page-visual-approved'}:{status:'pending'}};
 f.p.pages[0].frameworkSourceIds=['product-framework'];
 f.p.referenceSelections=[{pageKey:'home',primarySourceId:'competitor-home',pattern:'竞品 Home 低保真抽象',mode:'competitor-abstraction',borrowedAspects:['information-architecture','module-density','control-patterns'],abstraction:{pageType:'Home',primaryTask:'开始主要任务',layoutTopology:['顶部标题、主任务区、内容区、底部导航'],modules:['主任务入口','当前内容','辅助入口'],controlPatterns:['主按钮','内容卡片','底部导航'],stateExpressions:['默认状态'],lowFidelity:true},reason:'截图与当前页面类型和主任务匹配。',prohibitedInheritances:['品牌、文案、价格、权限、广告和业务结果']}];
 if(stage==='page-design'){
  f.s.stage='page-design';
  f.s.pages[0].notes=[];
  f.p.decorations=f.p.decorations.filter(d=>d.role!=='number-marker');
  f.s.pages[0].widgets=f.s.pages[0].widgets.filter(w=>!w.key.startsWith('marker-'));
  for(const e of f.p.expressions){e.noteKeys=[];e.method=e.widgetKeys.length?'widget-only':'deferred-note';}
 }
 return f;
}
test('framework-screenshot page-design requires inputs and inventory approval but no notes',()=>{const f=frameworkScreenshotFixture('page-design'),r=run(f);assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.workflowStage,'page-design');assert.equal(f.s.pages[0].notes.length,0);});
test('framework-screenshot rejects missing framework, screenshot abstraction and approval',()=>{const f=frameworkScreenshotFixture('page-design');f.m.sources.find(s=>s.id==='product-framework').read=false;f.m.sources.find(s=>s.id==='competitor-home').inputRole='team-rp-template';f.p.gates.pageInventory={status:'pending'};delete f.p.referenceSelections[0].abstraction;const r=run(f);assert.equal(r.ok,false);assert.match(r.errors.join('\n'),/product framework source/);assert.match(r.errors.join('\n'),/competitor screenshot source/);assert.match(r.errors.join('\n'),/Page inventory approval/);assert.match(r.errors.join('\n'),/low-fidelity abstraction/);});
test('framework-screenshot final stage is blocked until the page visual is approved',()=>{const f=frameworkScreenshotFixture('final');assert.equal(run(f).ok,true);f.p.gates.pageVisual={status:'pending'};reject(f,/Page visual approval is required before final/);});
test('page-design cannot contain requirement notes and final cannot defer notes',()=>{const f=frameworkScreenshotFixture('page-design');f.s.pages[0].notes.push(structuredClone(qualityFixture().s.pages[0].notes[0]));reject(f,/cannot contain requirement notes/);const g=frameworkScreenshotFixture('final');g.p.expressions[3]={...g.p.expressions[3],method:'deferred-note',widgetKeys:[],noteKeys:[]};reject(g,/deferred-note is only valid/);});
function partial(){const f=fixture();f.p.delivery='partial';f.p.omissionReason='等待文档入口规则，仅先展示标题、状态及范围。';f.p.includedRequirementIds=f.p.includedRequirementIds.filter(id=>id!=='R003');f.p.expressions=f.p.expressions.filter(e=>e.requirementId!=='R003');f.p.decorations=f.p.decorations.filter(d=>!['marker-3-ring','marker-3-text'].includes(d.widgetKey));f.s.pages[0].widgets=f.s.pages[0].widgets.filter(w=>!['print-document','marker-3-ring','marker-3-text'].includes(w.key));f.s.pages[0].notes=f.s.pages[0].notes.filter(n=>n.key!=='document');f.m.questions[0].status='open';delete f.m.questions[0].answer;delete f.m.questions[0].answerSourceId;return f;}
test('explicit partial plan can proceed outside blocked requirement',()=>{const r=run(partial());assert.equal(r.ok,true);assert.deepEqual(r.omitted,['R003']);assert.ok(r.warnings.length);});
test('partial requires explanation and cannot bypass global question',()=>{const f=partial();delete f.p.omissionReason;reject(f,/omissionReason/);f.p.omissionReason='待确认';f.m.questions[0].affectedRequirementIds=[];reject(f,/Blocking question unresolved/);});
test('unknown fields and malformed targets fail schema validation',()=>{const f=fixture();f.m.requirements[0].madeUp=true;assert.throws(()=>run(f));delete f.m.requirements[0].madeUp;f.m.requirements[0].exactCopies[0].target.field='script';assert.throws(()=>run(f));});
test('workflow refuses unanswered apply before touching session or generating HTML',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'axure-plan-test-'));
 try{
  const f=fixture();f.m.questions[0].status='open';delete f.m.questions[0].answer;delete f.m.questions[0].answerSourceId;
  for(const [name,value]of [['requirements-model.json',f.m],['page-plan.json',f.p],['scene.json',f.s]])await writeFile(join(dir,name),JSON.stringify(value));
  const out=join(dir,'output'),script=fileURLToPath(new URL('workflow.mjs',import.meta.url));
  const r=spawnSync(process.execPath,[script,'apply','--spec',join(dir,'scene.json'),'--out',out,'--session',join(dir,'nonexistent-session.json'),'--project',join(dir,'nonexistent.rp')],{encoding:'utf8'});
  assert.notEqual(r.status,0);assert.match(r.stderr,/Planning blocked before Axure connection/);
  const report=JSON.parse(await readFile(join(out,'verification.json'),'utf8'));assert.equal(report.stage,'planning-blocked');assert.equal(report.saved,false);
  await assert.rejects(access(join(out,'prototype.html')));await assert.rejects(access(join(out,'axure-map.json')));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('workflow rejects one missing planning file and explicit missing pair',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'axure-plan-test-'));
 try{
  const f=fixture();await writeFile(join(dir,'scene.json'),JSON.stringify(f.s));
  const script=fileURLToPath(new URL('workflow.mjs',import.meta.url)),args=[script,'preview','--spec',join(dir,'scene.json'),'--out',join(dir,'out')];
  let r=spawnSync(process.execPath,[...args,'--model',join(dir,'missing.json'),'--plan',join(dir,'also-missing.json')],{encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/Both requirements-model/);
  await writeFile(join(dir,'requirements-model.json'),JSON.stringify(f.m));r=spawnSync(process.execPath,args,{encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/Both requirements-model/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
