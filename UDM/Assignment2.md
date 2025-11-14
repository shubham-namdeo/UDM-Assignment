## Step 1: Create UserLogin

Define the `UserLogin` entity for your user.
```
<UserLogin userLoginId="anita.malhotra" currentPassword="securePass@123" enabled="Y" partyId="P2025080401"/>
```
## Step 2: Create Security Groups
```
<SecurityGroup groupId="ACCOUNTANT" description="ACCOUNTANT"/>
<SecurityGroup groupId="ADMIN_VIEW" description="Admin View"/>
```
## Step 3: Create Security Permissions

```
<SecurityPermission permissionId="COMMON_ADMIN" description="Common administrator access"/>
<SecurityPermission permissionId="COMMERCEUSER_VIEW" description="User can manage commerce application."/>
```

## Step 4: Link Permissions to Groups
```
<SecurityGroupPermission groupId="ACCOUNTANT" permissionId="COMMON_ADMIN"/>
<SecurityGroupPermission groupId="ADMIN_VIEW" permissionId="access"/>
```
## Step 5: Assign User to Security Groups

```
<UserLoginSecurityGroup userLoginId="anita.malhotra" groupId="ACCOUNTANT" fromDate="2025-11-14 12:08:00.000"/>
<UserLoginSecurityGroup userLoginId="anita.malhotra" groupId="ADMIN_VIEW" fromDate="2025-11-14 12:08:00.000"/>
```
