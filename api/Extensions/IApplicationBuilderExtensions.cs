using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.FileProviders;

namespace JunieAPI.Extensions
{
    public static class IApplicationBuilderExtensions
    {
        public static IApplicationBuilder UseDefaultFiles(this IApplicationBuilder app, string basePath, string physicalPath, string requestPath = "")
        {
            return app.UseDefaultFiles(new DefaultFilesOptions
            {
                FileProvider = new PhysicalFileProvider(Path.Combine(basePath, physicalPath)),
                RequestPath = requestPath,
            });
        }

        public static IApplicationBuilder UseStaticFiles(this IApplicationBuilder app, string basePath, string physicalPath, string requestPath = "")
        {
            return app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(Path.Combine(basePath, physicalPath)),
                RequestPath = requestPath,
                ServeUnknownFileTypes = true,
            });
        }

        public static IApplicationBuilder UseIndexFile(this IApplicationBuilder app, string physicalPath)
        {
            return app.Use(async (context, task) =>
            {
                var file = File.ReadAllBytes(Path.Combine(physicalPath, "index.html"));
                context.Response.ContentType = "text/html";
                await context.Response.Body.WriteAsync(file);
            });
        }
    }
}