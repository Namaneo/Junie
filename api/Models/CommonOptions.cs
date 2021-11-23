namespace JunieAPI.Models
{
    public class CommonOptions
    {
        public BinariesOptions Binaries { get; set; }

        public ResourcesOptions Resources { get; set; }


        public class BinariesOptions
        {
            public string Web { get; set; }

            public string App { get; set; }
        }

        public class ResourcesOptions
        {
            public string UI { get; set; }

            public string App { get; set; }

            public string Games { get; set; }

            public string System { get; set; }
        }
    }
}
