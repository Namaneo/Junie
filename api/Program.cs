using System;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace JunieAPI
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) 
        {
            string portStr = Environment.GetEnvironmentVariable("PORT");
            ushort port = String.IsNullOrEmpty(portStr) ? (ushort)5000 : ushort.Parse(portStr); 

            return Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.ConfigureKestrel(x => x.ListenAnyIP(port));
                });
        }
    }
}
