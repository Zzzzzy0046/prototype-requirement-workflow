import {z} from 'zod';
import {createHash} from 'node:crypto';

const id=z.string().min(1).max(100);
const key=z.string().regex(/^[a-z][a-z0-9-]{0,59}$/);
const text=z.string().trim().min(1);
const identity=z.object({productKey:key,platform:text,version:text}).strict();
const block=z.object({page:text,objectId:text.optional(),role:z.enum(['requirement','change','reference','research','placeholder','old']),status:z.enum(['current','tentative','superseded']),quote:text.optional(),x:z.number().optional(),y:z.number().optional()}).strict();
const source=z.object({id,kind:z.enum(['user','baseline','reference','assumption']),locator:text,read:z.boolean(),identity:identity.optional(),block:block.optional(),relation:z.object({type:z.enum(['inherits','replaces','rolls-back-to']),sourceId:id,scope:text}).strict().optional()}).strict();
const target=z.union([
 z.object({pageKey:key,kind:z.literal('widget'),key,field:z.literal('text')}).strict(),
 z.object({pageKey:key,kind:z.literal('note'),key,field:z.literal('title')}).strict(),
 z.object({pageKey:key,kind:z.literal('note'),key,field:z.literal('cell'),row:z.number().int().min(0),column:z.number().int().min(0)}).strict(),
 z.object({pageKey:key,kind:z.literal('note'),key,field:z.literal('line'),line:z.number().int().min(0)}).strict()
]);
export const modelSchema=z.object({
 version:z.literal(1),
 context:z.object({productKey:key,platform:text,baselineSourceId:id}).strict().optional(),
 sources:z.array(source).min(1),
 requirements:z.array(z.object({id,sourceIds:z.array(id).min(1),status:z.enum(['confirmed','assumption','unresolved','reference']),inScope:z.boolean(),pageKey:key,applicablePageKeys:z.array(key).min(1).optional(),ruleState:z.enum(['current','replaced','withdrawn']).optional(),ruleType:z.enum(['behavior','display']).optional(),fieldSources:z.array(z.object({field:z.enum(['statement','display','trigger','result','boundaries','exactCopies']),sourceIds:z.array(id).min(1)}).strict()).optional(),module:text,statement:text,display:z.string().default(''),trigger:z.string().default(''),result:z.string().default(''),boundaries:z.array(z.string()).default([]),exactCopies:z.array(z.object({text:z.string().min(1),target}).strict()).default([])}).strict()).min(1),
 questions:z.array(z.object({id,question:text,why:text,blocking:z.boolean(),affectedRequirementIds:z.array(id),status:z.enum(['open','answered','deferred']),answer:text.optional(),answerSourceId:id.optional(),reason:text.optional()}).strict()).default([])
}).strict();
export const planSchema=z.object({
 version:z.literal(1),delivery:z.enum(['complete','partial']),omissionReason:text.optional(),includedRequirementIds:z.array(id).min(1),
 template:z.object({profile:z.enum(['default','house-review','android-review']),reason:text}).strict(),
 excludedImpacts:z.array(z.object({requirementId:id,pageKey:key,reason:text}).strict()).default([]),
 pages:z.array(z.object({key,name:text,boards:z.array(z.object({key,purpose:text}).strict()).min(1)}).strict()).min(1),
 expressions:z.array(z.object({requirementId:id,pageKey:key,boardKey:key,method:z.enum(['widget-and-note','static-board','note-only','widget-only']),reason:text,widgetKeys:z.array(key),noteKeys:z.array(key)}).strict()).min(1),
 decorations:z.array(z.object({pageKey:key,widgetKey:key,role:z.enum(['frame','note-container','review-title','system-chrome','number-marker']),reason:text}).strict()).default([])
}).strict();

// This is structural validation, not semantic entailment or source authentication.
export function validatePlan(modelInput,planInput,scene){
 const m=modelSchema.parse(modelInput),p=planSchema.parse(planInput),errors=[],warnings=[];
 const fail=s=>errors.push(s),unique=(a,label)=>{if(new Set(a).size!==a.length)fail(`Duplicate ${label}`);};
 unique(m.sources.map(s=>s.id),'source id');unique(m.requirements.map(r=>r.id),'requirement id');unique(m.questions.map(q=>q.id),'question id');unique(p.pages.map(v=>v.key),'plan page key');unique(p.pages.map(v=>v.name),'plan page name');unique(p.includedRequirementIds,'included requirement id');
 const sources=new Map(m.sources.map(s=>[s.id,s])),reqs=new Map(m.requirements.map(r=>[r.id,r])),included=new Set(p.includedRequirementIds),planned=new Map(p.pages.map(v=>[v.key,v]));
 const applicable=r=>r?.applicablePageKeys??(r?[r.pageKey]:[]);
 const authoritative=s=>s?.read&&['user','baseline'].includes(s.kind)&&(!s.block||(s.block.status==='current'&&['requirement','change'].includes(s.block.role)))&&(!m.context||!s.identity||(s.identity.productKey===m.context.productKey&&s.identity.platform===m.context.platform));
 for(const s of m.sources){
  if(s.relation){const b=sources.get(s.relation.sourceId);if(!b)fail(`Unknown related source: ${s.id}`);else if(!s.identity||!b.identity||s.identity.productKey!==b.identity.productKey||s.identity.platform!==b.identity.platform)fail(`Version relation needs same product/platform identity: ${s.id}`);}
  const seen=new Set();let cur=s;
  while(cur?.relation){if(seen.has(cur.id)){fail(`Cyclic source relation: ${s.id}`);break;}seen.add(cur.id);cur=sources.get(cur.relation.sourceId);}
 }
 if(m.context&&!authoritative(sources.get(m.context.baselineSourceId)))fail('Invalid effective baseline for context');
 for(const pg of p.pages)unique(pg.boards.map(b=>b.key),`board key ${pg.key}`);
 for(const r of m.requirements){
  unique(r.sourceIds,`source references ${r.id}`);
  if(!r.ruleType)warnings.push(`Legacy requirement lacks explicit ruleType: ${r.id}`);
  if(!r.fieldSources?.length)warnings.push(`No field-level provenance recorded: ${r.id}`);
  for(const sid of r.sourceIds)if(!sources.has(sid))fail(`Unknown source ${sid}: ${r.id}`);
  if(r.status==='confirmed'&&!r.sourceIds.some(sid=>authoritative(sources.get(sid))))fail(`Confirmed requirement lacks read user/baseline: ${r.id}`);
  unique(applicable(r),`applicable pages ${r.id}`);
  if(!applicable(r).includes(r.pageKey))fail(`Primary page absent from applicable pages: ${r.id}`);
  unique((r.fieldSources??[]).map(f=>f.field),`field source ${r.id}`);
  for(const f of r.fieldSources??[]){unique(f.sourceIds,`field source ids ${r.id}/${f.field}`);for(const sid of f.sourceIds)if(!r.sourceIds.includes(sid))fail(`Field source not declared on requirement: ${r.id}/${f.field}`);if(r.status==='confirmed'&&!f.sourceIds.some(sid=>authoritative(sources.get(sid))))fail(`Field lacks current evidence: ${r.id}/${f.field}`);}
 }
 if(p.delivery==='partial'&&!p.omissionReason)fail('Partial delivery requires omissionReason');
 const omitted=m.requirements.filter(r=>r.inScope&&!included.has(r.id)).map(r=>r.id);
 if(omitted.length){if(p.delivery==='complete')fail(`Uncovered in-scope requirements: ${omitted.join(', ')}`);else warnings.push(`Partial delivery omits: ${omitted.join(', ')}`);}
 for(const rid of included){const r=reqs.get(rid);if(!r)fail(`Unknown included requirement: ${rid}`);else{
  if(!r.inScope)fail(`Out-of-scope requirement included: ${rid}`);
  if(!['confirmed','assumption'].includes(r.status))fail(`Unconfirmed requirement included: ${rid}`);
  if(r.ruleState&&r.ruleState!=='current')fail(`Inactive requirement included: ${rid}`);
  if(!applicable(r).some(k=>planned.has(k)))fail(`Requirement page not planned: ${rid}/${r.pageKey}`);
  if(r.status==='assumption'){warnings.push(`Assumption used: ${rid}`);if(scene&&!scene.assumptions.includes(r.statement))fail(`Assumption not disclosed in scene: ${rid}`);}
 }}
 for(const q of m.questions){
  unique(q.affectedRequirementIds,`affected requirements ${q.id}`);
  for(const rid of q.affectedRequirementIds)if(!reqs.has(rid))fail(`Unknown affected requirement ${rid}: ${q.id}`);
  if(q.status==='answered'){
   const s=sources.get(q.answerSourceId);
   if(!q.answer||!authoritative(s))fail(`Answer lacks read user/baseline evidence: ${q.id}`);
  }else{
   if(q.answer||q.answerSourceId)fail(`Unanswered question contains answer fields: ${q.id}`);
   if(q.status==='deferred'&&!q.reason)fail(`Deferred question lacks reason: ${q.id}`);
   if(q.blocking&&(!q.affectedRequirementIds.length||q.affectedRequirementIds.some(rid=>included.has(rid))))fail(`Blocking question unresolved: ${q.id} ${q.question}`);
   else warnings.push(`Unresolved question: ${q.id} ${q.question}`);
  }
 }
 const widgetRefs=new Set(),noteRefs=new Set(),covered=new Set();
 const ref=(page,k)=>`${page}/${k}`;
 for(const e of p.expressions){
  if(!included.has(e.requirementId))fail(`Expression outside included requirements: ${e.requirementId}`);
  if(!planned.get(e.pageKey)?.boards.some(b=>b.key===e.boardKey))fail(`Unknown expression page/board: ${e.pageKey}/${e.boardKey}`);
  if(!applicable(reqs.get(e.requirementId)).includes(e.pageKey))fail(`Expression page differs from requirement: ${e.requirementId}`);
  const req=reqs.get(e.requirementId);
  if((req?.ruleType==='behavior'||req?.trigger||req?.result||req?.boundaries.length)&&!e.noteKeys.length)fail(`Behavior requires notes on each expressed page: ${e.requirementId}/${e.pageKey}`);
  unique(e.widgetKeys,`expression widgets ${e.requirementId}`);unique(e.noteKeys,`expression notes ${e.requirementId}`);
  if(['widget-and-note','static-board'].includes(e.method)&&(!e.widgetKeys.length||!e.noteKeys.length))fail(`Expression needs widgets and notes: ${e.requirementId}`);
  if(e.method==='note-only'&&(!e.noteKeys.length||e.widgetKeys.length))fail(`note-only cannot create widgets: ${e.requirementId}`);
  if(e.method==='widget-only'&&(!e.widgetKeys.length||e.noteKeys.length))fail(`widget-only needs only widgets: ${e.requirementId}`);
  covered.add(e.requirementId);
  for(const k of e.widgetKeys)widgetRefs.add(ref(e.pageKey,k));for(const k of e.noteKeys)noteRefs.add(ref(e.pageKey,k));
 }
 for(const rid of included)if(!covered.has(rid))fail(`No expression for requirement: ${rid}`);
 unique(p.excludedImpacts.map(e=>ref(e.requirementId,e.pageKey)),'excluded impact');
 for(const e of p.excludedImpacts){if(!included.has(e.requirementId)||!applicable(reqs.get(e.requirementId)).includes(e.pageKey)||planned.has(e.pageKey))fail(`Invalid excluded impact: ${e.requirementId}/${e.pageKey}`);}
 for(const rid of included)for(const pageKey of applicable(reqs.get(rid))){
  if(planned.has(pageKey)){if(!p.expressions.some(e=>e.requirementId===rid&&e.pageKey===pageKey))fail(`Missing shared rule expression: ${rid}/${pageKey}`);}
  else if(!p.excludedImpacts.some(e=>e.requirementId===rid&&e.pageKey===pageKey))fail(`Missing outside-scope impact reason: ${rid}/${pageKey}`);
 }
 unique(p.decorations.map(d=>ref(d.pageKey,d.widgetKey)),'decoration');
 for(const d of p.decorations){if(!planned.has(d.pageKey))fail(`Unknown decoration page: ${d.pageKey}`);widgetRefs.add(ref(d.pageKey,d.widgetKey));}
 if(scene){
  if((scene.noteProfile??'default')!==p.template.profile)fail('Scene noteProfile differs from planned template');
  const actualPages=new Map(scene.pages.map(pg=>[pg.key,pg]));
  for(const pg of p.pages)if(actualPages.get(pg.key)?.name!==pg.name)fail(`Planned page missing/renamed in scene: ${pg.key}`);
  for(const pg of scene.pages){
   if(!planned.has(pg.key))fail(`Unplanned scene page: ${pg.key}`);
   for(const w of pg.widgets)if(!widgetRefs.has(ref(pg.key,w.key)))fail(`Unmapped scene widget: ${pg.key}/${w.key}`);
   for(const n of pg.notes)if(!noteRefs.has(ref(pg.key,n.key)))fail(`Unmapped scene note: ${pg.key}/${n.key}`);
  }
  for(const r of widgetRefs){const [pg,k]=r.split('/');if(!actualPages.get(pg)?.widgets.some(w=>w.key===k))fail(`Missing scene widget: ${r}`);}
  for(const r of noteRefs){const [pg,k]=r.split('/');if(!actualPages.get(pg)?.notes.some(n=>n.key===k))fail(`Missing scene note: ${r}`);}
  if(['house-review','android-review'].includes(p.template.profile))for(const d of p.decorations){
   const w=actualPages.get(d.pageKey)?.widgets.find(w=>w.key===d.widgetKey);if(!w)continue;
   const wrongFrame=w.shape!=='Rectangle'||w.width!==360||(p.template.profile==='android-review'?w.height!==640:w.height<640)||w.cornerRadius!==0||w.borderColor!=='#797979'||w.fill!=='#FFFFFF';
   if(d.role==='frame'&&wrongFrame)fail(`Review frame differs from profile: ${d.widgetKey}`);
   if(d.role==='review-title'&&(w.fontFamily!=='Arial'||w.fontSize!==13.5||!w.bold||w.textColor!=='#333333'))fail(`Review title differs from profile: ${d.widgetKey}`);
   if(d.role==='number-marker'&&(w.shape!=='Ellipse'||w.width!==w.height||![22,26].includes(w.width)))fail(`Number marker differs from profile: ${d.widgetKey}`);
  }
  for(const r of m.requirements.filter(r=>included.has(r.id)))for(const c of r.exactCopies){
   const t=c.target,pg=actualPages.get(t.pageKey),obj=t.kind==='widget'?pg?.widgets.find(w=>w.key===t.key):pg?.notes.find(n=>n.key===t.key);
   const value=t.field==='cell'?obj?.table?.rows[t.row]?.[t.column]:t.field==='line'?obj?.lines[t.line]:obj?.[t.field];
   if(value!==c.text)fail(`Exact copy mismatch: ${r.id}/${t.pageKey}/${t.key}/${t.field}`);
   const mapped=p.expressions.some(e=>e.requirementId===r.id&&e.pageKey===t.pageKey&&(t.kind==='widget'?e.widgetKeys:e.noteKeys).includes(t.key));
   if(!mapped)fail(`Exact copy target not mapped to requirement: ${r.id}`);
  }
 }
 const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
 return {ok:errors.length===0,stage:scene?'scene-checked':'plan-checked',delivery:p.delivery,omitted,errors,warnings,hashes:{model:digest(m),plan:digest(p),...(scene?{scene:digest(scene)}:{})},semanticReview:'required',sourceAuthenticity:'agent-reviewed-not-machine-verified'};
}
