# Legacy API-based organizational data samples

These folders retain the original `api.orginsights.viva.office.com` solutions for reference. Use the updated top-level folders for the `orgdata.svc.cloud.microsoft` API.

| Folder | Purpose | Authentication |
| --- | --- | --- |
| `C#_Solution` | Upload a CSV file using the legacy API | App-only certificate authentication |
| `Powershell_Solution` | Upload a CSV file using the legacy API | App-only client secret or certificate authentication |
| `PowerShell_Solution_For_Tokens` | Obtain legacy delegated access and refresh tokens; does not upload a file | Interactive authorization-code flow with client secret and S256 PKCE |

The C# and PowerShell uploaders retain their original API resource, tenant-based URL, scale-unit discovery, and `x-nova-scaleunit` header.
Their authentication and routing remain legacy. The PowerShell uploader accepts only CSV files; C# accepts CSV or JSON.

The former Node.js token helper is now a standalone PowerShell script. It retains the old Node helper's `https://api.orginsights.viva.office.com/.default` resource scope and upload URL with tenant ID, `connectorId`, and `novascaleunit`.
All configuration is prompted; no credentials are prefilled. No Node.js source, generated JavaScript, or npm dependencies are retained.

Do not mix these legacy scopes and routing settings with the updated top-level solutions.
