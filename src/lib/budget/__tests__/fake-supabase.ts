/**
 * Minimal in-memory stand-in for the Supabase client, built to reproduce the
 * two PostgREST behaviours that caused real bugs in this codebase:
 *
 * 1. `.single()` answers PGRST116 both for "no rows" and for "more than one
 *    row". Code that reads PGRST116 as "not found" silently mistakes a
 *    duplicate for an absence.
 * 2. An insert that violates a unique index answers error code 23505.
 *
 * Only the query surface used by src/lib/budget/cycle.ts is implemented.
 */

// biome-ignore lint/suspicious/noExplicitAny: test double mirrors an untyped client
type Row = Record<string, any>;

type Filter = { op: "eq" | "lte" | "gte"; field: string; value: unknown };

export type FakeTables = Record<string, Row[]>;

/** Columns that must be unique together, per table. */
const UNIQUE_KEYS: Record<string, string[]> = {
  daily_records: ["account_id", "record_date"],
};

const PGRST116 = {
  code: "PGRST116",
  message: "Cannot coerce the result to a single JSON object",
};

export interface FakeSupabaseOptions {
  /**
   * Runs just before an insert is applied. Use it to simulate another request
   * winning a race, by writing the conflicting row into the table.
   */
  onBeforeInsert?: (table: string, payload: Row, tables: FakeTables) => void;
}

export interface FakeSupabase {
  from: (table: string) => FakeQuery;
  tables: FakeTables;
  /** Every insert attempted, successful or not, in order. */
  insertAttempts: { table: string; payload: Row }[];
}

class FakeQuery {
  private filters: Filter[] = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private mode: "select" | "insert" = "select";
  private payload: Row | null = null;
  private coerce: "none" | "single" | "maybeSingle" = "none";

  constructor(
    private readonly db: FakeSupabase,
    private readonly table: string,
    private readonly options: FakeSupabaseOptions,
  ) {}

  select(): this {
    return this;
  }

  insert(payload: Row): this {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }

  eq(field: string, value: unknown): this {
    this.filters.push({ op: "eq", field, value });
    return this;
  }

  lte(field: string, value: unknown): this {
    this.filters.push({ op: "lte", field, value });
    return this;
  }

  gte(field: string, value: unknown): this {
    this.filters.push({ op: "gte", field, value });
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }): this {
    this.orderField = field;
    this.orderAscending = opts?.ascending !== false;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): this {
    this.coerce = "single";
    return this;
  }

  maybeSingle(): this {
    this.coerce = "maybeSingle";
    return this;
  }

  // Supabase query builders are thenable: awaiting one runs it. Reproducing
  // that is the whole point of this double.
  // biome-ignore lint/suspicious/noThenProperty: mirrors the real query builder
  then(
    resolve: (value: { data: unknown; error: unknown }) => unknown,
    reject?: (reason: unknown) => unknown,
  ) {
    try {
      return Promise.resolve(this.run()).then(resolve, reject);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private rows(): Row[] {
    this.db.tables[this.table] ??= [];
    return this.db.tables[this.table];
  }

  private matching(): Row[] {
    let result = this.rows().filter((row) =>
      this.filters.every(({ op, field, value }) => {
        const cell = row[field];
        if (op === "eq") return cell === value;
        if (op === "lte") return cell <= (value as never);
        return cell >= (value as never);
      }),
    );

    if (this.orderField) {
      const field = this.orderField;
      const direction = this.orderAscending ? 1 : -1;
      result = [...result].sort((a, b) =>
        a[field] === b[field] ? 0 : a[field] > b[field] ? direction : -direction,
      );
    }

    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }

    return result;
  }

  private run(): { data: unknown; error: unknown } {
    if (this.mode === "insert") return this.runInsert();

    const found = this.matching();

    if (this.coerce === "single") {
      // The behaviour that matters: one error code for both "none" and "many".
      if (found.length !== 1) return { data: null, error: PGRST116 };
      return { data: found[0], error: null };
    }

    if (this.coerce === "maybeSingle") {
      if (found.length > 1) return { data: null, error: PGRST116 };
      return { data: found[0] ?? null, error: null };
    }

    return { data: found, error: null };
  }

  private runInsert(): { data: unknown; error: unknown } {
    const payload = this.payload as Row;
    this.db.insertAttempts.push({ table: this.table, payload });

    this.options.onBeforeInsert?.(this.table, payload, this.db.tables);

    const uniqueKey = UNIQUE_KEYS[this.table];
    if (uniqueKey) {
      const clash = this.rows().some((row) =>
        uniqueKey.every((field) => row[field] === payload[field]),
      );

      if (clash) {
        return {
          data: null,
          error: {
            code: "23505",
            message: `duplicate key value violates unique constraint on ${this.table}`,
          },
        };
      }
    }

    const row: Row = {
      id: `${this.table}-${this.rows().length + 1}`,
      created_at: new Date(2026, 0, 1, 0, this.rows().length).toISOString(),
      updated_at: new Date(2026, 0, 1, 0, this.rows().length).toISOString(),
      ...payload,
    };
    this.rows().push(row);

    return { data: row, error: null };
  }
}

export function createFakeSupabase(
  tables: FakeTables = {},
  options: FakeSupabaseOptions = {},
): FakeSupabase {
  const db: FakeSupabase = {
    tables,
    insertAttempts: [],
    from: (table: string) => new FakeQuery(db, table, options),
  };

  return db;
}
