import fs from "fs";
import path from "path";

// Mock data for testing
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
    }
];

const targetMonth = "2026-01";

// Prepare consolidated data (same format as the real script)
const consolidatedData = mockReleases.map(r => {
    const prLinks = r.prRefs.map(pr => `[${pr.text}](${pr.url})`).join(", ");
    return `
Repository: ${r.repo}
Version: ${r.tag}
Published: ${r.publishedAt}
PR References: ${prLinks || "None"}

Release Notes:
${r.body}

---
`;
}).join("\n");

// Create a mock output that follows the expected format
const mockOutput = `# HotWax Commerce Product Update

This month, we've focused on expanding fulfillment options, enhancing inventory accuracy, and making the store associate experience more intuitive across our suite of apps.

## 🚀 New Features

### Ship to Store fulfillment
HotWax Commerce now supports "Ship to Store" workflows within the BOPIS App. ([#180](https://github.com/hotwax/bopis/pull/180))

**User Benefit:** You can now offer customers the flexibility to have products shipped from a distribution center to a specific store for pickup, broadening your omnichannel fulfillment options.

### Proof of delivery for pickups
A new proof of delivery setting is now available in the BOPIS App, complete with specific user permissions. ([#181](https://github.com/hotwax/bopis/pull/181))

**User Benefit:** Enhance security and order accuracy by requiring a verification step during the customer pickup process.

### Order handover notifications
We've added automated email support for order handovers and enhanced status notifications. ([#246](https://github.com/hotwax/fulfillment/pull/246))

**User Benefit:** Keep your customers informed with real-time updates when their orders are ready for pickup or have been successfully handed over.

## ⚡ Improvements

### Enhanced product identification in inventory counts
We added support for primary and secondary identifiers (such as internal names or SKUs) across the Assigned, Pending Review, and Closed lists in the Inventory Count App. ([#395](https://github.com/hotwax/inventory-count/pull/395))

**User Benefit:** Find and sort products more easily during counts using the identifiers that make the most sense for your warehouse or store.

### Partial sync for inventory records
The Inventory Count App now handles missing "Quantity on Hand" (QOH) data more intelligently. If an error occurs with one record during a sync, the app will block only that record and allow the rest of the count to sync successfully. ([#396](https://github.com/hotwax/inventory-count/pull/396))

**User Benefit:** Prevent your entire inventory sync from getting stuck due to a single data error, ensuring most of your work is saved immediately.

### Local database management
Users can now clear cached data directly from the Settings menu in the Inventory Count App. ([#397](https://github.com/hotwax/inventory-count/pull/397))

**User Benefit:** Quickly troubleshoot local data issues or refresh your app's cache without needing technical assistance.

### Static search bars
We've updated the search bars in the BOPIS and Fulfillment Apps to remain static at the top of the screen. ([#245](https://github.com/hotwax/fulfillment/pull/245))

**User Benefit:** Save time by having search tools always accessible, even when scrolling through long lists of orders.
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
