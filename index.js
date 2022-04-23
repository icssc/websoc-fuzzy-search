// imports
import { default as index } from './index.json';

// constants
// mapping of types to numbers for compare
const types = {
    GE_CATEGORY: 4,
    DEPARTMENT: 3,
    COURSE: 2,
    INSTRUCTOR: 1,
};

// regex to tokenize a course number into its prefix/number/suffix
const tokenizeCourseNum = /(?<prefix>[A-Z]?)(?<number>\d{1,3})(?<suffix>[A-Z]{0,4})/;

// comparation function for sorting responses
function compare(a, b) {
    // compare object types in the order GE->department->course->instructor
    let aType = index.objects[a].type;
    let bType = index.objects[b].type;
    if (aType !== bType) return Math.sign(types[bType] - types[aType]);
    // special ordering for course numbers that checks in the order number->prefix->suffix
    if (aType === 'COURSE') {
        const [preA, numA, sufA] = Object.values(index.objects[a].metadata.number.match(tokenizeCourseNum).groups);
        const [preB, numB, sufB] = Object.values(index.objects[b].metadata.number.match(tokenizeCourseNum).groups);
        if (numA === numB) {
            return preA === preB ? lexOrd(sufA, sufB) : lexOrd(preA, preB);
        }
        return lexOrd(parseInt(numA), parseInt(numB))
    }
    // standard lexicographical ordering for everything else
    return lexOrd(a, b)
}

// given an array of keys, return a mapping of those keys to their results in index.objects
function expandResponse(response, numResults, mask) {
    response = mask.length ? response.filter((x) => !mask.includes(index.objects[x].type)) : response;
    return response
        .sort(compare)
        .slice(0, numResults - 1)
        .reduce((obj, key) => {
            obj[key] = index.objects[key];
            return obj;
        }, {});
}

// shorthand for the lexicographical ordering ternary
function lexOrd(a, b) {
    return a === b ? 0 : a < b ? -1 : 1;
}

// search on a single keyword
function searchSingle(keyword, numResults) {
    keyword = keyword.toLowerCase();
    let response = [];
    // match course codes first if the query resembles a course number (with or without the department code)
    if (keyword.match(/^\d+[a-z]*$/)) {
        response.push(
            ...Object.keys(index.objects).filter(
                (x) =>
                    index.objects[x].metadata.number && index.objects[x].metadata.number.includes(keyword.toUpperCase())
            )
        );
    } else if (keyword.match(/^[a-z]+\d+[a-z]*$/)) {
        keyword = keyword.replace(' ', '');
        for (const [alias, department] of Object.entries(index.aliases)) {
            keyword = keyword.replace(new RegExp(`^${alias}`), department.toString());
        }
        response.push(...Object.keys(index.objects).filter((x) => x.includes(keyword.replace(' ', '').toUpperCase())));
    }
    // match all keywords
    const keyArrMap = Object.keys(index.keywords)
        .filter((x) => x.includes(keyword))
        .sort((a, b) => (a.length === b.length ? (a === b ? 0 : a < b ? -1 : 1) : a.length < b.length ? -1 : 1))
        .reduce((obj, val) => {
            obj[val] = index.keywords[val];
            return obj;
        }, {});
    // prioritize exact keyword matches
    let exactDeptMatch = false;
    for (const kw of Object.keys(keyArrMap)) {
        if (kw === keyword) {
            response.push(...keyArrMap[kw]);
            for (const key of keyArrMap[kw]) {
                // prioritize exact department matches
                if (
                    index.objects[key].type === 'DEPARTMENT' &&
                    (keyword.toUpperCase() === key || (index.aliases[keyword] && index.aliases[keyword] === key))
                ) {
                    response.push(
                        ...Object.keys(index.objects).filter((x) => index.objects[x].metadata.department === key)
                    );
                    exactDeptMatch = true;
                }
            }
            delete keyArrMap[kw];
            break;
        }
    }
    // add everything else if no exact department match was found
    if (!exactDeptMatch) response.push(...Object.values(keyArrMap).flat());
    // if there are bare departments and not enough responses, add the courses from that department
    for (const key of response) {
        if (index.objects[key].type === 'DEPARTMENT' && response.length <= numResults) {
            response.push(...Object.keys(index.objects).filter((x) => index.objects[x].metadata.department === key));
        }
    }
    return [...new Set([...response])];
}

// perform a search
export default function search(query, numResults = 10, mask = []) {
    query = query.toLowerCase();
    // match course code with space, remove the space if detected
    if (query.match(/([a-z]+) (\d+[a-z]*)/)) {
        query = query.replace(/([a-z]+) (\d+[a-z]*)/, '$1$2');
    }
    const keywords = query.split(' ');
    if (keywords.some((x) => x.length < 2)) {
        throw new TypeError('Each keyword of the query must be at least two characters long.');
    }
    // if only one keyword was given, just run a single query
    if (keywords.length === 1) {
        return expandResponse(searchSingle(query, numResults), numResults, mask);
    }
    // take the results of all queries and return their intersection
    return expandResponse(
        keywords
            .map((keyword) => searchSingle(keyword, numResults))
            .reduce((array, response) => array.filter((x) => response.includes(x))),
        numResults,
        mask
    );
}
