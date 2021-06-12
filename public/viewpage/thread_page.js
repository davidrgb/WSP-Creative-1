import * as Auth from '../controller/auth.js'
import * as Element from './element.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Util from './util.js'
import * as Constant from '../model/constant.js'
import {Reply} from '../model/reply.js'

export function addViewButtonListeners() {
    const viewButtonForms = document.getElementsByClassName("thread-view-form");
    for (let i = 0; i < viewButtonForms.length; i++) {
        addViewFormSubmitEvent(viewButtonForms[i]);
    }
}

export function addViewFormSubmitEvent(form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        const threadId = e.target.threadId.value;
        thread_page(threadId);
    });
}

async function thread_page(threadId) {
    if (!Auth.currentUser) {
        Element.root.innerHTML = '<h1>Protected Page</h1>'
        return
    }

    let thread
    try {
        thread = await FirebaseController.getOneThread(threadId);
        if (!thread) {
            Util.info('Error', 'Thread does not exist');
            return;
        }
        
    } catch (e) {
        if (Constant.DEV) console.log(e);
        Util.info('Error', JSON.stringify(e));
        return;
    }

    let html = `
        <h4 class="bg-primary text-white">${thread.title}</h4>
        <div>${thread.email} (At ${new Date(thread.timestamp).toString()})</div>
        <div class="bg-secondary text-white">${thread.content}</div>
        <hr>
    `;

    html += '<div id="message-reply-body">'
    html += '</div'

    html += `
        <div>
            <textarea id="textarea-add-new-reply" placeholder="Reply to this thread"></textarea>
            <br>
            <button id="button-add-new-reply" class="btn btn-outline-info">Post reply</button>
        </div>
    `;

    Element.root.innerHTML = html;

    document.getElementById('button-add-new-reply').addEventListener('click', async () => {
        const content = document.getElementById('textarea-add-new-reply').value;
        const uid = Auth.currentUser.uid;
        const email = Auth.currentUser.email;
        const timestamp = Date.now();
        const reply = new Reply({
            uid, email, timestamp, content, threadId,
        });

        try {
            const docId = await FirebaseController.addReply(reply);
            reply.docId = docId;
        } catch (e) {
            if (Constant.DEV) console.log(e)
            Util.info('Error', JSON.stringify(e))
        }
    });
}