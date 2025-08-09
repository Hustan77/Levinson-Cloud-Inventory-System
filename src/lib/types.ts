// LANDMARK: shared types + zod schemas (client & server agree)
import { z } from "zod";

export const ItemType = z.enum(["casket", "urn"]);
export type ItemType = z.infer<typeof ItemType>;

export const OrderStatus = z.enum(["PENDING", "BACKORDERED", "ARRIVED", "SPECIAL"]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export type Supplier = { id: number; name: string; ordering_instructions: string | null };

export type CasketMaterial = "WOOD" | "METAL" | "GREEN";

export type Casket = {
  id: number;
  name: string;
  supplier_id: number | null;
  // exterior (inches)
  ext_width_in: number | null;
  ext_length_in: number | null;
  ext_height_in: number | null;
  // interior (inches)
  int_width_in: number | null;
  int_length_in: number | null;
  int_height_in: number | null;
  material: CasketMaterial | null;
  jewish: boolean;
};

export type UrnCategory = "FULL" | "KEEPSAKE" | "JEWELRY" | "SPECIAL";

export type Urn = {
  id: number;
  name: string;
  supplier_id: number | null;
  width_in: number | null;
  height_in: number | null;
  depth_in: number | null;
  category: UrnCategory | null;
};

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
  created_at: string;
  arrived_at: string | null;
  received_by: string | null;
  deceased_name: string | null;
};

export type VOrderEnriched = Order & {
  supplier_name: string | null;
  item_display_name: string | null;
};

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
    deceased_name: z.string().min(1).max(200).nullable().optional().default(null),
    supplier_id: z.number().int().nullable().optional().default(null) // for special custom
  })
  .refine(
    (d) => (d.special_order ? !!d.item_name && d.item_id === null : d.item_id !== null && !d.item_name),
    { message: "Special order: set item_name. Normal order: set item_id." }
  )
  .refine((d) => d.backordered || (!!d.expected_date && !d.tbd_expected), {
    message: "Provide expected_date (TBD not allowed) when not backordered."
  })
  .refine((d) => !d.backordered || (d.tbd_expected || !!d.expected_date), {
    message: "When backordered, choose TBD or a Date."
  });

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderSchema = z
  .object({
    po_number: z.string().min(1).max(120).optional(),
    expected_date: isoDate,
    backordered: z.boolean().optional(),
    tbd_expected: z.boolean().optional()
  })
  .refine((d) => {
    const b = d.backordered ?? false;
    const tbd = d.tbd_expected ?? false;
    const date = d.expected_date ?? null;
    if (!b) return !!date && !tbd;
    return tbd || !!date;
  }, { message: "When backordered: TBD or Date. When not: Date required and TBD disabled." });

export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;

export const ArriveSchema = z.object({
  received_by: z.string().min(1).max(120),
  arrived_at: z.string().datetime().optional()
});
export type ArriveInput = z.infer<typeof ArriveSchema>;
