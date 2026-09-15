import {z} from 'zod';
import {createHash} from 'node:crypto';

const id=z.string().min(1).max(100);
const key=z.string().regex(/^[a-z][a-z0-9-]{0,59}$/);
const text=z.string().trim().min(1);
const taskType=z.enum(['full-product','single-page','iteration','bugfix','faithful-rebuild']);
const decisionMode=z.enum(['source-led','guided-concept','explicit-fiction']);
const inputCompleteness=z.enum(['minimal','partial','detailed']);
const workflowProfile=z.enum(['framework-screenshot']);
const inputRole=z.enum(['current-requirement','product-framework','competitor-screenshot','team-rp-template','flow','fixed-copy','existing-rp','page-inventory-approval','page-visual-approval']);
const workflowStage=z.enum(['page-design','final']);
const requirementCategory=z.enum(['display','navigation','input','state','permission','system-handoff','data-write','destructive','monetization','shared-rule','art']);
const requirementAspect=z.enum(['purpose','entry','display','trigger','result','cancel-return','failure','persistence','reentry','system-boundary','data-impact','art-delivery']);
const componentRole=z.enum(['content','status-bar','app-bar','image','illustration','icon','button','input','tab','nav','card','list-item','menu','dialog','bottom-sheet','overlay','toggle','radio','checkbox','progress','banner','ad-slot','system-surface','feedback','divider','drag-handle','chart','thumbnail','badge','camera-view','crop-handle']);
const referenceAspect=z.enum(['information-architecture','module-density','state-expression','control-patterns','requirement-structure']);
const replicaDimension=z.enum(['layout-topology','module-density','state-boards','control-composition','requirement-structure']);
const identity=z.object({productKey:key,platform:text,version:text}).strict();
const block=z.object({page:text,objectId:text.optional(),role:z.enum(['requirement','change','reference','research','placeholder','old']),status:z.enum(['current','tentative','superseded']),quote:text.optional(),x:z.number().optional(),y:z.number().optional()}).strict();
const source=z.object({id,kind:z.enum(['user','baseline','reference','assumption']),inputRole:inputRole.optional(),locator:text,read:z.boolean(),identity:identity.optional(),block:block.optional(),relation:z.object({type:z.enum(['inherits','replaces','rolls-back-to']),sourceId:id,scope:text}).strict().optional()}).strict();
const approval=z.object({status:z.enum(['pending','approved']),sourceId:id.optional(),note:text.optional()}).strict();
const screenshotAbstraction=z.object({pageType:text,primaryTask:text,layoutTopology:z.array(text).min(1),modules:z.array(text).min(1),controlPatterns:z.array(text).min(1),stateExpressions:z.array(text).default([]),lowFidelity:z.literal(true)}).strict();
const target=z.union([
 z.object({pageKey:key,kind:z.literal('widget'),key,field:z.literal('text')}).strict(),
 z.object({pageKey:key,kind:z.literal('note'),key,field:z.literal('title')}).strict(),
 z.object({pageKey:key,kind:z.literal('note'),key,field:z.literal('cell'),row:z.number().int().min(0),column:z.number().int().min(0)}).strict(),
 z.object({pageKey:key,kind:z.literal('note'),key,field:z.literal('line'),line:z.number().int().min(0)}).strict()
]);
export const modelSchema=z.object({
 version:z.union([z.literal(1),z.literal(2)]),
 context:z.object({productKey:key,platform:text,baselineSourceId:id.optional(),taskType:taskType.optional(),decisionMode:decisionMode.optional(),inputCompleteness:inputCompleteness.optional(),workflowProfile:workflowProfile.optional()}).strict().optional(),
 sources:z.array(source).min(1),
 requirements:z.array(z.object({id,sourceIds:z.array(id).min(1),status:z.enum(['confirmed','assumption','unresolved','reference']),inScope:z.boolean(),pageKey:key,applicablePageKeys:z.array(key).min(1).optional(),ruleState:z.enum(['current','replaced','withdrawn']).optional(),ruleType:z.enum(['behavior','display']).optional(),criticality:z.enum(['low','medium','high']).optional(),category:requirementCategory.optional(),visualChange:z.boolean().optional(),fieldSources:z.array(z.object({field:z.enum(['statement','display','trigger','result','boundaries','exactCopies']),sourceIds:z.array(id).min(1)}).strict()).optional(),module:text,statement:text,display:z.string().default(''),trigger:z.string().default(''),result:z.string().default(''),boundaries:z.array(z.string()).default([]),exactCopies:z.array(z.object({text:z.string().min(1),target}).strict()).default([])}).strict()).min(1),
 questions:z.array(z.object({id,question:text,why:text,blocking:z.boolean(),affectedRequirementIds:z.array(id),status:z.enum(['open','answered','deferred']),answer:text.optional(),answerSourceId:id.optional(),reason:text.optional()}).strict()).default([])
}).strict();
export const planSchema=z.object({
 version:z.union([z.literal(1),z.literal(2)]),stage:workflowStage.default('final'),delivery:z.enum(['complete','partial']),omissionReason:text.optional(),includedRequirementIds:z.array(id).min(1),
 gates:z.object({pageInventory:approval,pageVisual:approval}).strict().optional(),
 template:z.object({profile:z.enum(['default','house-review','android-review']),reason:text}).strict(),
 referenceSelections:z.array(z.object({pageKey:key,primarySourceId:id,pattern:text,mode:z.enum(['reference','competitor-abstraction','direct-rp-replica','fallback-pattern']).default('reference'),borrowedAspects:z.array(referenceAspect).min(1),abstraction:screenshotAbstraction.optional(),replicaDimensions:z.array(replicaDimension).min(4).optional(),evidence:z.object({sourcePage:text,pageId:text.optional(),widgetsRead:z.boolean(),nativeRendered:z.boolean()}).strict().optional(),reason:text,prohibitedInheritances:z.array(text).min(1)}).strict()).default([]),
 excludedImpacts:z.array(z.object({requirementId:id,pageKey:key,reason:text}).strict()).default([]),
 pages:z.array(z.object({key,name:text,pageType:z.enum(['screen','flow','overview','table','iteration']).optional(),frameworkSourceIds:z.array(id).min(1).optional(),boards:z.array(z.object({key,purpose:text,stateType:z.enum(['primary','alternate','exception','system-handoff']).optional()}).strict()).min(1)}).strict()).min(1),
 expressions:z.array(z.object({requirementId:id,pageKey:key,boardKey:key,method:z.enum(['widget-and-note','static-board','note-only','widget-only','deferred-note']),reason:text,widgetKeys:z.array(key),noteKeys:z.array(key)}).strict()).min(1),
 decorations:z.array(z.object({pageKey:key,widgetKey:key,role:z.enum(['frame','note-container','review-title','system-chrome','number-marker']),reason:text}).strict()).default([])
}).strict();

// This is structural validation, not semantic entailment or source authentication.
export function validatePlan(modelInput,planInput,scene){
 const m=modelSchema.parse(modelInput),p=planSchema.parse(planInput),errors=[],warnings=[];
 const fail=s=>errors.push(s),unique=(a,label)=>{if(new Set(a).size!==a.length)fail(`Duplicate ${label}`);};
 unique(m.sources.map(s=>s.id),'source id');unique(m.requirements.map(r=>r.id),'requirement id');unique(m.questions.map(q=>q.id),'question id');unique(p.pages.map(v=>v.key),'plan page key');unique(p.pages.map(v=>v.name),'plan page name');unique(p.includedRequirementIds,'included requirement id');
 const sources=new Map(m.sources.map(s=>[s.id,s])),reqs=new Map(m.requirements.map(r=>[r.id,r])),included=new Set(p.includedRequirementIds),planned=new Map(p.pages.map(v=>[v.key,v]));
 const modern=m.version===2||p.version===2;
 const frameworkScreenshot=m.context?.workflowProfile==='framework-screenshot',pageDesign=p.stage==='page-design',finalStage=p.stage==='final';
 if(m.version!==p.version)fail('Requirements model and page plan versions differ');
 if(modern){
 if(m.version!==2||p.version!==2)fail('Quality-gated planning requires model and plan version 2');
  if(!m.context?.taskType||!m.context?.decisionMode||!m.context?.inputCompleteness)fail('Version 2 context requires taskType, decisionMode and inputCompleteness');
  for(const r of m.requirements)if(!r.criticality||!r.category||r.visualChange===undefined)fail(`Version 2 requirement lacks criticality/category/visualChange: ${r.id}`);
  for(const pg of p.pages){if(!pg.pageType)fail(`Version 2 page lacks pageType: ${pg.key}`);for(const b of pg.boards)if(!b.stateType)fail(`Version 2 board lacks stateType: ${pg.key}/${b.key}`);}
 }else warnings.push('Legacy v1 planning has no enforced reference, note-depth or component-role quality gate');
 const applicable=r=>r?.applicablePageKeys??(r?[r.pageKey]:[]);
 const authoritative=s=>s?.read&&['user','baseline'].includes(s.kind)&&(!s.block||(s.block.status==='current'&&['requirement','change'].includes(s.block.role)))&&(!m.context||!s.identity||(s.identity.productKey===m.context.productKey&&s.identity.platform===m.context.platform));
 for(const s of m.sources){
  if(s.relation){const b=sources.get(s.relation.sourceId);if(!b)fail(`Unknown related source: ${s.id}`);else if(!s.identity||!b.identity||s.identity.productKey!==b.identity.productKey||s.identity.platform!==b.identity.platform)fail(`Version relation needs same product/platform identity: ${s.id}`);}
  const seen=new Set();let cur=s;
  while(cur?.relation){if(seen.has(cur.id)){fail(`Cyclic source relation: ${s.id}`);break;}seen.add(cur.id);cur=sources.get(cur.relation.sourceId);}
 }
 if(frameworkScreenshot){
  const frameworkSources=m.sources.filter(s=>s.inputRole==='product-framework'&&s.read);
  const competitorSources=m.sources.filter(s=>s.inputRole==='competitor-screenshot'&&s.read);
  if(!frameworkSources.length)fail('Framework-screenshot workflow requires a read product framework source');
  if(!competitorSources.length)fail('Framework-screenshot workflow requires a read competitor screenshot source');
  if(!p.gates)fail('Framework-screenshot workflow requires page inventory and page visual gates');
  const checkApproval=(gate,role,label,required)=>{
   if(!gate){if(required)fail(`${label} approval is required`);return;}
   if(required&&gate.status!=='approved')fail(`${label} approval is required before ${p.stage}`);
   if(gate.status==='approved'){
    const s=sources.get(gate.sourceId);
    if(!s||!s.read||s.kind!=='user'||s.inputRole!==role)fail(`${label} approval needs a read user source with role ${role}`);
   }else if(gate.sourceId)fail(`${label} pending gate cannot contain sourceId`);
  };
  checkApproval(p.gates?.pageInventory,'page-inventory-approval','Page inventory',true);
  checkApproval(p.gates?.pageVisual,'page-visual-approval','Page visual',finalStage);
  if(pageDesign&&p.gates?.pageVisual.status==='approved')warnings.push('Page visual is already approved while plan stage remains page-design');
  for(const pg of p.pages){
   if(!pg.frameworkSourceIds?.length)fail(`Framework-screenshot page lacks framework source mapping: ${pg.key}`);
   for(const sid of pg.frameworkSourceIds??[]){const s=sources.get(sid);if(!s||!s.read||s.inputRole!=='product-framework')fail(`Page framework mapping must use a read product framework source: ${pg.key}/${sid}`);}
  }
 }
 if(m.context?.baselineSourceId&&!authoritative(sources.get(m.context.baselineSourceId)))fail('Invalid effective baseline for context');
 for(const pg of p.pages)unique(pg.boards.map(b=>b.key),`board key ${pg.key}`);
 unique(p.referenceSelections.map(r=>r.pageKey),'reference selection page');
 if(modern){
  for(const pg of p.pages)if(!p.referenceSelections.some(r=>r.pageKey===pg.key))fail(`Missing page reference selection: ${pg.key}`);
  for(const selection of p.referenceSelections){
   if(!planned.has(selection.pageKey))fail(`Reference selection targets unknown page: ${selection.pageKey}`);
   const selected=sources.get(selection.primarySourceId);
   if(!selected||!selected.read||!['baseline','reference'].includes(selected.kind))fail(`Primary page reference must be a read baseline/reference source: ${selection.pageKey}`);
   if(/(^|[\\/])test-fixtures([\\/]|$)/i.test(selected?.locator??''))fail(`Test fixture cannot be a product reference: ${selection.pageKey}`);
   if(selection.mode==='direct-rp-replica'){
    if(!/\.rp$/i.test(selected?.locator??''))fail(`Direct RP replica requires an RP source: ${selection.pageKey}`);
    if(!selection.evidence?.widgetsRead||!selection.evidence?.nativeRendered)fail(`Direct RP replica requires read and native-render evidence: ${selection.pageKey}`);
    if((selection.replicaDimensions??[]).length<4)fail(`Direct RP replica requires at least four replica dimensions: ${selection.pageKey}`);
    unique(selection.replicaDimensions??[],`replica dimensions ${selection.pageKey}`);
   }
   if(frameworkScreenshot){
    if(selection.mode!=='competitor-abstraction')fail(`Framework-screenshot page must use competitor-abstraction mode: ${selection.pageKey}`);
    if(selected?.inputRole!=='competitor-screenshot')fail(`Framework-screenshot page reference must be a competitor screenshot: ${selection.pageKey}`);
    if(selection.borrowedAspects.length<2)fail(`Competitor abstraction must affect at least two page-expression aspects: ${selection.pageKey}`);
    if(!selection.abstraction)fail(`Competitor screenshot requires a low-fidelity abstraction: ${selection.pageKey}`);
   }
  }
 }
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
  if(r.status==='assumption'){warnings.push(`Assumption used: ${rid}`);if(modern&&r.criticality==='high')fail(`High-consequence requirement cannot be an assumption: ${rid}`);if(scene&&!scene.assumptions.includes(r.statement))fail(`Assumption not disclosed in scene: ${rid}`);}
 }}
 if(modern&&p.delivery==='complete'&&m.context?.taskType==='full-product'&&m.context?.decisionMode!=='explicit-fiction'&&['minimal','partial'].includes(m.context?.inputCompleteness)){
  const active=[...included].map(id=>reqs.get(id)).filter(Boolean),assumptions=active.filter(r=>r.status==='assumption');
  if(assumptions.length>=4&&assumptions.length/active.length>0.5)fail(`Assumption overload for complete product: ${assumptions.length}/${active.length}; ask necessary questions or deliver a scoped proposal`);
 }
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
  if(finalStage&&(req?.ruleType==='behavior'||req?.trigger||req?.result||req?.boundaries.length)&&!e.noteKeys.length)fail(`Behavior requires notes on each expressed page: ${e.requirementId}/${e.pageKey}`);
  unique(e.widgetKeys,`expression widgets ${e.requirementId}`);unique(e.noteKeys,`expression notes ${e.requirementId}`);
  if(e.method==='widget-and-note'&&(!e.widgetKeys.length||!e.noteKeys.length))fail(`Expression needs widgets and notes: ${e.requirementId}`);
  if(e.method==='static-board'&&(!e.widgetKeys.length||(finalStage&&!e.noteKeys.length)))fail(`Static-board expression needs widgets${finalStage?' and notes':''}: ${e.requirementId}`);
  if(e.method==='note-only'&&(!e.noteKeys.length||e.widgetKeys.length))fail(`note-only cannot create widgets: ${e.requirementId}`);
  if(e.method==='widget-only'&&(!e.widgetKeys.length||e.noteKeys.length))fail(`widget-only needs only widgets: ${e.requirementId}`);
  if(e.method==='deferred-note'&&(!pageDesign||e.widgetKeys.length||e.noteKeys.length))fail(`deferred-note is only valid without targets during page-design: ${e.requirementId}`);
  if(modern&&req?.visualChange&&e.method!=='static-board')fail(`Visually material state requires static-board expression: ${e.requirementId}/${e.pageKey}`);
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
  if(modern&&scene.version!==2)fail('Version 2 planning requires scene version 2');
  if(scene.stage!==p.stage)fail(`Scene stage differs from planned stage: ${scene.stage}/${p.stage}`);
  if((scene.noteProfile??'default')!==p.template.profile)fail('Scene noteProfile differs from planned template');
  const actualPages=new Map(scene.pages.map(pg=>[pg.key,pg]));
  for(const pg of p.pages)if(actualPages.get(pg.key)?.name!==pg.name)fail(`Planned page missing/renamed in scene: ${pg.key}`);
  for(const pg of scene.pages){
   if(!planned.has(pg.key))fail(`Unplanned scene page: ${pg.key}`);
   for(const w of pg.widgets)if(!widgetRefs.has(ref(pg.key,w.key)))fail(`Unmapped scene widget: ${pg.key}/${w.key}`);
   for(const n of pg.notes)if(!noteRefs.has(ref(pg.key,n.key)))fail(`Unmapped scene note: ${pg.key}/${n.key}`);
  }
  if(modern){
   const decorative=new Set(p.decorations.map(d=>ref(d.pageKey,d.widgetKey)));
   for(const pg of scene.pages){
    if(pageDesign&&pg.notes.length)fail(`Page-design stage cannot contain requirement notes: ${pg.key}`);
    for(const n of pg.notes){
     if(finalStage){
      if(!n.coverage)fail(`Version 2 note lacks requirement coverage: ${pg.key}/${n.key}`);
      else for(const rid of n.coverage.requirementIds)if(!reqs.has(rid)||!included.has(rid))fail(`Note coverage references unavailable requirement: ${pg.key}/${n.key}/${rid}`);
     }
    }
    const businessWidgets=pg.widgets.filter(w=>widgetRefs.has(ref(pg.key,w.key))&&!decorative.has(ref(pg.key,w.key)));
    for(const w of businessWidgets)if(!w.componentRole)fail(`Mapped widget lacks componentRole: ${pg.key}/${w.key}`);
    const planPage=planned.get(pg.key),roles=new Set(businessWidgets.map(w=>w.componentRole).filter(Boolean));
    if(planPage?.pageType==='screen'){
     if(roles.size<4)fail(`Screen needs at least four semantic component roles: ${pg.key}`);
     const expressive=new Set(['image','illustration','icon','input','tab','list-item','menu','dialog','bottom-sheet','toggle','radio','checkbox','progress','banner','ad-slot','system-surface','feedback','thumbnail','badge','camera-view','crop-handle']);
     if(![...roles].some(role=>expressive.has(role)))fail(`Screen lacks a page-specific composite control pattern: ${pg.key}`);
    }
   }
   for(const e of p.expressions){
    const pg=actualPages.get(e.pageKey),r=reqs.get(e.requirementId),mapped=e.noteKeys.map(k=>pg?.notes.find(n=>n.key===k)).filter(Boolean);
    for(const n of mapped)if(!n.coverage?.requirementIds.includes(e.requirementId))fail(`Mapped note does not declare requirement coverage: ${e.requirementId}/${e.pageKey}/${n.key}`);
    if(!finalStage||r?.ruleType!=='behavior')continue;
    const aspects=new Set(mapped.flatMap(n=>n.coverage?.aspects??[]));
    for(const aspect of ['trigger','result'])if(!aspects.has(aspect))fail(`Behavior note coverage lacks ${aspect}: ${r.id}/${e.pageKey}`);
    if(r.criticality==='high'&&!aspects.has('failure')&&!aspects.has('cancel-return'))fail(`High-consequence behavior lacks failure or cancel-return coverage: ${r.id}/${e.pageKey}`);
    if(['permission','system-handoff'].includes(r.category))for(const aspect of ['entry','system-boundary','reentry'])if(!aspects.has(aspect))fail(`System handoff note coverage lacks ${aspect}: ${r.id}/${e.pageKey}`);
    if(['data-write','destructive'].includes(r.category))for(const aspect of ['persistence','data-impact'])if(!aspects.has(aspect))fail(`Data-changing note coverage lacks ${aspect}: ${r.id}/${e.pageKey}`);
    if(r.category==='monetization')for(const aspect of ['entry','cancel-return','failure','persistence'])if(!aspects.has(aspect))fail(`Monetization note coverage lacks ${aspect}: ${r.id}/${e.pageKey}`);
   }
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
  if(['house-review','android-review'].includes(p.template.profile))for(const pg of scene.pages){
   const markerKeys=new Set(p.decorations.filter(d=>d.pageKey===pg.key&&d.role==='number-marker').map(d=>d.widgetKey));
   const markers=pg.widgets.filter(w=>markerKeys.has(w.key)),rings=markers.filter(w=>w.width===26&&w.height===26),labels=markers.filter(w=>w.width===22&&w.height===22);
   if(rings.length!==pg.notes.length||labels.length!==pg.notes.length)fail(`Each review note needs one numbered marker pair: ${pg.key}`);
   for(const n of pg.notes){
    if(n.x===undefined||n.y===undefined){fail(`Review note needs explicit coordinates for marker alignment: ${pg.key}/${n.key}`);continue;}
    if(!rings.some(w=>w.x===n.x-38&&w.y===n.y)||!labels.some(w=>w.x===n.x-36&&w.y===n.y+2))fail(`Numbered marker not aligned with note: ${pg.key}/${n.key}`);
   }
  }
  for(const r of m.requirements.filter(r=>included.has(r.id)))for(const c of r.exactCopies){
   const t=c.target,pg=actualPages.get(t.pageKey),obj=t.kind==='widget'?pg?.widgets.find(w=>w.key===t.key):pg?.notes.find(n=>n.key===t.key);
   if(pageDesign&&t.kind==='note')continue;
   const value=t.field==='cell'?obj?.table?.rows[t.row]?.[t.column]:t.field==='line'?obj?.lines[t.line]:obj?.[t.field];
   if(value!==c.text)fail(`Exact copy mismatch: ${r.id}/${t.pageKey}/${t.key}/${t.field}`);
   const mapped=p.expressions.some(e=>e.requirementId===r.id&&e.pageKey===t.pageKey&&(t.kind==='widget'?e.widgetKeys:e.noteKeys).includes(t.key));
   if(!mapped)fail(`Exact copy target not mapped to requirement: ${r.id}`);
  }
 }
 const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
 return {ok:errors.length===0,stage:scene?'scene-checked':'plan-checked',workflowStage:p.stage,workflowProfile:m.context?.workflowProfile??'legacy-flexible',delivery:p.delivery,omitted,errors,warnings,hashes:{model:digest(m),plan:digest(p),...(scene?{scene:digest(scene)}:{})},semanticReview:'required',sourceAuthenticity:'agent-reviewed-not-machine-verified'};
}
