
# Product Setup XML

## 1. Create Catalog

```
<ProdCatalog catalogName="Falcon catalog v1" prodCatalogId="9102"/>
```

## 2. Create Root Category

```
<ProductCategory productCategoryId="FALCON_ROOT_CAT" productCategoryTypeId="CATALOG_CATEGORY"/>
```

## 3. Link Catalog to Root Category

```
<ProdCatalogCategory
    prodCatalogId="9102"
    productCategoryId="FALCON_ROOT_CAT"
    prodCatalogCategoryTypeId="PCCT_BROWSE_ROOT"
    fromDate="2025-11-14 00:00:00.0"
/>
```

## 4. Assign Catalog to Store

```
<ProductStoreCatalog
    fromDate="2025-11-14 10:00:00.0"
    prodCatalogId="9102"
    productStoreId="STORE"
/>
```

## 5. Create Subcategory

```
<ProductCategory productCategoryId="FALCON_PHONE_CAT" productCategoryTypeId="CATALOG_CATEGORY"/>
```

## 6. Add Subcategory to Root Category

```
<ProductCategoryRollup parentProductCategoryId="FALCON_ROOT_CAT" productCategoryId="FALCON_PHONE_CAT" fromDate="2025-11-14 00:00:00.0"/>
```

## 7. Create a Finished Good Product

```
<Product internalName="Falcon Phone X" productId="FALCON_PHONEX" productTypeId="FINISHED_GOOD"/>
```

## 8. Set Product Pricing

```
<ProductPrice productId="FALCON_PHONEX" productPricePurposeId="PURCHASE" productPriceTypeId="LIST_PRICE" currencyUomId="USD" fromDate="2025-11-14 10:10:00.0" price="599.00" productStoreGroupId="STORE_GROUP"/>
```

## 9. Associate Product with Subcategory

```
<ProductCategoryMember productId="FALCON_PHONEX" productCategoryId="FALCON_PHONE_CAT" fromDate="2025-11-14 10:15:00.0"/>
```

## 10. Create Virtual and Variant Products

Virtual Product
```
<Product
    internalName="Falcon Phone X - Variant"
    productId="FALCON_VIRTUAL"
    productTypeId="FINISHED_GOOD"
    isVirtual="Y"
    virtualVariantMethodEnum="VV_VARIANTTREE"
/>
```

Variants
```
<Product
    internalName="Falcon Phone X - Red"
    productId="FALCON_RED"
    productTypeId="FINISHED_GOOD"
    isVariant="Y"
/>
<Product
    internalName="Falcon Phone X - Blue"
    productId="FALCON_BLUE"
    productTypeId="FINISHED_GOOD"
    isVariant="Y"
/>
```

Link variants to virtual product
```
<ProductAssoc
    productId="FALCON_VIRTUAL"
    productIdTo="FALCON_RED"
    productAssocTypeId="PRODUCT_VARIANT"
    fromDate="2025-11-14 12:00:00.0"
/>
<ProductAssoc
    productId="FALCON_VIRTUAL"
    productIdTo="FALCON_BLUE"
    productAssocTypeId="PRODUCT_VARIANT"
    fromDate="2025-11-14 12:00:00.0"
/>
```

## 11. Create Kit Product

Create Kit Product
```
<Product
    internalName="Falcon Phone Bundle"
    productId="FALCON_BUNDLE"
    productTypeId="MARKETING_PKG_PICK"
/>
```

Product Association
```
<ProductAssoc
    productId="FALCON_BUNDLE"
    productIdTo="FALCON_PHONEX"
    productAssocTypeId="PRODUCT_COMPONENT"
    fromDate="2025-11-14 12:05:00.0"
    quantity="2"
/>
<ProductAssoc
    productId="FALCON_BUNDLE"
    productIdTo="FALCON_RED"
    productAssocTypeId="PRODUCT_COMPONENT"
    fromDate="2025-11-14 12:05:00.0"
    quantity="1"
/>
```

Product Price
```
<ProductPrice
    productId="FALCON_BUNDLE"
    productPricePurposeId="PURCHASE"
    productPriceTypeId="LIST_PRICE"
    currencyUomId="USD"
    fromDate="2025-11-14 12:10:00.0"
    price="1200.00"
    productStoreGroupId="_NA_"
 />
```

## 12. Create ProductFeatureType and Apply Features

Product Feature Type
```
<ProductFeatureType productFeatureTypeId="MEMORY" description="Memory"/>
```

Product Feature
```
<ProductFeature
    description="128 GB"
    productFeatureId="FALCON_128GB"
    productFeatureTypeId="MEMORY"
/>
<ProductFeature
    description="256 GB"
    productFeatureId="FALCON_256GB"
    productFeatureTypeId="MEMORY"
/>
```

Product Feature Appl
```
<ProductFeatureAppl
    fromDate="2025-11-14 12:00:00.0"
    productId="FALCON_VIRTUAL"
    productFeatureId="FALCON_128GB"
    productFeatureApplTypeId="SELECTABLE_FEATURE"
/>
<ProductFeatureAppl
    fromDate="2025-11-14 12:00:00.0"
    productId="FALCON_VIRTUAL"
    productFeatureId="FALCON_256GB"
    productFeatureApplTypeId="SELECTABLE_FEATURE"
/>
<ProductFeatureAppl
    fromDate="2025-11-14 12:00:00.0"
    productId="FALCON_RED"
    productFeatureId="FALCON_128GB"
    productFeatureApplTypeId="STANDARD_FEATURE"
/>
<ProductFeatureAppl
    fromDate="2025-11-14 12:00:00.0"
    productId="FALCON_BLUE"
    productFeatureId="FALCON_256GB"
    productFeatureApplTypeId="STANDARD_FEATURE"
/>
```

## 13. Create Product Associations (Also bought, Up-sell, Cross-sell)

```
<ProductAssoc
    productId="FALCON_BUNDLE"
    productIdTo="FALCON_VIRTUAL"
    productAssocTypeId="ALSO_BOUGHT"
    fromDate="2025-11-14 12:20:00.0"
/>
<ProductAssoc
    productId="FALCON_PHONEX"
    productIdTo="FALCON_VIRTUAL"
    productAssocTypeId="PRODUCT_UPGRADE"
    fromDate="2025-11-14 12:19:00.0"
/>
<ProductAssoc
    productId="FALCON_PHONEX"
    productIdTo="FALCON_RED"
    productAssocTypeId="PRODUCT_COMPLEMENT"
    fromDate="2025-11-14 12:18:00.0"
/>
```
