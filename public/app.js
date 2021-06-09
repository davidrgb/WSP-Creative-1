import * as Auth from './controller/auth.js'
import * as Home from './viewpage/home_page.js'
import * as About from './viewpage/about_page.js'
import * as Route from './controller/route.js'

Auth.addEventListeners();
Home.addEventListeners();
About.addEventListeners();

window.onload = () => {
    const pathname = window.location.pathname;
    const href = window.location.href;

    Route.routing(pathname, href);
}