# Database Guide

## Local Supabase Setup

### Starting a Local Instance

```bash
npx supabase start
```

This command:
- Starts a local PostgreSQL database
- Initializes Supabase services (Auth, Realtime, Storage)
- Outputs connection credentials to the terminal

**Note:** Requires Docker to be running. Install [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) if not already installed.

### Accessing Supabase Studio Locally

After running `npx supabase start`, Supabase Studio is available at:

```
http://localhost:54323
```

**Default credentials:**
- Email: `supabase`
- Password: `postgres`

Studio provides:
- Database browser (tables, schemas, functions)
- Query editor for SQL
- Authentication user management
- Real-time monitoring
- RLS policy editor

### Stopping Local Supabase

```bash
npx supabase stop
```

---

## Migration Workflow

### Creating Migrations

Create a new migration file:

```bash
npx supabase migration new <migration_name>
```

Example:

```bash
npx supabase migration new create_toys_table
```

This creates a timestamped SQL file in `supabase/migrations/`. Edit the file to add your SQL:

```sql
-- supabase/migrations/20250101123456_create_toys_table.sql
CREATE TABLE toys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

### Running Migrations Locally

Apply pending migrations to your local database:

```bash
npx supabase db push
```

This:
- Reads migration files from `supabase/migrations/`
- Applies new migrations in order
- Updates the local schema

Verify changes in Supabase Studio at `http://localhost:54323`.

### Pushing Migrations to Remote

After testing locally and committing migration files:

```bash
npx supabase db push --remote
```

**Before pushing:**
1. Ensure migration has been tested locally
2. Commit migration file to git
3. Have appropriate database credentials (service role key)

This applies migrations to your production/staging Supabase project.

---

## RLS Policy Development

### How RLS Policies Work

Row-Level Security (RLS) in PostgreSQL allows fine-grained access control. Supabase automatically enforces RLS policies based on the authenticated user's JWT token.

**Key Concepts:**
- **Policy**: A rule that defines which rows a user can SELECT, INSERT, UPDATE, or DELETE
- **Check Expression**: SQL condition evaluated per row (e.g., `auth.uid() = user_id`)
- **Using Clause**: Condition for SELECT/UPDATE/DELETE operations
- **With Check Clause**: Condition for INSERT/UPDATE operations

**Example Policy:**
```sql
-- Users can only view their own toys
CREATE POLICY "Users can view own toys" ON toys
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Developing RLS Policies Locally

1. **Enable RLS on your table:**
   ```sql
   ALTER TABLE toys ENABLE ROW LEVEL SECURITY;
   ```

2. **Create a policy in a migration:**
   ```sql
   CREATE POLICY "Users can view own toys" ON toys
     FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can create toys" ON toys
     FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

3. **Test the policy locally** using Supabase Studio:
   - Go to the **SQL Editor** in Studio
   - Create a test user or use the Supabase default auth endpoint
   - Query as that authenticated user to verify row visibility

4. **Use `set local` to simulate auth in queries:**
   ```sql
   -- In Studio SQL Editor, simulate being user with specific ID
   SET local "request.jwt.claims" = '{"sub":"user-id-uuid"}';
   SELECT * FROM toys;
   ```

### Testing RLS Policies

**Via Supabase Client (JavaScript):**
```typescript
// Test as authenticated user
const { data, error } = await supabase
  .from('toys')
  .select('*');
// Only returns rows where auth.uid() = user_id

// Test INSERT
const { data, error } = await supabase
  .from('toys')
  .insert({ title: 'My Toy', user_id: userId });
// Success only if policy allows (auth.uid() = user_id)
```

**Common RLS Patterns:**

| Use Case | Policy |
|----------|--------|
| Users see only their data | `auth.uid() = user_id` |
| Public read, auth write | `FOR SELECT: true`, `FOR INSERT: auth.uid() = user_id` |
| Admin bypass | `auth.jwt() ->> 'role' = 'admin'` or `auth.uid() = admin_uid` |
| Shared access via group | `user_id = auth.uid() OR toy_id IN (SELECT toy_id FROM shared_toys WHERE user_id = auth.uid())` |

### Debugging RLS Issues

**If data is missing after adding RLS:**
- Check policy exists: `SELECT * FROM pg_policies WHERE tablename = 'toys';`
- Verify policy condition logic
- Confirm RLS is enabled: `SELECT * FROM information_schema.tables WHERE tablename = 'toys' AND row_security;`

**If operations fail unexpectedly:**
- Check error message for "permission denied" or "row-level security"
- Verify `auth.uid()` matches `user_id` in your test data
- Test with explicit SQL: `SET local "request.jwt.claims" = '{"sub":"your-user-id"}';`

---

## Quick Reference

| Task | Command |
|------|---------|
| Start local DB | `npx supabase start` |
| Stop local DB | `npx supabase stop` |
| Create migration | `npx supabase migration new <name>` |
| Apply migrations locally | `npx supabase db push` |
| Push to production | `npx supabase db push --remote` |
| Access Studio locally | `http://localhost:54323` |
