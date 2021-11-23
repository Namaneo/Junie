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
    }
}