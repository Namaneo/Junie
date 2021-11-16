using System.IO;
using System.Linq;
using System.Threading.Tasks;
using JunieAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using IOFile = System.IO.File;

namespace JunieAPI.Controllers
{
    public class LibraryController : Controller
    {
        private readonly IOptionsSnapshot<CommonOptions> _common;
        private readonly IOptionsSnapshot<SystemsOptions> _systems;

        public LibraryController(IOptionsSnapshot<CommonOptions> common, IOptionsSnapshot<SystemsOptions> systems)
        {
            _common = common;
            _systems = systems;
        }

        [HttpGet("systems")]
        public string[] GetSystems()
        {
            return _systems.Value.Keys.ToArray();
        }

        [HttpGet("systems/{system}")]
        public SystemOptions GetSystem(string system)
        {
            return _systems.Value[system];
        }

        [HttpGet("systems/{system}/games")]
        public string[] GetGames(string system)
        {
            var path = Path.Combine(_common.Value.Assets.Games, system);
            var files = Directory.GetFiles(path); 
            return files.Select(x => Path.GetFileNameWithoutExtension(x)).ToArray();
        }

        [HttpGet("systems/{system}/games/{game}")]
        public async Task<FileContentResult> GetGames(string system, string game)
        {
            var path = Path.Combine(_common.Value.Assets.Games, system, game);
            return File(await IOFile.ReadAllBytesAsync(path), "application/octet-stream");
        }
    }
}
