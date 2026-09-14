import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
if(process.argv.length!==4||process.argv[2]!=='--session')throw Error('Usage: node verify-connection.mjs --session <local session.json>');
const c=new Client({name:'axure-trial-readonly-check',version:'0.3.0'});
async function readyStatus(){
 let last='No response';
 for(let attempt=0;attempt<20;attempt++){
  try{const r=await c.callTool({name:'axure_live_status',arguments:{}});if(!r.isError)return r;last=r.content[0].text;}catch(e){last=e.message;}
  // Only read-only status may retry while the app initializes. Never replay writes.
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 throw Error(`Axure did not become ready. Check the file/error dialog; do not keep starting new instances. Last error: ${last}`);
}
try{
 await c.connect(new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./mcp-live.mjs',import.meta.url)),'--session',process.argv[3]]}));
 const tools=await c.listTools();
 for(const name of ['axure_live_create_page','axure_live_create_shapes','axure_live_save'])assert.ok(tools.tools.some(t=>t.name===name),`Missing ${name}`);
 for(const name of ['axure_live_status','axure_live_sitemap']){
  const r=name==='axure_live_status'?await readyStatus():await c.callTool({name,arguments:{}});if(r.isError)throw Error(r.content[0].text);
  const data=JSON.parse(r.content[0].text);
  if(name==='axure_live_status'){assert.equal(data.faulted,false);console.log(JSON.stringify({connected:true,version:data.version,mode:data.mode}));}
  else console.log(JSON.stringify({pageCount:data.Pages.length,pageNames:data.Pages.map(p=>p.Name)}));
 }
 console.log('PASS: read-only connection check. No pages/widgets were changed.');
}finally{await c.close();}
