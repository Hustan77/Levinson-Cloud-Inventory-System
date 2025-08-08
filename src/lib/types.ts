import { z } from "zod";

/* ENUMS */
export const ItemType = z.enum(["casket", "urn"]);
export type ItemType = z.infer<typeof ItemType>;

export const OrderStatus = z.enum(["PENDING", "BACKORDERED", "ARRIVED", "SPECIAL"]);
export type OrderStatus = z.infer<typeof OrderStatus>;

/* TABLE TYPES (subset) */
export type Supplier = {
  id: number;
  name: string;
  ordering_instructions: string | null;
};

export type Casket = {
  id: number;
  name: string;
  supplier_id: number | null;
};

export type Urn = {
  id: number;
  name: string;
  supplier_id: number | null;
};

/* Base order row */
export type Order = {
  id: number;
  item_type: ItemType;
  item_id: number | null;
  item_name: string | null;      // for SPECIAL
  supplier_id: number | null;
  po_number: string;
  expected_date: string | null;  // date ISO (nullable)
  status: OrderStatus;
  backordered: boolean;
  tbd_expected: boolean;
  created_at: string;            // timestamptz ISO
  arrived_at: string | null;
  received_by: string | null;
  deceased_name: string | null;  // only for SPECIAL
};

/* View row (enriched) */
export type VOrderEnriched = Order & {
  supplier_name: string | null;
  item_display_name: string | null; // joined casket/urn name or item_name for SPECIAL
};

/* ZOD for requests */
export const CreateOrderSchema = z.object({
  item_type: ItemType,
  item_id: z.number().int().nullable().optional().default(null),
  item_name: z.string().min(1).max(200).nullable().optional().default(null), // used only when SPECIAL
  po_number: z.string().min(1).max(120),
  expected_date: z.string().date().nullable().optional().default(null).or(z.literal("").transform(() => null)),
  backordered: z.boolean().default(false),
  tbd_expected: z.boolean().default(false),
  special_order: z.boolean().default(false),
  deceased_name: z.string().min(1).max(200).nullable().optional().default(null)
}).refine((data) => {
  if (data.special_order) {
    return !!data.item_name && data.item_id === null;
  } else {
    return data.item_id !== null && !data.item_name;
  }
}, {
  message: "For special orders, item_name is required and item_id must be null. For normal orders, item_id is required and item_name must be null."
}).refine((data) => {
  if (data.backordered) return true; // can be TBD or date
  if (data.tbd_expected) return true; // explicit TBD flag
  // If neither backordered nor tbd, expected_date must be provided
  return !!data.expected_date;
}, {
  message: "Either provide expected_date or mark as backordered/TBD."
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const ArriveSchema = z.object({
  received_by: z.string().min(1).max(120),
  arrived_at: z.string().datetime().optional() // default now on server if not provided
});

export type ArriveInput = z.infer<typeof ArriveSchema>;
