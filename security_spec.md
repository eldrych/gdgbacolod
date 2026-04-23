# Security Specification - GDG Bacolod Guest Checker

## 1. Data Invariants
- A Guest must have a valid `name` and `email`.
- `email` must be the document ID and match the `email` field.
- `metadata/config` holds the Sheet ID and sync state.

## 2. The Dirty Dozen (Test Payloads)
1. Missing name (create /guests/test@abc.com) -> DENIED
2. Invalid email format (create /guests/not-an-email) -> DENIED
3. Spoofing document ID (create /guests/a@b.com with field email: 'c@d.com') -> DENIED
4. unauthorized metadata edit (update /metadata/config) -> DENIED (until auth added)
5. Overwriting guest name with 1MB string -> DENIED
6. Deleting the entire collection -> DENIED
7. Listing guests without filters -> DENIED (or allowed if needed by admin UI, but should be restricted)
8. Updating email field (immutable) -> DENIED
9. Injecting extra fields into metadata -> DENIED
10. Anonymous metadata read -> DENIED
11. Bypassing size limits on names -> DENIED
12. Accessing system config as guest -> DENIED

## 3. Test Runner (Draft)
- `it('should deny guest creation with missing fields', ...)`
- `it('should deny unauthorized config updates', ...)`
- `it('should allow guest lookup by email', ...)`
