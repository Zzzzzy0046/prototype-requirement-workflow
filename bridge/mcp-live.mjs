import {readFile} from 'node:fs/promises';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';

if(process.argv.length!==4||process.argv[2]!=='--session')throw Error('Usage: node mcp-live.mjs --session <absolute session.json>');
const cfg=JSON.parse(await readFile(process.argv[3],'utf8'));
if(!Number.isInteger(cfg.port)||cfg.port<1024||cfg.port>65535||!/^[a-f\d]{64}$/i.test(cfg.token))throw Error('Invalid session config');
const server=new McpServer({name:'axure-live-experimental',version:'0.2.0'});
async function request(body){
 const response=await fetch(`http://127.0.0.1:${cfg.port}/operations`,{method:'POST',headers:{'Content-Type':'application/json','X-Axure-Bridge-Token':cfg.token},body:JSON.stringify(body),signal:AbortSignal.timeout(15000),redirect:'error'});
 if(!response.ok)throw Error(`Bridge HTTP ${response.status}`);
 const data=await response.json();if(data.error)throw Error(data.message??data.error);return data;
}
function handler(action){return async input=>{try{const data=await request({action,...input});return {content:['screenshot','render-group','render-page'].includes(action)?[{type:'image',data:data.Data,mimeType:data.MimeType},{type:'text',text:data.Description}]:[{type:'text',text:JSON.stringify(data)}]};}catch(e){return {isError:true,content:[{type:'text',text:e.name==='TimeoutError'?'Bridge timed out: outcome is unknown; read status/state before retrying any write.':e.message}]};}};}
const target={pageId:z.string().uuid(),widgetId:z.string().uuid()};
function tool(name,description,inputSchema,action,readOnly=false){server.registerTool(name,{description,inputSchema,annotations:{readOnlyHint:readOnly,destructiveHint:!readOnly,openWorldHint:false}},handler(action));}
tool('axure_live_status','Read the attached experimental test-copy session and supported Axure build.',{},'status',true);
tool('axure_live_sitemap','Read page IDs from the attached test copy.',{},'sitemap',true);
tool('axure_live_open_page','Open a verified page in the bound project before editing.',{pageId:z.string().uuid()},'open-page');
tool('axure_live_create_page','Create and open a real root sitemap page. Windows RP11 4134/4137/4149. Checks registration and active page; idempotent within the current process. Page creation has NO bridge undo; explicit save required.',{name:z.string().min(1).max(100).regex(/^[^\x00-\x1f\x7f]+$/),requestId:z.string().uuid(),dryRun:z.boolean().default(true)},'create-page');
tool('axure_live_page','Read page structure and canonical widget UUIDs. IDs are not raw RP hex byte order.',{pageId:z.string().uuid()},'page',true);
tool('axure_live_render_page','Render the whole page using Axure native rendering; does not depend on temporary group IDs.',{pageId:z.string().uuid()},'render-page',true);
tool('axure_live_read','Read one VectorShape and its optimistic-concurrency fingerprint.',target,'read',true);
tool('axure_live_edit','Edit one VectorShape on the currently open page in memory using native undo. No file regeneration, clipboard or GUI automation. Preview default. Text replacement preserves first-run formatting, not mixed runs. Experimental and test-copy-only.',{
 ...target,expectedFingerprint:z.string().regex(/^[a-f\d]{64}$/),kind:z.enum(['text','move','resize','style']),
 changes:z.object({text:z.string().max(500).optional(),dx:z.number().finite().optional(),dy:z.number().finite().optional(),width:z.number().finite().optional(),height:z.number().finite().optional(),cornerRadius:z.number().finite().optional(),borderWidth:z.number().finite().optional(),opacity:z.number().finite().optional()}).strict(),dryRun:z.boolean().default(true)
},'edit');
tool('axure_live_undo','Undo only if the native undo top is an edit owned by this bridge. Refuses to undo user work.',{},'undo');
tool('axure_live_redo','Redo only a bridge-owned native edit; rejects changed history.',{},'redo');
tool('axure_live_save','Save the attached test copy, including any user edits in that copy. Explicit save; source RP is never overwritten.',{},'save');
tool('axure_live_render','Render the target widget using Axure. This is a model render, not a screen/canvas screenshot.',target,'screenshot',true);
const fingerprint=z.string().regex(/^[a-f\d]{64}$/);
const color=z.string().regex(/^#[a-f\d]{6}([a-f\d]{2})?$/i);
const patch=z.object({text:z.string().max(4000).optional(),x:z.number().finite().optional(),y:z.number().finite().optional(),width:z.number().positive().optional(),height:z.number().positive().optional(),cornerRadius:z.number().nonnegative().optional(),borderWidth:z.number().nonnegative().optional(),opacity:z.number().min(0).max(1).optional(),fill:color.optional(),borderColor:color.optional(),textColor:color.optional(),fontSize:z.number().min(1).max(200).optional(),fontFamily:z.string().max(120).optional(),bold:z.boolean().optional(),imageBase64:z.string().max(1400000).optional()}).strict();
const batch={pageId:z.string().uuid(),requestId:z.string().uuid().describe('Unique per logical write. Reuse SAME ID and payload after uncertain timeout; never generate a new ID for retry.'),dryRun:z.boolean().default(true)};
tool('axure_live_create_shapes','Create editable native Rectangle/Paragraph/Ellipse leaves on a blank or existing current page, grouped in one native undo operation. No source templates required.',{...batch,groupName:z.string().min(1).max(100),items:z.array(z.object({shape:z.enum(['Rectangle','Paragraph','Ellipse']),name:z.string().min(1).max(100),patch}).strict()).min(1).max(150)},'create-shapes');
tool('axure_live_read_many','Read up to 200 VectorShape/ImageBox widgets in one UI-thread roundtrip.',{pageId:z.string().uuid(),widgetIds:z.array(z.string().uuid()).min(1).max(200)},'read-many',true);
tool('axure_live_compose','Clone 1-150 existing native leaf templates, preserve source resources, apply patches, group and add to the CURRENT page as ONE native undo operation. Input order is back-to-front. No clipboard. Preview default. Copies have independent IDs. PNG import supported; no arbitrary files/URLs. Unchanged text preserves full source rich text.',{...batch,groupName:z.string().min(1).max(100),items:z.array(z.object({templateId:z.string().uuid(),expectedFingerprint:fingerprint,name:z.string().min(1).max(100),patch}).strict()).min(1).max(150)},'compose');
tool('axure_live_batch','Patch 1-150 distinct existing leaf widgets in ONE native undo operation and UI roundtrip. Full prevalidation; experimental native failures stop all further writes, not guaranteed atomic rollback. Includes colors/fonts/images. PNG max 1MB and 4096px/8M pixels. Preview default.',{...batch,items:z.array(z.object({widgetId:z.string().uuid(),expectedFingerprint:fingerprint,patch}).strict()).min(1).max(150)},'batch');
tool('axure_live_render_group','Render the complete native group using Axure; no desktop input simulation.',target,'render-group',true);
await server.connect(new StdioServerTransport());
