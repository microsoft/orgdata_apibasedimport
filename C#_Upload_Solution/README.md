# C# Application to Push Data Using the Descriptive Data Upload Api 

Compile the C# application to generate the program executable **OrganizationalDataUploadApp.exe**

Requires the .NET 10 SDK. The project targets `net10.0`; running the generated framework-dependent executable also requires the .NET 10 runtime.

```powershell
dotnet build .\OrganizationalDataUploadApp\OrganizationalDataUploadApp.csproj
dotnet run --project .\OrganizationalDataUploadApp\OrganizationalDataUploadApp.csproj
```

The application authenticates using the registered application's certificate or client secret and the organizational data API's `.default` scope (`client_credentials`). It uploads the file; it does not obtain a delegated refresh token.
The required connector ID is sent as the `connectorId` query parameter. No scale unit is requested or sent.

## Running the data export App
1. Make sure you have following information with you
    - **Entra App ID** - Find this ID in the registered Entra app information on the Azure portal under **Application (client) ID**
    - **CSV filepath** containing the organizational data extracted from the HRIS System.
    - **Certificate Name** configured in your registered application, or a **Client Secret Value** from the app registration's **Certificates & secrets** page. Use the secret's value, not its ID.
    - **Tenant ID** of your Tenant - Find this ID on the app's overview page under **Directory (tenant) ID**.
    - **Connector ID**  - ID of the Connector. Find in Org data in M365 > API-based connector page URL.
2. Run the OrganizationalDataUploadApp executable, a console pops up asking you for the following inputs: 
    - AppId/Client ID - Enter the **Entra App ID**
    - Absolute path to the CSV file (Example: `C:\Users\JaneDoe\OneDrive - Microsoft\Desktop\data.csv`) - Paste the **CSV filepath** with single backslashes; no escaping is needed
    - Azure Active Directory (AAD) Tenant ID - Enter the **Tenant ID**
    - Certificate name for your registered application - Enter the **Certificate Name**, or leave it blank to use a client secret
    - Client secret value - Prompted only when the certificate name is blank; each character is masked with `*` in an interactive console, and Backspace removes the last character and its asterisk
    - Connector ID - Enter the **Connector ID**

Each required input is prompted again individually until it is non-empty (not just whitespace). App, tenant, and connector IDs must also be valid GUIDs. Previously accepted inputs are kept; a blank certificate name still selects client-secret authentication. If redirected input ends before all inputs are supplied, the application stops with an error.

Existing certificate-based input continues to work without an extra prompt. For client-secret authentication, the secret is read from standard input when input is redirected.
The application does not print the secret or write it to a configuration file. Do not store redirected input containing a secret in source control.
An authentication failure stops processing before the upload is attempted.

## Expected Behavior

This is the sample API call made by the application.
``` 
Method: POST
RequestUri: https://orgdata.svc.cloud.microsoft/v1.0/dataUpload/HR/ingestions/fileIngestion?connectorId=<connectorId>
Version: 1.0
Content: CSV file bytes
Content-Type: text/csv
Headers:
  {
    Accept: application/json
    Authorization: Bearer <bearer token from ClientID and client certificate/secret>"
    X-AnchorMailbox: TID:<tenantId>
  }
  Content: <csv file>
``` 
Sample response: 
```
 {"FriendlyName":"Data ingress","Id":"<ingestion Id>","ConnectorId":"<connector Id>","Submitter":"System","StartDate":"2023-05-08T19:07:07.4994043Z","Status":"NotStarted","ErrorDetail":null,"EndDate":null,"Type":"FileIngestion"}
```

CSV files are sent directly as `text/csv`; JSON files are sent as `application/json`. Other file types are rejected before authentication or upload.

**Troubleshooting**
1. App, tenant, and connector IDs must be valid GUIDs. The connector must authorize the registered app.
2. A missing file or invalid credential prevents the upload. For certificate mode, check the certificate name and stores. For client-secret mode, verify the secret value and its expiration.
3. If the API rejects the request, inspect the printed HTTP status and verify the app's authorization and token.
4. A successful upload starts ingestion; it does not guarantee validation has completed. Check the ingestion status in the admin center for CSV schema or data errors.
