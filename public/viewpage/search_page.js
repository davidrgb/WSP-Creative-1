import * as Element from './element.js'
import * as Util from './util.js'
import * as Auth from '../controller/auth.js'

export function addEventListeners() {
    Element.formSearch.addEventListener('submit', e => {
        e.preventDefault();
        const searchKeys = e.target.searchKeys.value.trim();
        if (searchKeys.length == 0) {
            Util.info('Error', "No search keys");
            return;
        }
        const searchKeysInArray = searchKeys.toLowerCase().match(/\S+/g);
        const joinedSearchKeys = searchKeysInArray.join('+')
        search_page(joinedSearchKeys);
    });
}

export async function search_page(joinedSearchKeys) {
    if (!joinedSearchKeys) {
        Util.info('Error', 'No search keys')
        return
    }

    const searchKeysInArray = joinedSearchKeys.split('+');
    if (searchKeysInArray.length == 0) {
        Util.info('Error', 'No search keys')
        return
    }

    if (!Auth.currentUser) {
        Element.root.innerHTML = '<h1>Protected Page</h1>'
    }
}