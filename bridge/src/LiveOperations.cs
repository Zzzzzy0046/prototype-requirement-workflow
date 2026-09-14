using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;

public static partial class LiveOperations {
 const BindingFlags F=BindingFlags.Public|BindingFlags.NonPublic|BindingFlags.Instance|BindingFlags.Static;
 static Assembly App=>AppDomain.CurrentDomain.GetAssemblies().First(a=>a.GetName().Name=="AxureRP11");
 static Type T(string n)=>App.GetType(n,true);
 static object Call(object o,string n,params object[] args)=>o.GetType().GetMethod(n,F).Invoke(o,args);
 static object Get(object o,string n)=>o.GetType().GetProperty(n,F).GetValue(o);
 static void Set(object o,string n,object v)=>o.GetType().GetProperty(n,F).SetValue(o,v);
 static object Make(string n,params object[] args)=>Activator.CreateInstance(T(n),F,null,args,null);
 static readonly Stack<object> UndoOwned=new();static readonly Stack<object> RedoOwned=new();
 static bool faulted=false;
 static Dictionary<string,object> State(object widget){
  var rect=Get(widget,"Rect");var style=Get(widget,"MyStyle");
  return new Dictionary<string,object>{["text"]=Get(widget,"Text"),["x"]=Get(rect,"X"),["y"]=Get(rect,"Y"),["width"]=Get(rect,"Width"),["height"]=Get(rect,"Height"),["cornerRadius"]=Get(widget,"CornerRadius"),["borderWidth"]=Get(widget,"BorderWidth"),["opacity"]=Get(style,"Opacity"),["fill"]=ColorText(Get(widget,"Fill")),["borderColor"]=ColorText(Get(widget,"BorderFill")),["textColor"]=ColorText(TextStyle(widget,"FORE_GROUND_FILL")),["fontSize"]=TextStyle(widget,"FONT_SIZE"),["fontFamily"]=TextStyle(widget,"FONT_NAME"),["bold"]=TextStyle(widget,"BOLD")?.ToString(),["name"]=Get(widget,"Name"),["type"]=widget.GetType().Name,["imageKey"]=ImageHash(widget)};
 }
 static string Fingerprint(object state)=>Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(state))).ToLowerInvariant();
 static double Number(JsonElement changes,string name,double min,double max){var n=changes.GetProperty(name).GetDouble();if(!double.IsFinite(n)||n<min||n>max)throw new Exception("Out of range: "+name);return n;}
 static Array Widgets(object widget){var a=Array.CreateInstance(T("wRsm.aRsa"),1);a.SetValue(widget,0);return a;}
 static object NativeTop(object client,object editor,bool redo){var list=(IList)T("lNn.RNk").GetMethod(redo?"KyS":"Hvz",F).Invoke(client,new[]{editor});return list.Count>0?list[list.Count-1]:null;}
 public static object Handle(string body,string config){
  try {
   var req=JsonDocument.Parse(body).RootElement;var settings=JsonDocument.Parse(config).RootElement;
   if(App.GetName().Version.ToString()!="11.0.0.4149")throw new Exception("Unsupported Axure build; writes disabled");
   var action=req.GetProperty("action").GetString();
   var dir=T("Axure.McpServer.InProcDocumentDirectory");
   var clients=((IEnumerable)dir.GetMethod("OpenClients",F).Invoke(null,null)).Cast<object>().ToArray();
   if(clients.Length!=1)throw new Exception("Exactly one document must be open in this bridge process");
   var client=clients[0];var svc=Make("Axure.McpServer.DocumentToolService",client);
   return svc.GetType().GetMethod("OnUi",F).MakeGenericMethod(typeof(object)).Invoke(svc,new object[]{new Func<object>(()=>{
    var docs=JsonSerializer.SerializeToElement(dir.GetMethod("ListDocuments",F).Invoke(Activator.CreateInstance(dir,true),null));
    if(docs.GetArrayLength()!=1)throw new Exception("Document list changed");
    var path=docs[0].GetProperty("FilePath").GetString();
    if(string.IsNullOrWhiteSpace(path))throw new Exception("DOCUMENT_NOT_READY: Axure has not loaded a file. Check its error/recovery dialog; no write attempted.");
    if(!string.Equals(Path.GetFullPath(path),Path.GetFullPath(settings.GetProperty("document").GetString()),StringComparison.OrdinalIgnoreCase))throw new Exception("Document is not the bound project: "+path);
    var editor=Call(client,"EBU2");
    if(action=="status")return new{pid=Environment.ProcessId,version=App.GetName().Version.ToString(),document=path,documents=docs,mode=settings.TryGetProperty("mode",out var mode)?mode.GetString():"experimental-copy-only",faulted,undoOwned=UndoOwned.Count,redoOwned=RedoOwned.Count};
    if(action=="sitemap")return Call(svc,"GetSitemap","active");
    if(action=="page")return Call(svc,"GetPage","active",Guid.Parse(req.GetProperty("pageId").GetString()),(int?)2,false);
    if(action=="render-page")return Call(svc,"GetScreenshot","active",Guid.Parse(req.GetProperty("pageId").GetString()),null,null,1600);
    if(action=="create-shapes")return CreateShapes(req,svc,client,editor);
    if(action=="create-page")return CreatePage(req,svc,client);
    if(action=="open-page"){
     if(faulted)throw new Exception("Bridge faulted");
     var pageId=Guid.Parse(req.GetProperty("pageId").GetString());Call(svc,"LoadFragment",pageId);
     Call(client,"IBsg",pageId,Guid.Empty,false);
     var active=Call(client,"xBsb");return new{pageId,activeId=active==null?Guid.Empty:Id(active)};
    }
    if(new[]{"read-many","compose","batch","render-group"}.Contains(action))return Composition(req,svc,client,editor);
    if(action=="save"){
     if(faulted)throw new Exception("Bridge faulted; no further writes");
     Call(client,"CommitOuterObject",true);var doc=T("lNn.RNk").GetField("GMr",F).GetValue(client);Call(doc,"Save");
     return new{saved=true,document=path};
    }
    if(action=="close-saved"){
     if(faulted)throw new Exception("Bridge faulted; refusing save/close");
     Call(client,"CommitOuterObject",true);Call(T("lNn.RNk").GetField("GMr",F).GetValue(client),"Save");
     Call(client,"CloseClient");return new{closed=true,saved=true,document=path};
    }
    if(action=="undo"||action=="redo"){
     if(faulted)throw new Exception("Bridge faulted; no further writes");
     var redo=action=="redo";var source=redo?RedoOwned:UndoOwned;var dest=redo?UndoOwned:RedoOwned;
     if(source.Count==0||!ReferenceEquals(source.Peek(),NativeTop(client,editor,redo)))throw new Exception("Native history changed or no bridge-owned edit; refusing to undo user work");
     var change=source.Peek();Call(client,redo?"Redo":"Undo",new object[]{null});
     if(!ReferenceEquals(change,NativeTop(client,editor,!redo)))throw new Exception("Native history transition not confirmed");
     dest.Push(source.Pop());return new{action,success=true};
    }
    if(!new[]{"read","edit","screenshot"}.Contains(action))throw new Exception("Unsupported action");
    var page=Guid.Parse(req.GetProperty("pageId").GetString());var id=Guid.Parse(req.GetProperty("widgetId").GetString());
    var fragment=Call(svc,"LoadFragment",page);
    var widget=svc.GetType().GetMethod("ResolveWidget",F).Invoke(null,new object[]{fragment,id.ToString(),null});
    if(action=="screenshot")return Call(svc,"GetScreenshot","active",page,null,new Guid[]{id},1200);
    if(!Supported(widget))throw new Exception("Current live adapter supports VectorShape and ImageBox only");
    var before=State(widget);var fingerprint=Fingerprint(before);
    if(action=="read")return new{pageId=page,widgetId=id,state=before,fingerprint};
    if(faulted)throw new Exception("Bridge faulted; no further writes");
    if((bool)Get(widget,"IsLocked"))throw new Exception("Widget is locked");
    if(!ReferenceEquals(fragment,Call(client,"xBsb")))throw new Exception("Open the target page in Axure before editing; inactive pages cannot be edited");
    if(req.GetProperty("expectedFingerprint").GetString()!=fingerprint)throw new Exception("Stale widget state; read again before editing");
    var kind=req.GetProperty("kind").GetString();var changes=req.GetProperty("changes");
    var allowed=kind switch{"text"=>new[]{"text"},"move"=>new[]{"dx","dy"},"resize"=>new[]{"width","height"},"style"=>new[]{"cornerRadius","borderWidth","opacity"},_=>throw new Exception("Unsupported edit kind")};
    if(changes.ValueKind!=JsonValueKind.Object||!changes.EnumerateObject().Any()||changes.EnumerateObject().Any(p=>!allowed.Contains(p.Name)))throw new Exception("Unknown or empty changes");
    string text=null;double dx=0,dy=0,width=0,height=0;var numbers=new Dictionary<string,double>();
    if(kind=="text"){text=changes.GetProperty("text").GetString();if(text==null||text.Length>500||text.Contains('\n')||text.Contains('\r'))throw new Exception("Single-line text up to 500 characters only");}
    if(kind=="move"){dx=Number(changes,"dx",-1000,1000);dy=Number(changes,"dy",-1000,1000);}
    if(kind=="resize"){width=Number(changes,"width",1,4000);height=Number(changes,"height",1,4000);}
    if(kind=="style")foreach(var p in changes.EnumerateObject())numbers[p.Name]=Number(changes,p.Name,0,p.Name=="opacity"?1:p.Name=="borderWidth"?20:200);
    if(!req.TryGetProperty("dryRun",out var dry)||dry.GetBoolean())return new{dryRun=true,kind,changes,before,fingerprint};
    object edit=null;
    try {
     if(kind=="text"){
      var attr=Get(widget,"AttributedString");var font=Call(attr,"AB71");var newAttr=attr.GetType().GetMethod("ugsp",F).Invoke(null,new object[]{text,font});
      edit=Make("Qu4q.ou47",widget,newAttr);
     }else if(kind=="move"||kind=="resize"){
      edit=Make("SgQl.sgQ3",widget);
      if(kind=="move")Call(widget,"Move",Make("j3eG.A3e8",dx,dy),Widgets(widget),false,false,false,null);
      else Set(Get(widget,"MyStyle"),"Size",Make("XlTr.IlTZ",width,height));
     }else{
      edit=Make("Ygf5.ogfI",Widgets(widget),false);
      foreach(var p in numbers)Set(p.Key=="opacity"?Get(widget,"MyStyle"):widget,p.Key=="opacity"?"Opacity":p.Key=="cornerRadius"?"CornerRadius":"BorderWidth",p.Value);
     }
     Call(editor,"KBs7",edit,false);
     if(!ReferenceEquals(edit,NativeTop(client,editor,false)))throw new Exception("Edit did not become the native undo top");
     UndoOwned.Push(edit);RedoOwned.Clear();var after=State(widget);
     return new{kind,before,after,fingerprint=Fingerprint(after),nativeUndo=true,saved=false};
    }catch{faulted=true;throw;}
   })});
  }catch(Exception e){while(e.InnerException!=null)e=e.InnerException;return new{error=e.GetType().Name,message=e.Message,faulted};}
 }
}
