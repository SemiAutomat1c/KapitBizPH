import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { areaId: v.string() },
  handler: (ctx, { areaId }) =>
    ctx.db
      .query("entries")
      .withIndex("by_area", (q) => q.eq("areaId", areaId))
      .order("desc")
      .collect(),
});

export const add = mutation({
  args: { areaId: v.string(), values: v.any(), status: v.string(), impact: v.number() },
  handler: (ctx, a) => ctx.db.insert("entries", { ...a, createdAt: Date.now() }),
});

export const setStatus = mutation({
  args: { id: v.id("entries"), status: v.string() },
  handler: (ctx, { id, status }) => ctx.db.patch(id, { status }),
});
