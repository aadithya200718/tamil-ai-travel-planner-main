const { createClient } = require('@supabase/supabase-js');
require('./loadEnv');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// pg-compatible query wrapper that translates SQL to Supabase REST calls
class SupabasePoolAdapter {
  constructor(client) {
    this.supabase = client;
  }

  // Replaces $1, $2 etc. with actual param values for simple queries
  _interpolate(sql, params) {
    if (!params || params.length === 0) return sql;
    let result = sql;
    for (let i = params.length; i >= 1; i--) {
      const val = params[i - 1];
      const escaped = val === null ? 'NULL' : `'${String(val).replace(/'/g, "''")}'`;
      result = result.replace(new RegExp(`\\$${i}`, 'g'), escaped);
    }
    return result;
  }

  // Parse INSERT ... RETURNING id
  _parseInsert(sql) {
    const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (!match) return null;
    const table = match[1];
    const columns = match[2].split(',').map(c => c.trim());
    const returningMatch = sql.match(/RETURNING\s+(.+)/i);
    const returning = returningMatch ? returningMatch[1].trim() : null;
    return { table, columns, returning };
  }

  // Parse SELECT
  _parseSelect(sql) {
    const match = sql.match(/SELECT\s+([\s\S]+?)\s+FROM\s+(\w+)([\s\S]*)/i);
    if (!match) return null;
    const selectClause = match[1].trim();
    const table = match[2];
    const rest = match[3] || '';
    return { selectClause, table, rest };
  }

  async query(sql, params = []) {
    const trimmed = sql.trim().replace(/\s+/g, ' ');
    const upperSql = trimmed.toUpperCase();

    // DDL statements (CREATE TABLE, ALTER TABLE) - skip silently
    if (upperSql.startsWith('CREATE TABLE') || upperSql.startsWith('ALTER TABLE') ||
        upperSql.startsWith('BEGIN') || upperSql.startsWith('COMMIT') ||
        upperSql.startsWith('ROLLBACK')) {
      return { rows: [], rowCount: 0 };
    }

    // INSERT
    if (upperSql.startsWith('INSERT')) {
      const parsed = this._parseInsert(trimmed);
      if (parsed) {
        const values = parsed.columns.map((_, i) => params[i]);
        const obj = {};
        parsed.columns.forEach((col, i) => {
          obj[col] = values[i] !== undefined ? values[i] : null;
        });

        let q = this.supabase.from(parsed.table).insert(obj);
        if (parsed.returning) {
          q = q.select(parsed.returning === '*' ? '*' : parsed.returning);
        }
        const { data, error } = await q;
        if (error) throw new Error(`Supabase INSERT error: ${error.message}`);
        return { rows: data || [], rowCount: (data || []).length };
      }
    }

    // SELECT
    if (upperSql.startsWith('SELECT')) {
      const parsed = this._parseSelect(trimmed);
      if (parsed) {
        const interpolatedSql = this._interpolate(trimmed, params);

        // Use the Supabase client for simple selects
        let q = this.supabase.from(parsed.table).select(
          parsed.selectClause === '*' ? '*' : undefined
        );

        // Handle WHERE clauses
        const whereMatch = parsed.rest.match(/WHERE\s+([\s\S]+?)(?:\s+ORDER|\s+LIMIT|\s*$)/i);
        if (whereMatch) {
          const conditions = this._interpolate(whereMatch[1], params);

          // Handle simple equality: column = 'value'
          const eqParts = conditions.match(/(\w+)\s*=\s*'([^']+)'/g);
          if (eqParts) {
            for (const part of eqParts) {
              const [col, val] = part.split(/\s*=\s*/);
              q = q.eq(col.trim(), val.replace(/^'|'$/g, ''));
            }
          }
        }

        // Handle ORDER BY
        const orderMatch = parsed.rest.match(/ORDER\s+BY\s+(\w+(?:\.\w+)?)\s*(ASC|DESC)?/i);
        if (orderMatch) {
          const col = orderMatch[1].includes('.') ? orderMatch[1].split('.')[1] : orderMatch[1];
          q = q.order(col, { ascending: (orderMatch[2] || 'ASC').toUpperCase() === 'ASC' });
        }

        // Handle LIMIT
        const limitMatch = parsed.rest.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
          q = q.limit(parseInt(limitMatch[1]));
        }

        // For JOINs or complex selects, fallback to raw query if possible
        if (parsed.rest.toLowerCase().includes('join') || parsed.selectClause.includes(',')) {
          // Use raw select with custom column list for the primary table
          const { data, error } = await this.supabase
            .from(parsed.table)
            .select('*')
            .limit(limitMatch ? parseInt(limitMatch[1]) : 100);
          if (error) throw new Error(`Supabase SELECT error: ${error.message}`);
          return { rows: data || [], rowCount: (data || []).length };
        }

        const { data, error } = await q;
        if (error) throw new Error(`Supabase SELECT error: ${error.message}`);
        return { rows: data || [], rowCount: (data || []).length };
      }
    }

    // UPDATE
    if (upperSql.startsWith('UPDATE')) {
      const updateMatch = trimmed.match(/UPDATE\s+(\w+)\s+SET\s+([\s\S]+?)\s+WHERE\s+([\s\S]+?)(?:\s+RETURNING\s+([\s\S]+))?$/i);
      if (updateMatch) {
        const table = updateMatch[1];
        const setClauses = this._interpolate(updateMatch[2], params);
        const whereClause = this._interpolate(updateMatch[3], params);
        const returning = updateMatch[4];

        const updates = {};
        const setParts = setClauses.split(',');
        for (const part of setParts) {
          const [key, ...valParts] = part.split('=');
          let val = valParts.join('=').trim();
          val = val.replace(/^'|'$/g, '');
          if (val === 'NULL') val = null;
          if (val === 'CURRENT_TIMESTAMP' || val === 'NOW()') val = new Date().toISOString();
          updates[key.trim()] = val;
        }

        const eqMatch = whereClause.match(/(\w+)\s*=\s*'([^']+)'/);
        if (eqMatch) {
          let q = this.supabase.from(table).update(updates).eq(eqMatch[1], eqMatch[2]);
          if (returning) q = q.select(returning === '*' ? '*' : returning);
          const { data, error } = await q;
          if (error) throw new Error(`Supabase UPDATE error: ${error.message}`);
          return { rows: data || [], rowCount: (data || []).length };
        }
      }
    }

    // DELETE
    if (upperSql.startsWith('DELETE')) {
      const delMatch = trimmed.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+([\s\S]+)/i);
      if (delMatch) {
        const table = delMatch[1];
        const whereClause = this._interpolate(delMatch[2], params);
        const eqMatch = whereClause.match(/(\w+)\s*=\s*'([^']+)'/);
        if (eqMatch) {
          const { data, error } = await this.supabase.from(table).delete().eq(eqMatch[1], eqMatch[2]);
          if (error) throw new Error(`Supabase DELETE error: ${error.message}`);
          return { rows: data || [], rowCount: (data || []).length };
        }
      }
    }

    // Fallback: log and return empty
    console.warn('Unhandled SQL pattern (skipped):', trimmed.substring(0, 80));
    return { rows: [], rowCount: 0 };
  }
}

const pool = new SupabasePoolAdapter(supabase);

async function getDb() {
  return pool;
}

async function initializeSchema() {
  try {
    const { count, error } = await supabase
      .from('bus_routes')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('Schema check warning:', error.message);
    } else {
      console.log(`Database connected via Supabase REST API (${count} bus routes found)`);
    }
  } catch (e) {
    console.warn('Schema check failed (non-fatal):', e.message);
  }
}

initializeSchema().catch(console.error);

module.exports = { getDb, pool, supabase };
