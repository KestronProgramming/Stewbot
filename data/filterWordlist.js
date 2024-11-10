// Import the 'fs' module for reading and writing files
const fs = require('fs');

// Load filter and wordlist files
const filterFilePath = 'filter.txt';
const wordlistFilePath = 'wordlist.txt';
const outputFilePath = 'wordlist.txt';

// Read files and remove words in filter from wordlist
fs.readFile(filterFilePath, 'utf8', (err, filterData) => {
    if (err) throw err;

    const filterWords = new Set(filterData.split(/\r?\n/)); // Store filter words in a Set for fast lookup

    fs.readFile(wordlistFilePath, 'utf8', (err, wordlistData) => {
        if (err) throw err;

        const filteredWords = wordlistData
            .split(/\r?\n/)
            .filter(word => !filterWords.has(word)) // Exclude words present in filterWords
            .join('\n');

        // Write the filtered words to the output file
        fs.writeFile(outputFilePath, filteredWords, 'utf8', (err) => {
            if (err) throw err;
            console.log(`Filtered word list saved to ${outputFilePath}`);
        });
    });
});
