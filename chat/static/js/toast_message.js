const TOAST_MESSAGE = 0;
const TOAST_WARNING = 1;
const TOAST_ERROR = 2;


function toast_message(type, text){
    var toast_container = document.getElementById("toast-container");
    var alert = document.createElement("div");
    var icon = document.createElement("i");
    icon.classList.add("fa");


    alert.classList.add("alert");
    if (type == TOAST_MESSAGE) {
        icon.classList.add("fa-check");
        alert.appendChild(icon);
        alert.classList.add("alert-success");
    }else if (type == TOAST_WARNING){

        icon.classList.add("fa-info-circle");
        alert.appendChild(icon);
        alert.classList.add("alert-warning");

    }else if (type == TOAST_ERROR){
        icon.classList.add("fa-times-circle");
        alert.appendChild(icon);
        alert.classList.add("alert-danger");
    }else{
        return ;
    }
    alert.appendChild(document.createTextNode("\xa0\xa0" + text));

    var rand_id = make_random_string(10);
    alert.setAttribute("id", rand_id);

    toast_container.appendChild(alert);
    setTimeout(function() {
        var id = "#" + rand_id;
        $(id).fadeOut(300);
        //toast_container.removeChild(alert);
    }, 4000);
}

function make_random_string(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() *
        charactersLength));
    }
    return result;
}