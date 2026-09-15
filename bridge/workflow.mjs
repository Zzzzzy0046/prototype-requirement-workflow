import {readFile,writeFile,mkdir,rename,access} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {parseScene,compile,html,requirements} from './scene.mjs';
import {validatePlan} from './planning.mjs';
import {beginRun,traceability} from './history.mjs';
const [mode,...args]=process.argv.slice(2),opts={};
if(!['preview','apply'].includes(mode))throw Error('Usage: workflow.mjs preview|apply --spec <scene.json> --out <directory> [--session <session.json> --project <file.rp>]');
for(let i=0;i<args.length;i+=2){if(!['--spec','--out','--session','--project','--model','--plan'].includes(args[i])||!args[i+1]||opts[args[i]])throw Error('Invalid arguments');opts[args[i]]=args[i+1];}
if(!opts['--spec']||!opts['--out'])throw Error('--spec and --out required');
const out=resolve(opts['--out']);
await mkdir(out,{recursive:true});
if(resolve(opts['--spec']).toLowerCase()===join(out,'scene.json').toLowerCase())throw Error('Keep the editable source scene outside the generated output directory');
const modelPath=resolve(opts['--model']??join(dirname(resolve(opts['--spec'])),'requirements-model.json'));
const planPath=resolve(opts['--plan']??join(dirname(resolve(opts['--spec'])),'page-plan.json'));
const optionalJson=async path=>{try{return JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code==='ENOENT')return undefined;throw e;}};
const reserved=['planning-check.json','verification.json','scene.json','prototype.html','requirements.md','brief.md','axure-map.json','traceability.json'].map(n=>join(out,n).toLowerCase());
for(const input of [resolve(opts['--spec']),modelPath,planPath])if(reserved.includes(input.toLowerCase()))throw Error('Input path collides with generated output: '+input);
let planning,scene,pages,model,plan;
try{
 scene=parseScene(JSON.parse(await readFile(resolve(opts['--spec']),'utf8')));pages=compile(scene);
 model=await optionalJson(modelPath);plan=await optionalJson(planPath);
 if(model===undefined&&plan===undefined&&!opts['--model']&&!opts['--plan']){
  planning={ok:null,stage:'legacy-unchecked',warnings:['No planning files: technical scene compatibility only; new skill deliveries require a model and plan.']};
 }else{
  if(model===undefined||plan===undefined)throw Error('Both requirements-model.json and page-plan.json are required');
  planning=validatePlan(model,plan,scene);
 }
}catch(e){planning={ok:false,stage:'invalid-input',errors:[e.message]};}
await writeFile(join(out,'planning-check.json'),JSON.stringify(planning,null,2));
const run=await beginRun(out,{mode,model,plan,scene,planning});
try{
if(planning.ok===false){
 await run.finish('planning-blocked',{axureVerified:false});
 await writeFile(join(out,'verification.json'),JSON.stringify({saved:false,axureVerified:false,stage:'planning-blocked',errors:planning.errors},null,2));
 throw Error('Planning blocked before Axure connection: '+planning.errors.join('; '));
}
if(planning.ok!==true)console.error('WARNING: legacy scene without requirement/planning verification');
await writeFile(join(out,'prototype.html'),html(scene,pages));
await writeFile(join(out,'requirements.md'),requirements(scene));
await writeFile(join(out,'traceability.json'),JSON.stringify(traceability(model,plan),null,2));
await writeFile(join(out,'brief.md'),`# ${scene.project}\n\n${scene.brief}\n\n## 假设\n\n${scene.assumptions.map(s=>'- '+s).join('\n')||'无'}\n\n## 本次不做\n\n${scene.outOfScope.map(s=>'- '+s).join('\n')||'无'}\n`);
await writeFile(join(out,'scene.json'),JSON.stringify(scene,null,2));
await writeFile(join(out,'verification.json'),JSON.stringify({saved:false,axureVerified:false,stage:mode==='preview'?'preview-only':'apply-in-progress',planning,generatedAt:new Date().toISOString()},null,2));
if(mode==='preview'){await run.finish('preview-only',{axureVerified:false,pages:pages.length});console.log(JSON.stringify({preview:true,runId:run.runId,pages:pages.length,html:join(out,'prototype.html'),axureWritten:false}));process.exit(0);}
if(!opts['--session']||!opts['--project'])throw Error('apply requires --session and --project');
const project=resolve(opts['--project']),mapFile=join(out,'axure-map.json'),samePath=(a,b)=>resolve(a).toLowerCase()===resolve(b).toLowerCase();
let map;
try{map=JSON.parse(await readFile(mapFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;map={version:1,document:project,pages:{},pending:null};}
if(map.version!==1||!samePath(map.document,project))throw Error('Map belongs to a different project');
if(map.pending)throw Error('Unresolved pending write. Read live state and reconcile map before continuing; do not delete pending blindly.');
const persist=async()=>{const tmp=mapFile+'.tmp';await writeFile(tmp,JSON.stringify(map,null,2));await rename(tmp,mapFile);};
const client=new Client({name:'prototype-requirement-writer',version:'1.0.0'});
const call=async(name,input={})=>{const r=await client.callTool({name,arguments:input});if(r.isError)throw Error(r.content.filter(c=>c.type==='text').map(c=>c.text).join('\n'));return name==='axure_live_render_page'?r:JSON.parse(r.content[0].text);};
const chunks=a=>Array.from({length:Math.ceil(a.length/150)},(_,i)=>a.slice(i*150,(i+1)*150));
async function write(name,input,onResult){map.pending={name,input};await persist();const r=await call(name,input);onResult(r);map.pending=null;await persist();return r;}
function check(actual,patch,label){
 for(const k of ['text','x','y','width','height']){if(typeof patch[k]==='number'?Math.abs(actual[k]-patch[k])>0.1:actual[k]!==patch[k])throw Error(`Readback mismatch ${label}/${k}`);}
}
let writes=0;
try{
 await client.connect(new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./mcp-live.mjs',import.meta.url)),'--session',resolve(opts['--session'])]}));
 const status=await call('axure_live_status');
 if(status.faulted||!['11.0.0.4134','11.0.0.4137','11.0.0.4149'].includes(status.version)||!samePath(status.document,project))throw Error('Unexpected or faulted Axure session');
 const sitemap=await call('axure_live_sitemap');
 // Preflight every existing mapping before any mutation, including removals and concurrent edits.
 for(const [key,prior] of Object.entries(map.pages)){
  const page=pages.find(p=>p.key===key);if(!page||page.name!==prior.name)throw Error('Removing or renaming mapped pages is not supported');
  if(!sitemap.Pages.some(p=>p.Id===prior.pageId&&p.Name===prior.name))throw Error(`Mapped page missing or renamed: ${key}`);
  for(const [wk,w] of Object.entries(prior.widgets)){const next=page.items.find(i=>i.key===wk);if(!next||next.shape!==w.shape)throw Error(`Removing/changing widget type is not supported: ${key}/${wk}`);}
  for(const batch of chunks(Object.entries(prior.widgets))){
   const rows=(await call('axure_live_read_many',{pageId:prior.pageId,widgetIds:batch.map(([,w])=>w.widgetId)})).widgets;
   for(const [wk,w] of batch){const live=rows.find(r=>r.widgetId===w.widgetId);if(!live||live.fingerprint!==w.fingerprint)throw Error(`External edit or undo detected: ${key}/${wk}. Read and reconcile before writing.`);}
  }
 }
 for(const page of pages){if(!map.pages[page.key]&&sitemap.Pages.some(p=>p.Name===page.name))throw Error(`Existing page without mapping: ${page.name}. Resolve before creating a duplicate.`);}
 await persist();
 for(const page of pages){
  let target=map.pages[page.key];
  if(!target){
   const input={name:page.name,requestId:randomUUID(),dryRun:false};
   await call('axure_live_create_page',{...input,dryRun:true});
   await write('axure_live_create_page',input,r=>{map.pages[page.key]={pageId:r.pageId,name:page.name,widgets:{},groups:[]};});writes++;
   target=map.pages[page.key];
  }
  const pageId=target.pageId;await call('axure_live_open_page',{pageId});
  if((target.groups??[]).length){
   const topology=await call('axure_live_page',{pageId}),flatten=rows=>rows.flatMap(w=>[w,...flatten(w.Children??[])]),liveIds=new Set(flatten(topology.Widgets).map(w=>w.Id));
   if(!Object.values(target.widgets).every(w=>liveIds.has(w.widgetId)))throw Error(`Mapped leaves missing before ungroup: ${page.key}`);
   const presentGroups=target.groups.filter(id=>liveIds.has(id));
   if(presentGroups.length!==target.groups.length){target.groups=presentGroups;await persist();}
  }
  if((target.groups??[]).length){
   const input={pageId,requestId:randomUUID(),dryRun:false,groupIds:target.groups,expectedWidgetIds:Object.values(target.widgets).map(w=>w.widgetId)};
   await call('axure_live_ungroup',{...input,dryRun:true});
   await write('axure_live_ungroup',input,r=>{if(r.groupsRemoved!==target.groups.length||r.widgets!==Object.keys(target.widgets).length)throw Error('Ungroup count mismatch');target.groups=[];});writes++;
  }
  const added=page.items.filter(i=>!target.widgets[i.key]);
  for(const batch of chunks(added)){
   const input={pageId,requestId:randomUUID(),dryRun:false,items:batch.map(({shape,name,patch})=>({shape,name,patch}))};
   await call('axure_live_create_shapes',{...input,dryRun:true});
   await write('axure_live_create_shapes',input,r=>{
    if(r.count!==batch.length)throw Error('Create count mismatch');
    for(let i=0;i<batch.length;i++){const b=batch[i],w=r.widgets[i];check(w.state,b.patch,b.key);target.widgets[b.key]={widgetId:w.widgetId,fingerprint:w.fingerprint,shape:b.shape,patch:b.patch};}
    if(r.groupId)target.groups.push(r.groupId);
   });writes++;
  }
  const changed=page.items.filter(i=>JSON.stringify(target.widgets[i.key].patch)!==JSON.stringify(i.patch));
  for(const batch of chunks(changed)){
   const input={pageId,requestId:randomUUID(),dryRun:false,items:batch.map(i=>({widgetId:target.widgets[i.key].widgetId,expectedFingerprint:target.widgets[i.key].fingerprint,patch:Object.fromEntries(Object.entries(i.patch).filter(([k,v])=>v!==target.widgets[i.key].patch[k]))}))};
   await call('axure_live_batch',{...input,dryRun:true});
   // Keep pending until a separate live read confirms each applied result.
   map.pending={name:'axure_live_batch',input};await persist();await call('axure_live_batch',input);
   const rows=(await call('axure_live_read_many',{pageId,widgetIds:input.items.map(i=>i.widgetId)})).widgets;
   for(const b of batch){const w=rows.find(r=>r.widgetId===target.widgets[b.key].widgetId);check(w.state,b.patch,b.key);target.widgets[b.key].patch=b.patch;target.widgets[b.key].fingerprint=w.fingerprint;}
   map.pending=null;await persist();writes++;
  }
  // Read back every widget, not just new/changed content.
  for(const batch of chunks(page.items)){
   const rows=(await call('axure_live_read_many',{pageId,widgetIds:batch.map(b=>target.widgets[b.key].widgetId)})).widgets;
   for(const b of batch){const w=rows.find(r=>r.widgetId===target.widgets[b.key].widgetId);check(w.state,b.patch,b.key);if(w.fingerprint!==target.widgets[b.key].fingerprint)throw Error('Concurrent change during verification');}
  }
 }
 await call('axure_live_save');
 await mkdir(join(out,'axure-render'),{recursive:true});
 for(const page of pages){const target=map.pages[page.key];const r=await call('axure_live_render_page',{pageId:target.pageId});const img=r.content.find(c=>c.type==='image');if(!img)throw Error('Native render missing');await writeFile(join(out,'axure-render',`${page.key}.png`),Buffer.from(img.data,'base64'));}
 await writeFile(join(out,'verification.json'),JSON.stringify({saved:true,version:status.version,pages:pages.length,widgets:pages.reduce((n,p)=>n+p.items.length,0),writeBatches:writes,textAndGeometryReadback:true,nativeRendered:true,visualReview:'required',planning,verifiedAt:new Date().toISOString()},null,2));
 await run.finish('axure-written',{saved:true,version:status.version,pages:pages.length,writeBatches:writes,textAndGeometryReadback:true,nativeRendered:true});
 console.log(JSON.stringify({saved:true,pages:pages.length,writeBatches:writes,output:out,visualReview:'Inspect axure-render PNGs'}));
}catch(e){await run.finish('apply-failed-or-unknown',{saved:false,axureVerified:false,pending:!!map.pending});throw e;}finally{await client.close();}
}catch(e){await run.finish('failed-before-write',{saved:false,axureVerified:false});throw e;}
