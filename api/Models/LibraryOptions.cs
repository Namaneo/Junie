using System.Collections.Generic;

namespace JunieAPI.Models
{
    public class GameOptions
    {
        public string Name { get; set; }

        public string Rom { get; set; }

        public string Cover { get; set; }
    }

    public class SystemOptions
    {
        public string Name { get; set; }

        public string FullName { get; set; }

        public string CoreName { get; set; }

        public string CorePath { get; set; }

        public string Extension { get; set; }

        public string Cover { get; set; }

        public string CoverDark { get; set; }

        public List<GameOptions> Games { get; set; }
    }

    public class LibraryOptions : List<SystemOptions>
    { }
}
