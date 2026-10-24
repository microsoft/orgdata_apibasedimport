# Quick start: legacy organizational data tokens

Use this helper only for the legacy `api.orginsights.viva.office.com` integration.
It is a PowerShell conversion of the old Node.js helper; the old API resource and routing are retained.

## Run

Register `http://localhost:5173/callback` as a **Web** redirect URI, then run from this folder:

```powershell
powershell -File .\oauth-auth-code.ps1
# Or with PowerShell 7:
pwsh -File .\oauth-auth-code.ps1
```

Enter the client ID, client secret (hidden), tenant ID, connector ID, and Nova scale unit.
No values are prefilled. No Node.js, npm, or additional PowerShell module is needed.

The helper uses `authorization_code`, a client secret, S256 PKCE, and callback-state validation.
It retains the original Node helper's scope:

```text
offline_access https://api.orginsights.viva.office.com/.default
```

The terminal and browser display the access token, refresh token, refresh-token URL, client ID, and this legacy upload address:

```text
https://api.orginsights.viva.office.com/v1.0/tenants/YOUR-TENANT-ID/modis/connectors/HR/ingestions/fileIngestion?connectorId=YOUR-CONNECTOR-ID&novascaleunit=YOUR-SCALE-UNIT
```

Retain the original client secret separately; it is not printed.
The listener closes and the script exits after completion. Press Ctrl+C to cancel while waiting.
Treat tokens and saved pages as credentials.

This helper does not upload a file. Use the neighboring legacy CSV uploaders for app-only uploads.
For the updated API and its delegated `access_as_user` scope without a scale unit, use the top-level token helper.
