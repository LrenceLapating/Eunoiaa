# College Scores Table Schema Analysis

## Current Status

✅ **Table Exists**: The `college_scores` table exists in your Supabase database  
✅ **Related Tables**: All related tables (`bulk_assessments`, `students`, `assessments_42items`, `assessments_84items`) are accessible  
⚠️ **No Data**: The table currently has no data (empty)  
⚠️ **Schema Optimization Needed**: Data types and constraints need optimization for better relationships  

## Current Table Structure Analysis

Based on the migration file and code analysis, the `college_scores` table should have these columns:

| Column | Current Type | Should Be | Purpose |
|--------|-------------|-----------|----------|
| `id` | UUID | UUID | Primary key |
| `college_name` | VARCHAR | VARCHAR(255) | Links to `students.college` |
| `dimension_name` | VARCHAR | VARCHAR(100) | Psychological dimension |
| `raw_score` | NUMERIC | NUMERIC(6,2) | Aggregated score (0-100) |
| `student_count` | INTEGER | INTEGER | Number of students in calculation |
| `risk_level` | VARCHAR | VARCHAR(20) | Risk assessment level |
| `assessment_type` | VARCHAR | VARCHAR(50) | Links to assessments tables |
| `assessment_name` | VARCHAR(255) | VARCHAR(255) | Links to `bulk_assessments.assessment_name` |
| `last_calculated` | TIMESTAMP | TIMESTAMP WITH TIME ZONE | When scores were computed |
| `created_at` | TIMESTAMP | TIMESTAMP WITH TIME ZONE | Record creation time |
| `updated_at` | TIMESTAMP | TIMESTAMP WITH TIME ZONE | Record update time |

## Related Tables Data Types

### students.college
- **Type**: `VARCHAR(255)`
- **Sample**: "College of Engineering", "Nursing College"
- **Relationship**: `college_scores.college_name` should match this

### bulk_assessments.assessment_name
- **Type**: `VARCHAR(255)`
- **Sample**: "2025-2026 1st Semester - Testing for Section Filtering"
- **Relationship**: `college_scores.assessment_name` should reference this

### assessments_42items/84items.assessment_type
- **Type**: `VARCHAR(50)`
- **Values**: "ryff_42", "ryff_84"
- **Relationship**: `college_scores.assessment_type` should match this

## Issues Found

1. **Missing Constraints**: No CHECK constraints for data validation
2. **Missing Indexes**: Limited indexes for query performance
3. **No Foreign Keys**: No referential integrity constraints
4. **Data Type Inconsistencies**: Some columns may not match related tables exactly
5. **Missing Triggers**: No automatic `updated_at` trigger

## Recommended Actions

### 1. Run the Schema Optimization Script

I've created a comprehensive PostgreSQL script: `fix_college_scores_schema.sql`

This script will:
- ✅ Ensure proper data types match related tables
- ✅ Add missing columns if needed
- ✅ Create appropriate constraints for data integrity
- ✅ Add indexes for optimal query performance
- ✅ Create automatic `updated_at` trigger
- ✅ Add comprehensive documentation

### 2. Key Improvements the Script Makes

**Data Type Consistency:**
```sql
-- Ensures college_name matches students.college
ALTER TABLE college_scores ALTER COLUMN college_name TYPE VARCHAR(255);

-- Ensures assessment_type matches assessments tables
ALTER TABLE college_scores ALTER COLUMN assessment_type TYPE VARCHAR(50);

-- Ensures assessment_name matches bulk_assessments.assessment_name
ALTER TABLE college_scores ALTER COLUMN assessment_name TYPE VARCHAR(255);
```

**Data Integrity Constraints:**
```sql
-- Risk level validation
ALTER TABLE college_scores 
ADD CONSTRAINT college_scores_risk_level_check 
CHECK (risk_level IN ('low', 'moderate', 'high', 'at-risk', 'healthy'));

-- Assessment type validation
ALTER TABLE college_scores 
ADD CONSTRAINT college_scores_assessment_type_check 
CHECK (assessment_type IN ('ryff_42', 'ryff_84'));
```

**Performance Indexes:**
```sql
-- For college-based filtering
CREATE INDEX idx_college_scores_college_name ON college_scores(college_name);

-- For assessment filtering (important for your new feature)
CREATE INDEX idx_college_scores_assessment_name ON college_scores(assessment_name);

-- Composite index for common queries
CREATE INDEX idx_college_scores_college_assessment 
ON college_scores(college_name, assessment_type, assessment_name);
```

## How to Apply the Fix

1. **Review the Script**: Open `fix_college_scores_schema.sql` and review the changes

2. **Run in Supabase SQL Editor**:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `fix_college_scores_schema.sql`
   - Execute the script

3. **Verify Changes**:
   - The script includes verification queries at the end
   - Check that all constraints and indexes were created successfully

## Expected Benefits After Optimization

1. **Data Integrity**: Constraints prevent invalid data insertion
2. **Performance**: Indexes speed up queries, especially for college filtering and assessment name filtering
3. **Consistency**: Data types match related tables exactly
4. **Maintainability**: Automatic triggers and documentation make the table easier to maintain
5. **Reliability**: Foreign key relationships (optional) ensure data consistency

## Testing After Optimization

After running the script, test the college scoring functionality:

```bash
# Test college scores computation
node -e "require('./utils/collegeScoring').computeAndStoreCollegeScores(null, 'ryff_42', '2025-2026 1st Semester - Testing for Section Filtering')"

# Test college scores retrieval
node -e "require('./utils/collegeScoring').getCollegeScores(null, 'ryff_42', '2025-2026 1st Semester - Testing for Section Filtering')"
```

## Notes

- The script is designed to be safe and won't break existing data
- All changes are additive or type-compatible
- Foreign key constraints are commented out to avoid issues with existing data
- The script includes comprehensive error handling

Your `college_scores` table will be fully optimized for effective communication with other tables during data insertion after running this script.