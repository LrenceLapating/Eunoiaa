const { supabase } = require('../config/database');

/**
 * Safe script to fix missing intervention structure data
 * This addresses the issue where AI interventions appear to "disappear"
 * because the frontend expects structured data in overall_strategy and dimension_interventions
 */

class InterventionStructureFixer {
    constructor() {
        this.dimensionMap = {
            'autonomy': 'autonomy',
            'personal growth': 'personal_growth',
            'purpose in life': 'purpose_in_life',
            'self acceptance': 'self_acceptance',
            'positive relations': 'positive_relations',
            'environmental mastery': 'environmental_mastery'
        };
    }

    /**
     * Extract overall strategy from intervention text
     */
    extractOverallStrategy(interventionText) {
        if (!interventionText) return 'Personalized intervention strategy based on your assessment results.';
        
        // Try to find strategy before dimension scores
        let strategy = interventionText.split('Dimension Scores')[0];
        
        // Remove common prefixes
        strategy = strategy.replace(/^(Overall Mental Health Strategy:|Strategy:|Overall Strategy:|Overview:)\s*/gi, '');
        
        // If too short, take first paragraph
        if (strategy.length < 20) {
            strategy = interventionText.split('\n\n')[0];
        }
        
        // Ensure meaningful content
        if (strategy.length < 10) {
            strategy = 'Personalized intervention strategy based on your assessment results.';
        }
        
        return strategy.trim();
    }

    /**
     * Extract dimension interventions from intervention text
     */
    extractDimensionInterventions(interventionText) {
        if (!interventionText) return {};
        
        const dimensions = {};
        
        // Regex to match dimension patterns like "Autonomy (score/total): intervention text"
        const dimensionRegex = /(Autonomy|Personal Growth|Purpose in Life|Self Acceptance|Positive Relations|Environmental Mastery)\s*\([^)]+\):\s*([^\n]+)/gi;
        
        let match;
        while ((match = dimensionRegex.exec(interventionText)) !== null) {
            const dimensionName = match[1].toLowerCase();
            const dimensionText = match[2].trim();
            
            const dimensionKey = this.dimensionMap[dimensionName];
            if (dimensionKey && dimensionText) {
                dimensions[dimensionKey] = dimensionText;
            }
        }
        
        return dimensions;
    }

    /**
     * Check if intervention needs fixing
     */
    needsFix(intervention) {
        const missingStrategy = !intervention.overall_strategy || intervention.overall_strategy.trim() === '';
        const missingDimensions = !intervention.dimension_interventions || 
                                Object.keys(intervention.dimension_interventions).length === 0;
        
        return missingStrategy || missingDimensions;
    }

    /**
     * Fix a single intervention
     */
    async fixIntervention(intervention) {
        try {
            const updates = {};
            
            // Extract missing overall strategy
            if (!intervention.overall_strategy || intervention.overall_strategy.trim() === '') {
                updates.overall_strategy = this.extractOverallStrategy(intervention.intervention_text);
            }
            
            // Extract missing dimension interventions
            if (!intervention.dimension_interventions || Object.keys(intervention.dimension_interventions).length === 0) {
                updates.dimension_interventions = this.extractDimensionInterventions(intervention.intervention_text);
            }
            
            if (Object.keys(updates).length === 0) {
                console.log(`Intervention ${intervention.id} doesn't need fixing`);
                return { success: true, updated: false };
            }
            
            // Update the intervention
            const { error } = await supabase
                .from('counselor_interventions')
                .update(updates)
                .eq('id', intervention.id);
            
            if (error) {
                console.error(`Error updating intervention ${intervention.id}:`, error);
                return { success: false, error: error.message };
            }
            
            console.log(`Successfully updated intervention ${intervention.id}`);
            console.log(`  - Strategy length: ${updates.overall_strategy?.length || 'unchanged'}`);
            console.log(`  - Dimensions count: ${Object.keys(updates.dimension_interventions || {}).length || 'unchanged'}`);
            
            return { success: true, updated: true, updates };
            
        } catch (error) {
            console.error(`Error processing intervention ${intervention.id}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Main function to fix all interventions
     */
    async fixAllInterventions(dryRun = true) {
        try {
            console.log(`Starting intervention structure fix (${dryRun ? 'DRY RUN' : 'LIVE RUN'})...`);
            
            // Fetch interventions that need fixing
            const { data: interventions, error } = await supabase
                .from('counselor_interventions')
                .select('id, intervention_text, overall_strategy, dimension_interventions')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching interventions:', error);
                return { success: false, error: error.message };
            }
            
            console.log(`Found ${interventions.length} total interventions`);
            
            const interventionsToFix = interventions.filter(intervention => this.needsFix(intervention));
            console.log(`Found ${interventionsToFix.length} interventions that need fixing`);
            
            if (interventionsToFix.length === 0) {
                console.log('No interventions need fixing!');
                return { success: true, fixed: 0, total: interventions.length };
            }
            
            let fixedCount = 0;
            let errorCount = 0;
            
            for (const intervention of interventionsToFix) {
                if (dryRun) {
                    // Just simulate the fix
                    const strategy = this.extractOverallStrategy(intervention.intervention_text);
                    const dimensions = this.extractDimensionInterventions(intervention.intervention_text);
                    
                    console.log(`\nWould fix intervention ${intervention.id}:`);
                    console.log(`  - Strategy: ${strategy.substring(0, 100)}...`);
                    console.log(`  - Dimensions: ${Object.keys(dimensions).join(', ')}`);
                    fixedCount++;
                } else {
                    // Actually fix the intervention
                    const result = await this.fixIntervention(intervention);
                    if (result.success && result.updated) {
                        fixedCount++;
                    } else if (!result.success) {
                        errorCount++;
                    }
                }
            }
            
            console.log(`\n${dryRun ? 'DRY RUN' : 'LIVE RUN'} completed:`);
            console.log(`  - Total interventions: ${interventions.length}`);
            console.log(`  - Interventions ${dryRun ? 'that would be' : ''} fixed: ${fixedCount}`);
            if (errorCount > 0) {
                console.log(`  - Errors: ${errorCount}`);
            }
            
            return { 
                success: true, 
                total: interventions.length, 
                fixed: fixedCount, 
                errors: errorCount,
                dryRun 
            };
            
        } catch (error) {
            console.error('Error in fixAllInterventions:', error);
            return { success: false, error: error.message };
        }
    }
}

// Main execution
async function main() {
    const fixer = new InterventionStructureFixer();
    
    // First run a dry run to see what would be changed
    console.log('=== DRY RUN ===');
    const dryRunResult = await fixer.fixAllInterventions(true);
    
    if (!dryRunResult.success) {
        console.error('Dry run failed:', dryRunResult.error);
        process.exit(1);
    }
    
    if (dryRunResult.fixed === 0) {
        console.log('No interventions need fixing. Exiting.');
        process.exit(0);
    }
    
    // Ask for confirmation (in a real scenario, you'd want user input)
    console.log('\n=== READY TO APPLY FIXES ===');
    console.log('Run with --apply flag to actually apply the fixes');
    
    // Check if --apply flag is provided
    if (process.argv.includes('--apply')) {
        console.log('\n=== APPLYING FIXES ===');
        const liveResult = await fixer.fixAllInterventions(false);
        
        if (liveResult.success) {
            console.log('\n✅ All fixes applied successfully!');
        } else {
            console.error('\n❌ Error applying fixes:', liveResult.error);
            process.exit(1);
        }
    } else {
        console.log('\nTo apply the fixes, run: node scripts/fix_intervention_structure.js --apply');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { InterventionStructureFixer };