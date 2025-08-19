// Test importing simplified backend modules
async function testImport() {
  try {
    console.log('🔍 Testing simplified backend module imports...');
    
    const backendPath = '/Users/bem/Library/CloudStorage/GoogleDrive-ben@sidekickvideo.com/My Drive/Vibecoding/dashboard-vite/backend';
    
    console.log('📦 Importing database module...');
    const databaseModule = await import(`${backendPath}/database.js`);
    console.log('✅ Database module imported successfully');
    
    console.log('📦 Importing simplified scraper manager module...');
    const scraperManagerModule = await import(`${backendPath}/scraper-manager-simple.js`);
    console.log('✅ Simplified scraper manager module imported successfully');
    
    console.log('🎯 All simplified modules imported successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testImport();
