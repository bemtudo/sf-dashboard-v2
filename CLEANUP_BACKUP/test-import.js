// Test importing backend modules
async function testImport() {
  try {
    console.log('🔍 Testing backend module imports...');
    
    const backendPath = '/Users/bem/Library/CloudStorage/GoogleDrive-ben@sidekickvideo.com/My Drive/Vibecoding/dashboard-vite/backend';
    
    console.log('📦 Importing database module...');
    const databaseModule = await import(`${backendPath}/database.js`);
    console.log('✅ Database module imported successfully');
    
    console.log('📦 Importing scraper manager module...');
    const scraperManagerModule = await import(`${backendPath}/scraper-manager.js`);
    console.log('✅ Scraper manager module imported successfully');
    
    console.log('🎯 All modules imported successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testImport();
