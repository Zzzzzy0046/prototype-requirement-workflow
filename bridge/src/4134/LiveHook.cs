using System;
using System.IO;
using System.Net;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Threading;

// Per-process startup hook. No installation patch, clipboard or input simulation.
internal class StartupHook {
 public static void Initialize() {
  var configPath=Environment.GetEnvironmentVariable("AXURE_LIVE_SESSION");
  Environment.SetEnvironmentVariable("AXURE_LIVE_SESSION",null);
  Environment.SetEnvironmentVariable("DOTNET_STARTUP_HOOKS",null);
  if(string.IsNullOrEmpty(configPath))return;
  try {
   var config=File.ReadAllText(configPath);var settings=JsonDocument.Parse(config).RootElement;
   var port=settings.GetProperty("port").GetInt32();var token=settings.GetProperty("token").GetString();
   if(port<1024||port>65535||token.Length!=64)return;
   new Thread(()=>Serve(port,token,config)){IsBackground=true,Name="AxureLiveBridge"}.Start();
  }catch{/* A failed bridge must not crash Axure. */}
 }
 static void Serve(int port,string token,string config) {
  try {
   // Load once: operation history and identity remain stable; no arbitrary code endpoint.
   for(int i=0;i<100&&System.Windows.Forms.Application.OpenForms.Count==0;i++)Thread.Sleep(300); Thread.Sleep(2500); var dll=Path.Combine(Path.GetDirectoryName(typeof(StartupHook).Assembly.Location),"LiveOperations.dll");
   var handler=Assembly.LoadFrom(dll).GetType("LiveOperations").GetMethod("Handle");
   using var listener=new HttpListener();listener.Prefixes.Add($"http://127.0.0.1:{port}/");listener.Start();
   listener.TimeoutManager.EntityBody=TimeSpan.FromSeconds(10);
   while(true){var c=listener.GetContext();try{
    c.Response.ContentType="application/json";
    if(c.Request.Headers["X-Axure-Bridge-Token"]!=token||c.Request.Headers["Origin"]!=null){c.Response.StatusCode=403;continue;}
    if(c.Request.HttpMethod!="POST"||c.Request.Url.AbsolutePath!="/operations"){c.Response.StatusCode=404;continue;}
    if(c.Request.ContentLength64<0||c.Request.ContentLength64>2097152){c.Response.StatusCode=413;continue;}
    var raw=new byte[(int)c.Request.ContentLength64];var count=0;
    while(count<raw.Length){var n=c.Request.InputStream.Read(raw,count,raw.Length-count);if(n==0)throw new IOException("Incomplete body");count+=n;}
    var result=handler.Invoke(null,new object[]{Encoding.UTF8.GetString(raw),config});
    var bytes=JsonSerializer.SerializeToUtf8Bytes(result);c.Response.ContentLength64=bytes.Length;c.Response.OutputStream.Write(bytes);
   }catch{c.Response.StatusCode=500;}finally{c.Response.Close();}}
  }catch{/* Isolated endpoint failure only. */}
 }
}
