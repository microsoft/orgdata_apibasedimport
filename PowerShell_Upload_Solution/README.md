# PowerShell script to Push Data Using the Descriptive Data Upload Api 

## Requirements

The upload script supports Windows PowerShell 5.1 and PowerShell 7 on Windows.
Install MSAL.PS in the PowerShell edition you will use to run the script:

```powershell
Install-Module -Name MSAL.PS -Scope CurrentUser
```

or go to https://www.powershellgallery.com/packages/MSAL.PS for instructions on installation


## Running the data export script

The script uses app-only authentication with the organizational data API's `.default` scope and uploads the file; it does not obtain a delegated refresh token.
`-ConnectorId` is mandatory and is sent as the `connectorId` query parameter. No scale unit is requested or sent.

1. Make sure you have following information with you
    - **Entra App ID** - Find this ID in the registered Entra app information on the Azure portal under **Application (client) ID**
    - **CSV filepath** containing the organizational data extracted from the HRIS System.
    - **Tenant ID** of your Tenant - Find this ID on the app's overview page under **Directory (tenant) ID**.
    - **Connector ID**  - ID of the Connector. Find in Org data in M365 > API-based connector page URL.
2. Make sure you have one of the authentication parameters available
    - **Certificate Name** The certificate's simple subject name, returned by `GetNameInfo(X509NameType.SimpleName, false)`. For a subject such as `CN=orgdataupload-certificate`, pass `orgdataupload-certificate`, without `CN=`. The script searches `CurrentUser\My` before `LocalMachine\My` and uses the first matching certificate with a private key. Upload its public certificate to your app registration.

        OR

    - **Client Secret** A secret string that the application uses to prove its identity when requesting a token. Also can be referred to as application password. This is only shown for the first time when the client secret is created.

# Run the script 

Go to the specific folder 

```powershell
Set-Location .\orgdata_apibasedimport\PowerShell_Upload_Solution
```

Run the script with parameters in PowerShell terminal 

``` 
.\OrganizationalDataUpload.ps1 -AppId "YOUR-CLIENT-ID" -pathToFile "C:\repos\temp\data.csv" -TenantId "YOUR-TENANT-ID" -ConnectorId "YOUR-CONNECTOR-ID" -ClientSecret "YOUR-CLIENT-SECRET"
```

OR

``` 
.\OrganizationalDataUpload.ps1 -AppId "YOUR-CLIENT-ID" -pathToFile "C:\repos\temp\data.csv" -TenantId "YOUR-TENANT-ID" -ConnectorId "YOUR-CONNECTOR-ID" -CertificateName "orgdataupload-certificate"
```

## Expected Behavior

This is the sample API call made by the application.
``` 
Method: POST
RequestUri: https://orgdata.svc.cloud.microsoft/v1.0/dataUpload/HR/ingestions/fileIngestion?connectorId=<connectorId>
Version: 1.0
Content: CSV file stream
Content-Type: text/csv
Headers:
  {
    Accept: application/json
    Authorization: Bearer <bearer token from ClientID and client certificate/secret>"
  }
  Content: <csv file>
``` 
Sample response: 
```
 {"FriendlyName":"Data ingress","Id":"<ingestion Id>","ConnectorId":"<connector Id>","Submitter":"System","StartDate":"2023-05-08T19:07:07.4994043Z","Status":"NotStarted","ErrorDetail":null,"EndDate":null,"Type":"FileIngestion"}
```

Only `.csv` files are accepted and sent directly as `text/csv`. Other file types are rejected before authentication or upload.

**Troubleshooting**
1. App, tenant, and connector IDs must be valid GUIDs. The connector must authorize the registered app.
2. Supply either `-ClientSecret` or `-certificateName`. A missing file, unavailable certificate, or authentication failure prevents a successful upload.
3. Non-success HTTP responses are reported as errors. Inspect the status and verify the app's authorization and token.
4. A successful upload starts ingestion; it does not guarantee validation has completed. Check the ingestion status in the admin center for CSV schema or data errors.
