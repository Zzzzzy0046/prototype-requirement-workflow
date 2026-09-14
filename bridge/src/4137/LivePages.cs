using System;
using System.Collections;
using System.Linq;
using System.Text.Json;
public static partial class LiveOperations {
 static object CreatePage(JsonElement req,object svc,object client){
  if(faulted)throw new Exception("Bridge faulted");
  var name=req.GetProperty("name").GetString();if(string.IsNullOrWhiteSpace(name)||name.Length>100||name.Any(char.IsControl))throw new Exception("Invalid name");
  var requestId=req.GetProperty("requestId").GetString();if(!Guid.TryParse(requestId,out _))throw new Exception("UUID required");
  var dry=!req.TryGetProperty("dryRun",out var d)||d.GetBoolean();var hash=Fingerprint(req.GetRawText());
  if(!dry&&Requests.TryGetValue(requestId,out var cached)){if(cached.hash!=hash)throw new Exception("requestId payload mismatch");return cached.result;}
  if(Requests.Count>=500)throw new Exception("Request cache full");
  if(dry)return new{dryRun=true,name};
  var stage="commit";
  try{
   Call(client,"CommitOuterObject",true);var project=Call(client,"Wap4");var doc=Call(client,"cap2");
   stage="construct";var page=Make("qL0l.wL0Y",project,Call(client,"Qap6"));
   var id=(Guid)Call(page,"tock");var type=(string)Get(page,"TypeName");
   stage="register";var info=Call(project,"FoCi",id,type,name);
   stage="package";Call(doc,"DRbL",page,Call(page,"vL14"));
   stage="tree";var tree=Call(project,"CLQF");var root=Call(tree,"cRvX");var children=(IList)Call(root,"fLdd");var before=children.Count;
   // Sitemap nodes store the page Guid, not the PackageInfo object.
   stage="insert";var node=Call(tree,"YRv9",null,root,before,id);
   var after=((IList)Call(root,"fLdd")).Count;
   var map=Call(svc,"GetSitemap","active");
   var pages=JsonSerializer.SerializeToElement(map).GetProperty("Pages").EnumerateArray().ToArray();
   if(after!=before+1||pages.Count(p=>p.GetProperty("Id").GetString()==id.ToString()&&p.GetProperty("Name").GetString()==name)!=1)throw new Exception("Sitemap postcondition failed");
   stage="open";Call(client,"Gapc",id,Guid.Empty,false);
   if(!ReferenceEquals(Call(svc,"LoadFragment",id),Call(client,"XapS")))throw new Exception("New page is not active");
   var result=new{pageId=id,name,sitemap=map,saved=false,nativeUndo=false,active=true};
   Requests.Add(requestId,(hash,result));return result;
  }catch(Exception ex){faulted=true;throw new Exception("Create page failed at "+stage+"; writes disabled. "+ex.GetBaseException().Message);}
 }
}
