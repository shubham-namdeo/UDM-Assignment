# Comprehensive IBM Sterling OMS Consultant Master Guide: Architecture, Implementation, and Extensibility

**Key Points**
* IBM Sterling Order Management System (OMS) is a comprehensive, centralized orchestration platform designed to manage the entire order lifecycle across disparate systems and channels, orchestrating cross-channel selling and fulfillment.
* The system’s logical architecture heavily relies on precise Participant Modeling, utilizing constructs like Hub, Enterprise, Node, and Buyer/Seller to define operational boundaries, access controls, and data ownership.
* Workflow execution is rigorously governed by process types, pipelines, conditions, events, and Time-Triggered Transactions (Agents) that process tasks asynchronously using robust queuing mechanisms such as the `YFS_TASK_Q` table.
* Inventory visibility and promising are handled via the Real-Time Availability Monitor (RTAM), which applies Available-To-Promise (ATP) rules and generates delta updates for external catalog caches via `REALTIME_AVAILABILITY_CHANGE` events.
* Extensibility must strictly adhere to "Cloud Guardrails" in Order Management on Cloud (OMOC) environments, emphasizing upgrade-safe overlays, custom Service Definition Framework (SDF) implementations, and strict database extension guidelines involving Custom and Hang-off tables.
* It seems highly likely that mastering the intricacies of payment orchestration—such as leveraging the `recordExternalCharges` API alongside the `YFSCollectionOthersUE` user exit—is critical for implementing edge-case workflows like Cash on Delivery (COD) and Wallet payments without violating the base settlement logic.

**Overview of the Master Guide**
The modern supply chain requires unprecedented agility. Organizations are increasingly relying on distributed, multi-node fulfillment networks to meet consumer demands for speed and transparency. IBM Sterling OMS serves as the digital backbone for these operations. This comprehensive consultant master guide synthesizes technical architecture, business logic configuration, and deployment strategies into an authoritative resource for enterprise architects and OMS consultants. 

The guide is divided into specialized domains: Enterprise Modeling, Pipeline & Process Modeling, Inventory Management, Fulfillment Operations, Reverse Logistics, Payment Lifecycle, and Technical Extensibility.

---

## 1. Introduction to IBM Sterling OMS

IBM Sterling Order Management System (OMS) is an enterprise-grade software solution that brokers orders across many disparate systems, orchestrates and automates cross-channel selling and fulfillment processes, and provides a global view of supply and demand across the supply chain. The platform is built on a Service-Oriented Architecture (SOA), allowing businesses to abstract the complexity of their backend Enterprise Resource Planning (ERP), Warehouse Management Systems (WMS), and Transportation Management Systems (TMS) from the front-end commerce and point-of-sale (POS) channels.

```mermaid
graph TB
    subgraph Channels["Demand & Capture Channels"]
        ECOM["eCommerce (Shopify / Adobe / HCL)"]
        POS["Store Point-of-Sale (POS)"]
        CALL["Call Center / CSR Portal"]
        B2B["B2B Portals & Marketplaces"]
    end

    subgraph CoreOMS["IBM Sterling OMS Core Platform"]
        API["API Gateway & Web Services (REST / SOAP / XML)"]
        OM["Order Management & Orchestration Hub"]
        GIV["Global Inventory Visibility (GIV & ATP)"]
        PROM["Promising & Sourcing Engine"]
        PAY["Payment & Settlement Orchestration"]
        REV["Reverse Logistics & Returns Management"]
        SDF["Service Definition Framework (SDF)"]
        AGENT["Agent Engine & Time-Triggered Tasks"]
    end

    subgraph Execution["Supply, Logistics & Financial Systems"]
        WMS["Warehouse Management (Sterling WMS / Manhattan / Blue Yonder)"]
        STORES["Store Operations & Micro-Fulfillment"]
        TMS["Transportation Management & Carriers (FedEx / UPS / DHL)"]
        ERP["Financials & ERP (SAP / Oracle / NetSuite)"]
        GATEWAY["Payment Gateways (Stripe / Adyen / Chase)"]
    end

    Channels --> API
    API --> OM
    OM <--> GIV
    OM <--> PROM
    OM <--> PAY
    OM <--> REV
    OM <--> SDF
    SDF <--> AGENT

    OM <--> WMS
    OM <--> STORES
    OM <--> TMS
    PAY <--> GATEWAY
    OM <--> ERP
```

The platform is underpinned by the Sterling Application Platform, a collection of common components and foundational data structures used across the application. These components provide the infrastructure upon which all other business application modules are built, supporting a highly customizable relational schema known as the Sterling Data Model, which houses critical tables such as `YFS_ORDER_HEADER`, `YFS_ORDER_LINE`, and `YFS_INVENTORY_ITEM`.

---

## 2. Deep Dive into Enterprise Modeling

At the core of the Sterling OMS architecture is a robust organizational modeling framework known as Participant Modeling. This framework defines the legal, physical, and logical entities that interact within the supply chain network. The Applications Manager Configurator is utilized to create and maintain these organizations, define their roles, establish the services they provide, and configure the business elements required for collaborative processes.

### Participant Modeling: Hub, Enterprise, Seller, Buyer, and Node
Participant Modeling allows for the configuration of a multi-enterprise, multi-tenant marketplace. A marketplace acts as an online intermediary connecting Buyers and Sellers, aggregating offerings to eliminate inefficiencies and lower transaction costs.

1. **Hub**: The Hub is the central location and trusted intermediary that integrates procedures and technology. It is the root organization in the Sterling OMS hierarchy. System-wide configurations, generic document routing, and base application rules are often owned by the Hub. 
2. **Enterprise**: In the marketplace model, each market or distinct business unit can be set up as an Enterprise. This setup allows each market to be unique, possessing its own product handling, inventory separation, and business rules. The Enterprise represents the legal entity that owns the catalog, pricing, and the overarching lifecycle of an order.
3. **Seller and Buyer**: These are counterparties in a transaction. Organizations can be configured explicitly as Sellers (who provide goods/services) and Buyers (who procure them). An organization can hold multiple roles simultaneously depending on the context of the transaction.
4. **Node**: Nodes represent physical or virtual locations where inventory is held and fulfillment occurs. Examples include distribution centers (DCs), retail stores, third-party logistics (3PL) warehouses, and drop-ship vendors. Nodes are mapped to an organization and often act as the executing entities for warehouse operations.
5. **Carrier**: Logistics providers responsible for moving inventory between Nodes or from a Node to a Buyer. 

### Organization Hierarchy and Rule Inheritance Flow

```mermaid
graph TD
    subgraph HubOrg["Global Hub Organization (Root)"]
        HUB["Global Enterprise Holding (Hub)"]
        HUB_RULES["Global Base Rules, Default Pipelines & Abstract Transactions"]
    end

    subgraph Enterprises["Legal Business Entities (Enterprises)"]
        ENT_US["Enterprise North America (US/CA)"]
        ENT_EU["Enterprise Europe (EU/UK)"]
        ENT_APAC["Enterprise APAC (IN/AU/JP)"]
    end

    subgraph RolesUS["Enterprise US Operational Sub-Entities"]
        SELLER_US["Seller Org: US Retail Corp"]
        BUYER_US["Buyer Org: Corporate / Consumer"]
        CARRIER_US["Carriers: FedEx, UPS, USPS"]
    end

    subgraph NodesUS["Fulfillment Nodes (Physical / Virtual)"]
        DC_EAST["Node DC-01 (Regional DC East)"]
        DC_WEST["Node DC-02 (Regional DC West)"]
        STORE_NYC["Node STR-101 (Flagship Store NYC - BOPIS/SFS)"]
        DS_VENDOR["Node DS-99 (Drop-Ship Supplier)"]
    end

    HUB --> HUB_RULES
    HUB_RULES -. "Inherited Pipelines & UEs" .-> ENT_US
    HUB_RULES -. "Inherited Pipelines & UEs" .-> ENT_EU
    HUB_RULES -. "Inherited Pipelines & UEs" .-> ENT_APAC

    ENT_US --> SELLER_US
    ENT_US --> BUYER_US
    ENT_US --> CARRIER_US

    ENT_US --> DC_EAST
    ENT_US --> DC_WEST
    ENT_US --> STORE_NYC
    ENT_US --> DS_VENDOR

    classDef hubStyle fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef entStyle fill:#0f766e,stroke:#2dd4bf,stroke-width:2px,color:#f8fafc;
    classDef nodeStyle fill:#374151,stroke:#9ca3af,stroke-width:1px,color:#f8fafc;
    class HUB,HUB_RULES hubStyle;
    class ENT_US,ENT_EU,ENT_APAC entStyle;
    class DC_EAST,DC_WEST,STORE_NYC,DS_VENDOR,SELLER_US,BUYER_US,CARRIER_US nodeStyle;
```

### Rule Inheritance
To reduce duplication of configuration and enforce standardization across multiple brands or subsidiaries, Sterling OMS utilizes **Enhanced Inheritance for Process Models**. When an organization acts as an Enterprise, it inherits pipelines, user exits, services, actions, conditions, statuses, transactions, and events from parent Enterprises or the Hub, overriding only local legal or tax exceptions.

---

## 3. Pipeline & Process Modeling

Process Modeling is the engine that drives document lifecycles within Sterling OMS. It defines the sequence of statuses a document (like a Sales Order, Return, or Quote) goes through, governed by business rules and transactional logic. 

### End-to-End Order-to-Cash (O2C) Fulfillment Pipeline

```mermaid
graph LR
    Draft["Draft Order (1000)"] --> CreateOrder["Create Order (1100.01)0"]
    CreateOrder --> Created["Created (1100)"]
    
    Created --> FraudCheck{"Fraud & Risk Check"}
    FraudCheck -- "Flagged" --> FraudHold["On Fraud Hold (1100.100)"]
    FraudHold -- "Manually Cleared" --> PayAuth
    FraudCheck -- "Approved" --> PayAuth["Payment Authorization (1100.200)"]
    
    PayAuth --> AuthApproved{"Auth Success?"}
    AuthApproved -- "Failed" --> PayHold["On Payment Hold"]
    AuthApproved -- "Authorized" --> Sched["Schedule Order (1300)"]
    
    Sched --> SchedCheck{"Inventory Available?"}
    SchedCheck -- "No Stock" --> Backorder["Backordered (1300.100)"]
    SchedCheck -- "Procure Needed" --> ProcureTO["Procurement PO/TO Created"]
    SchedCheck -- "Stock Available" --> Scheduled["Scheduled (1500)"]
    
    Scheduled --> Release["Release Order (2160)"]
    Release --> Released["Released to Node (3200)"]
    
    Released --> WMSFlow["WMS Wave, Pick & Pack"]
    WMSFlow --> Shipped["Shipped (3700)"]
    
    Shipped --> Invoice["Create Invoice & Settle (3700.100)"]
    Invoice --> Closed["Order Closed / Completed (9000)"]

    classDef holdStyle fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#fef2f2;
    classDef successStyle fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#ecfdf5;
    classDef stateStyle fill:#1e293b,stroke:#94a3b8,stroke-width:1px,color:#f8fafc;
    class FraudHold,PayHold,Backorder holdStyle;
    class Shipped,Invoice,Closed successStyle;
    class Draft,Created,Scheduled,Released,ProcureTO stateStyle;
```

### Transactions: Concrete, Abstract, and Time-Triggered
Transactions are the functional nodes within a pipeline that move a document from one status to another.
* **Abstract Transactions**: Base templates provided by the system representing generic business logic (e.g., "Schedule Order" or "Release Order"). They cannot be used directly in a pipeline without being derived.
* **Concrete Transactions**: Instantiations of abstract transactions configured with specific drop-statuses and pick-statuses tailored to an Enterprise's pipeline. 

### Asynchronous Task Queue (`YFS_TASK_Q`) & Agent Server Architecture

Time-Triggered Transactions (Agents) run in the background on an Agent Server. They poll the `YFS_TASK_Q` table or external JMS queues, processing records in multithreaded batches.

```mermaid
sequenceDiagram
    autonumber
    participant Pipeline as Pipeline Transaction (e.g. Schedule)
    participant TaskQ as YFS_TASK_Q Table
    participant AgentSvr as Agent Server Engine (JVM)
    participant Worker as Worker Thread Pool
    participant Logic as Business Logic / User Exit
    participant DB as Sterling DB (YFS_ORDER_HEADER/LINE)
    participant Event as Event Dispatcher (SDF/JMS)

    Pipeline->>TaskQ: Insert Task Entry (TaskQ_Key, Order_Header_Key, Transaction_ID, Available_Date)
    loop Polling Interval (e.g. Every 10s)
        AgentSvr->>TaskQ: SELECT eligible tasks with Lock (Batch Size = 500)
        TaskQ-->>AgentSvr: Return task records
    end
    AgentSvr->>Worker: Dispatch task batch across N threads
    Worker->>Logic: Execute transaction logic (e.g., SchedOrderUE, Promising)
    Logic->>DB: Update Status (e.g., 1100 -> 1500)
    Logic->>TaskQ: DELETE processed task record
    Logic->>Event: Raise ON_SUCCESS Event (e.g., publish XML to JMS)
```

### Task Queues and Task Queue Synchers
When a pipeline is dynamically modified (e.g., adding a custom "Address Verification" transaction between "Create" and "Schedule"), in-flight orders lack task queue records for the new step. 

Sterling OMS provides five **Task Queue Synchers** to scan database tables and generate missing entries:
1. `Load execution task queue syncher`
2. `Order delivery task queue syncher`
3. `Order fulfillment task queue syncher`
4. `Order negotiation task queue syncher`
5. `Quote fulfillment task queue syncher`

---

## 4. Inventory Management & Promising

Omnichannel success hinges on accurate, real-time inventory visibility and intelligent order promising. Sterling OMS provides a global view of supply and demand across distribution centers, stores, and suppliers.

### Supply and Demand Types & Available-to-Promise (ATP) Equation

```mermaid
graph TD
    subgraph SupplyBucket["Total Supply (+)"]
        ONHAND["On-Hand Inventory (1)"]
        INTRANSIT["In-Transit / ASN (2)"]
        PO["Purchase Orders / Work Orders (3)"]
    end

    subgraph DemandBucket["Total Demand (-)"]
        ALLOC["Allocated Orders (Demand)"]
        RESV["Cart / Checkout Reservations"]
        BACK["Backordered Quantity"]
        SAFETY["Node / Enterprise Safety Stock"]
    end

    subgraph ATPEngine["ATP Calculation Engine (Global Inventory Visibility)"]
        ATPFormula["Available to Promise (ATP) = (On-Hand + In-Transit + PO) - (Allocated + Reserved + Backordered + Safety Stock)"]
    end

    subgraph Outcomes["Promising Outcomes"]
        STOCK_AVAIL["Available to Promise (Promise Date: Immediate)"]
        FUTURE_AVAIL["Future Available (Promise Date: Based on PO Receipt)"]
        OUT_OF_STOCK["Out of Stock (Procurement or Backorder Required)"]
    end

    SupplyBucket --> ATPEngine
    DemandBucket --> ATPEngine
    ATPEngine --> Outcomes
```

### Real-Time Availability Monitor (RTAM) Delta Publishing Architecture

RTAM monitors inventory changes and publishes delta updates to external storefronts only when predefined quantity thresholds are crossed, minimizing API traffic.

```mermaid
graph LR
    subgraph InventoryEvents["Inventory Trigger"]
        INV_CHG["Inventory Update (Receipt / Allocation / Adjustment)"]
    end

    subgraph RTAMProcess["Real-Time Availability Monitor (RTAM)"]
        EVAL["Evaluate ATP against Thresholds (High, Med, Low, Zero)"]
        THRESH_CHECK{"Threshold Crossed?"}
        GEN_EVENT["Raise REALTIME_AVAILABILITY_CHANGE Event"]
    end

    subgraph SDFService["Integration Pipeline"]
        SDF["SDF Service (e.g. SCWC_SDF_synchInventoryChanges)"]
        JMS["JMS Queue / Kafka Topic"]
    end

    subgraph ExternalConsumers["External Channels & Caches"]
        STOREFRONT["eCommerce Cache (HCL Commerce / Shopify / Magento)"]
        MARKETPLACE["Marketplaces (Amazon / Walmart)"]
    end

    INV_CHG --> EVAL
    EVAL --> THRESH_CHECK
    THRESH_CHECK -- "Yes" --> GEN_EVENT
    THRESH_CHECK -- "No (Within Threshold)" --> IGNORE["Suppress Event (No Noise)"]
    GEN_EVENT --> SDF
    SDF --> JMS
    JMS --> STOREFRONT
    JMS --> MARKETPLACE
```

### Sourcing and Sourcing Decision Tree

When an order line is scheduled, Sterling OMS evaluates sourcing rules across all eligible fulfillment nodes.

```mermaid
graph TD
    START["Order Line Ready for Scheduling"] --> GEO["Filter Nodes by Sourcing Rule & Proximity (Radius / Region)"]
    GEO --> CAP["Evaluate Node Capacity & Store Labor Availability"]
    CAP --> CUTOFF["Check Carrier Cut-off Times & Store Calendars"]
    CUTOFF --> COST["Run Cost Optimization (Shipping Cost vs Markdown Velocity)"]
    
    COST --> DECISION{"Optimal Fulfillment Path Identified?"}
    
    DECISION -- "Single Node Has Stock" --> DIRECT["Route to Optimal DC / Store (SFS)"]
    DECISION -- "Split Required" --> SPLIT["Split Line / Order across Multiple Nodes"]
    DECISION -- "Store Transfer Possible" --> MULTIHOP["Create Multi-Hop Transfer Order (TO)"]
    DECISION -- "No Internal Stock" --> DROPSHIP["Create Drop-Ship Purchase Order (PO) to Vendor"]

    classDef optStyle fill:#0f766e,stroke:#2dd4bf,stroke-width:2px,color:#f8fafc;
    class DIRECT,SPLIT,MULTIHOP,DROPSHIP optStyle;
```

---

## 5. Fulfillment & Store Operations

Fulfillment bridges digital order commitments with physical warehouse and store execution.

### Omnichannel Fulfillment Architectures: BOPIS, SFS, and BOSS

```mermaid
graph TB
    subgraph BOPIS["BOPIS (Buy Online Pick Up In Store)"]
        B1["Order Placed with Store Pickup"] --> B2["Reserve Store Inventory"]
        B2 --> B3["Store Associate Pick & Pack"]
        B3 --> B4["Customer Notified (Ready for Pickup)"]
        B4 --> B5["Customer Handover / OTP Verification"]
    end

    subgraph SFS["SFS (Ship From Store)"]
        S1["Order Routed to Local Store"] --> S2["Evaluate Store Capacity"]
        S2 --> S3["Pick-to-Tote by Associate"]
        S3 --> S4["Pack Carton & Generate Carrier Label"]
        S4 --> S5["Carrier Pickup & Dispatch"]
    end

    subgraph BOSS["BOSS (Buy Online Ship to Store)"]
        O1["Customer Selects Store Pickup (Out of Local Stock)"] --> O2["Fulfill from Central DC"]
        O2 --> O3["Create Chained Transfer Order (DC -> Store)"]
        O3 --> O4["Store Receives Transfer Shipment"]
        O4 --> O5["Ready for Pickup Notification"]
    end
```

### Warehouse Execution Lifecycle (Wave $\to$ Pick $\to$ Pack $\to$ Manifest)

```mermaid
graph LR
    Released["Released Order Lines (Status 3200)"] --> WavePlan["1. Wave Planning (FIFO, Priority, Carrier Cut-off)"]
    WavePlan --> Picking["2. Picking Execution (RF Scanner, Pick-to-Tote)"]
    Picking --> Packing["3. Packing & Quality Audit (Cartonization & Weighing)"]
    Packing --> Manifesting["4. Manifesting (Carrier Labels, Loftware, Tracking #)"]
    Manifesting --> Shipped["5. Shipment Dispatched (Status 3700 & ASN Sent to OMS)"]

    classDef procStyle fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    class Released,WavePlan,Picking,Packing,Manifesting,Shipped procStyle;
```

---

## 6. Reverse Logistics & Returns

Returns represent 20–30% of eCommerce volume. Sterling OMS manages returns as dedicated document types moving through specialized Return Fulfillment pipelines.

### End-to-End Reverse Logistics & Disposition Workflow

```mermaid
graph TD
    START["Return Request Initiated"] --> TYPE{"Return Origin"}
    
    TYPE -- "With Sales Order" --> LINKED["Linked Return (computeRefundPayments API)"]
    TYPE -- "No Order Reference" --> BLIND["Blind Return (Dock Receipt / Manual Entry)"]
    
    LINKED --> RMA["Generate RMA & Inbound Tracking Label"]
    BLIND --> RMA
    
    RMA --> RECEIPT["Inbound Dock Receipt & Physical Inspection"]
    RECEIPT --> DISPOSITION{"Assign Disposition Code"}
    
    DISPOSITION -- "Active / Grade A" --> RESTOCK["Restock to Sellable On-Hand Inventory"]
    DISPOSITION -- "Refurbish / QA" --> REPAIR["Route to Repair / QA Inspection Area"]
    DISPOSITION -- "Liquidate" --> LIQUIDATE["Route to Recommerce / Bulk Liquidation"]
    DISPOSITION -- "Damaged / Scrap" --> SCRAP["Discard Physically & Financial Write-Off"]
    
    RESTOCK --> SETTLE{"Exchange or Refund?"}
    REPAIR --> SETTLE
    LIQUIDATE --> SETTLE
    SCRAP --> SETTLE
    
    SETTLE -- "Refund" --> REFUND["Refund to Original Tender (YFS_CHARGE_TRANSACTION)"]
    SETTLE -- "Exchange" --> EXCH["Create Exchange Order (Rollover Funds via computeRefundPayments)"]

    classDef dispStyle fill:#0f766e,stroke:#2dd4bf,stroke-width:1px,color:#f8fafc;
    class RESTOCK,REPAIR,LIQUIDATE,SCRAP dispStyle;
```

### Linked Returns vs. Exchange Settlement

```mermaid
sequenceDiagram
    autonumber
    participant Customer as Customer / Store Associate
    participant ReturnPipe as Return Order Pipeline
    participant PaymentEngine as Payment Orchestration Engine
    participant SalesOrder as Original Sales Order (Parent)
    participant ExchOrder as New Exchange Order
    participant Gateway as Payment Gateway / Accounts Payable

    Customer->>ReturnPipe: Create Return Order for Item (Linked)
    ReturnPipe->>PaymentEngine: Invoke computeRefundPayments API
    PaymentEngine->>SalesOrder: Read original payment method & authorization limit
    PaymentEngine->>ReturnPipe: Copy refund profile (Prevents refunding > original charge)
    
    alt Standard Refund Flow
        ReturnPipe->>Gateway: Issue credit transaction to original tender
        Gateway-->>ReturnPipe: Refund confirmed ($50.00 returned to Credit Card)
    else Exchange Order Flow
        Customer->>ReturnPipe: Select alternative item / size
        ReturnPipe->>ExchOrder: Create Exchange Order ($50.00 total)
        PaymentEngine->>ExchOrder: Transfer refund balance from Return directly to Exchange
        ExchOrder->>ExchOrder: Set payment status to PAID (Zero net charge)
    end
```

---

## 7. Payment & Invoicing Lifecycle

Payment orchestration is modular, designed to interface asynchronously with payment gateways while maintaining strict state separation between fulfillment and financial settlement.

### Payment State Machine

```mermaid
stateDiagram-v2
    [*] --> AWAIT_PAY_INFO: Order Created without Valid Tender
    AWAIT_PAY_INFO --> AWAIT_AUTH: Payment Info Collected
    [*] --> AWAIT_AUTH: Order Created with Valid Tender
    
    AWAIT_AUTH --> AUTHORIZED: Payment Execution Agent calls executeCollection (Auth Success)
    AWAIT_AUTH --> PAYMENT_HOLD: Gateway Rejection / Timeout
    PAYMENT_HOLD --> AWAIT_AUTH: Customer Updates Payment Info
    
    AUTHORIZED --> INVOICED: Shipment Dispatched & Invoice Generated
    INVOICED --> PAID: Payment Collection Agent calls requestCollection (Capture Success)
    
    PAID --> REFUND_PENDING: Return / Cancellation Created
    REFUND_PENDING --> REFUNDED: Refund Processed via computeRefundPayments / Gateway
    REFUNDED --> [*]
    PAID --> [*]
```

### Standard Authorization & Settlement Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client / Storefront
    participant OMS as Sterling OMS Engine
    participant Agent as Payment Execution / Collection Agent
    participant UE as YFSCollectionOthersUE (Custom Exit)
    participant Gateway as Payment Gateway (Stripe / Adyen)
    participant DB as YFS_CHARGE_TRANSACTION Table

    Client->>OMS: createOrder (with PaymentMethod=CREDIT_CARD)
    OMS->>Agent: Trigger Payment Execution (AWAIT_AUTH)
    Agent->>UE: Invoke YFSCollectionOthersUE (Authorization Request)
    UE->>Gateway: POST /v1/authorizations ($150.00)
    Gateway-->>UE: Authorization Approved (AuthCode: AUTH9988)
    UE-->>Agent: Return Auth Success XML
    Agent->>DB: Insert Charge Transaction (CHARGE_TYPE=AUTHORIZATION, STATUS=CLOSED, AMOUNT=150.00)
    Agent->>OMS: Update Payment Status to AUTHORIZED

    Note over OMS,Gateway: Fulfillment executes (Wave -> Pick -> Pack -> Ship)

    OMS->>OMS: createShipmentInvoice ($150.00)
    OMS->>Agent: Trigger Payment Collection (REQUEST_CHARGE)
    Agent->>UE: Invoke YFSCollectionOthersUE (Capture Request)
    UE->>Gateway: POST /v1/captures ($150.00 against AUTH9988)
    Gateway-->>UE: Capture Settled (TxnID: CAP4433)
    UE-->>Agent: Return Capture Success XML
    Agent->>DB: Insert Charge Transaction (CHARGE_TYPE=CHARGE, STATUS=CLOSED, AMOUNT=150.00)
    Agent->>OMS: Update Payment Status to PAID
```

### Case Study: Cash on Delivery (COD) & External Charges Reconciliation

Handling Cash on Delivery (COD) requires bypassing standard gateway authorization and reconciling physical cash collections reported by logistics carriers.

```mermaid
sequenceDiagram
    autonumber
    participant Carrier as Carrier / Delivery Courier
    participant TMS as Carrier TMS / Webhook Middleware
    participant OMSAPI as Sterling OMS API Gateway
    participant DB as YFS_CHARGE_TRANSACTION Table
    participant CollAgent as Payment Collection Agent (requestCollection)
    participant Order as YFS_ORDER_HEADER

    Note over OMSAPI,Order: Order created with PaymentRule "Processing Not Required"<br/>YFSCollectionOthersUE returns null (Auth bypassed)
    Note over Carrier,Order: Order is shipped to customer doorstep
    Carrier->>Carrier: Courier collects physical cash ($200.00) from customer
    Carrier->>TMS: Mark delivery status "DELIVERED_AND_COLLECTED"
    TMS->>OMSAPI: POST recordExternalCharges API (ChargeType=CHARGE, Amount=200.00, ExtSource=COURIER_COD)
    OMSAPI->>DB: Direct INSERT into YFS_CHARGE_TRANSACTION (STATUS=CLOSED, REQUEST_AMOUNT=200.00, CREDIT_AMOUNT=200.00)
    TMS->>CollAgent: Trigger requestCollection API for Order
    CollAgent->>DB: Query YFS_CHARGE_TRANSACTION vs. INVOICE_AMOUNT
    CollAgent->>Order: Reconcile balance (Remaining Balance = $0.00)
    CollAgent->>Order: Transition Payment Status to PAID
```

---

## 8. Technical Extensibility & Cloud Guardrails

To adapt the base product to enterprise requirements, consultants leverage the Service Definition Framework (SDF), custom Java APIs, and schema extensions while adhering strictly to Order Management on Cloud (OMOC) guardrails.

### Service Definition Framework (SDF) Integration Architecture

```mermaid
graph LR
    subgraph Inbound["Inbound Trigger"]
        REST["REST / HTTPS Request"]
        JMS_IN["JMS Inbound Queue"]
        EVENT_IN["Pipeline ON_SUCCESS Event"]
    end

    subgraph SDFPipeline["SDF Service Pipeline Flow"]
        START["Service Entry Point"] --> XSLT1["1. Input XSLT Translator (Transform Schema)"]
        XSLT1 --> CUSTOM_JAVA["2. Custom Java Component (implements YIFCustomApi)"]
        CUSTOM_JAVA --> OOTB_API["3. Call Base Sterling API (e.g. modifyOrder / scheduleOrder)"]
        OOTB_API --> XSLT2["4. Output XSLT Translator"]
    end

    subgraph Outbound["Outbound Destinations"]
        JMS_OUT["JMS Outbound Queue / Kafka"]
        EXT_API["Third-Party Webhook / REST API"]
        DB_RESP["Synchronous Response to Client"]
    end

    Inbound --> START
    XSLT2 --> JMS_OUT
    XSLT2 --> EXT_API
    XSLT2 --> DB_RESP
```

### Database Extensibility: Hang-off Tables & Locking Architecture

A **Hang-off table** possesses a many-to-one relationship with a base table (e.g., custom attributes or tracking entries linked to `YFS_ORDER_HEADER`).

```mermaid
classDiagram
    class YFS_ORDER_HEADER {
        +CHAR(24) ORDER_HEADER_KEY [PK]
        +VARCHAR(40) ORDER_NO
        +CHAR(24) ENTERPRISE_KEY
        +CHAR(24) BILL_TO_ID
        +VARCHAR(15) STATUS
        +TIMESTAMP CREATETS
        +TIMESTAMP MODIFYTS
    }

    class EXT_ORDER_CUSTOM_DATA_PK {
        +CHAR(24) EXT_ORDER_CUSTOM_DATA_PK [PK]
        +CHAR(24) ORDER_HEADER_KEY [FK - Logical]
        +VARCHAR(50) CUSTOM_LOYALTY_TIER
        +VARCHAR(100) CUSTOM_GIFT_MESSAGE
        +VARCHAR(50) EXTERNAL_FRAUD_SCORE
        +TIMESTAMP CREATETS [Mandatory]
        +TIMESTAMP MODIFYTS [Mandatory]
        +VARCHAR(40) CREATEUSERID [Mandatory]
        +VARCHAR(40) MODIFYUSERID [Mandatory]
    }

    YFS_ORDER_HEADER "1" <|-- "0..*" EXT_ORDER_CUSTOM_DATA_PK : Parent (LockingEntity="YFS_ORDER_HEADER")
    
    note for EXT_ORDER_CUSTOM_DATA_PK "Rules:\n1. Cannot start with 'Y'\n2. Primary Key must end with '_PK'\n3. LockingEntity must point to Parent\n4. Managed via SDF Services / Extensions.xml"
```

### OMOC Cloud Guardrails & Configuration Deployment Tool (CDT) Pipeline

In IBM Sterling OMOC SaaS, direct schema edits and manual DDL scripts are strictly prohibited. Configuration must be promoted across environments via CDT.

```mermaid
graph TB
    subgraph DevEnv["Development / Sandbox Environment"]
        DEV_DB["Dev Config DB (Pipelines, Rules, SDF Services)"]
        EXT_XML["Extensions.xml & Custom Java Jars"]
    end

    subgraph CDTProcess["Configuration Deployment Tool (CDT)"]
        EXPORT["1. CDT Export (Extract DB Config to XML Files)"]
        FILTER["2. Apply Table Filters (Selective Ignore for PLT_PROPERTY, etc.)"]
        OVERRIDE["3. Apply Environment Overrides (URLs, Endpoints, Logins)"]
        PACKAGE["4. Package Upgrade-Safe Cloud Bundle"]
    end

    subgraph TargetEnv["Target Environment (Staging / Production)"]
        IMPORT["5. CDT Import Execution (Strict Verification)"]
        PROD_DB["Target Sterling DB (Zero Direct DDL Modifications)"]
        HEALTH["6. Cloud Guardrail Automated Compliance Checks"]
    end

    DevEnv --> EXPORT
    EXPORT --> FILTER
    FILTER --> OVERRIDE
    OVERRIDE --> PACKAGE
    PACKAGE --> IMPORT
    IMPORT --> PROD_DB
    PROD_DB --> HEALTH

    classDef guardStyle fill:#0f766e,stroke:#2dd4bf,stroke-width:2px,color:#f8fafc;
    class EXPORT,FILTER,OVERRIDE,PACKAGE,IMPORT,HEALTH guardStyle;
```

### Performance Tuning for Peak Scale

| Strategy | Technical Mechanism | Impact on Peak Throughput |
| :--- | :--- | :--- |
| **Complex Query Syntax** | Use `AND` / `OR` query syntax in API input XML rather than broad retrieval. | Reduces payload size and database memory pressure by >70%. |
| **Index Optimization** | Remove unnecessary OOTB indexes (e.g. `PERSON_INFO_I4`) on heavy-write tables. | Reduces I/O locking during massive flash-sale order insert spikes. |
| **Transaction Caching** | Enable transaction-level caching on static/infrequent tables (`YFS_INVENTORY_TAG`). | Eliminates redundant round-trip SQL queries across agent threads. |
| **Task Queue Batch Tuning** | Set batch sizes (e.g., 200–500) and thread counts aligned with DB CPU cores. | Maximizes throughput while avoiding database deadlocks. |

---

*End of Guide. This document encapsulates the architectural principles, operational processes, diagrams, state machines, and technical guardrails required to successfully implement and scale IBM Sterling Order Management System in a modern enterprise environment.*
