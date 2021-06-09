import * as Element from './element.js'

function info(title, body, closeModal) {
    if (closeModal) closeModal.hide();
    Element.modalInfoboxTitleElement.innerHTML = title;
    Element.modalInfoboxBodyElement = body;
    Element.modalInfobox.show();
}