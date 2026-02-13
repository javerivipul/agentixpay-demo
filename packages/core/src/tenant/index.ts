export {
  createTenant,
  getTenantById,
  getTenantByApiKey,
  getTenantByEmail,
  updateTenant,
  deleteTenant,
  listTenants,
} from './tenant.service';
export type { CreateTenantInput, UpdateTenantInput, CreateTenantResult } from './tenant.service';
