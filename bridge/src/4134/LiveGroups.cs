using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

public static partial class LiveOperations {
 static object Ungroup(JsonElement req,object svc,object client,object editor){
  if(faulted)throw new Exception("Bridge faulted");
  var page=Guid.Parse(req.GetProperty("pageId").GetString());var fragment=Call(svc,"LoadFragment",page);
  if(!ReferenceEquals(fragment,Call(client,"VKEE")))throw new Exception("Target page must be open");
  var requestId=req.GetProperty("requestId").GetString();if(!Guid.TryParse(requestId,out _))throw new Exception("UUID required");
  var dry=!req.TryGetProperty("dryRun",out var d)||d.GetBoolean();var hash=Fingerprint(req.GetRawText());
  if(!dry&&Requests.TryGetValue(requestId,out var cached)){if(cached.hash!=hash)throw new Exception("requestId payload mismatch");return cached.result;}
  if(Requests.Count>=500)throw new Exception("Request cache full");
  var groupIds=req.GetProperty("groupIds").EnumerateArray().Select(x=>Guid.Parse(x.GetString())).ToArray();
  var expected=req.GetProperty("expectedWidgetIds").EnumerateArray().Select(x=>Guid.Parse(x.GetString())).ToArray();
  if(groupIds.Length<1||groupIds.Length>50||groupIds.Distinct().Count()!=groupIds.Length)throw new Exception("Invalid group IDs");
  if(expected.Length<1||expected.Length>500||expected.Distinct().Count()!=expected.Length)throw new Exception("Invalid expected widget IDs");
  var groups=groupIds.Select(id=>Resolve(svc,fragment,id)).ToArray();
  if(groups.Any(g=>g.GetType().Name!="Layer"))throw new Exception("Ungroup target must be Layer");
  var rows=groups.Select(g=>new{group=g,children=((IEnumerable)Get(g,"DiagramObjects")).Cast<object>().ToArray()}).ToArray();
  if(rows.Any(r=>r.children.Length<1||r.children.Any(c=>!Supported(c)||c.GetType().Name=="Layer")))throw new Exception("Only leaf-only bridge groups can be ungrouped");
  var actual=rows.SelectMany(r=>r.children).Select(Id).ToArray();
  if(actual.Distinct().Count()!=actual.Length||!actual.OrderBy(x=>x).SequenceEqual(expected.OrderBy(x=>x)))throw new Exception("Group membership differs from mapped widgets");
  if(dry)return new{dryRun=true,groups=groups.Length,widgets=actual.Length};
  try{
   var diagram=svc.GetType().GetMethod("ResolveDiagram",F).Invoke(null,new object[]{fragment,null});var edits=new List<object>();
   var retain=Enum.Parse(T("Axure.DocumentModel.RetainAnn"),"Children");
   foreach(var row in rows){
    var parent=Call(row.group,"jGhf");
    var delete=T("MsZ2.ysZS").GetMethod("fsZm",F).Invoke(null,new object[]{Typed("mGXa.OGXN",new[]{row.group}),retain});
    edits.Add(Make("GslB.Gsl2",diagram,Typed("mGXa.OGXN",row.children),row.group,parent,delete,true,true));
   }
   Commit(client,editor,Combined(edits));
   foreach(var row in rows)foreach(var child in row.children){var parent=Call(child,"jGhf");if(parent!=null&&groupIds.Contains(Id(parent)))throw new Exception("Ungroup verification failed");}
   var result=new{groupsRemoved=groups.Length,widgets=actual.Length,widgetIds=actual,nativeUndo=true,saved=false};
   Requests.Add(requestId,(hash,result));return result;
  }catch{faulted=true;throw;}
 }
}
