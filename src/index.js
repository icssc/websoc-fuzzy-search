const fs = require('fs');
const pathToIndex = `${module.path}/index.json`;

let index = {};
let initialized = false;

function init() {
    index = JSON.parse(fs.readFileSync(pathToIndex).toString());
    Object.freeze(index);
    initialized = true;
}

function search(query, numResults = 10) {
    if (!initialized) {
        throw new Error('Index has not been initialized. Please run init() before executing a query.');
    }
    if (query.length < 2) {
        throw new Error('Query must be at least two characters long.');
    }
    let response = {};
    const keyArrMap = JSON.parse(
        JSON.stringify(
            Object.keys(index.keywords)
                .filter((x) => x.includes(query))
                .sort((a, b) => (a.length === b.length ? (a === b ? 0 : a < b ? -1 : 1) : a.length < b.length ? -1 : 1))
                .reduce((obj, val) => {
                    obj[val] = index.keywords[val];
                    return obj;
                }, {})
        )
    );
    if (!Object.keys(keyArrMap).length) {
        if (query.match(/^[a-z]+[0-9]+$/)) {
            query = query
                .toUpperCase()
                .replace(/\bCS/, 'COMPSCI')
                .replace(/\bICS/, 'I&CSCI')
                .replace(/\bINF/, 'IN4MATX');
            for (const key of Object.keys(index.objects).filter((x) => x.includes(query))) {
                if (Object.keys(response).length === numResults) return response;
                response[key] = index.objects[key];
            }
        }
    }
    for (const key of Object.keys(JSON.parse(JSON.stringify(keyArrMap)))) {
        if (key === query) {
            response = keyArrMap[key].slice(0, numResults - 1).reduce((obj, val) => {
                obj[val] = index.objects[val];
                return obj;
            }, {});
            for (const k of keyArrMap[key]) {
                if (Object.keys(response).length === numResults) return response;
                if (index.objects[k].type === 'DEPARTMENT') {
                    for (const course of Object.values(index.objects).filter((x) => x.metadata.department === k)) {
                        if (Object.keys(response).length === numResults) return response;
                        response[`${course.metadata.department.replace(' ', '')}${course.metadata.number}`] = course;
                    }
                }
            }
            delete keyArrMap[key];
            break;
        }
    }
    while (Object.values(keyArrMap).some((x) => x.length)) {
        for (let arr of Object.values(keyArrMap)) {
            if (Object.keys(response).length === numResults) return response;
            let key = arr.shift();
            if (key !== undefined) response[key] = index.objects[key];
        }
    }
    return response;
}

module.exports = { init, search };
