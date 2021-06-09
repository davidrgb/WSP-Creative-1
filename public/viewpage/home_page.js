import * as Element from './element.js'

export function addEventListeners() {
    Element.menuHome.addEventListener('click', () => {
        home_page();
    });
}

export function home_page() {
    Element.root.innerHTML = '<h1>Home Page</h1>';
}