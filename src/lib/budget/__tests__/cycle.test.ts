import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import type { TBudgetConfig, TWeekCycle } from "@/db/types";
import {
  ensureActiveCycle,
  getActiveCycle,
  getOrCreateDailyRecord,
} from "../cycle";
import { createFakeSupabase, type FakeTables } from "./fake-supabase";

// Wednesday. The cycle below runs Monday to Sunday around it.
const TODAY = new Date(2026, 8, 2, 12, 0, 0);
const TODAY_STR = "2026-09-02";
const ACCOUNT = "account-1";

const config: TBudgetConfig = {
  id: "config-1",
  account_id: ACCOUNT,
  daily_base: 150,
  week_start_day: 1,
  carry_over_mode: "carry_all",
  is_active: true,
  created_at: "2026-08-31T00:00:00.000Z",
  updated_at: "2026-08-31T00:00:00.000Z",
};

function makeCycle(overrides: Partial<TWeekCycle> = {}): TWeekCycle {
  return {
    id: "cycle-1",
    account_id: ACCOUNT,
    config_id: config.id,
    start_date: "2026-08-31",
    end_date: "2026-09-06",
    initial_budget: 1050,
    carried_balance: 0,
    accumulated_balance: 0,
    status: "active",
    created_at: "2026-08-31T00:00:00.000Z",
    updated_at: "2026-08-31T00:00:00.000Z",
    ...overrides,
  };
}

function client(tables: FakeTables, options = {}) {
  const fake = createFakeSupabase(tables, options);
  return {
    fake,
    supabase: fake as unknown as SupabaseClient,
  };
}

describe("getActiveCycle", () => {
  it("should return null when the account has no cycle", async () => {
    const { supabase } = client({ week_cycles: [] });

    expect(await getActiveCycle(supabase, ACCOUNT, TODAY)).toBeNull();
  });

  it("should return the cycle when exactly one is active", async () => {
    const { supabase } = client({ week_cycles: [makeCycle()] });

    const cycle = await getActiveCycle(supabase, ACCOUNT, TODAY);

    expect(cycle?.id).toBe("cycle-1");
  });

  it("should return the oldest cycle when duplicates exist, not null", async () => {
    // The regression. PostgREST answers PGRST116 for "more than one row" just
    // as it does for "no rows", so reading that as "no active cycle" made the
    // app create yet another cycle on every call.
    const { supabase } = client({
      week_cycles: [
        makeCycle({ id: "cycle-2", created_at: "2026-08-31T10:00:00.000Z" }),
        makeCycle({ id: "cycle-1", created_at: "2026-08-31T09:00:00.000Z" }),
      ],
    });

    const cycle = await getActiveCycle(supabase, ACCOUNT, TODAY);

    expect(cycle).not.toBeNull();
    expect(cycle?.id).toBe("cycle-1");
  });

  it("should ignore closed cycles", async () => {
    const { supabase } = client({
      week_cycles: [makeCycle({ status: "closed" })],
    });

    expect(await getActiveCycle(supabase, ACCOUNT, TODAY)).toBeNull();
  });

  it("should ignore cycles from another account", async () => {
    const { supabase } = client({
      week_cycles: [makeCycle({ account_id: "account-2" })],
    });

    expect(await getActiveCycle(supabase, ACCOUNT, TODAY)).toBeNull();
  });

  it("should ignore a cycle whose range does not contain the date", async () => {
    const { supabase } = client({
      week_cycles: [
        makeCycle({ start_date: "2026-08-10", end_date: "2026-08-16" }),
      ],
    });

    expect(await getActiveCycle(supabase, ACCOUNT, TODAY)).toBeNull();
  });
});

describe("ensureActiveCycle", () => {
  it("should reuse the existing cycle instead of creating another", async () => {
    const { supabase, fake } = client({ week_cycles: [makeCycle()] });

    const cycle = await ensureActiveCycle(supabase, ACCOUNT, config);

    expect(cycle.id).toBe("cycle-1");
    expect(fake.insertAttempts).toHaveLength(0);
  });

  it("should not create a cycle when duplicates already exist", async () => {
    // Loading the page repeatedly used to add one cycle per load.
    const { supabase, fake } = client({
      week_cycles: [
        makeCycle({ id: "cycle-1", created_at: "2026-08-31T09:00:00.000Z" }),
        makeCycle({ id: "cycle-2", created_at: "2026-08-31T10:00:00.000Z" }),
      ],
    });

    await ensureActiveCycle(supabase, ACCOUNT, config);
    await ensureActiveCycle(supabase, ACCOUNT, config);
    await ensureActiveCycle(supabase, ACCOUNT, config);

    expect(fake.insertAttempts).toHaveLength(0);
    expect(fake.tables.week_cycles).toHaveLength(2);
  });
});

describe("getOrCreateDailyRecord", () => {
  let cycle: TWeekCycle;

  beforeEach(() => {
    cycle = makeCycle();
  });

  it("should create the record when the day has none", async () => {
    const { supabase, fake } = client({ daily_records: [] });

    const record = await getOrCreateDailyRecord(
      supabase,
      ACCOUNT,
      cycle,
      config,
      TODAY,
    );

    expect(record.record_date).toBe(TODAY_STR);
    expect(record.base_budget).toBe(150);
    expect(record.total_spent).toBe(0);
    expect(fake.tables.daily_records).toHaveLength(1);
  });

  it("should return the existing record without inserting again", async () => {
    const { supabase, fake } = client({ daily_records: [] });

    const first = await getOrCreateDailyRecord(
      supabase,
      ACCOUNT,
      cycle,
      config,
      TODAY,
    );
    const second = await getOrCreateDailyRecord(
      supabase,
      ACCOUNT,
      cycle,
      config,
      TODAY,
    );

    expect(second.id).toBe(first.id);
    expect(fake.tables.daily_records).toHaveLength(1);
  });

  it("should not duplicate the day across many page loads", async () => {
    const { supabase, fake } = client({ daily_records: [] });

    for (let i = 0; i < 5; i++) {
      await getOrCreateDailyRecord(supabase, ACCOUNT, cycle, config, TODAY);
    }

    expect(fake.tables.daily_records).toHaveLength(1);
  });

  it("should recover when another request wins the race", async () => {
    // Simulates the real sequence: our select finds nothing, another request
    // inserts the row, then our insert comes back with 23505.
    const winner = {
      id: "winner",
      account_id: ACCOUNT,
      cycle_id: cycle.id,
      record_date: TODAY_STR,
      base_budget: 150,
      available_budget: 150,
      total_spent: 0,
      daily_balance: 150,
      remaining_days: 5,
      created_at: "2026-09-02T08:00:00.000Z",
      updated_at: "2026-09-02T08:00:00.000Z",
    };

    const { supabase, fake } = client(
      { daily_records: [] },
      {
        onBeforeInsert: (table: string, _payload: unknown, tables: FakeTables) => {
          if (table !== "daily_records") return;
          if (tables.daily_records.length === 0) {
            tables.daily_records.push(winner);
          }
        },
      },
    );

    const record = await getOrCreateDailyRecord(
      supabase,
      ACCOUNT,
      cycle,
      config,
      TODAY,
    );

    expect(record.id).toBe("winner");
    expect(fake.tables.daily_records).toHaveLength(1);
  });

  it("should keep each day separate", async () => {
    const { supabase, fake } = client({ daily_records: [] });

    await getOrCreateDailyRecord(supabase, ACCOUNT, cycle, config, TODAY);
    await getOrCreateDailyRecord(
      supabase,
      ACCOUNT,
      cycle,
      config,
      new Date(2026, 8, 3, 12, 0, 0),
    );

    expect(fake.tables.daily_records).toHaveLength(2);
  });

  it("should raise today's budget when the cycle carries a surplus", async () => {
    const { supabase } = client({ daily_records: [] });

    const record = await getOrCreateDailyRecord(
      supabase,
      ACCOUNT,
      makeCycle({ accumulated_balance: 100 }),
      config,
      TODAY,
    );

    // Wednesday of a Monday-Sunday cycle leaves 5 days, so 150 + 100/5.
    expect(record.remaining_days).toBe(5);
    expect(record.available_budget).toBe(170);
  });

  it("should lower today's budget when the cycle carries a deficit", async () => {
    const { supabase } = client({ daily_records: [] });

    const record = await getOrCreateDailyRecord(
      supabase,
      ACCOUNT,
      makeCycle({ accumulated_balance: -100 }),
      config,
      TODAY,
    );

    expect(record.available_budget).toBe(130);
  });
});
