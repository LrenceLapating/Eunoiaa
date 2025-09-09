# Bulk Assessment Duplicate Prevention

This document explains the duplicate prevention mechanisms implemented for the bulk assessment feature to prevent duplicate assessments when users rapidly click the "Send Now" button.

## Problem Statement

Previously, when counselors rapidly clicked the "Send Now" button in the bulk assessment interface, multiple identical assessments could be created, leading to:
- Duplicate bulk assessment records
- Multiple assignment notifications to the same students
- Confusion in the assessment tracking system
- Poor user experience

## Solution Overview

A multi-layered duplicate prevention system has been implemented:

### 1. Frontend Prevention (Client-Side)

**File:** `Eunoia frontend/src/components/Counselor/BulkAssessment.vue`

**Mechanisms:**
- **Button State Management**: The `isSending` state prevents multiple simultaneous requests
- **Visual Feedback**: Button shows loading spinner and "Sending..." text when disabled
- **Early Return**: The `confirmSend()` method returns early if already sending

**Implementation:**
```javascript
async confirmSend() {
  // Prevent duplicate submissions
  if (this.isSending) {
    return;
  }
  
  this.isSending = true;
  // ... rest of the method
}
```

**Button UI:**
```vue
<button class="primary-button" @click="confirmSend" :disabled="isSending">
  <i class="fas fa-spinner fa-spin" v-if="isSending"></i>
  <i class="fas fa-paper-plane" v-else></i>
  {{ isSending ? 'Sending...' : 'Confirm & Send' }}
</button>
```

### 2. Backend Prevention (Server-Side)

**File:** `backend/routes/bulkAssessments.js`

**Mechanisms:**
- **Time-Based Duplicate Check**: Prevents identical assessments within 5 minutes
- **Parameter Comparison**: Compares assessment name, type, and target parameters
- **Assignment-Level Protection**: Prevents duplicate assignments to students with active assessments

**Implementation:**

#### Bulk Assessment Duplicate Check:
```javascript
// Check for duplicate bulk assessments (prevent rapid clicking duplicates)
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
const { data: recentAssessments, error: duplicateCheckError } = await supabase
  .from('bulk_assessments')
  .select('id, assessment_name, target_colleges, target_year_levels, target_sections')
  .eq('counselor_id', counselorId)
  .eq('assessment_name', assessmentName)
  .eq('assessment_type', assessmentType)
  .gte('created_at', fiveMinutesAgo)
  .neq('status', 'cancelled');

// Compare target parameters for exact duplicates
const isDuplicate = recentAssessments.some(assessment => {
  const sameColleges = JSON.stringify(assessment.target_colleges?.sort()) === JSON.stringify(targetColleges?.sort());
  const sameYearLevels = JSON.stringify(assessment.target_year_levels?.sort()) === JSON.stringify(targetYearLevels?.sort());
  const sameSections = JSON.stringify(assessment.target_sections?.sort()) === JSON.stringify(targetSections?.sort());
  return sameColleges && sameYearLevels && sameSections;
});
```

#### Assignment-Level Protection:
```javascript
// Check for existing active assignments to prevent duplicates
const { data: existingAssignments, error: existingError } = await supabase
  .from('assessment_assignments')
  .select('student_id')
  .in('student_id', studentIds)
  .in('status', ['assigned', 'in_progress'])
  .gte('expires_at', new Date().toISOString());

// Filter out students who already have active assignments
const existingStudentIds = new Set(existingAssignments?.map(a => a.student_id) || []);
const studentsToAssign = targetStudents.filter(student => !existingStudentIds.has(student.id));
```

## Error Handling

### Backend Error Response
When a duplicate is detected, the server returns:
```json
{
  "success": false,
  "message": "A similar assessment was recently created. Please wait a few minutes before creating another identical assessment."
}
```
**HTTP Status Code:** 409 (Conflict)

### Frontend Error Handling
The frontend specifically handles 409 status codes and displays the duplicate error message to the user.

## Success Response Enhancement

The success response now includes detailed information about assignment creation:

```json
{
  "success": true,
  "message": "Bulk assessment created successfully. Assigned to 25 students. 3 students were skipped as they already have active assignments.",
  "data": {
    "bulkAssessment": { /* bulk assessment object */ },
    "assignedStudents": 25,
    "skippedStudents": 3,
    "totalTargetStudents": 28
  }
}
```

## Testing

A comprehensive test script has been created to verify the duplicate prevention functionality:

**File:** `backend/tests/test-duplicate-prevention.js`

**Test Scenarios:**
1. **First Request**: Should succeed and create the assessment
2. **Immediate Duplicate**: Should be blocked with 409 status
3. **Different Parameters**: Should succeed as it's not a duplicate

**Running the Test:**
```bash
cd backend/tests
node test-duplicate-prevention.js
```

## Configuration

### Duplicate Detection Window
**Current Setting:** 5 minutes
**Location:** `backend/routes/bulkAssessments.js`
**Modification:**
```javascript
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
// Change '5 * 60 * 1000' to adjust the time window
```

### Assignment Expiration
**Current Setting:** 30 days
**Location:** `backend/routes/bulkAssessments.js`
**Modification:**
```javascript
expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
// Change '30 * 24 * 60 * 60 * 1000' to adjust expiration time
```

## Benefits

1. **Prevents Data Duplication**: Eliminates duplicate bulk assessments and assignments
2. **Improved User Experience**: Clear visual feedback and informative error messages
3. **System Integrity**: Maintains clean data and prevents confusion
4. **Performance**: Reduces unnecessary database operations
5. **Flexibility**: Allows legitimate similar assessments with different parameters

## Edge Cases Handled

1. **Network Delays**: Frontend prevention handles slow network responses
2. **Concurrent Requests**: Backend database-level checks handle race conditions
3. **Similar but Different Assessments**: Only exact duplicates are blocked
4. **Expired Assignments**: Students with expired assignments can receive new ones
5. **Cancelled Assessments**: Cancelled assessments don't count as duplicates

## Monitoring and Logging

The system logs duplicate detection events for monitoring:
- Duplicate check errors are logged to console
- Assignment creation errors are logged but don't fail the operation
- Successful operations include detailed assignment statistics

## Future Enhancements

1. **Admin Override**: Allow administrators to bypass duplicate prevention
2. **Configurable Time Window**: Make the duplicate detection window configurable via environment variables
3. **Duplicate Detection Dashboard**: Create a dashboard to monitor duplicate attempts
4. **Rate Limiting**: Implement general rate limiting for the bulk assessment endpoint