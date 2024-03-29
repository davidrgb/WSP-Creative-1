import * as Element from './element.js'
import * as Route from '../controller/route.js'
import * as Auth from '../controller/auth.js'
import { Thread } from '../model/thread.js';
import * as Constant from '../model/constant.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Util from './util.js'
import * as ThreadPage from './thread_page.js'

export function addEventListeners() {
    Element.menuHome.addEventListener('click', async () => {
        history.pushState(null, null, Route.routePath.HOME);
        const label = Util.disableButton(Element.menuHome);
        await home_page();
        //await Util.sleep(1000);
        Util.enableButton(Element.menuHome, label);
    });

    Element.formCreateThread.addEventListener('submit', async e => {
        e.preventDefault();

        const button = Element.formCreateThread.getElementsByTagName('button')[0];
        const label = Util.disableButton(button);
        //await Util.sleep(1000);

        Element.formCreateThreadError.title.innerHTML = '';
        Element.formCreateThreadError.keywords.innerHTML = '';
        Element.formCreateThreadError.content.innerHTML = '';

        const title = e.target.title.value.trim();
        const content = e.target.content.value;
        const keywords = e.target.keywords.value;
        const uid = Auth.currentUser.uid;
        const email = Auth.currentUser.email;
        const timestamp = Date.now();
        const keywordsArray = keywords.toLowerCase().match(/\S+/g);
        const thread = new Thread({
            uid, title, content, email, timestamp, keywordsArray, 
        });

        let valid = true;
        let error = thread.validate_title();
        if (error) {
            valid = false;
            Element.formCreateThreadError.title.innerHTML = error;
        }
        error = thread.validate_keywords();
        if (error) {
            valid = false;
            Element.formCreateThreadError.keywords.innerHTML = error;
        }
        error = thread.validate_content();
        if (error) {
            valid = false;
            Element.formCreateThreadError.content.innerHTML = error;
        }

        if (!valid) {
            Util.enableButton(button, label);
            return;
        }

        try {
            const docId = await FirebaseController.addThread(thread);
            thread.docId = docId;
            //home_page();
            const trTag = document.createElement('tr');
            trTag.innerHTML = buildThreadView(thread);
            const threadTableBody = document.getElementById('thread-table-body');
            threadTableBody.prepend(trTag);
            const viewForms = document.getElementsByClassName('thread-view-form');
            ThreadPage.addViewFormSubmitEvent(viewForms[0]);
            const noThreadFound = document.getElementById('no-thread-found');
            if (noThreadFound)
                noThreadFound.innerHTML = '';
            e.target.reset();

            Util.info('Success', 'A new thread has been added', Element.modalCreateThread);
        } catch (e) {
            if (Constant.DEV) console.log(e);
            Util.info('Failed to add', JSON.stringify(e), Element.modalCreateThread);
        }
        Util.enableButton(button, label)
    })
}

export async function home_page() {
    if (!Auth.currentUser) {
        Element.root.innerHTML = '<h1>Access not allowed.</h1>'
        return;
    }

    let threadList;
    try {
        threadList = await FirebaseController.getThreadList();
    } catch (e) {
        if (Constant.DEV) console.log(e);
        Util.info('Error to get thread list', JSON. stringify(e));
        return;
    }

    buildHomeScreen(threadList);

}

export function buildHomeScreen(threadList) {
    let html = ``
    html += `
        <button class="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#modal-create-thread"
        >+ New Thread</button>
    `;

    html += `
    <table class="table table-striped">
    <thead>
        <tr>
        <th scope="col">Action</th>
        <th scope="col">Title</th>
        <th scope="col">Keywords</th>
        <th scope="col">Posted By</th>
        <th scope="col">Content</th>
        <th scope="col">Posted At</th>
        </tr>
    </thead>
    <tbody id="thread-table-body">
    `

    threadList.forEach(thread => {
        html += `
            <tr>
            ${buildThreadView(thread)}
            </tr>
        `
    });

    html += '</tbody></table>'
    Element.root.innerHTML = html;

    if (threadList.length == 0) {
        html += '<h4 id="no-thread-found">No Threads Found</h4>'
        Element.root.innerHTML = html;
        return;
    }

    ThreadPage.addViewButtonListeners();
}

function buildThreadView(thread) {
    return `
        <td>
            <form method="post" class="thread-view-form">
                <input type="hidden" name="threadId" value="${thread.docId}">
                <button type="submit" class="btn btn-outline-primary">View</button>
            </form>
        </td>
        <td>${thread.title}</td>
        <td>${!thread.keywordsArray || !Array.isArray(thread.keywordsArray) ? ' ' : thread.keywordsArray.join(' ')}</td>
        <td>${thread.email}</td>
        <td>${thread.content}</td>
        <td>${new Date(thread.timestamp).toString()}</td>
    `
}