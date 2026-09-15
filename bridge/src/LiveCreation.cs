using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
public static partial class LiveOperations {
 static object CreateShapes(JsonElement req,object svc,object client,object editor){
  if(faulted)throw new Exception("Bridge faulted");
  var page=Guid.Parse(req.GetProperty("pageId").GetString());var fragment=Call(svc,"LoadFragment",page);
  if(!ReferenceEquals(fragment,Call(client,"xBsb")))throw new Exception("Target page must be open");
  var requestId=req.GetProperty("requestId").GetString();if(!Guid.TryParse(requestId,out _))throw new Exception("UUID required");
  var dry=!req.TryGetProperty("dryRun",out var d)||d.GetBoolean();var hash=Fingerprint(req.GetRawText());
  if(!dry&&Requests.TryGetValue(requestId,out var cached)){if(cached.hash!=hash)throw new Exception("requestId payload mismatch");return cached.result;}
  if(Requests.Count>=500)throw new Exception("Request cache full");
  var items=req.GetProperty("items").EnumerateArray().ToArray();if(items.Length<1||items.Length>150)throw new Exception("Limit 150");
  var leaves=new List<object>();
  foreach(var item in items){
   var shape=item.GetProperty("shape").GetString();if(!new[]{"Rectangle","Paragraph","Ellipse"}.Contains(shape))throw new Exception("Unsupported shape");
   var leafName=item.GetProperty("name").GetString();if(string.IsNullOrWhiteSpace(leafName)||leafName.Length>100)throw new Exception("Invalid name");
   var w=Make("Axure.DocumentModel.Objects.VectorShape",fragment,Enum.Parse(T("Axure.Platform.Shape"),shape),leafName,Enum.Parse(T("Axure.DocumentModel.Objects.VectorLegacyType"),"None"),false);
   Set(w,"Name",leafName);ValidatePatch(item.GetProperty("patch"),w);leaves.Add(w);
  }
  if(dry)return new{dryRun=true,count=leaves.Count};
  try{
   for(int i=0;i<leaves.Count;i++)Patch(leaves[i],items[i].GetProperty("patch"),false);
   var diagram=svc.GetType().GetMethod("ResolveDiagram",F).Invoke(null,new object[]{fragment,null});
   Commit(client,editor,Make("qgLq.mgL7",Enum.Parse(T("Axure.DocumentModel.Edit.DiagramEditAction"),"Add"),diagram,Typed("wRsm.aRsa",leaves)));
   var result=new{count=leaves.Count,widgets=leaves.Select(w=>new{widgetId=Id(w),state=State(w),fingerprint=Fingerprint(State(w))}).ToArray(),nativeUndo=true,ungrouped=true,saved=false};
   Requests.Add(requestId,(hash,result));return result;
  }catch{faulted=true;throw;}
 }
}
