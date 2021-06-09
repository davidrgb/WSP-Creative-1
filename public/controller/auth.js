import * as Element from '../viewpage/element.js'
import * as FirebaseController from './firebase_controller.js'

export let currentUser

export function addEventListeners() {

    Element.formSignin.addEventListener('submit', async e => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        try {
            await FirebaseController.signIn(email, password);
            Element.modalSigninForm.hide();
        } catch (e) {
            console.log(e);
        }
    });

    Element.menuSignout.addEventListener('click', () => {
        try {
            FirebaseController.signOut();
        } catch (e) {
            console.log(e);
        }
    });
    
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // sign in
            currentUser = user;
            let elements = document.getElementsByClassName('modal-menus-pre-auth');
            for (let i = 0; i < elements.length; i++)
                elements[i].style.display = 'none';
            elements = document.getElementsByClassName('modal-menus-post-auth');
            for (let i = 0; i < elements.length; i++)
                elements[i].style.display = 'block';
        } else {
            // sign out
            currentUser = null;
            let elements = document.getElementsByClassName('modal-menus-pre-auth');
            for (let i = 0; i < elements.length; i++)
                elements[i].style.display = 'block';
            elements = document.getElementsByClassName('modal-menus-post-auth');
            for (let i = 0; i < elements.length; i++)
                elements[i].style.display = 'none';
        }
    });
}

