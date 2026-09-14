import {readFile} from 'node:fs/promises';
import {validatePlan} from './planning.mjs';
import {parseScene,compile} from './scene.mjs';
const args=process.argv.slice(2),opts={};
for(let i=0;i<args.length;i+=2){if(!['--model','--plan','--spec'].includes(args[i])||!args[i+1]||opts[args[i]])throw Error('Usage: validate-plan.mjs --model <json> --plan <json> [--spec <scene.json>]');opts[args[i]]=args[i+1];}
if(!opts['--model']||!opts['--plan'])throw Error('--model and --plan required');
const read=async path=>JSON.parse(await readFile(path,'utf8'));
try{
 const scene=opts['--spec']?parseScene(await read(opts['--spec'])):undefined;
 if(scene)compile(scene);
 const result=validatePlan(await read(opts['--model']),await read(opts['--plan']),scene);
 console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
}catch(e){console.log(JSON.stringify({ok:false,stage:'invalid-input',errors:[e.message]}));process.exitCode=1;}
