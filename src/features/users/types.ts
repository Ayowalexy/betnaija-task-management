import type { UserRole } from '../../types/index.js';

export interface CreateUserForm {
  name: string;
  email: string;
  role: UserRole;
  departmentId: string;
}
