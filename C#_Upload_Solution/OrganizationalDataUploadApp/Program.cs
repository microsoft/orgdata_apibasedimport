using OrganizationalDataUploadApp;
using Microsoft.Identity.Client;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace HttpClientCallerApp
{
    public class Program
    {
        static HttpClient client = new HttpClient();
        private string appId = string.Empty;
        private string pathToFile = string.Empty;
        private string tenantId = string.Empty;
        private string certName = string.Empty;
        private string clientSecret = string.Empty;
        private string connectorId = string.Empty;
        static async Task Main()
        {
            try
            {
                var program = new Program();
                program.TakeInputs();
                await program.RunAsync();
            }
            catch (Exception e)
            {
                Console.WriteLine($"\nAn error occurred:\n{e.Message}");
            }

            Console.WriteLine("Press any key to exit...");
            Console.ReadKey(intercept: true);
        }

        private void TakeInputs()
        {
            Console.WriteLine("Please enter the following values.");
            this.appId = ReadRequiredInput("\nApp (client) ID:", requireGuid: true);
            this.pathToFile = ReadRequiredInput("\nAbsolute path to the CSV file: (Example: C:\\Users\\JaneDoe\\OneDrive - Microsoft\\Desktop\\info.csv)");
            this.pathToFile = this.pathToFile.Trim('"');
            this.tenantId = ReadRequiredInput("\nMicrosoft Tenant ID:", requireGuid: true);
            this.connectorId = ReadRequiredInput("\nConnector ID:", requireGuid: true);

            Console.WriteLine("\nCertificate name (leave blank to use a client secret):");
            this.certName = Console.ReadLine()
                ?? throw new EndOfStreamException("Input ended before an authentication method was selected.");
            if (string.IsNullOrWhiteSpace(this.certName))
            {
                this.clientSecret = ReadRequiredInput("\nClient secret value (input hidden):", hideInput: true);
            }
        }

        private static string ReadRequiredInput(string prompt, bool requireGuid = false, bool hideInput = false)
        {
            while (true)
            {
                Console.WriteLine(prompt);
                var value = (hideInput ? ReadClientSecret() : Console.ReadLine())
                    ?? throw new EndOfStreamException("Input ended before a required value was provided.");

                if (string.IsNullOrWhiteSpace(value))
                {
                    Console.WriteLine("A non-empty value is required. Please try again.");
                }
                else if (requireGuid && !IsGuid(value))
                {
                    Console.WriteLine("Please enter a valid GUID.");
                }
                else
                {
                    return value;
                }
            }
        }

        private static string? ReadClientSecret()
        {
            if (Console.IsInputRedirected)
            {
                return Console.ReadLine();
            }

            var secret = new StringBuilder();
            while (true)
            {
                var key = Console.ReadKey(intercept: true);
                if (key.Key == ConsoleKey.Enter)
                {
                    Console.WriteLine();
                    return secret.ToString();
                }
                else if (key.Key == ConsoleKey.Backspace)
                {
                    if (secret.Length > 0)
                    {
                        secret.Length--;
                        Console.Write("\b \b");
                    }
                }
                else if (!char.IsControl(key.KeyChar))
                {
                    secret.Append(key.KeyChar);
                    Console.Write('*');
                }
            }
        }

        private async Task RunAsync()
        {
            var fileExtension = Path.GetExtension(this.pathToFile).ToLowerInvariant();
            if (fileExtension != ".csv" && fileExtension != ".json")
            {
                throw new ArgumentException("Only CSV (.csv) and JSON (.json) files are supported.", nameof(pathToFile));
            }

            Console.WriteLine("\nAcquiring token...");

            var appToken = await this.GetAppToken();

            Console.WriteLine("\nUploading file...");

            client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Bearer {appToken}");
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Add("X-AnchorMailbox", $"TID:{this.tenantId}");

            var byteArray = File.ReadAllBytes(this.pathToFile);
            using var content = new ByteArrayContent(byteArray);
            content.Headers.ContentType = new MediaTypeHeaderValue(
                fileExtension == ".csv" ? "text/csv" : "application/json");

            var OrganizationalDataUploadEndPoint =
                $"{Constants.OrgDataApi}/v1.0/dataUpload/HR/ingestions/fileIngestion?connectorId={this.connectorId}";

            HttpResponseMessage message = await client.PostAsync(OrganizationalDataUploadEndPoint, content);

            if (message.IsSuccessStatusCode)
            {
                string responseBody = await message.Content.ReadAsStringAsync();
                Console.WriteLine($"\nResponse content:\n{responseBody}");
                Console.WriteLine("\n\nUpload succeeded. Ingestion is in progress. To check status, please visit the connector page. Response details are above.");
            }
            else
            {
                Console.WriteLine($"\n\nUpload failed:\n{message.ToString()}");
            }
        }

        private async Task<string> GetAppToken()
        {
            var useCertificate = !string.IsNullOrWhiteSpace(this.certName);

            var authority = $"{Constants.LoginBaseUrl}/{this.tenantId}";

            var builder = ConfidentialClientApplicationBuilder.Create(this.appId)
                .WithAuthority(new Uri(authority));
            if (useCertificate)
            {
                builder = builder.WithCertificate(FindCertificate(this.certName));
            }
            else
            {
                builder = builder.WithClientSecret(this.clientSecret);
            }

            var app = builder.Build();
            var tokenRequest = app.AcquireTokenForClient(
                [$"{Constants.OrgDataResourceId}/.default"
            ]);
            if (useCertificate)
            {
                tokenRequest = tokenRequest.WithSendX5C(true);
            }

            var authResult = await tokenRequest.ExecuteAsync().ConfigureAwait(false);
            return authResult.AccessToken;
        }

        private static X509Certificate2 FindCertificate(string certificateName)
        {
            var userCert = TryGetCertificateFromStore(certificateName, StoreLocation.CurrentUser);
            if (userCert != null)
            {
                return userCert;
            }

            var machineCert = TryGetCertificateFromStore(certificateName, StoreLocation.LocalMachine);
            if (machineCert != null)
            {
                return machineCert;
            }

            throw new InvalidOperationException($"Failed to load the certificate with name {certificateName}");
        }

        private static X509Certificate2? TryGetCertificateFromStore(string certificateName, StoreLocation storeLocation)
        {
            using var store = new X509Store(StoreName.My, storeLocation);
            try
            {
                store.Open(OpenFlags.ReadOnly);
                return store.Certificates.FirstOrDefault(c => 
                    c.GetNameInfo(X509NameType.SimpleName, false) == certificateName && c.HasPrivateKey);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\nError accessing {storeLocation} certificate store: {ex.Message}");
                return null;
            }
        }

        private static bool IsGuid(string value)
        {
            return Guid.TryParse(value, out Guid _);
        }
    }
}
