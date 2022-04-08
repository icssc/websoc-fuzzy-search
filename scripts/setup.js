// TODO: Actually filter out all of the special characters and determiners, prepositions, conjunctions, etc.
// TODO: Singularize keywords (currently 'science' and 'sciences' are two separate keywords)

const fs = require('fs');
const os = require('os');
// hack from node-fetch documentation so we can still use 3.x
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const localPrefix = 'cache/';
const remotePrefix = 'https://raw.githubusercontent.com/icssc/peterportal-public-api/master/cache/';
const files = {
    courses: 'parsed_courses_cache.json',
    instructors: 'parsed_professor_cache.json',
};
const outputFile = 'index.json';

// convert titles etc. to lowercase, strip connectives/prepositions, and filter out empty strings
function keywordize(s) {
    return s
        .toLowerCase()
        .replaceAll(/\band\b|\bof\b|[&/-]/g, ' ')
        .split(' ')
        .filter((x) => x);
}

// convert proper names to lowercase, strip dashes so they can be split, and filter out middle initials
function keywordizeName(s) {
    return s
        .toLowerCase()
        .replace('-', ' ')
        .split(' ')
        .filter((name) => name.length > 1);
}

// add object to set if keyword exists, create new set if not
function associate(d, k, o) {
    Object.keys(d).includes(k) ? d[k].add(o) : (d[k] = new Set([o]));
}

// parse the data into the format we want, and write it to the output
function parseAndWriteData(d) {
    // GE categories
    let parsedData = {
        keywords: {},
        objects: {
            'GE-1A': {
                type: 'GE_CATEGORY',
                name: 'Lower Division Writing',
            },

            'GE-1B': {
                type: 'GE_CATEGORY',
                name: 'Upper Division Writing',
            },

            'GE-2': {
                type: 'GE_CATEGORY',
                name: 'Science and Technology',
            },

            'GE-3': {
                type: 'GE_CATEGORY',
                name: 'Social and Behavioral Sciences',
            },

            'GE-4': {
                type: 'GE_CATEGORY',
                name: 'Arts and Humanities',
            },

            'GE-5A': {
                type: 'GE_CATEGORY',
                name: 'Quantitative Literacy',
            },

            'GE-5B': {
                type: 'GE_CATEGORY',
                name: 'Formal Reasoning',
            },

            'GE-6': {
                type: 'GE_CATEGORY',
                name: 'Language other than English',
            },

            'GE-7': {
                type: 'GE_CATEGORY',
                name: 'Multicultural Studies',
            },

            'GE-8': {
                type: 'GE_CATEGORY',
                name: 'International/Global Issues',
            },
        },
    };

    for (const [key, value] of Object.entries(parsedData.objects)) {
        for (const keyword of keywordize(value.name)) {
            associate(parsedData.keywords, keyword, key);
        }
    }

    // departments
    for (const value of Object.values(d.courses)) {
        if (Object.keys(parsedData.objects).includes(value.department)) continue;
        parsedData.objects[value.department] = {
            type: 'DEPARTMENT',
            name: value.department_name,
        };
        for (const keyword of [
            ...value.department_alias.map((x) => x.toLowerCase()),
            ...keywordize(value.department_name),
        ]) {
            associate(parsedData.keywords, keyword, value.department);
        }
    }

    // courses
    for (const [key, value] of Object.entries(d.courses)) {
        parsedData.objects[key] = {
            type: 'COURSE',
            department: value.department,
            number: value.number,
        };
        for (const keyword of keywordize(value.title)) {
            associate(parsedData.keywords, keyword, key);
        }
    }

    // instructors
    for (const instructor of Object.values(d.instructors)) {
        parsedData.objects[instructor.shortened_name] = {
            type: 'PROFESSOR',
            name: instructor.name,
        };
        for (const keyword of keywordizeName(instructor.name)) {
            associate(parsedData.keywords, keyword, instructor.shortened_name);
        }
    }

    for (const [key, value] of Object.entries(parsedData.keywords)) {
        parsedData.keywords[key] = [...value];
    }
    fs.writeFileSync(`${localPrefix}${outputFile}`, JSON.stringify(parsedData));
    console.log(`Wrote index to file ${outputFile}`);
    process.exit(0);
}

// fetch the latest cached data from remote if necessary
async function verifyFiles() {
    try {
        fs.mkdirSync(localPrefix);
    } catch (e) {
        // no idea why errnos returned by fs are negative
        if (!(e.errno && Math.abs(e.errno) === os.constants.errno.EEXIST)) throw e;
    }
    let cachedData = {};
    for (const [dataType, fileName] of Object.entries(files)) {
        try {
            cachedData[dataType] = JSON.parse(fs.readFileSync(`${localPrefix}${fileName}`).toString());
            console.log(`${fileName} is a valid JSON file, reading into memory and skipping`);
        } catch (e) {
            if (e instanceof SyntaxError || (e.errno && Math.abs(e.errno) === os.constants.errno.ENOENT)) {
                console.log(`Malformed or empty JSON file ${fileName} detected locally, downloading from remote`);
                const response = await fetch(`${remotePrefix}${fileName}`);
                const data = await response.json();
                cachedData[dataType] = data;
                fs.writeFileSync(`${localPrefix}${fileName}`, JSON.stringify(data));
                console.log(`File ${fileName} written successfully`);
            } else {
                throw e;
            }
        }
    }
    return cachedData;
}

// entry point of sorts
verifyFiles().then((response) => parseAndWriteData(response));
