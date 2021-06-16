import * as Constant from '../model/constant.js'
import { Reply } from '../model/reply.js';
import { Thread } from '../model/thread.js';
import * as Element from '../viewpage/element.js';
import * as ThreadPage from '../viewpage/thread_page.js';
import * as Auth from '../controller/auth.js';


export async function signIn(email, password) {
    await firebase.auth().signInWithEmailAndPassword(email, password);
}

export async function signOut() {
    await firebase.auth().signOut();
}

export async function addThread(thread) {
    const ref = await firebase.firestore()
            .collection(Constant.collectionNames.THREADS)
            .add(thread.serialize());
    return ref.id;
}

export async function getThreadList() {
    let threadList = []
    const snapShot = await firebase.firestore()
        .collection(Constant.collectionNames.THREADS)
        .orderBy('timestamp', 'desc')
        .get();

    snapShot.forEach(doc => {
        const t = new Thread(doc.data());
        t.docId = doc.id
        threadList.push(t);
    });
    return threadList;
}

export async function getOneThread(threadId) {
    const ref = await firebase.firestore()
            .collection(Constant.collectionNames.THREADS)
            .doc(threadId)
            .get();
    if (!ref.exists) return null;
    const t = new Thread(ref.data());
    t.docId = threadId;
    return t;
}

export async function addReply(reply) {
    const ref = await firebase.firestore()
                .collection(Constant.collectionNames.REPLIES)
                .add(reply.serialize());
    return ref.id;
}

export async function getReplyList(threadId) {
    const snapShot = await firebase.firestore()
        .collection(Constant.collectionNames.REPLIES)
        .where('threadId', '==', threadId)
        .orderBy('timestamp')
        .get();
    const replies = [];
    snapShot.forEach(doc => {
        const r = new Reply(doc.data())
        r.docId = doc.id
        replies.push(r);
    });
    
    return replies;
}

export async function searchThreads(keywordsArray) {
    const threadList = []
    const snapShot = await firebase.firestore()
        .collection(Constant.collectionNames.THREADS)
        .where('keywordsArray', 'array-contains-any', keywordsArray)
        .orderBy('timestamp', 'desc')
        .get();
    snapShot.forEach(doc => {
        const t = new Thread(doc.data());
        t.docId = doc.id;
        threadList.push(t)
    });
    return threadList;
}

export async function createAccount(email, password) {
    await firebase.auth().createUserWithEmailAndPassword(email, password);
}

export async function deleteThread(thread) {
    const replyList = await getReplyList(thread.docId)
    if (replyList.length == 0) {
        await firebase.firestore()
                .collection(Constant.collectionNames.THREADS)
                .doc(thread.docId)
                .delete();
        Element.root.innerHTML = "Thread has been deleted."
        return;
    }
    await updateThread(thread, 'deleted', null, 'deleted', Date.now());
    const title = 'deleted';
    const content = 'deleted';
    const uid = thread.uid;
    const email = thread.email;
    const timestamp = Date.now();
    const keywordsArray = null;
    const deletedThread = new Thread({
        uid, title, content, email, timestamp, keywordsArray, 
    });
    await ThreadPage.updateOriginalThreadBody(deletedThread);
}

export async function updateThread(thread, title, keywordsArray, content, timestamp) {
    await firebase.firestore()
        .collection(Constant.collectionNames.THREADS)
        .doc(thread.docId)
        .set({
            title: title,
            keywordsArray: keywordsArray,
            content: content,
            timestamp: timestamp,
        }, { merge: true });
}

export async function deleteReply(reply) {
    await firebase.firestore()
        .collection(Constant.collectionNames.REPLIES)
        .doc(reply.docId)
        .delete();
    document.getElementById(`reply-${reply.uid}-${reply.timestamp}`).innerHTML = 'This reply has been deleted.';
    document.getElementById(`buttons-${reply.uid}-${reply.timestamp}`).innerHTML = '';
}

export async function updateReply(reply, content, timestamp) {
    if (Auth.currentUser.uid == reply.uid) {
        await firebase.firestore()
            .collection(Constant.collectionNames.REPLIES)
            .doc(reply.docId)
            .set({
                content: content,
                timestamp: timestamp,
            }, { merge: true });
    }
}