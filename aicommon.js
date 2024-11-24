import fs from "fs";
import path from "path";

export function loadFilesWithExtension(dirPath, extension) {
    const results = [];

    // Read directory contents
    function readDirectory(currentPath) {
        console.info('Scanning directory ' + currentPath);
        const files = fs.readdirSync(currentPath);

        for (const file of files) {
            const filePath = path.join(currentPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Recursively process subdirectories
                readDirectory(filePath);
            } else if (path.extname(file).toLowerCase() === extension.toLowerCase()) {
                // Load file content if extension matches
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    results.push({
                        path: filePath,
                        content: content
                    });
                } catch (error) {
                    console.error(`Error reading file ${filePath}:`, error);
                }
            }
        }
    }

    // Start recursive processing
    readDirectory(dirPath);
    return results;
}

/**
 * Extracts and parses TOML front matter from an AsciiDoctor file
 * @param {string} content - The content of the AsciiDoctor file
 * @returns {Object} Object containing parsed frontMatter and remaining content
 */
export function parseAsciidocFrontMatter(content) {
    const frontMatterRegex = /^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+\r?\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);

    if (!match) {
        return {
            frontMatter: {},
            content: content.trim()
        };
    }

    const [, frontMatterStr, remainingContent] = match;

    try {
        const frontMatter = parseTOML(frontMatterStr);
        return {
            frontMatter,
            content: remainingContent.trim()
        };
    } catch (error) {
        throw new Error(`Error parsing TOML front matter: ${error.message}`);
    }
}

/**
 * Parses TOML-formatted string into JavaScript object
 * @param {string} toml - TOML string to parse
 * @returns {Object} Parsed TOML as JavaScript object
 */
function parseTOML(toml) {
    const result = {};
    let currentTable = result;
    let currentTablePath = [];

    const lines = toml.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines and comments
        if (!line || line.startsWith('#')) continue;

        // Handle table headers
        if (line.startsWith('[') && line.endsWith(']')) {
            const tableName = line.slice(1, -1).trim();
            currentTablePath = tableName.split('.');

            // Create nested objects for the table path
            let current = result;
            currentTablePath.forEach((key, index) => {
                if (index === currentTablePath.length - 1) {
                    current[key] = current[key] || {};
                    currentTable = current[key];
                } else {
                    current[key] = current[key] || {};
                    current = current[key];
                }
            });
            continue;
        }

        // Handle key-value pairs
        const equalIndex = line.indexOf('=');
        if (equalIndex === -1) continue;

        const key = line.slice(0, equalIndex).trim();
        let value = line.slice(equalIndex + 1).trim();

        // Parse the value
        try {
            value = parseTOMLValue(value, lines, i);
            // If parseTOMLValue returns an object with nextIndex, update the line counter
            if (value && typeof value === 'object' && 'nextIndex' in value) {
                i = value.nextIndex;
                value = value.value;
            }
        } catch (error) {
            throw new Error(`Error parsing value at line ${i + 1}: ${error.message}`);
        }

        currentTable[key] = value;
    }

    return result;
}

/**
 * Parses a TOML value, handling various data types
 * @param {string} value - The value string to parse
 * @param {string[]} lines - All lines of the TOML content
 * @param {number} currentIndex - Current line index
 * @returns {any} Parsed value
 */
function parseTOMLValue(value, lines, currentIndex) {
    // Handle strings
    if (value.startsWith('"') && value.endsWith('"')) {
        return value.slice(1, -1).replace(/\\"/g, '"');
    }

    // Handle multi-line strings
    if (value.startsWith('"""')) {
        return parseMultilineString(lines, currentIndex);
    }

    // Handle arrays
    if (value.startsWith('[')) {
        return parseArray(value);
    }

    // Handle booleans
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Handle dates
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date;
    }

    // Handle numbers
    if (!isNaN(value)) {
        // Check if it's an integer or float
        return value.includes('.') ? parseFloat(value) : parseInt(value, 10);
    }

    return value;
}

/**
 * Parses a TOML array
 * @param {string} arrayStr - The array string to parse
 * @returns {Array} Parsed array
 */
function parseArray(arrayStr) {
    // Remove brackets and split by commas
    const items = arrayStr.slice(1, -1).split(',');
    return items.map(item => {
        const trimmed = item.trim();
        if (!trimmed) return undefined;
        return parseTOMLValue(trimmed);
    }).filter(item => item !== undefined);
}

/**
 * Parses a multi-line string
 * @param {string[]} lines - All lines of the TOML content
 * @param {number} startIndex - Starting line index
 * @returns {Object} Object containing the parsed value and next index
 */
function parseMultilineString(lines, startIndex) {
    let result = '';
    let currentIndex = startIndex;
    let foundEnd = false;

    // Skip the first line with """
    currentIndex++;

    while (currentIndex < lines.length) {
        const line = lines[currentIndex].trim();
        if (line.endsWith('"""')) {
            foundEnd = true;
            result += line.slice(0, -3);
            break;
        }
        result += lines[currentIndex] + '\n';
        currentIndex++;
    }

    if (!foundEnd) {
        throw new Error('Unterminated multi-line string');
    }

    return {
        value: result.trim(),
        nextIndex: currentIndex
    };
}

