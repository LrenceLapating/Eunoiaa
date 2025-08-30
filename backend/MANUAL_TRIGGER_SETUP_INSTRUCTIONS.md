# Manual Database Trigger Setup Instructions

## Overview
Since Supabase doesn't allow direct SQL execution through the Node.js client, you need to manually execute the SQL migration in your Supabase dashboard.

## Steps to Apply the Triggers

### 1. Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### 2. Execute the SQL Migration
Copy and paste the entire content from the file:
```
C:\EUNOIA\Eunoiaa\backend\migrations\create_risk_level_sync_triggers.sql
```

### 3. Run the Query
1. Paste the SQL content into the SQL editor
2. Click **Run** to execute the migration
3. Verify that all statements execute successfully

## What the Migration Creates

### 1. Function: `sync_risk_level_to_assignments()`
- Automatically syncs risk_level from assessment tables to assessment_assignments
- Maps risk_level values:
  - `low` → `healthy`
  - `moderate` → `moderate`
  - `high` → `at-risk`
- Updates the `updated_at` timestamp

### 2. Triggers
- **`trigger_sync_risk_level_42items`** on `assessments_42items`
- **`trigger_sync_risk_level_84items`** on `assessments_84items`
- Both triggers fire AFTER INSERT OR UPDATE of the `risk_level` column
- Only execute when `risk_level` and `assignment_id` are NOT NULL

### 3. Performance Indexes
- `idx_assessment_assignments_id_risk_level`
- `idx_assessments_42items_assignment_risk`
- `idx_assessments_84items_assignment_risk`

## Verification

After running the SQL migration, you can verify the triggers were created by running:

```sql
-- Check if triggers exist
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name IN (
    'trigger_sync_risk_level_42items', 
    'trigger_sync_risk_level_84items'
);

-- Check if function exists
SELECT 
    routine_name, 
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'sync_risk_level_to_assignments';
```

## Testing the Triggers

Once the triggers are installed, you can test them by:

1. **Updating an existing assessment's risk_level:**
```sql
UPDATE assessments_42items 
SET risk_level = 'high' 
WHERE id = 'some-assessment-id';
```

2. **Check if assessment_assignments was updated:**
```sql
SELECT 
    aa.id,
    aa.risk_level as assignment_risk_level,
    a42.risk_level as assessment_risk_level
FROM assessment_assignments aa
JOIN assessments_42items a42 ON aa.id = a42.assignment_id
WHERE a42.id = 'some-assessment-id';
```

## Troubleshooting

### If Triggers Don't Work
1. Check that the function was created successfully
2. Verify trigger permissions
3. Check Supabase logs for any error messages
4. Ensure the assessment records have valid `assignment_id` values

### Common Issues
- **Permission errors:** Make sure you're using the service role key
- **Missing assignment_id:** Triggers only fire when `assignment_id` IS NOT NULL
- **Invalid risk_level values:** Check that risk_level values are valid

## Alternative: Node.js Implementation

If database triggers cannot be used, we can implement the sync logic in the application layer by modifying the assessment submission endpoints.