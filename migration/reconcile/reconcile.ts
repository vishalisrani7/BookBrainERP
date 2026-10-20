import { MigrationService } from '../../apps/api/src/modules/migration/migration.service';

export async function runReconciliation() {
  const result = await MigrationService.reconcileBalances();
  console.log('--- RECONCILIATION REPORT ---');
  console.log(JSON.stringify(result, null, 2));
  return result;
}
