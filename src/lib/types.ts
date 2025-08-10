// LANDMARK: shared types

export type OrderStatus = "PENDING" | "BACKORDERED" | "ARRIVED" | "SPECIAL";
export type ItemType = "casket" | "urn";

export type Supplier = {
  id: number;
  name: string;
  ordering_instructions?: string | null;
  // LANDMARK: new contact fields
  phone?: string | null;
  email?: string | null;
  ordering_website?: string | null;
};

export type Casket = {
  id: number;
  name: string;
  supplier_id: number | null;
  material?: "WOOD" | "METAL" | "GREEN" | null;
  jewish?: boolean | null;
  green?: boolean | null;
  ext_width_in?: number | null;
  ext_length_in?: number | null;
  ext_height_in?: number | null;
  int_width_in?: number | null;
  int_length_in?: number | null;
  int_height_in?: number | null;
  target_qty?: number | null;
  on_hand?: number | null;
  // these two are computed in API list responses where supported
  on_order_live?: number;
  backordered_live?: number;
};

export type Urn = {
  id: number;
  name: string;
  supplier_id: number | null;
  category?: "FULL" | "KEEPSAKE" | "JEWELRY" | "SPECIAL" | null;
  green?: boolean | null;
  width_in?: number | null;
  height_in?: number | null;
  depth_in?: number | null;
  target_qty?: number | null;
  on_hand?: number | null;
  // computed in API list responses where supported
  on_order_live?: number;
  backordered_live?: number;
};

export type Order = {
  id: number;
  item_type: ItemType;
  item_id: number | null;
  item_name?: string | null;
  supplier_id: number | null;
  po_number: string;
  expected_date?: string | null; // YYYY-MM-DD
  status: OrderStatus;
  backordered: boolean;
  tbd_expected: boolean;
  created_at?: string; // ISO
  arrived_at?: string | null;
  received_by?: string | null;
  notes?: string | null;
  special_order?: boolean | null;
  is_return?: boolean | null;
  need_by_date?: string | null; // for special orders (deadline)
};

export type VOrderEnriched = Order & {
  supplier_name?: string | null;
  // Helpful deriveds for UI
  item_display?: string | null;
};
