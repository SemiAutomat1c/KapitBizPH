import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ponytail: values is v.any() — flexible per-area fields for a hackathon core,
// not a typed product schema. Tighten only if an area needs server-side validation.
export default defineSchema({
  entries: defineTable({
    areaId: v.string(),
    values: v.any(),
    status: v.string(),
    impact: v.number(),
    createdAt: v.number(),
  }).index("by_area", ["areaId"]),
});
