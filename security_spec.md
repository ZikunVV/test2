# Security Specification (Phase 0: Payload-First Security TDD)

## 1. Data Invariants
1. **Valid Document IDs**: Any workspace document ID (`workspaceId`) must be a valid alphanumeric identifier (`^[a-zA-Z0-9_\-]+$`) with length `<= 128`.
2. **Strict Schema Enforcement (`isValidWorkspaceSync`)**: Every write (`create` or `update`) to `/workspaces/{workspaceId}` must strictly match allowed keys (`id`, `updatedBy`, `updatedAtIso`, `organizations`, `houses`, `tickets`, `streets`, `users`, `personalTasks`, `personalPeople`, `auditLogs`, `adminMessages`) and include all required keys (`id`, `updatedBy`, `updatedAtIso`).
3. **Volumetric & String Bounds**:
   - `id`: string, `1 <= size <= 128`, matches `^[a-zA-Z0-9_\-]+$` and equals `workspaceId`
   - `updatedBy`: string, `1 <= size <= 200`
   - `updatedAtIso`: string, `1 <= size <= 64`
   - Bounded collection arrays (`organizations`, `houses`, `tickets`, `streets`, `users`, `personalTasks`, `personalPeople`, `auditLogs`, `adminMessages`): list with `size <= 5000`.
4. **No Shadow Fields**: Any payload containing unapproved keys (e.g., `isAdminOverride`, `hacked`) is immediately rejected by `.keys().hasOnly(...)`.

## 2. The "Dirty Dozen" Payloads
1. **Ghost Field Injection**: `{ id: "main", updatedBy: "admin", updatedAtIso: "2026-10-03", isSuperAdmin: true }` -> Rejected by `hasOnly()`.
2. **Missing Required Key (`updatedBy`)**: `{ id: "main", updatedAtIso: "2026-10-03" }` -> Rejected by `hasAll()`.
3. **Oversized `updatedBy` (10KB string)**: `{ id: "main", updatedBy: "A".repeat(10000), updatedAtIso: "2026-10-03" }` -> Rejected by `updatedBy.size() <= 200`.
4. **Invalid Type for `houses` (string instead of list)**: `{ id: "main", updatedBy: "admin", updatedAtIso: "2026-10-03", houses: "not-a-list" }` -> Rejected by `data.houses is list`.
5. **Path ID Mismatch**: Writing `{ id: "other", updatedBy: "admin", updatedAtIso: "2026-10-03" }` to `/workspaces/main` -> Rejected by `data.id == workspaceId`.
6. **ID Poisoning Attack**: Writing to `/workspaces/invalid$id!@#` -> Rejected by `isValidId(workspaceId)`.
7. **Unmapped Collection Write**: Writing to `/unprotected_collection/doc1` -> Rejected by global default-deny `match /{document=**} { allow read, write: if false; }`.
8. **Delete Workspace**: Deleting `/workspaces/main` -> Rejected (`allow delete: if false;`).
9. **Oversized Array (`tickets.size() > 5000`)**: Rejected by `data.tickets.size() <= 5000`.
10. **Empty `updatedAtIso` (`""`)**: Rejected by `data.updatedAtIso.size() >= 1`.
11. **Non-string `id` (`12345`)**: Rejected by `data.id is string`.
12. **Partial Update with Unknown Key**: Updating `/workspaces/main` with `{ secretField: "xyz" }` -> Rejected by `isValidWorkspaceSync(incoming())`.
