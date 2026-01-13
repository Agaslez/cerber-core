#!/usr/bin/env node

/**
 * Real-time GitHub Actions Monitoring & Auto-Push
 * Usage: node monitor-actions.js
 */

const { execSync } = require('child_process');
const fs = require('fs');

const REPO = 'Agaslez/cerber-core';
const BRANCH = 'main';
const MAX_WAIT = 3600; // 1 hour
const POLL_INTERVAL = 15; // seconds

console.log('🔍 MONITORING GitHub Actions');
console.log(`   Repository: ${REPO}`);
console.log(`   Branch: ${BRANCH}`);
console.log(`   Dashboard: https://github.com/${REPO}/actions`);
console.log(`   Polling every ${POLL_INTERVAL}s...\n`);

const startTime = Date.now();
let lastStatus = '';
let dotCount = 0;

function checkPushStatus() {
    try {
        const result = execSync('git push origin main --dry-run 2>&1', {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        return result;
    } catch (error) {
        return error.stdout + error.stderr;
    }
}

function formatTime() {
    return new Date().toLocaleTimeString();
}

async function monitor() {
    while (true) {
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (elapsed > MAX_WAIT) {
            console.error(
                '\n❌ TIMEOUT after ' + Math.round(MAX_WAIT) + 's - checks did not complete'
            );
            console.error(
                '   Check manually: https://github.com/' + REPO + '/actions'
            );
            process.exit(1);
        }
        
        const status = checkPushStatus();
        const hasError = status.includes('error') || status.includes('rejected');
        
        if (!hasError) {
            // ✅ Checks passed - push is allowed!
            console.log('\n');
            console.log('✅ ' + formatTime() + ' - Status checks PASSED!');
            console.log('');
            console.log('🚀 Ready to push! Running: git push origin main\n');
            
            try {
                const pushResult = execSync('git push origin main', { encoding: 'utf-8' });
                console.log(pushResult);
                console.log('✅ Push successful! Monitoring complete.');
                process.exit(0);
            } catch (error) {
                console.error('❌ Push failed:', error.message);
                process.exit(1);
            }
        } else {
            // Extract error message
            const errorMatch = status.match(/(?:error|rejected)[^.\n]*/i);
            const currentStatus = errorMatch ? errorMatch[0].trim() : 'Waiting...';
            
            if (currentStatus !== lastStatus) {
                console.log('⏳ ' + formatTime() + ' - Waiting for checks...');
                console.log('   ' + currentStatus.substring(0, 80));
                lastStatus = currentStatus;
                dotCount = 0;
            } else {
                // Print progress dots
                process.stdout.write('.');
                dotCount++;
                if (dotCount % 10 === 0) {
                    console.log(' ' + Math.round(elapsed) + 's');
                    dotCount = 0;
                }
            }
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL * 1000));
    }
}

// Run monitoring
monitor().catch(error => {
    console.error('❌ Monitoring error:', error.message);
    process.exit(1);
});
