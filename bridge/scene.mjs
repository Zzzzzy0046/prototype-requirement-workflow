import {z} from 'zod';
const key=z.string().regex(/^[a-z][a-z0-9-]{0,59}$/);
const color=z.string().regex(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i);
const requirementAspect=z.enum(['purpose','entry','display','trigger','result','cancel-return','failure','persistence','reentry','system-boundary','data-impact','art-delivery']);
const componentRole=z.enum(['content','status-bar','app-bar','image','illustration','icon','button','input','tab','nav','card','list-item','menu','dialog','bottom-sheet','overlay','toggle','radio','checkbox','progress','banner','ad-slot','system-surface','feedback','divider','drag-handle','chart','thumbnail','badge','camera-view','crop-handle']);
const table=z.object({columns:z.array(z.string().min(1)).min(1).max(8),rows:z.array(z.array(z.string().max(4000))).min(1).max(100)}).strict().superRefine((v,ctx)=>{if(v.rows.some(r=>r.length!==v.columns.length))ctx.addIssue({code:z.ZodIssueCode.custom,message:'Table rows must match columns'});});
const note=z.object({key,title:z.string().min(1).max(100),kind:z.enum(['module','shared-rule','change','art']).optional(),lines:z.array(z.string().min(1)).default([]),table:table.optional(),coverage:z.object({requirementIds:z.array(z.string().min(1)).min(1),aspects:z.array(requirementAspect).min(1)}).strict().optional(),x:z.number().min(0).max(15000).optional(),y:z.number().min(0).max(15000).optional(),width:z.number().min(200).max(2000).optional()}).strict().refine(n=>n.lines.length||n.table,'Note needs lines or table');
const houseReview={fontFamily:'Arial',titleSize:10.5,bodySize:9,color:'#333333',width:322,titleMin:20,titleLine:21,titleTop:5,bodyGap:1,bodyLine:20,minBody:36};
export const noteProfiles={
 default:{fontFamily:'Microsoft YaHei',titleSize:14,bodySize:11,color:'#263445',width:570,titleMin:36,titleLine:28,titleTop:0,bodyGap:4,bodyLine:24,minBody:42},
 'house-review':houseReview,
 // Historical alias retained so existing projects keep rendering identically.
 'android-review':houseReview
};
const widget=z.object({key,shape:z.enum(['Rectangle','Paragraph','Ellipse']),componentRole:componentRole.optional(),text:z.string().max(4000).default(''),x:z.number().min(0).max(15000),y:z.number().min(0).max(15000),width:z.number().positive().max(4000),height:z.number().positive().max(4000),fontSize:z.number().min(1).max(200).default(11),fontFamily:z.string().min(1).max(120).default('Microsoft YaHei'),bold:z.boolean().default(false),fill:color.optional(),textColor:color.default('#263445'),borderColor:color.default('#CBD5E1'),borderWidth:z.number().min(0).max(20).optional(),cornerRadius:z.number().min(0).max(200).default(0)}).strict();
export const schema=z.object({version:z.union([z.literal(1),z.literal(2)]),stage:z.enum(['page-design','final']).default('final'),project:z.string().min(1).max(100),brief:z.string().min(1),noteProfile:z.enum(['default','house-review','android-review']).optional(),assumptions:z.array(z.string()).default([]),outOfScope:z.array(z.string()).default([]),pages:z.array(z.object({key,name:z.string().min(1).max(100).regex(/^[^\x00-\x1f\x7f]+$/),width:z.number().min(200).max(15000),height:z.number().min(200).max(15000),widgets:z.array(widget).min(1),notes:z.array(note).default([])}).strict()).min(1)}).strict();
export function parseScene(input){
 const scene=schema.parse(input);
 const unique=(values,label)=>{if(new Set(values).size!==values.length)throw Error(`Duplicate ${label}`);};
 unique(scene.pages.map(p=>p.key),'page key');unique(scene.pages.map(p=>p.name),'page name');
 for(const p of scene.pages){unique(p.widgets.map(w=>w.key),`${p.key} widget key`);unique(p.notes.map(n=>n.key),`${p.key} note key`);for(const w of p.widgets){if(w.x+w.width>p.width||w.y+w.height>p.height)throw Error(`Widget outside page: ${p.key}/${w.key}`);}for(const n of p.notes){if(n.lines.join('\n').length>4000)throw Error(`Split long note without truncation: ${p.key}/${n.key}`);}}
 return scene;
}
export function compile(scene){
 const style=noteProfiles[scene.noteProfile??'default'];
 return scene.pages.map(p=>{
  const items=p.widgets.map(w=>({key:`ui-${w.key}`,shape:w.shape,name:`ui-${w.key}`,patch:{text:w.text,x:w.x+40,y:w.y+40,width:w.width,height:w.height,fontSize:w.fontSize,fontFamily:w.fontFamily,bold:w.bold,fill:w.fill??(w.shape==='Paragraph'?'#FFFFFF00':'#FFFFFF'),textColor:w.textColor,borderColor:w.borderColor,borderWidth:w.borderWidth??(w.shape==='Paragraph'?0:1),cornerRadius:w.cornerRadius}}));
  let nextY=50;
  const placed=[];
  for(const n of p.notes){
   const outerX=n.x===undefined?p.width+100:n.x+40,outerY=n.y===undefined?nextY:n.y+40,outerWidth=n.width??style.width;
   const boxed=['shared-rule','change'].includes(n.kind),pad=boxed?12:0;
   const x=outerX+pad,y=outerY+pad,width=outerWidth-pad*2;
   const titleUnits=[...n.title].reduce((sum,c)=>sum+(c.charCodeAt(0)>255?2:1),0);
   const titleHeight=Math.max(style.titleMin,Math.ceil(titleUnits/(width/(11*style.titleSize/14)))*style.titleLine);
   const bodyOffset=style.titleTop+titleHeight+style.bodyGap;
   const title={key:`note-${n.key}-title`,shape:'Paragraph',name:`note-${n.key}-title`,patch:{text:n.title,x,y:y+style.titleTop,width,height:titleHeight,fontSize:style.titleSize,fontFamily:style.fontFamily,bold:true,fill:'#FFFFFF00',textColor:style.color,borderColor:'#CBD5E1',borderWidth:0,cornerRadius:0}};
   // Conservative wrap estimate leaves space for Chinese and mixed-language text.
   const capacity=62*width/570*11/style.bodySize;
   const lines=n.lines.reduce((sum,line)=>sum+line.split('\n').reduce((s,l)=>s+Math.max(1,Math.ceil([...l].reduce((a,c)=>a+(c.charCodeAt(0)>255?2:1),0)/capacity)),0),0);
   const height=n.lines.length?Math.max(style.minBody,lines*style.bodyLine+16):0;
   if(height>4000)throw Error(`Split tall note ${p.key}/${n.key}`);
   const cells=[];let tableHeight=0;
   if(n.table){const cw=width/n.table.columns.length;for(const [ri,row]of [n.table.columns,...n.table.rows].entries()){
    const rh=Math.max(style.bodyLine+16,...row.map(c=>c.split('\n').reduce((s,l)=>s+Math.max(1,Math.ceil([...l].reduce((a,ch)=>a+(ch.charCodeAt(0)>255?2:1),0)/Math.max(1,(cw-16)/(style.bodySize*.75)))),0)*style.bodyLine+16));
    if(rh>4000)throw Error(`Split tall table row ${p.key}/${n.key}/${ri}`);
    row.forEach((c,ci)=>{const prefix=`note-${n.key}-table-${ri}-${ci}`,base={...title.patch,x:x+ci*cw,y:y+bodyOffset+height+tableHeight,width:cw,height:rh,bold:ri===0,fontSize:style.bodySize};cells.push({key:prefix+'-box',shape:'Rectangle',name:prefix+'-box',patch:{...base,text:'',fill:ri===0?'#F1F5F9':'#FFFFFF',borderColor:'#797979',borderWidth:1}},{key:prefix+'-text',shape:'Paragraph',name:prefix+'-text',patch:{...base,text:c,x:base.x+8,y:base.y+8,width:cw-16,height:rh-16,fill:'#FFFFFF00',borderWidth:0}});});tableHeight+=rh;
   }}
   const rect={x:outerX,y:outerY,width:outerWidth,height:height+bodyOffset+tableHeight+pad*2,key:n.key};
   const overlap=placed.find(r=>rect.x<r.x+r.width&&rect.x+rect.width>r.x&&rect.y<r.y+r.height&&rect.y+rect.height>r.y);
   if(overlap)throw Error(`Overlapping notes: ${p.key}/${overlap.key} and ${n.key}`);
   placed.push(rect);
   if(boxed){if(rect.height>4000)throw Error(`Split tall boxed note ${p.key}/${n.key}`);items.push({key:`note-${n.key}-box`,shape:'Rectangle',name:`note-${n.key}-box`,patch:{...title.patch,text:'',x:rect.x,y:rect.y,width:rect.width,height:rect.height,fill:'#FFFFFF00',borderColor:n.kind==='change'?'#2563EB':'#797979',borderWidth:1}});}
   if(n.kind==='art')title.patch.textColor='#C00000';
   items.push(title);
   if(n.lines.length)items.push({key:`note-${n.key}-body`,shape:'Paragraph',name:`note-${n.key}-body`,patch:{...title.patch,text:n.lines.join('\n'),y:y+bodyOffset,height,fontSize:style.bodySize,bold:false,textColor:style.color}});
   items.push(...cells);
   nextY=Math.max(nextY,rect.y+rect.height+26);
  }
  if(nextY>19000)throw Error(`Page notes too tall: ${p.key}. Reflow note groups without splitting a function into state pages.`);
  const canvasWidth=Math.max(p.width+(p.notes.some(n=>n.x===undefined)?740:80),...placed.map(n=>n.x+n.width+40));
  return {key:p.key,name:p.name,width:canvasWidth,height:Math.max(p.height+80,nextY+30),items};
 });
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function html(scene,pages){
 const sections=pages.map(p=>`<section><h2>${esc(p.name)}</h2><div class="scroll"><div class="canvas" style="width:${p.width}px;height:${p.height}px">${p.items.map(w=>{const a=w.patch;return `<div data-key="${esc(w.key)}" style="position:absolute;box-sizing:border-box;left:${a.x}px;top:${a.y}px;width:${a.width}px;height:${a.height}px;background:${a.fill};color:${a.textColor};border:${a.borderWidth}px solid ${a.borderColor};border-radius:${w.shape==='Ellipse'?'50%':a.cornerRadius+'px'};font-family:${esc(a.fontFamily)};font-size:${a.fontSize}pt;font-weight:${a.bold?700:400};white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45;${w.shape==='Paragraph'?'':'display:flex;align-items:center;justify-content:center;padding:6px;'}">${esc(a.text)}</div>`;}).join('')}</div></div></section>`).join('');
 const stageText=scene.stage==='page-design'?'页面画面确认稿：本阶段只评审页面结构、模块、控件和状态；需求说明将在页面确认后生成。':'静态评审原型：点击行为见右侧说明。HTML 与 Axure 使用同一份文案及坐标，字体排版仍需核对。';
 return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(scene.project)} · 原型</title><style>body{margin:0;padding:28px;background:#eef1f5;color:#263445;font:15px/1.5 system-ui}h1{margin:0}p{max-width:1000px}section{margin-top:28px}.scroll{overflow:auto;border:1px solid #cbd5e1;border-radius:8px}.canvas{position:relative;background:white}h2{font-size:18px}</style><h1>${esc(scene.project)}</h1><p>${esc(scene.brief)}</p><p>${stageText}</p>${sections}</html>`;
}
const mdCell=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('|','&#124;').replaceAll('\n','<br>');
export function requirements(scene){if(scene.stage==='page-design')return `# ${scene.project} · 页面需求\n\n> 当前处于页面画面确认阶段。页面确认后再生成完整需求说明。\n`;return `# ${scene.project} · 页面需求\n\n`+scene.pages.map(p=>`## ${p.name}\n\n`+p.notes.map(n=>`### ${n.title}\n\n${n.lines.join('\n\n')}\n`+(n.table?'\n| '+n.table.columns.map(mdCell).join(' | ')+' |\n| '+n.table.columns.map(()=>'---').join(' | ')+' |\n'+n.table.rows.map(r=>'| '+r.map(mdCell).join(' | ')+' |').join('\n')+'\n':'')).join('\n')).join('\n');}
