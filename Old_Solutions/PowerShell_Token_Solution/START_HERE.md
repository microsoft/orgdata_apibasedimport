# Legacy PowerShell token helper

This is the PowerShell conversion of the original Node.js token helper. It retains the legacy `api.orginsights.viva.office.com` API URL and routing logic.
It obtains tokens only; it does not upload a CSV file. No Node.js installation is required.

Have these five values ready:

- Application (client) ID
- Client secret value
- Directory (tenant) ID
- Connector ID
- Nova scale unit from the legacy connector setup

Register `http://localhost:5173/callback` as a **Web** redirect URI.
From this folder, run:

```powershell
powershell -File .\oauth-auth-code.ps1
# Or:
pwsh -File .\oauth-auth-code.ps1
```

All values are prompted; the client secret input is hidden.
For the updated API without scale-unit routing, use the top-level `PowerShell_Solution_For_Tokens` instead.
See `QUICKSTART.md` or `FULL_INSTRUCTIONS.md` for the legacy scopes and output address.
