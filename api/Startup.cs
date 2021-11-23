using JunieAPI.Extensions;
using JunieAPI.Managers;
using JunieAPI.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

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
            services.Configure<LibraryOptions>(_configuration.GetSection("Library"));

            services.AddSingleton<CoversManager>();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, IOptions<CommonOptions> common, CoversManager covers)
        {
            app.UseRouting();
            app.UseCors();

            app.UseDefaultFiles(env.ContentRootPath, common.Value.Binaries.Web);
            app.UseStaticFiles(env.ContentRootPath,  common.Value.Binaries.Web);

            app.UseStaticFiles(env.ContentRootPath, common.Value.Resources.UI, "/assets");

            app.Map("/app", app =>
            {
                app.UseDefaultFiles(env.ContentRootPath, common.Value.Binaries.App);
                app.UseStaticFiles(env.ContentRootPath,  common.Value.Binaries.App);
                
                app.UseStaticFiles(env.ContentRootPath, common.Value.Resources.App,    "/assets");
                app.UseStaticFiles(env.ContentRootPath, common.Value.Resources.Games,  "/games");
                app.UseStaticFiles(env.ContentRootPath, common.Value.Resources.System, "/system");
            });

            app.Map("/api", app =>
            {
                app.UseRouting();
                app.UseEndpoints(endpoints => endpoints.MapControllers());
            });

            app.UseEndpoints(endpoints => endpoints.MapGet("/covers/{system}/{game}", async context =>
            {
                string systemName = (string)context.Request.RouteValues["system"];
                string gameName   = (string)context.Request.RouteValues["game"];

                await covers.SendCover(context, systemName, gameName);
            }));
        }
    }
}
