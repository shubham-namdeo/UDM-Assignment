## Create the Facility

```
<Facility
  facilityId="FALCON"
  facilityTypeId="WAREHOUSE"
  facilityName="Main Warehouse"
  ownerPartyId="COMPANY"
/>
```
## Create a Facility Location

```
<FacilityLocation
  aisleId="TL"
  areaId="TL"
  facilityId="FALCON"
  levelId="LL"
  locationSeqId="TLTLTLLL01"
  locationTypeEnumId="FLT_PICKLOC"
  positionId="01"
  sectionId="TL"
/>
```

## Assign Facility to a Facility Group

```
<FacilityGroupMember
  facilityGroupId="ALZARA"
  facilityId="FALCON"
  fromDate="2025-04-12 05:56:50.924"
/>
```
