using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using JunieAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using IOFile = System.IO.File;

namespace JunieAPI.Controllers
{
    [Route("library")]
    public class LibraryController : Controller
    {
        private readonly IOptionsSnapshot<CommonOptions> _common;
        private readonly IOptionsSnapshot<LibraryOptions> _library;

        public LibraryController(IOptionsSnapshot<CommonOptions> common, IOptionsSnapshot<LibraryOptions> library)
        {
            _common = common;
            _library = library;
        }

        [HttpGet]
        public LibraryOptions GetSystems()
        {
            var systems = _library.Value;
            foreach (var system in systems)
            {
                system.Games = GetGames(system);
            }
            return systems;
        }

        [HttpGet("{system}/{game}")]
        public async Task<FileContentResult> GetGames(string system, string game)
        {
            var path = Path.Combine(_common.Value.Resources.Games, system, game);
            return File(await IOFile.ReadAllBytesAsync(path), "application/octet-stream");
        }

        private List<GameOptions> GetGames(SystemOptions system)
        {
            var path = Path.Combine(_common.Value.Resources.Games, system.Name);

            if (!Directory.Exists(path))
                return new List<GameOptions>();

            var files = Directory.GetFiles(path).Where(x => Path.GetExtension(x) != ".png");

            return files.Select(x => Path.GetFileNameWithoutExtension(x)).Select(x => new GameOptions
            {
                Name = Regex.Replace(x, " \\(.*\\)", ""),
                Rom = $"{x}.{system.Extension}",
                Cover = $"covers/{system.Name}/{x}.png",
            }).ToList();
        }
    }
}
