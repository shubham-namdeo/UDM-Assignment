## Create Customer Data
Follow these steps

## Step 1: Create Party

Define the Party entity for your customer.

```xml
<Party partyId="P2025080401" partyTypeId="PERSON" statusId="PARTY_ENABLED" createdDate="2025-08-04 20:00:00" />
```

## Step 2: Create Person

Link Party to the Person.

```xml
Add the Person element linked to your Party.
<Person partyId="P2025080401" firstName="Shubham" lastName="Hotwax" />
```
## Step 3: Assign Party Role

Assign PartyRole to the party.

```xml
<PartyRole partyId="P2025080401" roleTypeId="CUSTOMER" />
```

## Step 4: Create ContactMech details

Add all contact methods—email, addresses, and phone numbers—using different contactMechId values to ensure uniqueness.

```xml
<ContactMech contactMechId="CM2025080401" contactMechTypeId="EMAIL_ADDRESS" infoString="shubham@party.com" />
<ContactMech contactMechId="CM2025080402" contactMechTypeId="POSTAL_ADDRESS" />
<ContactMech contactMechId="CM2025080403" contactMechTypeId="POSTAL_ADDRESS" />
<ContactMech contactMechId="CM2025080404" contactMechTypeId="TELECOM_NUMBER" />
<ContactMech contactMechId="CM2025080405" contactMechTypeId="TELECOM_NUMBER" />
```

## Step 5: Specify Details for ContactMech

Define the information for each contact method.

```xml
<PostalAddress contactMechId="CM2025080402" address1="Hotwax Building" city="Indore" stateProvinceGeoId="MP" countryGeoId="IND" postalCode="452010" toName="Shubham Hotwax" />
<PostalAddress contactMechId="CM2025080403" address1="Vijay Nagar" city="Indore" stateProvinceGeoId="MP" countryGeoId="IND" postalCode="452010" toName="Shubham Hotwax" />
<TelecomNumber contactMechId="CM2025080404" countryCode="91" contactNumber="12345" />
<TelecomNumber contactMechId="CM2025080405" countryCode="91" contactNumber="54321" />
```

## Step 6: Link Party to ContactMech
Associate each contact record with your party using PartyContactMech

```xml
<PartyContactMech partyId="P2025080401" contactMechId="CM2025080401" fromDate="2025-08-04 20:00:00" />
<PartyContactMech partyId="P2025080401" contactMechId="CM2025080402" fromDate="2025-08-04 20:00:00" />
<PartyContactMech partyId="P2025080401" contactMechId="CM2025080403" fromDate="2025-08-04 20:00:00" />
<PartyContactMech partyId="P2025080401" contactMechId="CM2025080404" fromDate="2025-08-04 20:00:00" />
<PartyContactMech partyId="P2025080401" contactMechId="CM2025080405" fromDate="2025-08-04 20:00:00" />
```

## Step 7: Set Purpose for Contact Method
Define which contact method is for what purpose using PartyContactMechPurpose

```xml
<PartyContactMechPurpose partyId="P2025080401" contactMechId="CM2025080401" contactMechPurposeTypeId="PRIMARY_EMAIL" fromDate="2025-08-04 20:00:00" />
<PartyContactMechPurpose partyId="P2025080401" contactMechId="CM2025080402" contactMechPurposeTypeId="SHIPPING_LOCATION" fromDate="2025-08-04 20:00:00" />
<PartyContactMechPurpose partyId="P2025080401" contactMechId="CM2025080403" contactMechPurposeTypeId="BILLING_LOCATION" fromDate="2025-08-04 20:00:00" />
<PartyContactMechPurpose partyId="P2025080401" contactMechId="CM2025080404" contactMechPurposeTypeId="PHONE_SHIPPING" fromDate="2025-08-04 20:00:00" />
<PartyContactMechPurpose partyId="P2025080401" contactMechId="CM2025080405" contactMechPurposeTypeId="PHONE_BILLING" fromDate="2025-08-04 20:00:00" />
```

