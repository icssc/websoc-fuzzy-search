// imports
const fs = require('fs');
const os = require('os');
const path = require('path');
// hack from node-fetch documentation so we can still use 3.x
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const pluralize = require('pluralize');

// input-output configuration
const localPrefix = path.normalize(`${module.path}/../cache/`);
const remotePrefix = 'https://raw.githubusercontent.com/icssc/peterportal-public-api/master/cache/';
const files = {
    courses: 'parsed_courses_cache.json',
    instructors: 'parsed_professor_cache.json',
};
const outputFile = path.normalize(`${module.path}/../src/index.json`);

// Roman numeral map
// Stops at 8 because that's the highest Roman numeral encountered in the cache (as of 2022-04-08)
const romans = {
    i: '1',
    ii: '2',
    iii: '3',
    iv: '4',
    v: '5',
    vi: '6',
    vii: '7',
    viii: '8',
};

// words to filter out
const toFilter = ['', 'a', 'o', 'an', 'at', 'in', 'it', 'of', 'on', 'to', 'and', 'for', 'the'];

// convert titles to keywords
function keywordize(s) {
    return s
        .toLowerCase()
        .replaceAll('u.s.', 'us')
        .replaceAll(/[&'(),\-/:]/g, ' ')
        .split(' ')
        .map((x) => (Object.keys(romans).includes(x) ? romans[x] : x))
        .map((x) => (x === 'us' || x === 'we' ? x : pluralize(x, 1)))
        .filter((x) => !toFilter.includes(x));
}

// convert proper names to lowercase, strip dashes so they can be split, and filter out middle initials
function keywordizeName(s) {
    return s
        .toLowerCase()
        .replace('-', ' ')
        .split(' ')
        .filter((name) => name.length > 1 && !name.includes('.'));
}

// add object to set if keyword exists, create new set if not
function associate(d, k, o) {
    Object.keys(d).includes(k) ? d[k].add(o) : (d[k] = new Set([o]));
}

// parse the data into the format we want, and write it to the output
function parseAndWriteData(d) {
    console.log('Parsing data...');
    // GE categories
    let parsedData = {
        aliases: {},
        keywords: {},
        objects: {
            'GE-1A': {
                name: 'Lower Division Writing',
            },

            'GE-1B': {
                name: 'Upper Division Writing',
            },

            'GE-2': {
                name: 'Science and Technology',
            },

            'GE-3': {
                name: 'Social and Behavioral Sciences',
            },

            'GE-4': {
                name: 'Arts and Humanities',
            },

            'GE-5A': {
                name: 'Quantitative Literacy',
            },

            'GE-5B': {
                name: 'Formal Reasoning',
            },

            'GE-6': {
                name: 'Language other than English',
            },

            'GE-7': {
                name: 'Multicultural Studies',
            },

            'GE-8': {
                name: 'International/Global Issues',
            },
        },
    };

    for (const [key, value] of Object.entries(parsedData.objects)) {
        parsedData.objects[key].type = 'GE_CATEGORY';
        parsedData.objects[key].metadata = {};
        for (const keyword of [
            key.toLowerCase(),
            key.toLowerCase().replace('-', ''),
            ...keywordize(key),
            ...keywordize(value.name),
        ]) {
            associate(parsedData.keywords, keyword, key);
        }
    }

    // departments and courses
    for (const [key, value] of Object.entries(d.courses)) {
        if (!Object.keys(parsedData.objects).includes(value.department)) {
            parsedData.objects[value.department] = {
                type: 'DEPARTMENT',
                name: value.department_name,
                metadata: {},
            };
            for (const alias of [...value.department_alias.map((x) => x.toLowerCase())]) {
                parsedData.aliases[alias] = value.department.replace(' ', '');
                associate(parsedData.keywords, alias, value.department);
            }
            for (const keyword of [value.department.toLowerCase(), ...keywordize(value.department_name)]) {
                associate(parsedData.keywords, keyword, value.department);
            }
        }
        parsedData.objects[key] = {
            type: 'COURSE',
            name: value.title,
            metadata: {
                department: value.department,
                number: value.number,
            },
        };
        for (const keyword of keywordize(value.title)) {
            associate(parsedData.keywords, keyword, key);
        }
    }

    // instructors
    for (const instructor of Object.values(d.instructors)) {
        parsedData.objects[instructor.shortened_name] = {
            type: 'INSTRUCTOR',
            name: instructor.name,
            metadata: {},
        };
        for (const keyword of keywordizeName(instructor.name)) {
            associate(parsedData.keywords, keyword, instructor.shortened_name);
        }
    }

    for (const [key, value] of Object.entries(parsedData.keywords)) {
        parsedData.keywords[key] = [...value];
    }
    console.log('Writing parsed data...');
    fs.writeFileSync(`${outputFile}`, JSON.stringify(parsedData));
    console.log(`Wrote index to file ${outputFile}`);
    console.timeEnd('Index built in');
    process.exit(0);
}

// fetch the latest cached data from remote if necessary
async function verifyFiles() {
    console.time('Index built in');
    try {
        fs.mkdirSync(localPrefix);
    } catch (e) {
        // no idea why errnos returned by fs are negative
        if (!(-e?.errno === os.constants.errno.EEXIST)) throw e;
    }
    let cachedData = {};
    for (const [dataType, fileName] of Object.entries(files)) {
        const fqPath = path.join(localPrefix, fileName);
        try {
            cachedData[dataType] = JSON.parse(fs.readFileSync(`${fqPath}`).toString());
            console.log(`${fqPath} is a valid JSON file, reading into memory and skipping`);
        } catch (e) {
            if (e instanceof SyntaxError || -e?.errno === os.constants.errno.ENOENT) {
                console.log(`Malformed or empty JSON file ${fqPath} detected locally, downloading from remote`);
                const response = await fetch(`${remotePrefix}${fileName}`);
                const data = await response.json();
                cachedData[dataType] = data;
                fs.writeFileSync(`${fqPath}`, JSON.stringify(data));
                console.log(`File ${fqPath} written successfully`);
            } else {
                throw e;
            }
        }
    }
    return cachedData;
}

// entry point of sorts
verifyFiles().then((response) => parseAndWriteData(response));
