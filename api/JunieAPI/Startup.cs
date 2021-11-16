using System.IO;
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

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, IOptions<CommonOptions> options)
        {
            app.UseRouting();
            app.UseCors();

            app.UseDefaultFiles(env.ContentRootPath, options.Value.Applications.Web);
            app.UseStaticFiles(env.ContentRootPath,  options.Value.Applications.Web);

            app.UseStaticFiles(env.ContentRootPath, options.Value.Assets.Web, "/assets");

            app.Map("/emulator", app =>
            {
                app.UseStaticFiles(env.ContentRootPath, options.Value.Applications.Emulator);

                app.UseStaticFiles(env.ContentRootPath, options.Value.Assets.Games,    "/games");
                app.UseStaticFiles(env.ContentRootPath, options.Value.Assets.System,   "/system");
                app.UseStaticFiles(env.ContentRootPath, options.Value.Assets.Emulator, "/assets");

                app.UseIndexFile(options.Value.Applications.Emulator);
            });

            app.Map("/api", app =>
            {
                app.UseRouting();
                app.UseEndpoints(endpoints => endpoints.MapControllers());
            });

            app.UseIndexFile(options.Value.Applications.Web);
        }
    }
}
