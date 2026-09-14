using System;
using System.IO;
using System.Linq;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Windows.Forms;

// Built once per exact supported legacy build. No public arbitrary-reflection endpoint.
internal static class LegacyNative {
 internal const BindingFlags F=BindingFlags.Public|BindingFlags.NonPublic|BindingFlags.Instance|BindingFlags.Static;
 internal static Assembly App=>AppDomain.CurrentDomain.GetAssemblies().First(a=>a.GetName().Name=="AxureRP11");
 internal static object Call(object o,string n,params object[] a)=>o.GetType().GetMethod(n,F).Invoke(o,a);
 internal static object Get(object o,string n)=>o.GetType().GetProperty(n,F)?.GetValue(o);
 internal static Guid Id(object o)=>(Guid)App.GetType("itcK.ftcZ",true).GetMethod("Rtc0",F).Invoke(o,null);
 internal static Guid PageId(object o)=>(Guid)Call(o,"ktol");
 internal static IEnumerable<FieldInfo> Fields(Type type){for(var t=type;t!=null&&t.Assembly==type.Assembly;t=t.BaseType)foreach(var f in t.GetFields(F|BindingFlags.DeclaredOnly))yield return f;}
 internal static string Document(object c){var paths=Fields(c.GetType()).Where(f=>!f.IsStatic&&f.FieldType==typeof(string)).Select(f=>f.GetValue(c) as string).Where(s=>!string.IsNullOrWhiteSpace(s)&&Path.IsPathFullyQualified(s)&&s.EndsWith(".rp",StringComparison.OrdinalIgnoreCase)).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();if(paths.Length!=1)throw new Exception("DOCUMENT_NOT_READY: expected one bound RP path");return paths[0];}
 internal static IEnumerable<object> Children(object o){var seen=new HashSet<object>(ReferenceEqualityComparer.Instance){o};IEnumerable<object> Visit(object parent){if(Get(parent,"DiagramObjects") is IEnumerable xs)foreach(var x in xs){if(!seen.Add(x))continue;yield return x;foreach(var y in Visit(x))yield return y;}}return Visit(o);}
}
internal sealed class LegacyDirectory {
 public static object[] OpenClients(){
  var t=LegacyNative.App.GetType("sS8.qSE",true);var result=new List<object>();
  foreach(var f in t.GetFields(LegacyNative.F).Where(f=>f.IsStatic)){
   var v=f.GetValue(null);if(v==null)continue;if(t.IsInstanceOfType(v))result.Add(v);
   if(v.GetType().IsGenericType&&v.GetType().GetGenericTypeDefinition()==typeof(WeakReference<>)){var args=new object[]{null};if((bool)v.GetType().GetMethod("TryGetTarget").Invoke(v,args)&&args[0]!=null&&t.IsInstanceOfType(args[0]))result.Add(args[0]);}
  }return result.Distinct().ToArray();
 }
 public object ListDocuments()=>OpenClients().Select(c=>new{FilePath=LegacyNative.Document(c),FileName=Path.GetFileName(LegacyNative.Document(c))}).ToArray();
}
internal sealed class LegacyDocumentService {
 readonly object client;
 public LegacyDocumentService(object c){client=c;}
 public T OnUi<T>(Func<T> action){if(Application.OpenForms.Count==0)throw new Exception("DOCUMENT_NOT_READY");var form=Application.OpenForms[0];if(!form.IsHandleCreated)throw new Exception("DOCUMENT_NOT_READY");return form.InvokeRequired?(T)form.Invoke(action):action();}
 public object LoadFragment(Guid id){var current=LegacyNative.Call(client,"VKEE");if(current==null||LegacyNative.PageId(current)!=id){var pages=(IEnumerable<PageNode>)((Sitemap)GetSitemap("active")).Pages;if(!Flatten(pages).Any(p=>p.Id==id.ToString()&&p.Type=="Page"))throw new Exception("Unknown page ID");LegacyNative.Call(client,"QKEh",id,Guid.Empty,false);current=LegacyNative.Call(client,"VKEE");}if(current==null||LegacyNative.PageId(current)!=id)throw new Exception("Page activation failed");return current;}
 static IEnumerable<PageNode> Flatten(IEnumerable<PageNode> nodes){foreach(var p in nodes){yield return p;foreach(var c in Flatten(p.Children))yield return c;}}
 public sealed class PageNode {public string Id{get;set;}public string Name{get;set;}public string Type{get;set;}public List<PageNode> Children{get;set;}=new();}
 public sealed class Sitemap {public string DocumentId{get;set;}="active";public string FileName{get;set;}public List<PageNode> Pages{get;set;}}
 public object GetSitemap(string active){
  var project=LegacyNative.Call(client,"rKEP");var tree=LegacyNative.Call(project,"DGOs");var root=LegacyNative.Call(tree,"lgqk");
  List<PageNode> Visit(object parent){var result=new List<PageNode>();foreach(var node in (IEnumerable)LegacyNative.Call(parent,"lGfr")){var val=LegacyNative.Call(tree,"mgqP",node);Guid id=val is Guid g?g:(Guid)LegacyNative.Call(val,"dGfB");result.Add(new PageNode{Id=id.ToString(),Name=(string)LegacyNative.Call(tree,"iKrk",node),Type="Page",Children=Visit(node)});}return result;}
  return new Sitemap{FileName=Path.GetFileName(LegacyNative.Document(client)),Pages=Visit(root)};
 }
 public static object ResolveDiagram(object fragment,Guid? sub){if(sub!=null)throw new Exception("Legacy subdiagram access not supported");return LegacyNative.Call(fragment,"bGvl");}
 public static object ResolveWidget(object fragment,string id,Guid? sub){if(sub!=null)throw new Exception("Legacy subdiagram access not supported");var guid=Guid.Parse(id);return LegacyNative.Children(fragment).Single(w=>LegacyNative.Id(w)==guid);}
 public object GetPage(string active,Guid id,int? depth,bool notes){var p=LoadFragment(id);return new{Id=id,Name=LegacyNative.Get(p,"Name"),Widgets=LegacyNative.Children(p).Select(w=>new{Id=LegacyNative.Id(w),Name=LegacyNative.Get(w,"Name"),Type=w.GetType().Name,Text=LegacyNative.Get(w,"Text")}).ToArray()};}
 public object GetScreenshot(string active,Guid id,Guid? sub,IReadOnlyList<Guid> ids,int max){
  var fragment=LoadFragment(id);var diagram=ResolveDiagram(fragment,sub);object bitmap;
  if(ids==null||ids.Count==0)bitmap=LegacyNative.Call(diagram,"SGRi",false,false,false,false);
  else{var array=Array.CreateInstance(LegacyNative.App.GetType("mGXa.OGXN",true),ids.Count);for(int i=0;i<ids.Count;i++)array.SetValue(ResolveWidget(fragment,ids[i].ToString(),null),i);bitmap=LegacyNative.Call(diagram,"eGRU",false,array,null,false);}
  try{using var stream=(Stream)LegacyNative.Call(bitmap,"oS9R",Enum.Parse(LegacyNative.App.GetType("Axure.Platform.AxImageFormat",true),"Png",true),false);using var memory=new MemoryStream();stream.CopyTo(memory);return new{Data=Convert.ToBase64String(memory.ToArray()),MimeType="image/png",Description="Axure native page model render (legacy adapter)"};}finally{(bitmap as IDisposable)?.Dispose();}
 }
}
