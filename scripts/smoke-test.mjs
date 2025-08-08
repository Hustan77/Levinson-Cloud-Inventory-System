// Minimal integration smoke test (run while `npm run dev` is active)
const base = "http://localhost:3000";

async function main() {
  try {
    // splash
    const home = await fetch(base);
    console.log("GET /", home.status);

    // lists
    for (const p of ["/api/caskets", "/api/urns", "/api/suppliers", "/api/orders"]) {
      const r = await fetch(base + p);
      console.log("GET", p, r.status);
      if (r.ok) {
        const j = await r.json();
        console.log(p, "items:", Array.isArray(j) ? j.length : Object.keys(j).length);
      }
    }

    // create a quick special order
    const createRes = await fetch(base + "/api/orders", {
      method: "POST",
      body: JSON.stringify({
        item_type: "casket",
        item_id: null,
        item_name: "SmokeTest Special",
        po_number: "PO-SMOKE",
        expected_date: null,
        backordered: false,
        tbd_expected: true,
        special_order: true,
        deceased_name: "Test Person"
      })
    });
    console.log("POST /api/orders", createRes.status);
    const created = createRes.ok ? await createRes.json() : null;

    if (created?.id) {
      const arrive = await fetch(base + `/api/orders/${created.id}/arrive`, {
        method: "PATCH",
        body: JSON.stringify({ received_by: "Smoke Bot", arrived_at: new Date().toISOString() })
      });
      console.log("PATCH arrive", arrive.status);
    }
  } catch (e) {
    console.error("Smoke test error", e);
    process.exit(1);
  }
}

main();
