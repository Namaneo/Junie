using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using JunieAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace JunieAPI.Managers
{
    public class CoversManager
    {
        private static readonly HttpClient _client = new HttpClient();

        private readonly IOptions<CommonOptions> _common;
        private readonly IOptions<LibraryOptions> _library;

        public CoversManager(IOptions<CommonOptions> common, IOptions<LibraryOptions> library)
        {
            _common = common;
            _library = library;
        }

        public async Task SendCover(HttpContext context, string systemName, string gameName)
        {
            SystemOptions system = _library.Value.First(x => x.Name == systemName);
            string coverPath = Path.Combine(_common.Value.Resources.Games, system.Name, gameName);

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
        }
    }
}
