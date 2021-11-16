using System.IO;
using JunieAPI.Extensions;
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

            app.UseDefaultFiles(env.ContentRootPath, "../../ui/build", "");
            app.UseStaticFiles(env.ContentRootPath,  "../../ui/build", "");

            app.UseStaticFiles(env.ContentRootPath, "Assets", "/assets");

            app.Map("/emulator", app =>
            {
                app.UseStaticFiles(env.ContentRootPath, "../../app/bin",    "");
                app.UseStaticFiles(env.ContentRootPath, "../../games",      "/games");
                app.UseStaticFiles(env.ContentRootPath, "../../system",     "/system");
                app.UseStaticFiles(env.ContentRootPath, "../../app/assets", "/assets");

                app.UseIndexFile("../../app/bin/");
            });

            app.Map("/api", app =>
            {
                app.UseRouting();
                app.UseEndpoints(endpoints => endpoints.MapControllers());
            });

            app.UseIndexFile("../../ui/build");
        }
    }
}
