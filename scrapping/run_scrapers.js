const { spawn } = require('child_process');
const path = require('path');

// Available scrapers
const scrapers = {
    accessories: 'puppet_scrapper_accessories.js',
    bags: 'puppet_scrapper_bags.js',
    women: 'puppet_scrapper_women.js',
    men: 'puppet_scrapper_men.js'
};

function runScraper(scraperName) {
    return new Promise((resolve, reject) => {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚀 Starting ${scraperName} scraper...`);
        console.log(`${'='.repeat(60)}\n`);
        
        const scraperPath = path.join(__dirname, scrapers[scraperName]);
        const child = spawn('node', [scraperPath], {
            stdio: 'inherit',
            shell: true
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`\n✅ ${scraperName} scraper completed successfully!\n`);
                resolve();
            } else {
                console.log(`\n❌ ${scraperName} scraper failed with code ${code}\n`);
                reject(new Error(`Scraper failed with code ${code}`));
            }
        });
        
        child.on('error', (error) => {
            console.error(`\n❌ Failed to start ${scraperName} scraper:`, error);
            reject(error);
        });
    });
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node run_scrapers.js <scraper1> <scraper2> ...');
        console.log('\nAvailable scrapers:');
        Object.keys(scrapers).forEach(name => {
            console.log(`  - ${name}`);
        });
        console.log('\nExamples:');
        console.log('  node run_scrapers.js accessories');
        console.log('  node run_scrapers.js accessories bags women');
        console.log('  node run_scrapers.js all  (runs all scrapers)');
        process.exit(0);
    }
    
    // Check if user wants to run all scrapers
    const scrapersToRun = args[0] === 'all' ? Object.keys(scrapers) : args;
    
    // Validate scraper names
    for (const scraperName of scrapersToRun) {
        if (!scrapers[scraperName]) {
            console.error(`❌ Unknown scraper: ${scraperName}`);
            console.log('Available scrapers:', Object.keys(scrapers).join(', '));
            process.exit(1);
        }
    }
    
    console.log(`\n📋 Will run ${scrapersToRun.length} scraper(s): ${scrapersToRun.join(', ')}\n`);
    
    // Run scrapers sequentially
    for (const scraperName of scrapersToRun) {
        try {
            await runScraper(scraperName);
        } catch (error) {
            console.error(`Failed to run ${scraperName}:`, error.message);
            // Continue with next scraper even if one fails
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 All scrapers completed!');
    console.log('='.repeat(60) + '\n');
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});

