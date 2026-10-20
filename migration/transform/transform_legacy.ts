import { LegacyRmRow } from '../extract/extract_legacy';

export interface TransformedBatch {
  batchNo: number;
  batchDate: string;
  ppUsedKg: number;
  llUsedKg: number;
  fillerUsedKg: number;
  newMixtureKg: number;
  openingStockKg: number;
  scrapAddedKg: number;
  totalMixtureKg: number;
  status: 'COMPLETED';
}

export function transformLegacyBatches(rows: LegacyRmRow[]): TransformedBatch[] {
  return rows.map((r) => {
    // Formula check: New Mixture = PP + LL + FILLER
    const newMix = Number((r.pp + r.ll + r.filler).toFixed(2));
    // Any difference between total_mixture and (newMix + opening_stock) represents scrap added
    const expected = Number((newMix + r.opening_stock).toFixed(2));
    const scrapAdded = r.total_mixture > expected ? Number((r.total_mixture - expected).toFixed(2)) : 0;

    return {
      batchNo: r.s_no,
      batchDate: r.mixture_date,
      ppUsedKg: r.pp,
      llUsedKg: r.ll,
      fillerUsedKg: r.filler,
      newMixtureKg: newMix,
      openingStockKg: r.opening_stock,
      scrapAddedKg: scrapAdded,
      totalMixtureKg: r.total_mixture,
      status: 'COMPLETED',
    };
  });
}
