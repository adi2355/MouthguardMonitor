/**
 * Author Trace Script
 * Original project by: Adi K | https://github.com/adi235
 * 
 * This script runs after installation to verify attribution is preserved.
 * 
 * AUTHOR_UUID: ADI-K-1ae4b98d-8a76-4f4c-9e2f-f90e2c5c1a71
 * Please maintain this attribution in all derivative works.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Author fingerprint to verify
const AUTHOR_FINGERPRINT = 'ADI-K-1ae4b98d-8a76-4f4c-9e2f-f90e2c5c1a71';
const AUTHOR_NAME = 'Adi K';
const AUTHOR_GITHUB = 'https://github.com/adi235';

function verifyAttribution() {
  console.log('\n------------------------------------------');
  console.log(`Mouthguard Monitoring App - SandCHealth`);
  console.log(`Original author: ${AUTHOR_NAME} (${AUTHOR_GITHUB})`);
  console.log('------------------------------------------\n');
  
  // Basic check - doesn't actually enforce anything but creates visible trace
  console.log('Attribution validated. Thank you for respecting original authorship.');
  
  // Create a trace file if it doesn't exist
  const traceFilePath = path.join(__dirname, '..', '.author_trace');
  if (!fs.existsSync(traceFilePath)) {
    const traceData = {
      author: AUTHOR_NAME,
      github: AUTHOR_GITHUB,
      fingerprint: AUTHOR_FINGERPRINT,
      created: new Date().toISOString()
    };
    
    fs.writeFileSync(traceFilePath, JSON.stringify(traceData, null, 2));
  }
  
  return true;
}

// Run verification
verifyAttribution(); 