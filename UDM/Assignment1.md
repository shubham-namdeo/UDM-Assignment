    <entity-engine-xml>
    Step 1: Party
    <Party partyId="P2025080401" partyTypeId="PERSON" statusId="PARTY_ENABLED" createdDate="2025-08-04 20:00:00"/>
    
    Step 2: Person
    <Person partyId="P2025080401" firstName="Shubham" lastName="Hotwax"/>
    
    Step 3: Party Role
    <PartyRole partyId="P2025080401" roleTypeId="CUSTOMER"/>
    
    Step 4: ContactMech
    <!-- Primary Email -->
    <ContactMech contactMechId="CM2025080401" contactMechTypeId="EMAIL_ADDRESS" infoString="shubham@party.com"/>
    <!-- Shipping Address -->
    <ContactMech contactMechId="CM2025080402" contactMechTypeId="POSTAL_ADDRESS"/>
    <!-- Billing Address -->
    <ContactMech contactMechId="CM2025080403" contactMechTypeId="POSTAL_ADDRESS"/>
    <!-- Shipping Phone -->
    <ContactMech contactMechId="CM2025080404" contactMechTypeId="TELECOM_NUMBER"/>
    <!-- Billing Phone -->
    <ContactMech contactMechId="CM2025080405" contactMechTypeId="TELECOM_NUMBER"/>
    
    ContactMechType
    <EmailAddress contactMechId="CM2025080401" emailAddress="shubham@party.com"/>
    <PostalAddress contactMechId="CM2025080402" address1="Hotwax Building" city="Indore" stateProvinceGeoId="MP" countryGeoId="IND" postalCode="452010" toName="Shubham Hotwax"/>
    <PostalAddress contactMechId="CM2025080403" address1="Vijay Nagar" city="Indore" stateProvinceGeoId="MP" countryGeoId="IND" postalCode="452010" toName="Shubham Hotwax"/>
    <TelecomNumber contactMechId="CM2025080404" countryCode="91" contactNumber="12345"/>
    <TelecomNumber contactMechId="CM2025080405" countryCode="91" contactNumber="54321"/>
    
    Step 5: PartyContactMech
    <PartyContactMech partyId="P2025080401" contactMechId="CM2025080401" fromDate="2025-08-04 20:00:00"/>
    <PartyContactMech partyId="P2025080401" contactMechId="CM2025080402" fromDate="2025-08-04 20:00:00"/>
    <PartyContactMech partyId="P2025080401" contactMechId="CM2025080403" fromDate="2025-08-04 20:00:00"/>
    <PartyContactMech partyId="P2025080401" contactMechId="CM2025080404" fromDate="2025-08-04 20:00:00"/>
    <PartyContactMech partyId="P2025080401" contactMechId="CM2025080405" fromDate="2025-08-04 20:00:00"/>
    
    Step 6: PartyContactMechPurpose
    <PartyContactMechPurpose partyId="P2025080401" contactMechId="CM2025080401" contactMechPurposeTypeId="PRIMARY_EMAIL" fromDate="2025-08-04 20:00:00"/>
    <PartyContactMechPurpose partyId="P2025080401" contactMechId="CM2025080402" contactMechPurposeTypeId="SHIPPING_LOCATION" fromDate="2025-08-04 20:00:00"/>
    <PartyContactMechPurpose partyId="P2025080401" contactMechId="CM2025080403" contactMechPurposeTypeId="BILLING_LOCATION" fromDate="2025-08-04 20:00:00"/>
    <PartyContactMechPurpose partyId="P2025080401" contactMechId="CM2025080404" contactMechPurposeTypeId="PHONE_SHIPPING" fromDate="2025-08-04 20:00:00"/>
    <PartyContactMechPurpose partyId="P2025080401" contactMechId="CM2025080405" contactMechPurposeTypeId="PHONE_BILLING" fromDate="2025-08-04 20:00:00"/>
    </entity-engine-xml>
