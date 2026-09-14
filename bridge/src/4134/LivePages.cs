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
   Call(client,"CommitOuterObject",true);var project=Call(client,"rKEP");var doc=Call(client,"xKEV");
   stage="construct";var page=Make("qGac.aGaW",project,Call(client,"IKE1"));
   var id=(Guid)Call(page,"ktol");var type=(string)Get(page,"TypeName");
   stage="register";var info=Call(project,"xtkx",id,type,name);
   stage="package";Call(doc,"mgB9",page,Call(page,"mGYP"));
   stage="tree";var tree=Call(project,"DGOs");var root=Call(tree,"lgqk");var children=(IList)Call(root,"lGfr");var before=children.Count;
   // Sitemap nodes store the page Guid, not the PackageInfo object.
   stage="insert";var node=Call(tree,"Jgqu",null,root,before,id);
   var after=((IList)Call(root,"lGfr")).Count;
   var map=Call(svc,"GetSitemap","active");
   var pages=JsonSerializer.SerializeToElement(map).GetProperty("Pages").EnumerateArray().ToArray();
   if(after!=before+1||pages.Count(p=>p.GetProperty("Id").GetString()==id.ToString()&&p.GetProperty("Name").GetString()==name)!=1)throw new Exception("Sitemap postcondition failed");
   stage="open";Call(client,"QKEh",id,Guid.Empty,false);
   if(!ReferenceEquals(Call(svc,"LoadFragment",id),Call(client,"VKEE")))throw new Exception("New page is not active");
   var result=new{pageId=id,name,sitemap=map,saved=false,nativeUndo=false,active=true};
   Requests.Add(requestId,(hash,result));return result;
  }catch(Exception ex){faulted=true;throw new Exception("Create page failed at "+stage+"; writes disabled. "+ex.GetBaseException().Message);}
 }
}
