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

// regex to match department and/or course number without space
const matchCourseNum = /(?<department>([ &/a-z]{1,2}4?[ &/a-z]*)?)(?<number>[a-z]?\d{1,3}[a-z]{0,4})/;

// regex to tokenize a course number into its prefix/numeral/suffix
const tokenizeCourseNum = /(?<prefix>[A-Z]?)(?<numeral>\d{1,3})(?<suffix>[A-Z]{0,4})/;

// comparation function for sorting responses
function compare(a, b) {
    // compare object types in the order GE->department->course->instructor
    let aType = index.objects[a].type;
    let bType = index.objects[b].type;
    if (aType !== bType) return Math.sign(types[bType] - types[aType]);
    // special ordering for course numbers that checks in the order department->numeral->prefix->suffix
    if (aType === 'COURSE') {
        const aDept = index.objects[a].metadata.department;
        const bDept = index.objects[b].metadata.department;
        if (aDept === bDept) {
            const [aPre, aNum, aSuf] = Object.values(index.objects[a].metadata.number.match(tokenizeCourseNum).groups);
            const [bPre, bNum, bSuf] = Object.values(index.objects[b].metadata.number.match(tokenizeCourseNum).groups);
            if (aNum === bNum) {
                return aPre === bPre ? lexOrd(aSuf, bSuf) : lexOrd(aPre, bPre);
            }
            return lexOrd(parseInt(aNum), parseInt(bNum));
        }
        return lexOrd(aDept, bDept);
    }
    // standard lexicographical ordering for everything else
    return lexOrd(a, b);
}

// given an array of keys, return a mapping of those keys to their results in index.objects
function expandResponse(response, numResults, type) {
    response = type ? response.filter((x) => type.includes(index.objects[x].type)) : response;
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

// search on a single course number, with or without department
function searchCourseNumber(courseNum) {
    let response = [];
    const matchGroups = courseNum.match(matchCourseNum).groups;
    // next check if a department was matched
    if (matchGroups.department) {
        for (const [alias, department] of Object.entries(index.aliases)) {
            for (const dept of department) {
                courseNum = courseNum.replace(
                    new RegExp(`^${alias}(?=[bcdehmnps]?\\d{1,3}[a-z]{0,4})`),
                    dept.toString()
                );
            }
        }
        response.push(
            ...Object.keys(index.objects).filter((x) => x.includes(courseNum.replace(' ', '').toUpperCase()))
        );
        // if not then we're dealing with a bare course number without the department
    } else {
        response.push(
            ...Object.keys(index.objects).filter(
                (x) =>
                    index.objects[x].metadata.number &&
                    index.objects[x].metadata.number.includes(matchGroups.number.toUpperCase())
            )
        );
    }
    return [...new Set(response)];
}

// search on a single keyword
function searchKeyword(keyword, numResults) {
    keyword = keyword.toLowerCase();
    let response = [];
    // match all keywords
    const keyArrMap = Object.keys(index.keywords)
        .filter((x) => x.includes(keyword))
        .sort((a, b) => (a.length === b.length ? lexOrd(a, b) : lexOrd(a.length, b.length)))
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
                    (keyword.toUpperCase() === key || (index.aliases[keyword] && index.aliases[keyword].includes(key)))
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
    return [...new Set(response)];
}

// perform a search
export default function search(query, numResults, type) {
    query = query.toLowerCase();
    numResults = numResults ?? Number.MAX_SAFE_INTEGER;
    // if at least one course number-like object (CNLO) was matched, search only for course numbers
    // match with the regex without space first since matches on all course numbers
    if (query.match(matchCourseNum)) {
        const courseNums = query
            .split(',')
            .map((x) => x.replaceAll(' ', ''))
            .filter((x) => x);
        // if only one CNLO was matched, just run a single query
        if (courseNums.length === 1) {
            return expandResponse(searchCourseNumber(courseNums[0]), numResults, type);
        }
        // for every CNLO matched, make sure it is a fully-qualified course number (FQCN);
        // that is, one that has a department or department alias and a number
        // (cs161 is a FQCN, while the numeral 161 is not)
        // if a bare numeral is found, assume that the last department or department alias applies
        // to that numeral, and then normalized
        // if all numbers given are bare numerals, then perform no normalization
        let lastDept = courseNums[0].match(matchCourseNum).groups.department;
        for (const i in courseNums) {
            const currDept = courseNums[i].match(matchCourseNum).groups.department;
            if (!currDept) {
                courseNums[i] = courseNums[i].replace(matchCourseNum, `${lastDept}$<number>`);
            } else if (currDept !== lastDept) {
                lastDept = currDept;
            }
        }
        return expandResponse(
            [...new Set(courseNums.map((courseNum) => searchCourseNumber(courseNum)).flat())],
            numResults,
            type
        );
    }
    const keywords = query.split(' ');
    // if only one keyword was given, just run a single query
    if (keywords.length === 1) {
        return expandResponse(searchKeyword(keywords[0], numResults), numResults, type);
    }
    // take the results of all queries and return their intersection
    return expandResponse(
        keywords
            .map((keyword) => searchKeyword(keyword, numResults))
            .reduce((array, response) => array.filter((x) => response.includes(x))),
        numResults,
        type
    );
}
