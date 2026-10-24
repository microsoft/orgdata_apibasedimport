# PowerShell script to Push Data Using the Descriptive Data Upload Api 

This is the legacy `api.orginsights.viva.office.com` uploader. For the updated API, use the top-level `Powershell_Solution`.
It discovers the scale unit automatically and sends `x-nova-scaleunit`. The legacy script has no `-ConnectorId` parameter.

## Install MSAL.PS

Run the command below after opening the PowerShell with admin privilege

``` Install-Module -Name MSAL.PS ```

or go to https://www.powershellgallery.com/packages/MSAL.PS for instructions on installation


## Running the data export script
1. Make sure you have following information with you
    - **Entra App ID** - Find this ID in the registered Entra app information on the Azure portal under **Application (client) ID**
    - **CSV filepath** containing the organizational data extracted from the HRIS System.
    - **Tenant ID** of your Tenant - Find this ID on the app's overview page under **Directory (tenant) ID**.
2. Make sure you have one of the authentication parameters available
    - **Certificate Name** This is the name configured in your registered application. After you upload the certificate, the certificate name shows up under **Description** in the Azure Portal.

        OR

    - **Client Secret** A secret string that the application uses to prove its identity when requesting a token. Also can be referred to as application password. This is only shown for the first time when the client secret is created.

# Run the script 

Go to the specific folder 

From the repository root:

```powershell
Set-Location .\Old_Solutions\Powershell_Solution
```

Run the script with parameters in PowerShell terminal 

``` 
.\OrganizationalDataUpload.ps1 -ClientId **** -pathToFile  "C:\repos\temp\data.csv" -TenantId ***** -ClientSecret **** 
```

OR

``` 
.\OrganizationalDataUpload.ps1 -ClientId **** -pathToFile  "C:\repos\temp\data.csv" -TenantId ***** -certificateName CN=orgdataupload-certificate
```

## Expected Behavior

This is the sample API call made by the application.
``` 
Method: POST
RequestUri: https://api.orginsights.viva.office.com/v1.0/tenants/<tenantId>/modis/connectors/HR/ingestions/fileIngestion
Version: 1.0
Content: CSV file stream
Content-Type: text/csv
Headers:
  {
    Accept: application/json
    x-nova-scaleunit: OrgDataIngestionwus2-02
    Authorization: Bearer <bearer token from ClientID and client certificate/secret>"
  }
  Content: <csv file>
``` 
Sample response: 
```
 {"FriendlyName":"Data ingress","Id":"<ingestion Id>","ConnectorId":"<connector Id>","Submitter":"System","StartDate":"2023-05-08T19:07:07.4994043Z","Status":"NotStarted","ErrorDetail":null,"EndDate":null,"Type":"FileIngestion"}
```

Only `.csv` files are accepted and sent directly as `text/csv`. Other file types are rejected before authentication or upload.
Check the script's error output for authentication, file-access, scale-unit discovery, and HTTP failures.
A successful upload starts ingestion; inspect its status in the admin center for later validation errors.
