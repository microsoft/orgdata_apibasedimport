# Organizational-Data-Uploading-App

Whenever it exports the CSV file from your source system, have your custom export app automatically run the OrganizationalDataUploadApp. Clone the OrganizationalDataUploadApp to your machine by running the following command: `git clone https://github.com/microsoft/modis_ingressupload.git`.

## Setting up Data Ingestion
1. Start by reviewing details of the [API based Data Import Connector](https://go.microsoft.com/fwlink/?linkid=2337669).
2. Follow the instructions listed to register a new app in Azure. Note the **Application ID**.
3. Review instructions for [Setting up mapping and sharing](https://go.microsoft.com/fwlink/?linkid=2328300) to understand how you can map your source system attributes names to corresponding reserved attributes names and also specify details of attribute sharing. 
4. If you haven't downloaded the CSV template for importing organizational data during connector setup , you can download it [here](https://go.microsoft.com/fwlink/?linkid=2327001&clcid=0x409). 
5. Identify the attributes you want to import, this can include attributes you want to ingest as reserved attributes as well as custom attributes. 
6. Create a CSV file containing the source attribute names of the attributes you want to ingest from your system. 
7. Logon to Microsoft Admin Center and navigate to [Organizational Data in M365](https://admin.cloud.microsoft/#/featureexplorer/migration/OrganizationalDataInM365) and 
Follow the instructions and set up a **API Based Connector**.
8. Note the **scale unit** associated with your tenant.


## Setting up your export App
1. Run the custom export app runs the OrganizationalDataUploadApp, a console pops up asking you for the following inputs: 

1.	App (client) ID. Find this ID in the registered app information on the Azure portal under **Application (client) ID**. If you haven’t created and registered your app yet, follow the instructions in our main data import documentation, under Register a new app in Azure.

2.	Path to the zip folder or the single csv/json data file. Format the path like this: `C:\\Users\\JaneDoe\\OneDrive - Microsoft\\Desktop\\info.zip`.

3.	Azure Active Directory tenant ID. Also find this ID on the app's overview page under **Directory (tenant) ID**.

4.	Certificate name. This name is configured in your registered application. If you haven’t created a certificate yet, refer to [How to create a self-signed certificate](https://learn.microsoft.com/azure/active-directory/develop/howto-create-self-signed-certificate). After you upload the certificate, the certificate name shows up under **Description** in the Azure Portal.
5. Ingress Data Type: `HR` or `Survey`
