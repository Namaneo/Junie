using System.IO;
using JunieAPI.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;

namespace JunieAPI
{
    public class Startup
    {
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
            services.Configure<SystemsOptions>(_configuration.GetSection("Systems"));
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseRouting();
            app.UseCors();

            app.UseDefaultFiles(new DefaultFilesOptions
            {
                FileProvider = new PhysicalFileProvider(Path.Combine(env.ContentRootPath, "../../ui/build")),
                RequestPath = ""
            });

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(Path.Combine(env.ContentRootPath, "../../ui/build")),
                RequestPath = ""
            });
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(Path.Combine(env.ContentRootPath, "Assets")),
                RequestPath = "/assets"
            });

            app.Map("/emulator", app =>
            {
                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = new PhysicalFileProvider(Path.Combine(env.ContentRootPath, "../../app/bin")),
                    RequestPath = "",
                    ServeUnknownFileTypes = true,
                });

                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = new PhysicalFileProvider(Path.Combine(env.ContentRootPath, "../../games")),
                    RequestPath = "/games",
                    ServeUnknownFileTypes = true,
                });

                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = new PhysicalFileProvider(Path.Combine(env.ContentRootPath, "../../system")),
                    RequestPath = "/system",
                    ServeUnknownFileTypes = true,
                });

                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = new PhysicalFileProvider(Path.Combine(env.ContentRootPath, "../../app/assets")),
                    RequestPath = "/assets",
                    ServeUnknownFileTypes = true,
                });

                app.Use(async (context, task) =>
                {
                    var file = File.ReadAllBytes("../../app/bin/index.html");
                    context.Response.ContentType = "text/html";
                    await context.Response.Body.WriteAsync(file);
                });
            });

            app.Map("/api", app =>
            {
                app.UseRouting();
                app.UseEndpoints(endpoints => endpoints.MapControllers());
            });

            app.Use(async (context, task) =>
            {
                var file = File.ReadAllBytes("../../ui/build/index.html");
                context.Response.ContentType = "text/html";
                await context.Response.Body.WriteAsync(file);
            });
        }
    }
}
