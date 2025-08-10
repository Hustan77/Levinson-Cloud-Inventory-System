// LANDMARK: shared types for API <-> UI

export type OrderStatus = "PENDING" | "BACKORDERED" | "ARRIVED" | "SPECIAL";
export type ItemType = "casket" | "urn";

export type Supplier = {
  id: number;
  name: string;
  ordering_instructions?: string | null;
  phone?: string | null;
  email?: string | null;
  ordering_website?: string | null;
};

export type Casket = {
  id: number;
  name: string | null;
  supplier_id: number | null;
  material: "WOOD" | "METAL" | "GREEN" | null;
  jewish: boolean | null;
  green: boolean | null;

  // exterior + interior (some may be null)
  ext_width_in?: number | null;
  ext_length_in?: number | null;
  ext_height_in?: number | null;
  int_width_in?: number | null;
  int_length_in?: number | null;
  int_height_in?: number | null;

  // some schemas also store plain dims; keep them optional for safety
  width_in?: number | null;
  length_in?: number | null;
  height_in?: number | null;

  target_qty?: number | null;
  on_hand?: number | null;
  on_order?: number | null;
  backordered_count?: number | null;
  created_at?: string;
};

export type Urn = {
  id: number;
  name: string | null;
  supplier_id: number | null;
  width_in?: number | null;
  height_in?: number | null;
  depth_in?: number | null;
  category?: "Full Size" | "Keepsake" | "Jewelry" | "Special Use" | null;
  green?: boolean | null;

  target_qty?: number | null;
  on_hand?: number | null;
  on_order?: number | null;
  backordered_count?: number | null;
  created_at?: string;
};

// Enriched order shape used on the dashboard
export type VOrderEnriched = {
  id: number;
  item_type: ItemType;
  item_id: number | null;
  item_name: string | null;
  supplier_id: number | null;
  po_number: string;
  expected_date: string | null;
  status: OrderStatus;
  backordered: boolean | null;
  tbd_expected: boolean | null;
  created_at: string;
  arrived_at: string | null;
  received_by: string | null;
  deceased_name?: string | null;

  // present in v_orders_enriched (and set by API fallback too)
  supplier_name?: string | null;
  item_display_name?: string | null;

  // some components reference these optional aliases
  item_display?: string | null;
  notes?: string | null;
};
