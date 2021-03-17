// MAIN SCRIPT
// -----------

// On page load
window.addEventListener('load', async (event) => {
    logistics.siteSetup();
});


// Main controller for site
let logistics = {

    currentSection: 'faq',
    headerLinks: '',
    titleNode: '',

    // Object for switching between sections
    siteSections: {
        settings: {node: '', object: settings},
        wallets: {node: '', object: wallets},
        journey: {node: '', object: journey},
        imports: {node: '', object: imports},
        stacks: {node: '', object: stacks},
        faq: {node: '', object: faq},
    },

    siteSetup: async function() {
        // Set state
        ////storage.removeFromStorage('heystack_status');
        console.log(localStorage);
        await status.setup();

        // Get nodes
        this.getLogisticsNodes();
        this.getSectionNodes();

        // Check for connection/ IDB failure
        if (this.checkFail() === true) {
            await status.setState('fail');
            this.switchSection('faq');
        } else {
            // First use setup
            if (status.summary.state === 'new') {
                this.switchSection('faq');
                faq.initialSetup();
            } else {
            // Repeated use setup
                await status.setState('setup');
                this.switchSection('stacks');
            }

            // Set link / title listeners
            this.addHeaderLinksListener();
            this.addPageTitleListener();

            // Set up each section
            communication.setup();
            this.sectionsSetup();

            // Open and set up database
            await this.databaseSetup();

            // Run opening tasks (fast only, no fetch, no aggregation)
            await this.runOpeningTasks();

            // Run starting tasks (slow tasks)
            await this.runTasks();
        }
    },

    // Nodes for orienting around site
    getLogisticsNodes: function() {
        this.headerLinks = document.getElementById('headerLinks');
        this.titleNode = document.getElementById('title');
    },

    // Nodes for each section - id in html must match section object
    getSectionNodes: function() {
        for (let section in logistics.siteSections) {
            this.siteSections[section].node = document.getElementById(section);
        }
    },

    // Check for connection/ IDB failure
    checkFail: function() {
        if (!window.indexedDB) {
            communication.message('Your browser does not support IndexedDB.<br>Please consider using Chrome browser.');
            return true;
        } else if (window.navigator.onLine === false) {
            communication.message('You are not connected to the internet.');
            return true;
        }
        return false;
    },

    // Hide / reveal different "pages"
    switchSection: async function(sectionName) {
        for (let siteSection in logistics.siteSections) {
            let currentSection = logistics.siteSections[logistics.currentSection];
            let section = logistics.siteSections[siteSection];
            if (siteSection === sectionName) {
                // Run close switch tasks
                if (currentSection.object.hasOwnProperty('closeSwitchTasks')) {
                    await currentSection.object.closeSwitchTasks();
                }
                section.node.style.display = "block";
                logistics.currentSection = siteSection;
                // Run switch tasks
                if (section.object.hasOwnProperty('switchTasks')) {
                    await section.object.switchTasks();
                }
            } else {
                section.node.style.display = "none";
            }
        }
    },

    // Set up each section
    sectionsSetup: function() {
        for (let siteSection in logistics.siteSections) {
            let section = logistics.siteSections[siteSection];
            if (section.object !== false && section.object.hasOwnProperty('setup')) {
                section.object.setup();
            }
        }
    },

    // Open database
    databaseSetup: async function() {
        // Delete old 'HiveJourney' database
        //await Database.deleteDB('HiveJourney');

        // Create new 'HeyStack' database
        databases.heyStack = new Database(databases.heyStack);
        let openHeyStackStatus = await databases.heyStack.openDB();
        ////databases.heyStack.closeAndDeleteDB();

        databases.cryptoPrices = new Database(databases.cryptoPrices);
        let openCryptoStatus = await databases.cryptoPrices.openDB();
        ////databases.cryptoPrices.closeAndDeleteDB();

        databases.vestPrices = new Database(databases.vestPrices);
        let openVestsStatus = await databases.vestPrices.openDB();
        ////databases.vestPrices.closeAndDeleteDB();
    },

    // Run opening tasks (fast only, no fetch, no aggregation)
    runOpeningTasks: async function() {
        for (let siteSection in logistics.siteSections) {
            let section = logistics.siteSections[siteSection];
            if (section.object !== false && section.object.hasOwnProperty('runOpeningTasks')) {
                await section.object.runOpeningTasks();
            }
        }
    },

    // Run starting tasks (slow tasks)
    runTasks: async function() {
        await wallets.runTasks();
        await stacks.runTasks();
        // Set status to waiting on completion
        await status.setState('waiting');
    },

    // Add listener for header links to allow section switch
    addHeaderLinksListener: function() {
        // Event listener for header links
        this.headerLinks.addEventListener("click", function(e) {
            for (let siteSection in logistics.siteSections) {
                if (siteSection === e.target.dataset.section) {
                    logistics.switchSection(siteSection);
                }
            }
        });
    },

    // Listener for title
    addPageTitleListener: function() {
        this.titleNode.addEventListener("click", function(e) {
            if (logistics.currentSection === 'stacks') {
                // Currently does nothing
            }
        });
    },

    // Delay function
    delayInMs: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
