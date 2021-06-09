import * as Element from './element.js'
import * as Route from '../controller/route.js'

export function addEventListeners() {
    Element.menuHome.addEventListener('click', () => {
        history.pushState(null, null, Route.routePath.HOME);
        home_page();
    });
}

export function home_page() {
    Element.root.innerHTML = '<h1>Home Page</h1>';
}