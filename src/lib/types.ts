import { z } from "zod";

/** LANDMARK: domain types */

export type Supplier = {
  id: number;
  name: string;
  ordering_instructions: string | null;
};

export type Casket = {
  id: number;
  name: string;
  supplier_id: number | null;
  ext_width_in?: number | null;
  ext_length_in?: number | null;
  ext_height_in?: number | null;
  int_width_in?: number | null;
  int_length_in?: number | null;
  int_height_in?: number | null;
  target_qty: number;
  on_hand: number;
  on_order: number;
  backordered_count: number;
  material: "Wood" | "Metal" | "Green Burial";
  jewish: boolean;
  green: boolean;
  created_at?: string;
};

export type Urn = {
  id: number;
  name: string;
  supplier_id: number | null;
  width_in?: number | null;
  height_in?: number | null;
  depth_in?: number | null;
  target_qty: number;
  on_hand: number;
  on_order: number;
  backordered_count: number;
  category: "Full Size" | "Keepsake" | "Jewelry" | "Special Use";
  green: boolean;
  created_at?: string;
};

export type OrderStatus = "PENDING" | "BACKORDERED" | "ARRIVED" | "SPECIAL";
export type ItemType = "casket" | "urn";

export type Order = {
  id: number;
  item_type: ItemType;
  item_id: number | null;
  item_name: string | null;
  supplier_id: number | null;
  po_number: string;
  expected_date: string | null;
  status: OrderStatus;
  backordered: boolean;
  tbd_expected: boolean;
  special_order: boolean;
  deceased_name: string | null;
  need_by_date: string | null;
  is_return: boolean;
  return_reason: string | null;
  created_at: string;
  arrived_at: string | null;
  received_by: string | null;
};

export type VOrderEnriched = Order & {
  item_display_name: string | null;
  supplier_name: string | null;
};

/** LANDMARK: zod schemas for API IO */
export const CreateOrderSchema = z.object({
  item_type: z.enum(["casket","urn"]),
  item_id: z.number().int().nullable(),
  item_name: z.string().nullable(),
  supplier_id: z.number().int().nullable().optional(),
  po_number: z.string().min(1),
  expected_date: z.string().nullable(),
  backordered: z.boolean().default(false),
  tbd_expected: z.boolean().default(false),
  special_order: z.boolean().default(false),
  deceased_name: z.string().nullable().optional(),
  need_by_date: z.string().nullable().optional(),
  is_return: z.boolean().default(false).optional(),
  return_reason: z.string().nullable().optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderSchema = z.object({
  po_number: z.string().min(1).optional(),
  expected_date: z.string().nullable().optional(),
  backordered: z.boolean().optional(),
  tbd_expected: z.boolean().optional(),
  // allow editing deadline/return flags on update page if needed later
  need_by_date: z.string().nullable().optional(),
  is_return: z.boolean().optional(),
  return_reason: z.string().nullable().optional(),
});

export const ArriveSchema = z.object({
  received_by: z.string().min(1),
  arrived_at: z.string().nullable().optional(),
});
