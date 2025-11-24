# PowerShell script to Push Data Using the Descriptive Data Upload Api 

## Install MSAL.PS

Run the command below after opening the PowerShell with admin privilege

``` Install-Module -Name MSAL.PS ```

or go to https://www.powershellgallery.com/packages/MSAL.PS for instructions on installation


## Running the data export script
1. Make sure you have following information with you
    - **Entra App ID** - Find this ID in the registered Entra app information on the Azure portal under **Application (client) ID**
    - **CSV filepath** containing the organizational data extracted from the HRIS System.
    - **scale unit** noted during connector setup.
    - **Tenant ID** of your Tenant - Find this ID on the app's overview page under **Directory (tenant) ID**.
2. Make sure you have one of the authentication parameters available
    - **Certificate Name** This is the name configured in your registered application. After you upload the certificate, the certificate name shows up under **Description** in the Azure Portal.

        OR

    - **Client Secret** A secret string that the application uses to prove its identity when requesting a token. Also can be referred to as application password. This is only shown for the first time when the client secret is created.

# Run the script 

Go to the specific folder 

``` cd orgdata_apibasedupload/Powershell_Solution``` 

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
Content: System.Net.Http.MultipartFormDataContent
Headers:
  {
    Accept: application/json
    x-nova-scaleunit: OrgDataIngestionwus2-02
    Authorization: Bearer <bearer token from ClientID and client certificate/secret>"
    Content-Length: 729
  }
  Content: <csv file>
``` 
Sample response: 
```
 {"FriendlyName":"Data ingress","Id":"<ingestion Id>","ConnectorId":"<connector Id>","Submitter":"System","StartDate":"2023-05-08T19:07:07.4994043Z","Status":"NotStarted","ErrorDetail":null,"EndDate":null,"Type":"FileIngestion"}
```

**Possible errors in the API**
1. Missing header <Authorization>: Response status 403 
2. Missing file: Response status 500
3. Expired Authorization header: Response status 200, but the response will suggest to sign in again 
4. If the data.csv have incorrect data (i.e mismatch in the fieldnames/number of fields, empty fields, etc ): the response status will be 200, but the ingestion will be stuck in "ValidationFailed" state
