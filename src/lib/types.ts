// LANDMARK: shared types + validators
import { z } from "zod";

/* ENUMS */
export const ItemType = z.enum(["casket", "urn"]);
export type ItemType = z.infer<typeof ItemType>;

export const OrderStatus = z.enum(["PENDING", "BACKORDERED", "ARRIVED", "SPECIAL"]);
export type OrderStatus = z.infer<typeof OrderStatus>;

/* TABLE TYPES */
export type Supplier = {
  id: number;
  name: string;
  ordering_instructions: string | null;
};

export type Casket = { id: number; name: string; supplier_id: number | null };
export type Urn    = { id: number; name: string; supplier_id: number | null };

export type Order = {
  id: number;
  item_type: ItemType;
  item_id: number | null;
  item_name: string | null; // for SPECIAL
  supplier_id: number | null;
  po_number: string;
  expected_date: string | null; // YYYY-MM-DD or null
  status: OrderStatus;
  backordered: boolean;
  tbd_expected: boolean;
  created_at: string;
  arrived_at: string | null;
  received_by: string | null;
  deceased_name: string | null;
};

export type VOrderEnriched = Order & {
  supplier_name: string | null;
  item_display_name: string | null;
};

/* LANDMARK: Zod ISO date (string) */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .nullable()
  .optional()
  .transform((v) => (v === "" ? null : v ?? null));

export const CreateOrderSchema = z
  .object({
    item_type: ItemType,
    item_id: z.number().int().nullable().optional().default(null),
    item_name: z.string().min(1).max(200).nullable().optional().default(null),
    po_number: z.string().min(1).max(120),
    expected_date: isoDate,
    backordered: z.boolean().default(false),
    tbd_expected: z.boolean().default(false),
    special_order: z.boolean().default(false),
    deceased_name: z.string().min(1).max(200).nullable().optional().default(null)
  })
  .refine(
    (data) => (data.special_order ? !!data.item_name && data.item_id === null : data.item_id !== null && !data.item_name),
    { message: "For special orders use item_name (item_id null). For normal orders use item_id (no item_name)." }
  )
  .refine((data) => (data.backordered || data.tbd_expected ? true : !!data.expected_date), {
    message: "Either provide expected_date or mark as backordered/TBD."
  });

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const ArriveSchema = z.object({
  received_by: z.string().min(1).max(120),
  arrived_at: z.string().datetime().optional()
});
export type ArriveInput = z.infer<typeof ArriveSchema>;
