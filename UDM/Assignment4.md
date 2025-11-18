## Create Order Header

```
<OrderHeader 
  orderId="UDM001"
  orderTypeId="SALES_ORDER"
  statusId="ORDER_CREATED"
  createdBy="anita.malhotra"
  orderDate="2025-11-15 00:00:00.0"
  entryDate="2025-11-15 00:00:00.0"
/>
```

## Set Initial Order Status

```
<OrderStatus
  orderStatusId="UDM001CREATED"
  orderId="UDM001"
  statusId="ORDER_CREATED"
  statusUserLogin="anita.malhotra"
/>
```

## Add Order Items and Line Status

```
<OrderItem
  orderId="UDM001"
  orderItemSeqId="1"
  productId="FALCON_RED"
  statusId="ITEM_CREATED"
  quantity="23"
/>
<OrderStatus
  orderStatusId="UDM001CREATED"
  orderId="UDM001"
  orderItemSeqId="1"
  statusId="ITEM_CREATED"
/>
<OrderItem
  orderId="UDM001"
  orderItemSeqId="2"
  productId="FALCON_BLUE"
  statusId="ITEM_CREATED"
  quantity="3"
/>
```

## Assign Contact Mechanisms for Addresses

```
<OrderContactMech
  orderId="UDM001"
  contactMechId="CM2025080402"
  contactMechPurposeTypeId="BILLING_LOCATION"
/>
<OrderContactMech
  orderId="UDM001"
  contactMechId="CM2025080402"
  contactMechPurposeTypeId="SHIPPING_LOCATION"
/>
```

## Assign Contact Mechanisms for Phone and Email

```
<OrderContactMech
  orderId="UDM001"
  contactMechId="CM2025080405"
  contactMechPurposeTypeId="PHONE_BILLING"
/>
<OrderContactMech
  orderId="UDM001"
  contactMechId="CM2025080404"
  contactMechPurposeTypeId="PHONE_SHIPPING"
/>
<OrderContactMech
  orderId="UDM001"
  contactMechId="10023"
  contactMechPurposeTypeId="PRIMARY_EMAIL"
/>


```

## Assign Roles to Parties

```
<OrderRole
  orderId="UDM001"
  roleTypeId="SHIP_TO_CUSTOMER"
  partyId="P2025080401"
  fromDate="2025-03-18 05:15:43.177"
/>
<OrderRole
  orderId="UDM001"
  roleTypeId="BILL_TO_CUSTOMER"
  partyId="P2025080401"
  fromDate="2025-03-18 05:15:43.177"
/>
```

## Define Shipment Group

```
<OrderItemShipGroup
  orderId="UDM001"
  shipGroupSeqId="1"
  shipmentMethodTypeId="SAME_DAY_BLINKIT"
  carrierPartyId="TEST"
/>
```

## Add Payment Preferences

```
<OrderPaymentPreference
  orderPaymentPreferenceId="OPP1"
  orderId="UDM001"
  paymentMethodTypeId="EXT_SHOP_PAYPAL"
  statusId="PAYMENT_AUTHORIZED"
/>
```

----
