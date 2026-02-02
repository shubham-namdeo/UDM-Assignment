import fs from "fs";
import path from "path";

// Mock data for testing - organized by repository
const mockReleases = [
    {
        repo: "hotwax/fulfillment",
        repoName: "fulfillment",
        tag: "v1.5.0",
        publishedAt: "2026-01-15T10:00:00Z",
        body: `## What's Changed
* Static search bars by @user1 in #245
* Enhanced order handover notifications by @user2 in #246

**Full Changelog**: https://github.com/hotwax/fulfillment/compare/v1.4.0...v1.5.0`,
        prRefs: [
            { number: "245", url: "https://github.com/hotwax/fulfillment/pull/245", text: "#245" },
            { number: "246", url: "https://github.com/hotwax/fulfillment/pull/246", text: "#246" }
        ]
    },
    {
        repo: "hotwax/inventory-count",
        repoName: "inventory-count",
        tag: "v2.1.0",
        publishedAt: "2026-01-20T14:30:00Z",
        body: `## What's Changed
* Enhanced product identification in inventory counts by @user3 in #395
* Partial sync for inventory records by @user4 in #396
* Local database management from Settings by @user5 in #397

**Full Changelog**: https://github.com/hotwax/inventory-count/compare/v2.0.0...v2.1.0`,
        prRefs: [
            { number: "395", url: "https://github.com/hotwax/inventory-count/pull/395", text: "#395" },
            { number: "396", url: "https://github.com/hotwax/inventory-count/pull/396", text: "#396" },
            { number: "397", url: "https://github.com/hotwax/inventory-count/pull/397", text: "#397" }
        ]
    },
    {
        repo: "hotwax/bopis",
        repoName: "bopis",
        tag: "v1.8.0",
        publishedAt: "2026-01-25T09:15:00Z",
        body: `## What's Changed
* Ship to Store fulfillment support by @user6 in #180
* Proof of delivery for pickups by @user7 in #181

**Full Changelog**: https://github.com/hotwax/bopis/compare/v1.7.0...v1.8.0`,
        prRefs: [
            { number: "180", url: "https://github.com/hotwax/bopis/pull/180", text: "#180" },
            { number: "181", url: "https://github.com/hotwax/bopis/pull/181", text: "#181" }
        ]
    },
    {
        repo: "hotwax/receiving",
        repoName: "receiving",
        tag: "v1.3.0",
        publishedAt: "2026-01-10T11:00:00Z",
        body: `## What's Changed
* Push notifications for transfer orders by @user8 in #120
* Manually added items shown in completed transfers by @user9 in #121

**Full Changelog**: https://github.com/hotwax/receiving/compare/v1.2.0...v1.3.0`,
        prRefs: [
            { number: "120", url: "https://github.com/hotwax/receiving/pull/120", text: "#120" },
            { number: "121", url: "https://github.com/hotwax/receiving/pull/121", text: "#121" }
        ]
    }
];

const targetMonth = "2026-01";

// Create a mock output that follows the product-centric format
const mockOutput = `# January 2026 Release Notes

The January 2026 release introduces updates across Receiving, BOPIS, Fulfillment and Inventory Count to improve transfer handling, support Ship-to-Store for BOPIS orders and enhance inventory accuracy. These changes help reduce manual intervention and keep store workflows running smoothly.

## Receiving App:

### Push notifications for Transfer Orders
1. Store teams need timely visibility into new and pending transfer orders to take receiving action without delay. The Receiving App now sends push notifications when transfer orders are created or remain pending. This helps with faster response to incoming transfers and reduced reliance on manual order checks.
2. Manually Added Items Shown in Completed Transfers
   Store teams may receive additional or incorrect items while completing transfer receiving and need visibility into those items after they are recorded. The Receiving App now displays manually added items as received within the corresponding Transfer Order. This helps with accurate transfer reconciliation and reduces follow-up between sending and receiving locations. 

## BOPIS App:

### Ship-to-store
1. Limited inventory at the pickup store often results in BOPIS order cancellations and lost sales. These orders can now be converted to Ship-to-Store from the BOPIS App, allowing fulfillment to continue while preserving the original pickup experience.

### OMS
1. Shipping Price Rules Configurable from OMS
   Shipping charges may be adjusted as part of promotional strategies and cost management. Checkout shipping prices are now configurable directly from the OMS, allowing teams to manage pricing centrally without storefront changes.
`;

// Output to drafts/YYYY-MM.md
const outFile = path.join("drafts", `${targetMonth}.md`);
fs.mkdirSync("drafts", { recursive: true });
fs.writeFileSync(outFile, mockOutput);

console.log(`✓ Generated test release notes: ${outFile}`);
console.log(`\nMock data summary:`);
console.log(`- Total releases: ${mockReleases.length}`);
console.log(`- Repositories: ${mockReleases.map(r => r.repo).join(", ")}`);
console.log(`- Total PR references: ${mockReleases.reduce((sum, r) => sum + r.prRefs.length, 0)}`);
console.log(`\nFormat: Product-centric with problem-solution structure`);
