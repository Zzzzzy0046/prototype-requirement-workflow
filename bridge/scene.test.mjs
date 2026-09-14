import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseScene,compile,html,requirements} from './scene.mjs';
const input=()=>({version:1,project:'示例',brief:'静态同页状态',pages:[{key:'home',name:'Home',width:1100,height:1500,widgets:[{key:'screen',shape:'Rectangle',x:0,y:0,width:360,height:640}],notes:[{key:'state',title:'页面说明',lines:['1、原文 A & B <tag>。','2、保留\n换行。']}]}]});
test('legacy default placement and text are unchanged',()=>{
 const s=parseScene(input()),p=compile(s)[0],t=p.items.find(i=>i.key==='note-state-title'),b=p.items.find(i=>i.key==='note-state-body');
 assert.equal(t.patch.x,1200);assert.equal(t.patch.y,50);assert.equal(t.patch.width,570);
 assert.equal(b.patch.y,90);assert.equal(p.width,1840);
 assert.equal(b.patch.text,s.pages[0].notes[0].lines.join('\n'));
 assert.ok(requirements(s).includes('1、原文 A & B <tag>。'));
 assert.ok(html(s,[p]).includes('A &amp; B &lt;tag&gt;'));
});
test('two state groups stay on one function page with independent notes',()=>{
 const raw=input();raw.pages[0].notes=[{key:'default',title:'S01 默认状态',x:430,y:0,width:500,lines:['1、列表展示当前已有记录。']},{key:'empty',title:'S02 空状态',x:430,y:800,width:500,lines:['1、没有记录时展示空状态。']}];
 const s=parseScene(raw),out=compile(s);assert.equal(out.length,1);assert.equal(out[0].key,'home');
 const first=out[0].items.find(i=>i.key==='note-default-title'),last=out[0].items.find(i=>i.key==='note-empty-title');
 assert.equal(first.patch.x,470);assert.equal(first.patch.y,40);assert.equal(last.patch.y,840);
 assert.ok(requirements(s).includes('S01 默认状态'));assert.ok(requirements(s).includes('S02 空状态'));
 raw.pages[0].notes[1].y=900;
 assert.deepEqual(compile(parseScene(raw))[0].items.map(i=>i.key),out[0].items.map(i=>i.key));
});
test('narrow long title and body grow without truncation',()=>{
 const raw=input();raw.pages[0].notes[0]={key:'long',title:'这是一段需要换行显示的较长状态说明标题',x:0,y:0,width:200,lines:['1、'+('较长正文需要完整保留。'.repeat(15))]};
 const p=compile(parseScene(raw))[0],t=p.items.find(i=>i.key==='note-long-title'),b=p.items.find(i=>i.key==='note-long-body');
 assert.equal(t.patch.x,40);assert.ok(t.patch.height>36);assert.equal(b.patch.y,t.patch.y+t.patch.height+4);
 assert.equal(b.patch.text,raw.pages[0].notes[0].lines[0]);
 raw.pages[0].notes[0].width=570;
 assert.ok(compile(parseScene(raw))[0].items.find(i=>i.key==='note-long-body').patch.height<b.patch.height);
});
test('overlap and unsupported scene fields fail before writing',()=>{
 const raw=input();raw.pages[0].notes=[{key:'one',title:'一',x:430,y:0,lines:['正文']},{key:'two',title:'二',x:430,y:30,lines:['正文']}];
 assert.throws(()=>compile(parseScene(raw)),/Overlapping notes/);
 raw.pages[0].notes[1].x=1100;assert.doesNotThrow(()=>compile(parseScene(raw)));
 raw.pages[0].notes[0].sourceFile='private.rp';assert.throws(()=>parseScene(raw));
});
test('invalid coordinates, width, duplicated keys, and excessive text fail',()=>{
 for(const patch of [{x:-1},{width:100},{width:2100},{y:15001}]){const r=input();Object.assign(r.pages[0].notes[0],patch);assert.throws(()=>parseScene(r));}
 const r=input();r.pages[0].notes.push({...r.pages[0].notes[0]});assert.throws(()=>parseScene(r),/Duplicate/);
 const long=input();long.pages[0].notes[0].lines=['中'.repeat(4001)];assert.throws(()=>parseScene(long),/Split long note/);
});
