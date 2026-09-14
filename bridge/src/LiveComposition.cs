using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;

public static partial class LiveOperations {
 static bool Supported(object w)=>new[]{"VectorShape","ImageBox"}.Contains(w.GetType().Name);
 static object TextStyle(object w,string name){var font=Call(Get(w,"AttributedString"),"AB71");var value=T("BjeW.Vje1").GetMethod("ValueAsObject",F).Invoke(font,new[]{Enum.Parse(T("Axure.Constants.PName"),name)});if(value==null&&name=="FONT_NAME")value=Get(Get(w,"MyStyle"),"FontName");if(value==null&&name=="BOLD")value=Get(Get(w,"MyStyle"),"Bold");return value;}
 static Guid Id(object w)=>(Guid)T("XjHA.qjHT").GetMethod("ujHv",F).Invoke(w,null);
 static object Resolve(object svc,object fragment,Guid id)=>svc.GetType().GetMethod("ResolveWidget",F).Invoke(null,new object[]{fragment,id.ToString(),null});
 static object InvokeExact(object o,string name,params object[] args){
  var methods=o.GetType().GetMethods(F).Where(m=>m.Name==name&&!m.IsGenericMethod&&m.GetParameters().Length==args.Length);
  var match=methods.Where(m=>m.GetParameters().Select((p,i)=>args[i]==null?!p.ParameterType.IsValueType||Nullable.GetUnderlyingType(p.ParameterType)!=null:p.ParameterType.IsInstanceOfType(args[i])).All(x=>x)).ToArray();
  if(match.Length!=1)throw new Exception("Ambiguous native signature: "+name);return match[0].Invoke(o,args);
 }
 static Array Typed(string type,IEnumerable<object> values){var all=values.ToArray();var a=Array.CreateInstance(T(type),all.Length);for(int i=0;i<all.Length;i++)a.SetValue(all[i],i);return a;}
 static string ColorText(object fill){if(fill==null)return null;var raw=Get(fill,"Color").ToString();var m=Regex.Match(raw,"^([A-Fa-f0-9]{2}),([A-Fa-f0-9]{2}),([A-Fa-f0-9]{2})--([A-Fa-f0-9]{2})$");return m.Success?"#"+m.Groups[1].Value+m.Groups[2].Value+m.Groups[3].Value+m.Groups[4].Value:raw;}
 static string ImageHash(object w){if(w.GetType().Name!="ImageBox")return null;var stream=(Stream)Call(Get(w,"Image"),"rjY2");if(stream==null)return null;var pos=stream.CanSeek?stream.Position:0;try{if(stream.CanSeek)stream.Position=0;return Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(stream));}finally{if(stream.CanSeek)stream.Position=pos;}}
 static object Fill(string hex){var raw=Convert.FromHexString(hex.Substring(1));var color=T("q3My.f3Mv").GetMethod("b3Mf",F).Invoke(null,new object[]{raw.Length==4?(int)raw[3]:255,(int)raw[0],(int)raw[1],(int)raw[2]});return Make("FlA2.nlAn",color);}
 static readonly string[] PatchKeys={"text","x","y","width","height","cornerRadius","borderWidth","opacity","fill","borderColor","textColor","fontSize","fontFamily","bold","imageBase64"};
 static void ValidatePatch(JsonElement p,object w){
  if(p.ValueKind!=JsonValueKind.Object||p.EnumerateObject().Any(x=>!PatchKeys.Contains(x.Name)))throw new Exception("Unknown patch field");
  foreach(var x in p.EnumerateObject()){
   if(new[]{"fill","borderColor","textColor"}.Contains(x.Name)){if(x.Value.ValueKind!=JsonValueKind.String||!Regex.IsMatch(x.Value.GetString(),"^#[a-fA-F0-9]{6}([a-fA-F0-9]{2})?$"))throw new Exception("Expected #RRGGBB or #RRGGBBAA");}
   else if(x.Name=="text"||x.Name=="fontFamily"){var s=x.Value.GetString();if(s==null||s.Length>(x.Name=="text"?4000:120))throw new Exception("Invalid text/font family");}
   else if(x.Name=="bold")x.Value.GetBoolean();
   else if(x.Name=="imageBase64"){if(w.GetType().Name!="ImageBox")throw new Exception("Image replacement requires ImageBox");DecodePng(x.Value.GetString());}
   else Number(p,x.Name,new[]{"x","y"}.Contains(x.Name)?-20000:new[]{"width","height","fontSize"}.Contains(x.Name)?1:0,x.Name=="opacity"?1:x.Name=="fontSize"?200:x.Name=="borderWidth"?30:x.Name=="cornerRadius"?1000:20000);
  }
 }
 static byte[] DecodePng(string b64){
  if(b64==null||b64.Length>1400000)throw new Exception("PNG exceeds 1MB limit");var bytes=Convert.FromBase64String(b64);
  if(bytes.Length<33||!bytes.Take(8).SequenceEqual(new byte[]{137,80,78,71,13,10,26,10}))throw new Exception("PNG only");
  uint Read(int i)=>(uint)bytes[i]<<24|(uint)bytes[i+1]<<16|(uint)bytes[i+2]<<8|bytes[i+3];
  var width=Read(16);var height=Read(20);if(width<1||height<1||width>4096||height>4096||(long)width*height>8000000)throw new Exception("PNG dimensions exceed limit");return bytes;
 }
 // Mutate a detached clone, or collect native before/after snapshots for an existing leaf.
 static List<object> Patch(object w,JsonElement p,bool capture){
  var edits=new List<object>();var style=Get(w,"MyStyle");
  if(p.TryGetProperty("text",out var txt)){
   if(capture){var attr=Get(w,"AttributedString");var font=Call(attr,"AB71");var next=attr.GetType().GetMethod("ugsp",F).Invoke(null,new object[]{txt.GetString(),font});edits.Add(Make("Qu4q.ou47",w,next));}
   else Set(w,"Text",txt.GetString());
  }
  if(p.EnumerateObject().Any(x=>new[]{"x","y","width","height"}.Contains(x.Name))){
   if(capture)edits.Add(Make("SgQl.sgQ3",w));
   var r=Get(w,"Rect");var x=p.TryGetProperty("x",out var px)?px.GetDouble():(double)Get(r,"X");var y=p.TryGetProperty("y",out var py)?py.GetDouble():(double)Get(r,"Y");
   var width=p.TryGetProperty("width",out var pw)?pw.GetDouble():(double)Get(r,"Width");var height=p.TryGetProperty("height",out var ph)?ph.GetDouble():(double)Get(r,"Height");
   Call(w,"Move",Make("j3eG.A3e8",x-(double)Get(r,"X"),y-(double)Get(r,"Y")),Widgets(w),false,false,false,null);
   Set(style,"Size",Make("XlTr.IlTZ",width,height));
  }
  var visual=p.EnumerateObject().Where(x=>!new[]{"text","x","y","width","height"}.Contains(x.Name)).ToArray();
  if(visual.Length>0){
   if(capture)edits.Add(Make("Ygf5.ogfI",Widgets(w),false));
   var fontStyle=InvokeExact(style,"Copy");var fontFields=new List<string>();
   foreach(var v in visual){
    switch(v.Name){
     case "fill":Set(w,"Fill",Fill(v.Value.GetString()));break;
     case "borderColor":Set(w,"BorderFill",Fill(v.Value.GetString()));break;
     case "textColor":Set(fontStyle,"ForeGroundFill",Fill(v.Value.GetString()));fontFields.Add("FORE_GROUND_FILL");break;
     case "fontSize":Set(fontStyle,"FontSize",v.Value.GetDouble());fontFields.Add("FONT_SIZE");break;
     case "fontFamily":Set(fontStyle,"FontName",v.Value.GetString());fontFields.Add("FONT_NAME");break;
     case "bold":Set(fontStyle,"Bold",Enum.Parse(T("Axure.Constants.BoolOverride"),v.Value.GetBoolean()?"TRUE":"FALSE"));fontFields.Add("BOLD");break;
     case "opacity":Set(style,"Opacity",v.Value.GetDouble());break;
     case "cornerRadius":Set(w,"CornerRadius",v.Value.GetDouble());break;
     case "borderWidth":Set(w,"BorderWidth",v.Value.GetDouble());break;
     case "imageBase64":var stream=new MemoryStream(DecodePng(v.Value.GetString()),false);Set(w,"Image",Make("zjYB.XjYL",stream,"live-image.png",Guid.NewGuid().ToString(),false));break;
    }
   }
   if(fontFields.Count>0){var props=((IEnumerable)Get(fontStyle,"Props")).Cast<object>().Where(v=>fontFields.Contains(Call(v,"n3uL").ToString()));Call(w,"YBwn",Typed("q3uA.G3uT",props),false);}
  }
  return edits;
 }
 static void Commit(object client,object editor,object edit){Call(editor,"KBs7",edit,false);if(!ReferenceEquals(edit,NativeTop(client,editor,false)))throw new Exception("Native undo registration failed");UndoOwned.Push(edit);RedoOwned.Clear();}
 static object Combined(IEnumerable<object> edits)=>Make("VgLB.xgLL",new object[]{Typed("ugNN.cgNB",edits)});
 static readonly Dictionary<string,(string hash,object result)> Requests=new();
 static object Composition(JsonElement req,object svc,object client,object editor){
  var timer=Stopwatch.StartNew();var action=req.GetProperty("action").GetString();var page=Guid.Parse(req.GetProperty("pageId").GetString());var fragment=Call(svc,"LoadFragment",page);
  if(action=="read-many"){
   var readIds=req.GetProperty("widgetIds").EnumerateArray().Select(x=>Guid.Parse(x.GetString())).ToArray();if(readIds.Length<1||readIds.Length>200)throw new Exception("Read limit 200");
   return new{widgets=readIds.Select(id=>{var w=Resolve(svc,fragment,id);if(!Supported(w))throw new Exception("Unsupported leaf");var state=State(w);return new{widgetId=id,state,fingerprint=Fingerprint(state)};}).ToArray()};
  }
  if(action=="render-group"){
   var group=Resolve(svc,fragment,Guid.Parse(req.GetProperty("widgetId").GetString()));
   var renderIds=group.GetType().Name=="Layer"?((IEnumerable)Get(group,"DiagramObjects")).Cast<object>().Select(Id).ToArray():new[]{Id(group)};
   return Call(svc,"GetScreenshot","active",page,null,renderIds,1600);
  }
  if(faulted)throw new Exception("Bridge faulted; writes disabled");
  if(!ReferenceEquals(fragment,Call(client,"xBsb")))throw new Exception("Target page must be open");
  var requestId=req.GetProperty("requestId").GetString();if(!Guid.TryParse(requestId,out _))throw new Exception("requestId must be UUID");
  var dry=!req.TryGetProperty("dryRun",out var d)||d.GetBoolean();var hash=Fingerprint(req.GetRawText());
  if(!dry&&Requests.TryGetValue(requestId,out var cached)){if(cached.hash!=hash)throw new Exception("requestId reused with different payload");return cached.result;}
  if(Requests.Count>=500)throw new Exception("Session request history full; save and reconnect a fresh Axure session");
  var items=req.GetProperty("items").EnumerateArray().ToArray();if(items.Length<1||items.Length>150)throw new Exception("Batch limit 150");
  var ids=items.Select(i=>Guid.Parse(i.GetProperty(action=="compose"?"templateId":"widgetId").GetString())).ToArray();
  if(action=="batch"&&ids.Distinct().Count()!=ids.Length)throw new Exception("Each existing widget must occur once per batch");
  var sources=ids.Select(id=>Resolve(svc,fragment,id)).ToArray();
  for(int i=0;i<items.Length;i++){
   if(!Supported(sources[i]))throw new Exception("Only VectorShape and ImageBox templates supported");
   if(action=="batch"&&(bool)Get(sources[i],"IsLocked"))throw new Exception("Locked target");
   if(items[i].GetProperty("expectedFingerprint").GetString()!=Fingerprint(State(sources[i])))throw new Exception("Stale state at item "+i);
   ValidatePatch(items[i].GetProperty("patch"),sources[i]);
   if(action=="compose"){var name=items[i].GetProperty("name").GetString();if(string.IsNullOrWhiteSpace(name)||name.Length>100)throw new Exception("Invalid item name");}
  }
  var groupName=action=="compose"?req.GetProperty("groupName").GetString():null;
  if(action=="compose"&&(string.IsNullOrWhiteSpace(groupName)||groupName.Length>100))throw new Exception("Invalid group name");
  if(dry)return new{dryRun=true,count=items.Length,action,elapsedMs=timer.ElapsedMilliseconds};
  object result;
  try{
   if(action=="compose"){
    var root=Make("Axure.DocumentModel.Objects.Layer",fragment);Set(root,"Name",groupName);var created=new List<object>();
    for(int i=0;i<items.Length;i++){
     var clone=InvokeExact(sources[i],"Copy");if(Id(clone)==Id(sources[i]))throw new Exception("Clone ID collision");
     Set(clone,"Name",items[i].GetProperty("name").GetString());Set(clone,"IsLocked",false);
     Patch(clone,items[i].GetProperty("patch"),false);InvokeExact(root,"Add",clone,i);created.Add(clone);
    }
    var diagram=svc.GetType().GetMethod("ResolveDiagram",F).Invoke(null,new object[]{fragment,null});
    var edit=Make("qgLq.mgL7",Enum.Parse(T("Axure.DocumentModel.Edit.DiagramEditAction"),"Add"),diagram,Typed("wRsm.aRsa",new[]{root}.Concat(created)));
    Commit(client,editor,edit);
    result=new{action,groupId=Id(root),count=created.Count,widgets=created.Select(w=>new{widgetId=Id(w),state=State(w),fingerprint=Fingerprint(State(w))}).ToArray(),nativeUndo=true,saved=false,elapsedMs=timer.ElapsedMilliseconds};
   }else{
    var edits=new List<object>();for(int i=0;i<items.Length;i++)edits.AddRange(Patch(sources[i],items[i].GetProperty("patch"),true));
    if(edits.Count==0)throw new Exception("Empty batch");Commit(client,editor,Combined(edits));
    result=new{action,count=items.Length,widgets=sources.Select(w=>new{widgetId=Id(w),state=State(w),fingerprint=Fingerprint(State(w))}).ToArray(),nativeUndo=true,saved=false,elapsedMs=timer.ElapsedMilliseconds};
   }
  }catch{faulted=true;throw;}
  Requests.Add(requestId,(hash,result));return result;
 }
}
