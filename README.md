# Sample Code for API Based Organizational Data Upload

[Organizational Data in Microsoft 365](https://go.microsoft.com/fwlink/?linkid=2339569) allows Microsoft customers to send organizational data (data associated with users) from their HR systems to Microsoft. The ingested organizational is data is used to light up multiple scenarios and functionality within Microsoft 365 and Viva Employee Experience platform.

We support multiple connector types to allow customers to setup automated data connectors to ensure the organizational data remains fresh helping improve the quality of the experiences.

The sample C# application and PowerShell script provided in this project can be used when setting up the API based connector type. 

1. C#_Solution: This requires running C# code in visual studio/command line 
2. PowerShell_Upload_Solution: Uploads CSV files using Windows PowerShell 5.1 or PowerShell 7 on Windows. Requires MSAL.PS installed in the PowerShell edition used to run it.
3. PowerShell_Token_Solution: A standalone PowerShell helper for obtaining delegated access and refresh tokens for an HRIS integration; it does not upload a CSV file. Supports Windows PowerShell 5.1 and PowerShell 7 on Windows without additional PowerShell modules.

All updated top-level samples use `https://orgdata.svc.cloud.microsoft/v1.0/dataUpload/HR/ingestions/fileIngestion?connectorId=<connector-id>`.
The connector ID is required and is supplied as the `connectorId` query parameter. No scale unit, scale-unit lookup, or scale-unit header is needed.
The C# and PowerShell uploaders use app-only authentication; the token helpers use interactive sign-in.

The original `api.orginsights.viva.office.com` samples are retained in [Old_Solutions](./Old_Solutions/README.md). Their token helper has also been converted from Node.js to PowerShell, retaining the legacy endpoint, resource scope, and scale-unit input.
Use the top-level folders for the updated organizational data API; no Node.js installation is required.

Customers can use any method to extract data from the HRIS system into a CSV file. Ideally, they are able to set up an extraction job to take a snapshot of the organizational data as a CSV file at regular intervals and then run either the C# application or Poweshell script to call the publically export API to push the organizational data file to Microsoft. 

In order to set up the C# application or Powershell script, execute the following steps.

## Cloning the Sample Code

1. Clone the sample solutions to your machine by running the following command:
```
  git clone https://github.com/microsoft/orgdata_apibasedimport.git
```

## Setting up Data Ingestion
1. Start by reviewing details of the [API based Data Import Connector](https://go.microsoft.com/fwlink/?linkid=2337669).
2. Follow the instructions listed in [Register an App](https://go.microsoft.com/fwlink/?linkid=2333489&clcid=0x409) to register a new app in Azure. Follow instructions from step 1 to set up authentication for the Entra Application. Note the **Application ID**. Additionally note the **Client Secret** or **Certificate Name** based on the authentication method you plan to use.
3. If you haven't downloaded the CSV template for setting up organizational data file, you can download it [here](https://go.microsoft.com/fwlink/?linkid=2327001&clcid=0x409). 
4. Identify the attributes you want to import, this includes attributes you want to ingest as reserved attributes as well as custom attributes. 
5. Create a CSV file containing the source attribute names of the attributes you plan to extract from your system. 
6. Extract just the headers from the CSV file into a separate CSV file. This will be used during connector setup.
7. Review instructions for [Setting up mapping and sharing](https://go.microsoft.com/fwlink/?linkid=2328300) to understand how you can map your source system attributes names to corresponding reserved attributes names and also specify details of attribute sharing. 
8. Logon to Microsoft Admin Center and navigate to [Organizational Data in M365](https://admin.cloud.microsoft/#/featureexplorer/migration/OrganizationalDataInM365) and 
initiate the **API Based Connector** setup.
9. Complete the **API Based Connector** setup, providing the Entra App ID, selecting the applications you want to share the organizational data with, uploading the header only csv file and completing the connector setup.
10. Note the **Connector ID** from the API-based connector page URL after completing setup.
11. Depending on whether you are using the C# application or the PowerShell script, follow the instruction in the corresponding folder to push the CSV data file to Microsoft. 
12. Make sure to extract latest snapshots from the HRIS systems at regular intervals and push the data to Microsoft regularly.
