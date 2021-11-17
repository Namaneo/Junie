namespace JunieAPI.Models
{
    public class CommonOptions
    {
        public ApplicationsOptions Applications { get; set; }

        public AssetsOptions Assets { get; set; }


        public class ApplicationsOptions
        {
            public string Web { get; set; }

            public string Emulator { get; set; }
        }

        public class AssetsOptions
        {
            public string Visuals { get; set; }

            public string Games { get; set; }

            public string System { get; set; }
        }
    }
}
