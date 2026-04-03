# Quick Start Guide

Follow these steps to get the OAuth Token Generator running:

## Prerequisites

- **Node.js (v16 or higher)** installed on your computer
  - **Don't have Node.js?** Download and install it from: https://nodejs.org/
  - This includes npm (Node Package Manager) which is required to run the setup commands
  - To verify installation, run: `node --version` and `npm --version`
- **App registration details** from Azure Portal (refer to `FULL_INSTRUCTIONS.md`)
  - Application (client) ID
  - Client secret
  - Directory (tenant) ID
- **Connector Details** from _Org data in M365_ (See `FULL_INSTRUCTIONS.md` Step 2 for detailed instructions with screenshots):
  - Connector ID (from API connector URL)
  - Nova Scale Unit (from API connector setup)

## Installation & Setup

1. **Clone** this github repo

2. **Open PowerShell/Command Prompt** in this folder

3. **Run the setup command**:
   ```powershell
   npm run setup
   ```
   This will install all dependencies and compile the TypeScript code.
   
   **Note:** If you get an error like `'npm' is not recognized`, you need to install Node.js first (see Prerequisites above).

## Running the Program

After setup is complete, run:
```powershell
npm start
```

Or directly:
```powershell
node oauth-auth-code.js
```

The program will prompt you for:
1. **Azure App Registration information**: Client ID, Client Secret, Tenant ID
2. **_Org data in M365_ connector details**: Connector ID, Nova Scale Unit

After authentication, the program will display the **complete configuration** with all the values you need to copy into your HRIS integration!

## What's Included

- `oauth-auth-code.ts` - Main TypeScript source code
- `oauth-auth-code.js` - Compiled JavaScript (generated after setup)
- `package.json` - Node.js dependencies configuration
- `FULL_INSTRUCTIONS.md` - Complete documentation with Azure AD setup instructions
- `screenshots/` - Folder for storing configuration screenshots

## Need Help?

Refer to `FULL_INSTRUCTIONS.md` for:
- Detailed Azure app registration setup
- API permissions configuration
- Integration instructions if you are using Workday EIB as your HRIS integration
- Troubleshooting common issues

## Quick Command Reference

```powershell
# Install dependencies and compile
npm run setup

# Compile TypeScript code only
npm run build

# Run the program
npm start
# or
node oauth-auth-code.js
```
