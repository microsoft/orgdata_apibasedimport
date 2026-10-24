# OAuth 2.0 Authorization Code flow (confidential client) with refresh support
# for Microsoft Entra ID v2.
# Each sign-in uses S256 PKCE in addition to the client secret.
# Legacy API version: retains the orginsights resource and scale-unit routing.
#
# Run:
#   powershell -ExecutionPolicy Bypass -File .\oauth-auth-code.ps1
#   # Or with PowerShell 7:
#   pwsh -File .\oauth-auth-code.ps1

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

$Port = 5173
$RedirectUri = "http://localhost:$Port/callback"
$Scope = "offline_access https://api.orginsights.viva.office.com/.default"

function Read-RequiredValue {
    param(
        [Parameter(Mandatory)]
        [string]$Prompt,

        [switch]$Secure
    )

    do {
        if ($Secure) {
            $value = Read-Host -Prompt $Prompt -AsSecureString
            if ($value.Length -eq 0) {
                Write-Host "This value is required."
            }
        }
        else {
            $value = (Read-Host -Prompt $Prompt).Trim()
            if ([string]::IsNullOrWhiteSpace($value)) {
                Write-Host "This value is required."
            }
        }
    }
    while (($Secure -and $value.Length -eq 0) -or (-not $Secure -and [string]::IsNullOrWhiteSpace($value)))

    return $value
}

function ConvertTo-UrlEncodedForm {
    param(
        [Parameter(Mandatory)]
        [hashtable]$Values
    )

    return ($Values.GetEnumerator() | ForEach-Object {
            "$([uri]::EscapeDataString($_.Key))=$([uri]::EscapeDataString([string]$_.Value))"
        }) -join "&"
}

function ConvertFrom-QueryString {
    param(
        [Parameter(Mandatory)]
        [string]$Query
    )

    $values = @{}
    foreach ($part in $Query.TrimStart("?").Split("&", [System.StringSplitOptions]::RemoveEmptyEntries)) {
        $name, $value = $part.Split("=", 2)
        $values[[System.Net.WebUtility]::UrlDecode($name)] =
            [System.Net.WebUtility]::UrlDecode($value.Replace("+", " "))
    }

    return $values
}

function New-RandomUrlSafeString {
    param(
        [int]$Bytes = 32
    )

    $randomBytes = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($randomBytes)
    return [Convert]::ToBase64String($randomBytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function Get-PkceCodeChallenge {
    param(
        [Parameter(Mandatory)]
        [string]$CodeVerifier
    )

    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $hash = $sha256.ComputeHash([System.Text.Encoding]::ASCII.GetBytes($CodeVerifier))
        return [Convert]::ToBase64String($hash).TrimEnd("=").Replace("+", "-").Replace("/", "_")
    }
    finally {
        $sha256.Dispose()
    }
}

function Get-PlainTextFromSecureString {
    param(
        [Parameter(Mandatory)]
        [System.Security.SecureString]$SecureString
    )

    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

function ConvertTo-HtmlEncoded {
    param(
        [AllowEmptyString()]
        [string]$Value
    )

    return [System.Net.WebUtility]::HtmlEncode($Value)
}

function New-ConfigurationHtml {
    param(
        [Parameter(Mandatory)]
        [string]$HttpAddress,

        [Parameter(Mandatory)]
        [string]$AccessToken,

        [Parameter(Mandatory)]
        [string]$RefreshToken,

        [Parameter(Mandatory)]
        [string]$RefreshTokenUrl,

        [Parameter(Mandatory)]
        [string]$ClientId,

        [AllowEmptyString()]
        [string]$TokenType,

        [AllowEmptyString()]
        [string]$ExpiresIn,

        [AllowEmptyString()]
        [string]$Scopes
    )

    $encodedHttpAddress = ConvertTo-HtmlEncoded -Value $HttpAddress
    $encodedAccessToken = ConvertTo-HtmlEncoded -Value $AccessToken
    $encodedRefreshToken = ConvertTo-HtmlEncoded -Value $RefreshToken
    $encodedRefreshTokenUrl = ConvertTo-HtmlEncoded -Value $RefreshTokenUrl
    $encodedClientId = ConvertTo-HtmlEncoded -Value $ClientId
    $encodedTokenType = ConvertTo-HtmlEncoded -Value $TokenType
    $encodedExpiresIn = ConvertTo-HtmlEncoded -Value $ExpiresIn
    $encodedScopes = ConvertTo-HtmlEncoded -Value $Scopes

    return @"
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authorization Complete</title>
  <style>
    body { background: #f5f7fb; color: #1f1f1f; font-family: "Segoe UI", Arial, sans-serif; margin: 0; }
    main { margin: 0 auto; max-width: 1000px; padding: 32px 20px 48px; }
    h1 { color: #0f6cbd; margin-top: 0px; }
    h2 { color: #333; margin-top: 0px; }
    p { margin-bottom: 8px; }
    .card { background: #fff; border: 1px solid #d6dbe7; border-radius: 10px; box-shadow: 0 2px 8px rgb(0 0 0 / 0.06); margin-top: 20px; padding: 24px; }
    .success { background: #ecfdf3; border-color: #7fd7a8; }
    table { border-collapse: collapse; margin-top: 16px; width: 100%; }
    th, td { border: 1px solid #d6dbe7; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #0f6cbd; color: #fff; }
    .label { font-weight: 700; width: 230px; }
    textarea { border: 1px solid #9aa6b8; border-radius: 6px; box-sizing: border-box; font-family: Consolas, "Courier New", monospace; min-height: 68px; padding: 10px; resize: vertical; width: 100%; }
    pre { background: #eef1f7; border-radius: 6px; overflow-wrap: anywhere; padding: 14px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <main>
    <section class="card success">
      <h1>Authorization complete</h1>
      <p>Save this page only in a secure location; it contains access and refresh tokens.</p>
    </section>

    <section class="card">
      <h2>HRIS Integration Configuration</h2>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="label">HTTP Address</td>
            <td><textarea rows="3" readonly>$encodedHttpAddress</textarea></td>
          </tr>
          <tr>
            <td class="label">Web Service Invocation Type</td>
            <td>OAuth 2.0</td>
          </tr>
          <tr>
            <td class="label">Access Token</td>
            <td><textarea rows="5" readonly>$encodedAccessToken</textarea></td>
          </tr>
          <tr>
            <td class="label">Refresh Token</td>
            <td><textarea rows="4" readonly>$encodedRefreshToken</textarea></td>
          </tr>
          <tr>
            <td class="label">Refresh Token URL</td>
            <td><textarea rows="2" readonly>$encodedRefreshTokenUrl</textarea></td>
          </tr>
          <tr>
            <td class="label">Client ID</td>
            <td>$encodedClientId</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>Token Details</h2>
      <pre>token_type: $encodedTokenType
expires_in (sec): $encodedExpiresIn
scopes: $encodedScopes</pre>
    </section>
  </main>
</body>
</html>
"@
}

function Send-CallbackResponse {
    param(
        [Parameter(Mandatory)]
        [System.Net.HttpListenerResponse]$Response,

        [Parameter(Mandatory)]
        [int]$StatusCode,

        [Parameter(Mandatory)]
        [string]$Html
    )

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Html)
    $Response.StatusCode = $StatusCode
    $Response.ContentType = "text/html; charset=utf-8"
    $Response.ContentLength64 = $bytes.Length
    try {
        $writeTask = $Response.OutputStream.WriteAsync($bytes, 0, $bytes.Length)
        Wait-InterruptibleTask -Task $writeTask | Out-Null
    }
    finally {
        $Response.Close()
    }
}

function Wait-InterruptibleTask {
    param(
        [Parameter(Mandatory)]
        [System.Threading.Tasks.Task]$Task
    )

    while (-not $Task.IsCompleted) {
        # Running a PowerShell command at short intervals lets Ctrl+C stop the pipeline.
        Start-Sleep -Milliseconds 100
    }

    return $Task.GetAwaiter().GetResult()
}

function Wait-HttpListenerContext {
    param(
        [Parameter(Mandatory)]
        [System.Net.HttpListener]$Listener
    )

    $contextTask = $Listener.GetContextAsync()
    return Wait-InterruptibleTask -Task $contextTask
}

function Invoke-TokenRequest {
    param(
        [Parameter(Mandatory)]
        [string]$TokenEndpoint,

        [Parameter(Mandatory)]
        [hashtable]$Values
    )

    $httpClient = [System.Net.Http.HttpClient]::new()
    $content = [System.Net.Http.StringContent]::new(
        (ConvertTo-UrlEncodedForm -Values $Values),
        [System.Text.Encoding]::UTF8,
        "application/x-www-form-urlencoded"
    )

    try {
        $response = Wait-InterruptibleTask -Task $httpClient.PostAsync($TokenEndpoint, $content)
        try {
            $responseBody = Wait-InterruptibleTask -Task $response.Content.ReadAsStringAsync()
            if (-not $response.IsSuccessStatusCode) {
                throw "Token exchange failed ($([int]$response.StatusCode)): $responseBody"
            }

            return $responseBody | ConvertFrom-Json
        }
        finally {
            $response.Dispose()
        }
    }
    finally {
        $content.Dispose()
        $httpClient.Dispose()
    }
}

Write-Host "=== OAuth Configuration Setup ===`n"
Write-Host "Before proceeding, ensure the following:"
Write-Host "1. Register this redirect URI under the Web platform:"
Write-Host "   $RedirectUri"
Write-Host "2. Add required delegated API permissions and grant admin consent."
Write-Host "3. Create a client secret and retain its value."

if ((Read-Host "Have you configured the redirect URI and API permissions? [y/n]").ToLowerInvariant() -notin @("y", "yes")) {
    Write-Host "`nConfigure the redirect URI, delegated permissions, and consent in the app registration, then run this script again."
    exit 0
}

$clientId = Read-RequiredValue -Prompt "Enter Client ID"
$clientSecret = Read-RequiredValue -Prompt "Enter Client Secret" -Secure
$tenant = Read-RequiredValue -Prompt "Enter Tenant ID"
$connectorId = Read-RequiredValue -Prompt "Enter Connector ID"
$novaScaleUnit = Read-RequiredValue -Prompt "Enter Nova Scale Unit"

$authorizationEndpoint = "https://login.microsoftonline.com/$tenant/oauth2/v2.0/authorize"
$tokenEndpoint = "https://login.microsoftonline.com/$tenant/oauth2/v2.0/token"
$state = New-RandomUrlSafeString
$codeVerifier = New-RandomUrlSafeString
$codeChallenge = Get-PkceCodeChallenge -CodeVerifier $codeVerifier

$authorizationParameters = @{
    client_id             = $clientId
    response_type         = "code"
    redirect_uri          = $RedirectUri
    response_mode         = "query"
    scope                 = $Scope
    state                 = $state
    prompt                = "select_account"
    code_challenge        = $codeChallenge
    code_challenge_method = "S256"
}

$authorizationUrl = "$authorizationEndpoint`?$(ConvertTo-UrlEncodedForm -Values $authorizationParameters)"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$callbackResponseSent = $false

try {
    $listener.Start()
    Write-Host "`nOpening browser for Microsoft Entra sign-in..."
    Start-Process $authorizationUrl
    Write-Host "Waiting for authorization callback at $RedirectUri (press Ctrl+C to cancel)"

    do {
        $context = Wait-HttpListenerContext -Listener $listener
        $callbackResponseSent = $false
        if ($context.Request.Url.AbsolutePath -ne "/callback") {
            Send-CallbackResponse -Response $context.Response -StatusCode 404 -Html "<h2>Not found</h2>"
            $callbackResponseSent = $true
            continue
        }

        $callbackValues = ConvertFrom-QueryString -Query $context.Request.Url.Query
        if ($callbackValues.ContainsKey("error")) {
            $authorizationError = $callbackValues["error"]
            $description = $callbackValues["error_description"]
            $encodedAuthorizationError = ConvertTo-HtmlEncoded -Value $authorizationError
            $encodedDescription = ConvertTo-HtmlEncoded -Value $description
            Send-CallbackResponse -Response $context.Response -StatusCode 400 -Html "<h2>Authorization failed</h2><p>${encodedAuthorizationError}: $encodedDescription</p>"
            $callbackResponseSent = $true
            throw "Authorization failed: $authorizationError - $description"
        }

        if (-not $callbackValues.ContainsKey("code") -or $callbackValues["state"] -ne $state) {
            Send-CallbackResponse -Response $context.Response -StatusCode 400 -Html "<h2>Invalid authorization callback</h2>"
            $callbackResponseSent = $true
            throw "The callback did not include a valid authorization code and state."
        }

        $authorizationCode = $callbackValues["code"]
        break
    }
    while ($true)

    $clientSecretText = Get-PlainTextFromSecureString -SecureString $clientSecret
    try {
        $tokenResponse = Invoke-TokenRequest `
            -TokenEndpoint $tokenEndpoint `
            -Values @{
                client_id     = $clientId
                client_secret = $clientSecretText
                grant_type    = "authorization_code"
                code          = $authorizationCode
                redirect_uri  = $RedirectUri
                code_verifier = $codeVerifier
            }
    }
    finally {
        $clientSecretText = $null
        $codeVerifier = $null
    }

    $httpAddress = "https://api.orginsights.viva.office.com/v1.0/tenants/$([uri]::EscapeDataString($tenant))/modis/connectors/HR/ingestions/fileIngestion?connectorId=$([uri]::EscapeDataString($connectorId))&novascaleunit=$([uri]::EscapeDataString($novaScaleUnit))"
    $refreshToken = if ([string]::IsNullOrWhiteSpace($tokenResponse.refresh_token)) { "N/A" } else { $tokenResponse.refresh_token }

    $configurationHtml = New-ConfigurationHtml `
        -HttpAddress $httpAddress `
        -AccessToken $tokenResponse.access_token `
        -RefreshToken $refreshToken `
        -RefreshTokenUrl $tokenEndpoint `
        -ClientId $clientId `
        -TokenType ([string]$tokenResponse.token_type) `
        -ExpiresIn ([string]$tokenResponse.expires_in) `
        -Scopes ([string]$tokenResponse.scope)
    Send-CallbackResponse -Response $context.Response -StatusCode 200 -Html $configurationHtml
    $callbackResponseSent = $true

    Write-Host "`n=== HRIS Integration Configuration ==="
    Write-Host "HTTP Address: $httpAddress"
    Write-Host
    Write-Host "Web Service Invocation Type: OAuth 2.0"
    Write-Host
    Write-Host "Access Token: $($tokenResponse.access_token)"
    Write-Host
    Write-Host "Refresh Token: $refreshToken"
    Write-Host
    Write-Host "Refresh Token URL: $tokenEndpoint"
    Write-Host
    Write-Host "Client ID: $clientId"
    Write-Host "`n=== Token Details ==="
    Write-Host "token_type: $($tokenResponse.token_type)"
    Write-Host
    Write-Host "expires_in (sec): $($tokenResponse.expires_in)"
    Write-Host
    Write-Host "scopes: $($tokenResponse.scope)"
}
catch [System.Management.Automation.PipelineStoppedException] {
    exit 130
}
catch {
    if (-not $callbackResponseSent -and $null -ne $context -and $null -ne $context.Response) {
        $encodedError = ConvertTo-HtmlEncoded -Value ([string]$_)
        Send-CallbackResponse `
            -Response $context.Response `
            -StatusCode 500 `
            -Html "<h2>Token request failed</h2><p>$encodedError</p><p>Return to PowerShell for details.</p>"
        $callbackResponseSent = $true
    }

    Write-Error $_
    exit 1
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }

    $listener.Close()
}
