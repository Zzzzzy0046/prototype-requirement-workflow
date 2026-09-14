import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function changes(before,after){
 const a=new Map((before?.requirements??[]).map(r=>[r.id,r])),b=new Map((after?.requirements??[]).map(r=>[r.id,r]));
 return [...new Set([...a.keys(),...b.keys()])].flatMap(id=>{const x=a.get(id),y=b.get(id);if(!x||!y)return [{id,type:x?'removed':'added'}];const fields=[...new Set([...Object.keys(x),...Object.keys(y)])].filter(k=>JSON.stringify(x[k])!==JSON.stringify(y[k]));return fields.length?[{id,type:'changed',fields}]:[];});
}
export function traceability(model,plan){return {version:1,sourceAuthenticity:'agent-reviewed-not-machine-verified',requirements:(model?.requirements??[]).map(r=>({id:r.id,statement:r.statement,status:r.status,ruleState:r.ruleState??'current',sourceIds:r.sourceIds,fieldSources:r.fieldSources??[],sources:(model.sources??[]).filter(s=>r.sourceIds.includes(s.id)),expressions:(plan?.expressions??[]).filter(e=>e.requirementId===r.id),excludedImpacts:(plan?.excludedImpacts??[]).filter(e=>e.requirementId===r.id)}))};}
// Per-run snapshots are project-private. No session, RP mapping, command line or tokens are read.
export async function beginRun(out,{mode,model,plan,scene,planning}){
 const history=join(out,'history'),runId=randomUUID();await mkdir(history,{recursive:true});
 let previous=null,before;
 try{const id=(await readFile(join(history,'latest-input.txt'),'utf8')).trim();if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Invalid history pointer');previous=id;before=JSON.parse(await readFile(join(history,id,'inputs.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const dir=join(history,runId);await mkdir(dir);
 const inputs={model:model??null,plan:plan??null,scene:scene??null};
 await writeFile(join(dir,'inputs.json'),JSON.stringify(inputs,null,2),{flag:'wx'});
 const start={runId,bundleVersion:'1.5.0',mode,startedAt:new Date().toISOString(),previousInputRunId:previous,inputHash:digest(inputs),changes:changes(before?.model,model),planningStage:planning.stage,status:planning.ok===false?'planning-blocked':'started',scriptTimingOnly:true};
 await writeFile(join(dir,'start.json'),JSON.stringify(start,null,2),{flag:'wx'});
 await writeFile(join(history,'latest-input.txt'),runId);
 const clock=performance.now();
 let finished=false;
 return {runId,async finish(status,verification={}){if(finished)return;await writeFile(join(dir,'result.json'),JSON.stringify({runId,status,completedAt:new Date().toISOString(),scriptDurationMs:Math.round(performance.now()-clock),humanEffortMinutes:null,semanticReview:'required',visualReview:'required',verification},null,2),{flag:'wx'});finished=true;}};
}
