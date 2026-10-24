<#
 .Synopsis
    Runs the Data Descriptive upload api 
    
 .Description
    This script runs a POST request to https://orgdata.svc.cloud.microsoft/v1.0/dataUpload/HR/ingestions/fileIngestion?connectorId=<connectorId>.
    ConnectorId is required.

 .Parameter AppId
   App (client) ID. Find this ID in the registered app information on the Azure portal under **Application (client) ID**. If you haven't created and registered your app yet, follow the instructions in our main data import documentation, under Register a new app in Azure.

 .Parameter FilePath
   Format the path like this: `C:\Users\JaneDoe\OneDrive - Microsoft\Desktop\data.csv`. File should be a utf-8 encoded CSV file.

 .Parameter TenantId
    Microsoft Tenant ID. Also find this ID on the app's overview page under **Directory (tenant) ID**.

 .Parameter ConnectorId
    ID of the Connector. Find in Microsoft 365 Org Data > API-based connector page at the end of the URL.

 .Parameter CertificateName
   The certificate's name (for example, orgdata-certificate for CN=orgdata-certificate). The certificate must have a private key. Either the CertificateName or the ClientSecret parameter has to be provided.

 .Parameter ClientSecret
    A secret string that the application uses to prove its identity when requesting a token. Either the CertificateName or the ClientSecret parameter has to be provided.

 .Example
    .\OrganizationalDataUpload.ps1 -AppId "YOUR-CLIENT-ID" -FilePath "C:\repos\temp\info.csv" -TenantId "YOUR-TENANT-ID" -ConnectorId "YOUR-CONNECTOR-ID" -ClientSecret "YOUR-CLIENT-SECRET"

 .Example
   .\OrganizationalDataUpload.ps1 -AppId "YOUR-CLIENT-ID" -FilePath "C:\repos\temp\info.csv" -TenantId "YOUR-TENANT-ID" -ConnectorId "YOUR-CONNECTOR-ID" -CertificateName "orgdata-certificate"

#>

param
(
        [Parameter(Position = 0, Mandatory = $true, HelpMessage = "App (client) ID")]
        [string] $AppId,
   
        [Parameter(Position = 1, Mandatory = $true,
                HelpMessage = "Absolute path to the csv file you wish to upload")]
        [string] $FilePath,
   
        [Parameter(Position = 2, Mandatory = $true,
                HelpMessage = "Microsoft Tenant ID")]
        [string] $TenantId,

        [Parameter(Position = 3, Mandatory = $true,
                HelpMessage = "Microsoft 365 Organizational Data API-based Connector ID")]
        [string] $ConnectorId,

        [Parameter(Mandatory = $false,
                HelpMessage = "Certificate name for your registered application")]
        [string] $CertificateName,

        [Parameter(Mandatory = $false,
                HelpMessage = "Client secret for your registered application")]
        [string] $ClientSecret 

);

$ErrorActionPreference = "Stop"
$fileExtension = [System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()
if ($fileExtension -ne ".csv") {
        throw "Only CSV (.csv) files are supported."
}

Import-Module -Name MSAL.PS
Add-Type -AssemblyName System.Net.Http

$OrgDataUri = "8cfd58c1-5cd4-475d-b77f-8f41cfbf6831";
$OrgDataApi = "https://orgdata.svc.cloud.microsoft";
$LoginBaseUrl = "https://login.microsoftonline.com";
$Scope = $OrgDataUri + "/.default";
$Scopes = New-Object System.Collections.Generic.List[string];
$Scopes.Add($Scope)

function IsGuid {
        [OutputType([bool])]
        param
        (
                [Parameter(Mandatory = $true)]
                [string]$StringGuid
        )
 
        $ObjectGuid = [System.Guid]::empty
        # Returns True if successfully parsed
        return [System.Guid]::TryParse($StringGuid, [System.Management.Automation.PSReference]$ObjectGuid)
}


function FindCertificate([string] $CertificateName) {
        foreach ($storePath in @("Cert:\CurrentUser\My\", "Cert:\LocalMachine\My\")) {
                $certificate = Get-ChildItem -Path $storePath -ErrorAction Stop |
                        Where-Object {
                                $_.GetNameInfo([System.Security.Cryptography.X509Certificates.X509NameType]::SimpleName, $false) -eq $CertificateName -and
                                $_.HasPrivateKey
                        } |
                        Select-Object -First 1
                if ($null -ne $certificate) {
                        return $certificate
                }
        }
        throw "Failed to find a certificate with name '$CertificateName' and private key in CurrentUser\My or LocalMachine\My."
}


function GetAppTokenFromClientSecret ( [string] $AppId, [string]$ClientSecret, [string] $TenantId ) {

        $appToken = ""

        try {
                $app = [Microsoft.Identity.Client.ConfidentialClientApplicationBuilder]::Create($AppId).WithClientSecret($ClientSecret).WithAuthority($("$LoginBaseUrl/$TenantId")).Build()
                $TokenResult = $app.AcquireTokenForClient($Scopes).ExecuteAsync().GetAwaiter().GetResult();
                $appToken = $TokenResult.AccessToken
        }
        catch {
                Write-Error $_
        }
        
        return $appToken;
}

function GetAppTokenFromClientCertificate ( [string] $AppId, [string]$CertificateName, [string] $TenantId ) {

       
        $appToken = ""
        $certificate = FindCertificate $CertificateName
        try {
               
                $app = [Microsoft.Identity.Client.ConfidentialClientApplicationBuilder]::Create($AppId).WithCertificate($certificate).WithAuthority($("$LoginBaseUrl/$TenantId")).Build()
                $TokenResult = $app.AcquireTokenForClient($Scopes).ExecuteAsync().GetAwaiter().GetResult();
                $appToken = $TokenResult.AccessToken
        }
        catch {
                Write-Error $_
        }
        
        return $appToken;
}

if (-NOT(IsGuid $AppId) -or -NOT(IsGuid $TenantId) -or -NOT(IsGuid $ConnectorId)) {
        throw "The AppId, TenantId, and ConnectorId must be valid GUIDs."
}   

Write-Host "`nAcquiring token..." -ForegroundColor Green
$appToken = ""
if (-NOT([string]::IsNullOrWhitespace($CertificateName))) {
        $appToken = GetAppTokenFromClientCertificate $AppId $CertificateName $TenantId 
}
elseif (-NOT([string]::IsNullOrWhitespace($ClientSecret))) {
        $appToken = GetAppTokenFromClientSecret $AppId $ClientSecret $TenantId 
}
else { 
        throw "Either CertificateName or ClientSecret must be provided."
}

$OrganizationalDataUploadEndPoint = $OrgDataApi + "/v1.0/dataUpload/HR/ingestions/fileIngestion?connectorId=" + $ConnectorId

$client = $null
$fileStream = $null
$content = $null
$result = $null

Write-Host "`nUploading CSV file..." -ForegroundColor Green

try {
        $client = New-Object System.Net.Http.HttpClient
        $client.DefaultRequestHeaders.Accept.Clear() 
        $mediaType = New-Object System.Net.Http.Headers.MediaTypeWithQualityHeaderValue "application/json"
        $client.DefaultRequestHeaders.Accept.Add($mediaType);
        $client.DefaultRequestHeaders.Add("Authorization", "Bearer " + $appToken);
        
        $fileStream = [System.IO.File]::OpenRead($FilePath)
        $content = New-Object System.Net.Http.StreamContent($fileStream)
        $content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("text/csv")

        $result = $client.PostAsync($OrganizationalDataUploadEndPoint, $content).GetAwaiter().GetResult();
        $result.EnsureSuccessStatusCode()
        Write-Host "`Response content:" -ForegroundColor Green
        $output = $result.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        Write-Host $output
        Write-Host "`n`nUpload succeeded. Ingestion is in progress. To check status, please visit the connector page. Request and response details are above." -ForegroundColor Green
}
catch {
        Write-Host "`n`nUpload failed:" -ForegroundColor Red
        Write-Error $_
}
finally {
        if ($null -ne $result) {
                $result.Dispose()
        }
        if ($null -ne $content) {
                $content.Dispose()
        }
        if ($null -ne $fileStream) {
                $fileStream.Dispose()
        }
        if ($null -ne $client) {
                $client.Dispose()
        }
}
