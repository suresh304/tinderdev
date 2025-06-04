// utils/azureUploader.js
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
// const containerName = process.env.AZURE_BLOB_CONTAINER;
const containerName = "uploads";

const uploadFileToAzure = async (localFilePath, blobName) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadFile(localFilePath);
  return blockBlobClient.url;
};

module.exports = { uploadFileToAzure };
