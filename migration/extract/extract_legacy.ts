/**
 * Legacy Data Extraction Script
 * Extracts records from legacy MySQL tables:
 * - raw_database_rm_stock
 * - raw_database_wip_in_tb
 * - raw_database_mix_tb
 * - raw_database_rm_data
 */

export interface LegacyRmRow {
  s_no: number;
  mixture_date: string;
  pp: number;
  ll: number;
  filler: number;
  mixture: number;
  opening_stock: number;
  total_mixture: number;
}

export function extractFromCsv(csvText: string): LegacyRmRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rows: LegacyRmRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < headers.length) continue;

    rows.push({
      s_no: parseInt(cols[0], 10) || i,
      mixture_date: cols[1] || '',
      pp: parseFloat(cols[2]) || 0,
      ll: parseFloat(cols[3]) || 0,
      filler: parseFloat(cols[4]) || 0,
      mixture: parseFloat(cols[5]) || 0,
      opening_stock: parseFloat(cols[6]) || 0,
      total_mixture: parseFloat(cols[7]) || 0,
    });
  }

  return rows;
}
