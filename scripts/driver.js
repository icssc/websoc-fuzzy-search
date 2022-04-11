import promptSync from 'prompt-sync';
import * as search from '../src/index.js';
const prompt = promptSync({ sigint: true, eot: true });
console.time('Initialization took');
search.init().then(() => {
    console.timeEnd('Initialization took');
    while (true) {
        try {
            let q = prompt('Enter a query: ');
            console.time('Query took');
            console.log(search.search(q));
            console.timeEnd('Query took');
        } catch (e) {
            console.error(e);
        }
    }
});
