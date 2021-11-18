using System.Collections.Generic;

namespace JunieAPI.Models
{
    public class SystemOptions
    {
        public string FullName { get; set; }

        public string CoreName { get; set; }

        public string CorePath { get; set; }

        public string Extension { get; set; }

        public string Cover { get; set; }

        public string CoverDark { get; set; }
    }

    public class SystemsOptions : Dictionary<string, SystemOptions>
    { }
}
