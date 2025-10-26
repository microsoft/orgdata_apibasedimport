<#
 .Synopsis
    Runs the Data Descriptive upload api 
    
 .Description
    This script runs a POST request to https://api.orginsights.viva.office.com/v1.0/tenants/<tenantId>/modis/connectors/HR/ingestions/fileIngestion

 .Parameter ClientID
   App (client) ID. Find this ID in the registered app information on the Azure portal under **Application (client) ID**. If you haven't created and registered your app yet, follow the instructions in our main data import documentation, under Register a new app in Azure.

 .Parameter pathToFile
   Format the path like this: `C:\\Users\\JaneDoe\\OneDrive - Microsoft\\Desktop\\info.csv`. File should be an utf-8 encoded CSV file.

 .Parameter TenantId
    Azure Active Directory tenant ID. Also find this ID on the app's overview page under **Directory (tenant) ID**.

 .Parameter certificateName 
   This certificate name is configured in your registered application. Either the certificateName or the ClientSecret parameter has to be provided 

 .Parameter ClientSecret 
    A secret string that the application uses to prove its identity when requesting a token. Either the certificateName or the ClientSecret parameter has to be provided 

 .Example
    .\OrganizationalDataUpload.ps1 -ClientId **** -pathToFile  "C:\repos\temp\info.csv" -TenantId ***** -ClientSecret **** 

 .Example
   .\OrganizationalDataUpload.ps1 -ClientId **** -pathToFile  "C:\repos\temp\info.csv" -TenantId ***** -certificateName CN=orgdata-certificate 

#>

param
(
        [Parameter(Position = 0, Mandatory = $true, HelpMessage = "AppId/Client ID")]
        [string] $ClientId,
   
        [Parameter(Position = 1, Mandatory = $true,
                HelpMessage = "Absolute path to the csv file you wish to upload")]
        [string] $pathToFile,
   
        [Parameter(Position = 2, Mandatory = $true,
                HelpMessage = "Azure Active Directory (AAD) Tenant ID")]
        [string] $TenantId,

        [Parameter(Mandatory = $false,
                HelpMessage = "Certificate name for your registered application")]
        [string] $certificateName,

        [Parameter(Mandatory = $false,
                HelpMessage = "Client secret for your registered application")]
        [string] $ClientSecret 

);

import-Module -Name MSAL.PS
Add-Type -AssemblyName System.Net.Http

$OrgDataIngestionUri = "9d827643-d003-4cca-9dc8-71213a8f1644";
$OrgDataIngestionApi = "https://api.orginsights.viva.office.com/v1.0/";
$loginURL = "https://login.microsoftonline.com";
$ingressDataType = "HR";
$Scope = $OrgDataIngestionUri + "/.default";
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
        return [System.Guid]::TryParse($StringGuid, [System.Management.Automation.PSReference]$ObjectGuid) # Returns True if successfully parsed
}


function FindCertificate([string] $certificateName) {
        try {
                $currentCertificate = Get-ChildItem Cert:\CurrentUser\My\ | Where-Object { $_.Subject -eq "$certificateName" }
                if ([string]::IsNullOrWhitespace($currentCertificate)) {
                        $localCertificate = Get-ChildItem Cert:\LocalMachine\My\ | Where-Object { $_.Subject -eq "$certificateName" }
                        if ([string]::IsNullOrWhitespace($localCertificate)) {
                                Write-Host   "Failed to load the certificate with find name "+$certificateName -ForegroundColor Red
                                exit 0
                        }
                        else {
                               
                                return $localCertificate
                        }
                }
                else {
                        return $currentCertificate  
                }
        }
        catch {
                Write-Error $_
        }

}


function GetAppTokenFromClientSecret ( [string] $ClientId, [string]$ClientSecret, [string] $TenantId ) {

        $appToken = ""

        try {
                $app = [Microsoft.Identity.Client.ConfidentialClientApplicationBuilder]::Create($ClientId).WithClientSecret($ClientSecret).WithAuthority($("$loginURL/$TenantId")).Build()
                $TokenResult = $app.AcquireTokenForClient($Scopes).ExecuteAsync().Result;
                $appToken = $TokenResult.AccessToken
        }
        catch {
                Write-Error $_
        }
        
        return $appToken;
}

function GetAppTokenFromClientCertificate ( [string] $ClientId, [string]$certificateName, [string] $TenantId ) {

       
        $appToken = ""
        $certificate = FindCertificate $certificateName
        try {
               
                $app = [Microsoft.Identity.Client.ConfidentialClientApplicationBuilder]::Create($ClientId).WithCertificate($certificate).WithAuthority($("$loginURL/$TenantId")).Build()
                $TokenResult = $app.AcquireTokenForClient($Scopes).ExecuteAsync().Result;
                $appToken = $TokenResult.AccessToken
        }
        catch {
                Write-Error $_
        }
        
        return $appToken;
}

if (-NOT(IsGuid $ClientId) -or -NOT(IsGuid $TenantId)) {
        Write-Host   "The appId and/or the tenantId is not a valid Guid.`nPlease go through the process again to upload your file." -ForegroundColor Red
        exit 0
}   

$appToken = ""
if (-NOT([string]::IsNullOrWhitespace($certificateName))) {
        $appToken = GetAppTokenFromClientCertificate $ClientId $certificateName $TenantId 
}
elseif (-NOT([string]::IsNullOrWhitespace($ClientSecret))) {
        $appToken = GetAppTokenFromClientSecret $ClientId $ClientSecret $TenantId 
}
else { 
        Write-Host   "Either certificateName or ClientSecret has to be provided. `nPlease go through the process again to upload your file." -ForegroundColor Red
        exit 0
}

$OrganizationalDataUploadEndPoint = $OrgDataIngestionApi + "tenants/" + $TenantId + "/modis/connectors/" + $ingressDataType + "/ingestions/fileIngestion"


try {
        $client = New-Object System.Net.Http.HttpClient
        $client.DefaultRequestHeaders.Accept.Clear() 
        $mediaType = New-Object System.Net.Http.Headers.MediaTypeWithQualityHeaderValue "application/json"
        $client.DefaultRequestHeaders.Accept.Add($mediaType);
        $client.DefaultRequestHeaders.Add("Authorization", "Bearer " + $appToken);
        
        $ScaleUnitEndPoint = $OrgDataIngestionApi + "tenants/" + $TenantId + "/scopes/" + $TenantId + "/scaleUnit"
        $scaleUnitResult = $client.GetAsync($ScaleUnitEndPoint).Result;
        $appScaleUnit = $scaleUnitResult.Content.ReadAsStringAsync().GetAwaiter().GetResult().Replace("`"", "")

       
        $client.DefaultRequestHeaders.Add('x-nova-scaleunit', $appScaleUnit);
        
        $fileExtension = [System.IO.Path]::GetExtension($pathToFile).ToLower()
        $fileStream = [System.IO.File]::OpenRead($pathToFile)
        $fileName = [System.IO.Path]::GetFileName($pathToFile)

        if ($fileExtension -eq ".csv") {
                $content = New-Object System.Net.Http.StreamContent($fileStream)
                $content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("text/csv")
                Write-Host "Uploading CSV file" -ForegroundColor Green
        }
        else {
                $content = New-Object System.Net.Http.MultipartFormDataContent
                $fileContent = New-Object System.Net.Http.StreamContent($fileStream)
                $content.Add($fileContent, "info", $fileName)
                Write-Host "Uploading ZIP file" -ForegroundColor Green
        }


        $result = $client.PostAsync($OrganizationalDataUploadEndPoint, $content).Result;
        $result.EnsureSuccessStatusCode()
        Write-Host "Request Status was success.`nIngestion is in progress. To check status, please visit the site.`n`nHere is the returned content:" -ForegroundColor Green
        $output = $result.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        Write-Host $output 

}
catch {
        Write-Host "Request Status was not successful" -ForegroundColor Red
        Write-Error $_
}

