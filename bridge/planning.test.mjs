import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {validatePlan} from './planning.mjs';
import {parseScene,compile,html} from './scene.mjs';
const example=new URL('../examples/clarification-home/',import.meta.url);
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
function partial(){const f=fixture();f.p.delivery='partial';f.p.omissionReason='等待文档入口规则，仅先展示标题、状态及范围。';f.p.includedRequirementIds=f.p.includedRequirementIds.filter(id=>id!=='R003');f.p.expressions=f.p.expressions.filter(e=>e.requirementId!=='R003');f.s.pages[0].widgets=f.s.pages[0].widgets.filter(w=>w.key!=='print-document');f.s.pages[0].notes=f.s.pages[0].notes.filter(n=>n.key!=='document');f.m.questions[0].status='open';delete f.m.questions[0].answer;delete f.m.questions[0].answerSourceId;return f;}
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
