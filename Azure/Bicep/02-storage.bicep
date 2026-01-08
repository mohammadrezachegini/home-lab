resource sa 'Microsoft.Storage/storageAccounts@2025-01-01' = {
  name : 'rezastorageaccount'
  location: 'eastus'
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}
