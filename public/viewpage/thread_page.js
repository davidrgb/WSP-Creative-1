import * as Auth from '../controller/auth.js'
import * as Element from './element.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Util from './util.js'
import * as Constant from '../model/constant.js'
import {Reply} from '../model/reply.js'
import * as Route from '../controller/route.js'
import { Thread } from '../model/thread.js';

export function addViewButtonListeners() {
    const viewButtonForms = document.getElementsByClassName("thread-view-form");
    for (let i = 0; i < viewButtonForms.length; i++) {
        addViewFormSubmitEvent(viewButtonForms[i]);
    }
}

export function addViewFormSubmitEvent(form) {
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const button = e.target.getElementsByTagName('button')[0];
        const label = Util.disableButton(button);
        const threadId = e.target.threadId.value;
        history.pushState(null, null, Route.routePath.THREAD + '#' + threadId)
        //await Util.sleep(1000);
        await thread_page(threadId);
        Util.enableButton(button, label);
    });
}

export async function thread_page(threadId) {
    let currentReply
    if (!Auth.currentUser) {
        Element.root.innerHTML = '<h1>Protected Page</h1>'
        return
    }

    if (!threadId) {
        Util.info('Error', 'Thread Id is null; invalid access')
        return;
    }

    let thread
    let replies
    try {
        thread = await FirebaseController.getOneThread(threadId);
        if (!thread) {
            Util.info('Error', 'Thread does not exist');
            return;
        }
        replies = await FirebaseController.getReplyList(threadId);
        
    } catch (e) {
        if (Constant.DEV) console.log(e);
        Util.info('Error', JSON.stringify(e));
        return;
    }

    let html = `
        <div id="original-thread">
        </div>
    `

    if (Auth.currentUser.uid == thread.uid) {
        html += `
        <button class="btn btn-outline-info" data-bs-toggle="modal" data-bs-target="#modal-edit-thread" style="margin-top: 10px">Edit</button>
        <button id="button-delete-thread" class="btn btn-outline-danger" style="margin-top: 10px">Delete</button>
        `
    }

    html += '<hr>'

    html += '<div id="message-reply-body">'
    if (replies && replies.length > 0) {
        replies.forEach(r => {
            html += buildReplyView(r)
        });
    }
    html += '</div>'

    html += `
        <div>
            <textarea id="textarea-add-new-reply" placeholder="Reply to this thread"></textarea>
            <br>
            <button id="button-add-new-reply" class="btn btn-outline-info">Post reply</button>
        </div>
    `;

    Element.root.innerHTML = html;

    await updateOriginalThreadBody(thread);

    if (Auth.currentUser.uid == thread.uid) {
        let editThread;
        Element.formEditThread.addEventListener('submit', async e => {
            e.preventDefault();
    
            const button = Element.formEditThread.getElementsByTagName ('button')[0];
            const label = Util.disableButton(button);
    
            Element.formEditThreadError.title.innerHTML = '';
            Element.formEditThreadError.keywords.innerHTML = '';
            Element.formEditThreadError.content.innerHTML = '';
    
            const title = e.target.title.value.trim();
            const content = e.target.content.value;
            const keywords = e.target.keywords.value;
            const uid = thread.uid;
            const email = thread.email;
            const timestamp = Date.now();
            const keywordsArray = keywords.toLowerCase().match(/\S+/g);
            editThread = new Thread({
                uid, title, content, email, timestamp, keywordsArray, 
            });

            let valid = true;
            let error = editThread.validate_title();
            if (error) {
                valid = false;
                Element.formEditThreadError.title.innerHTML = error;
            }
            error = editThread.validate_keywords();
            if (error) {
                valid = false;
                Element.formEditThreadError.keywords.innerHTML = error;
            }
            error = editThread.validate_content();
            if (error) {
                valid = false;
                Element.formEditThreadError.content.innerHTML = error;
            }

            if (!valid) {
                Util.enableButton(button, label);
                return;
            }

            try {
                await FirebaseController.updateThread(thread, title, keywordsArray, content, timestamp);
                await updateOriginalThreadBody(editThread);
                e.target.reset();
    
                Util.info('Success', 'Thread has been edited', Element.modalEditThread);
            } catch (e) {
                if (Constant.DEV) console.log(e);
                Util.info('Failed to edit', JSON.stringify(e), Element.modalCreateThread);
            }
            Util.enableButton(button, label)
        })
        document.getElementById('button-delete-thread').addEventListener('click', async () => {
            await FirebaseController.deleteThread(thread)
        })
    }

    for (const reply of replies) {
        /*if (Auth.currentUser.uid == reply.uid) {
            let replyId = `button-edit-reply-${reply.uid}-${reply.timestamp}`
            document.getElementById(replyId).addEventListener('click', async () => {
                currentReply = reply;
                Element.formEditReply.addEventListener('submit', async e => {
                    e.preventDefault();
            
                    const button = Element.formEditReply.getElementsByTagName ('button')[0];
                    const label = Util.disableButton(button);
            
                    Element.formEditReplyError.content.innerHTML = '';

                    /*if (Auth.currentUser.uid == reply.uid) {
                        let originalTimestamp = reply.timestamp;
                    }
                    let originalTimestamp = currentReply.timestamp;
            
                    const threadId = currentReply.threadId;
                    const content = e.target.content.value;
                    const uid = currentReply.uid;
                    const email = currentReply.email;
                    const timestamp = Date.now();
                    const editReply = new Reply({
                        uid, email, timestamp, content, threadId,
                    });
        
                    let valid = true;
                    let error = editReply.validate_reply();
                    if (error) {
                        valid = false;
                        Element.formEditReplyError.content.innerHTML = error;
                    }
        
                    if (!valid) {
                        Util.enableButton(button, label);
                        return;
                    }
        
                    try {
                        await FirebaseController.updateReply(currentReply, content, timestamp);
                        await updateOriginalReplyBody(editReply, originalTimestamp);
                        e.target.reset();
            
                        Util.info('Success', 'Reply has been edited', Element.modalEditReply);
                    } catch (e) {
                        if (Constant.DEV) console.log(e);
                        Util.info('Failed to edit', JSON.stringify(e), Element.modalEditReply);
                    }
                    Util.enableButton(button, label)
                })
            })

            
        }*/
        addDeleteReplyListener(reply);
    }

    document.getElementById('button-add-new-reply').addEventListener('click', async () => {
        const content = document.getElementById('textarea-add-new-reply').value;
        const uid = Auth.currentUser.uid;
        const email = Auth.currentUser.email;
        const timestamp = Date.now();
        const reply = new Reply({
            uid, email, timestamp, content, threadId,
        });

        const button = document.getElementById('button-add-new-reply');
        const label = Util.disableButton(button);

        try {
            const docId = await FirebaseController.addReply(reply);
            reply.docId = docId;
        } catch (e) {
            if (Constant.DEV) console.log(e)
            Util.info('Error', JSON.stringify(e))
        }

        const replyTag = document.createElement('div')
        replyTag.innerHTML = buildReplyView(reply)
        document.getElementById('message-reply-body').appendChild(replyTag)
        document.getElementById('textarea-add-new-reply').value = ''

        Util.enableButton(button, label)

        await addDeleteReplyListener(reply);
    });
}

function buildReplyView(reply) {
    let html = `
        <div id="reply-${reply.uid}-${reply.timestamp}" class="border border-primary">
            <div class="bg-info text-white">
                Replied by ${reply.email} (At ${new Date(reply.timestamp).toString()})
            </div>
            ${reply.content}
        </div>
        <!--<hr>-->
    `
    if (Auth.currentUser.uid == reply.uid) {
        html += `
        <div id="buttons-${reply.uid}-${reply.timestamp}">
            <!--<button id="button-edit-reply-${reply.uid}-${reply.timestamp}" class="btn btn-outline-info" data-bs-toggle="modal" data-bs-target="#modal-edit-reply" style="margin-top: 10px">Edit</button>-->
            <button id="button-delete-reply-${reply.uid}-${reply.timestamp}" class="btn btn-outline-danger" style="margin-top: 10px">Delete</button>
        </div>
        `
    }
    html += "<hr>"
    return html;
}

export async function updateOriginalThreadBody(thread) {
    document.getElementById("original-thread").innerHTML = `
    <h4 class="bg-primary text-white">${thread.title}</h4>
        <div>${thread.email} (At ${new Date(thread.timestamp).toString()})</div>
        <div class="bg-secondary text-white">${thread.content}</div>
        <!--<hr>-->
    `
}

async function addDeleteReplyListener(reply) {
    if (Auth.currentUser.uid == reply.uid) {
        document.getElementById(`button-delete-reply-${reply.uid}-${reply.timestamp}`).addEventListener('click', async () => {
            await FirebaseController.deleteReply(reply);
        })
    }
}

/*export async function updateOriginalReplyBody(reply, originalTimestamp) {
    let replyId = `reply-${reply.uid}-${originalTimestamp}`
    document.getElementById(replyId).innerHTML = `
        <div class="bg-info text-white">
                    Replied by ${reply.email} (At ${new Date(reply.timestamp).toString()})
                </div>
                ${reply.content}
    `
}*/