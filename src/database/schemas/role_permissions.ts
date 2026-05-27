import { pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { permissions } from "./permissions";
import { roles, rolesEnum } from "./roles";

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: rolesEnum("role_id")
      .notNull()
      .references(() => roles.id),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id),
  },
  (table) => ({
    pk: primaryKey(table.roleId, table.permissionId),
  }),
);
