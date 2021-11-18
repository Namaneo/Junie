using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using JunieAPI.Extensions;
using JunieAPI.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;

namespace JunieAPI
{
    public class Startup
    {
        private readonly HttpClient _client = new HttpClient();

        private readonly IConfiguration _configuration;

        public Startup(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();
            services.AddCors(options => options.AddDefaultPolicy(policy =>
            {
                policy.AllowAnyHeader();
                policy.AllowAnyMethod();
                policy.AllowAnyOrigin();
            }));

            services.Configure<CommonOptions>(_configuration.GetSection("Common"));
            services.Configure<LibraryOptions>(_configuration.GetSection("Library"));
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, IOptions<CommonOptions> common, IOptions<LibraryOptions> library)
        {
            app.UseRouting();
            app.UseCors();

            app.UseDefaultFiles(env.ContentRootPath, common.Value.Applications.Web);
            app.UseStaticFiles(env.ContentRootPath,  common.Value.Applications.Web);

            app.UseStaticFiles(env.ContentRootPath, common.Value.Resources.Assets, "/assets");

            app.Map("/emulator", app =>
            {
                app.UseStaticFiles(env.ContentRootPath, common.Value.Applications.Emulator);

                app.UseStaticFiles(env.ContentRootPath, common.Value.Resources.Assets, "/assets");
                app.UseStaticFiles(env.ContentRootPath, common.Value.Resources.Games,  "/games");
                app.UseStaticFiles(env.ContentRootPath, common.Value.Resources.System, "/system");

                app.UseIndexFile(common.Value.Applications.Emulator);
            });

            app.Map("/api", app =>
            {
                app.UseRouting();
                app.UseEndpoints(endpoints => endpoints.MapControllers());
            });

            app.UseEndpoints(endpoints => endpoints.MapGet("/covers/{system}/{game}", async context =>
            {
                //TODO: ugly part, must be generic (?) and extracted from here
                string systemName = (string)context.Request.RouteValues["system"];
                string gameName   = (string)context.Request.RouteValues["game"];

                SystemOptions system = library.Value.First(x => x.Name == systemName);
                string coverPath = Path.Combine(common.Value.Resources.Games, system.Name, gameName);

                if (File.Exists(coverPath))
                {
                    byte[] cachedContent = await File.ReadAllBytesAsync(coverPath);
                    await context.Response.Body.WriteAsync(cachedContent, 0, cachedContent.Length);
                    return;
                }

                string url = $"https://raw.githubusercontent.com/libretro-thumbnails/{system.FullName.Replace(' ', '_')}/master/Named_Boxarts/{gameName}";

                HttpResponseMessage response = await _client.GetAsync(url);
                byte[] content = await response.Content.ReadAsByteArrayAsync();

                await File.WriteAllBytesAsync(coverPath, content);

                await context.Response.Body.WriteAsync(content, 0, content.Length);
            }));

            app.UseIndexFile(common.Value.Applications.Web);
        }
    }
}
