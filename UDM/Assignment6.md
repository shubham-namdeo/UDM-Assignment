## 1. Create Inventory Items

```
<InventoryItem
  accountingQuantityTotal="1000"
  availableToPromiseTotal="950"
  datetimeReceived="2025-01-01 09:36:42.823"
  facilityId="FALCON"
  inventoryItemId="FA101"
  inventoryItemTypeId="NON_SERIAL_INV_ITEM"
  lastReceivedUnitCost="599"
  locationSeqId="TLTLTL01"
  ownerPartyId="COMPANY"
  productId="FALCON_BLUE"
  quantityOnHandTotal="1000"
  unitCost="599"
/>

<InventoryItem
  accountingQuantityTotal="1000"
  availableToPromiseTotal="950"
  datetimeReceived="2025-01-01 09:36:42.823"
  facilityId="FALCON"
  inventoryItemId="FA102"
  inventoryItemTypeId="NON_SERIAL_INV_ITEM"
  lastReceivedUnitCost="599"
  locationSeqId="TLTLTL01"
  ownerPartyId="COMPANY"
  productId="FALCON_RED"
  quantityOnHandTotal="1000"
  unitCost="599"
/>
```


## 2. Record Inventory Adjustments

```
<InventoryItemDetail
  availableToPromiseDiff="-1.000000"
  effectiveDate="2025-11-17 08:15:39.613"
  inventoryItemDetailSeqId="FA101D"
  inventoryItemId="FA101"
  lastAvailableToPromise="950.000000"
  lastQuantityOnHand="1050.000000"
  lastUpdatedStamp="2025-11-18 08:15:39.516"
  orderId="UDM001"
  orderItemSeqId="1"
  quantityOnHandDiff="0.000000"
  shipGroupSeqId="1"
/>

<InventoryItemDetail
  availableToPromiseDiff="-1.000000"
  effectiveDate="2025-11-17 08:15:39.613"
  inventoryItemDetailSeqId="FA101E"
  inventoryItemId="FA102"
  lastAvailableToPromise="950.000000"
  lastQuantityOnHand="1050.000000"
  lastUpdatedStamp="2025-11-18 08:15:39.516"
  orderId="UDM001"
  orderItemSeqId="1"
  quantityOnHandDiff="0.000000"
  shipGroupSeqId="1"
/>
```

---
