// Define enum use to set the state of the button
const States = {
    ATTEND: 'ATTEND',
    UNATTEND: 'UNATTEND',
    WAIT_LIST: 'WAIT_LIST',
    ON_WAITING_LIST: 'ON_WAITING_LIST'
}

// Used to set the modal functionality
const ModalTypes = {
    UNATTEND_EVENT: 'UNATTEND_EVENT',
    UNATTEND_SUB_EVENT: 'UNATTEND_SUB_EVENT',
}

// Used to set what kind of message alert to show
const MsgType = {
    SUCCESS: "SUCSESS",
    ERROR: "ERROR"
}

// Set the currentState, defaultis ADD
let state

// Used to know whether to use eventID or subEventid when performing a payment
let paymentSubEvent

// Keeps the current modal state
let modalType;

// defines variables that will be used
let csrftoken

// EventId sets the id for a given event, the has price sets whether the event has a price
let eventID
let hasNoPrice;

// used for guest users
let isGuestUser = false;
let email, firstName, lastName, phone

// Defines the button to be updated when paying for an event
let paymentButton;

// defines what button to be updated when guestUser is active
let guestSubEventButton
let guestSubEventObject

// used to define the current language
let lang;

// define handler used to access stripeCheckout
let handler = null;

// Array containing all the subEvents for this event
let subEvents = []

// index of current subEvent
let subEventIndex

/**
 * When the document have loaded, add listener to attend-event-button and send ajax.
 */
$(() => {
    // get the language
    lang = $('html').attr('lang')

    if (lang === 'nb' || lang === 'nn') {
        lang = 'no';
    }

    // Get the eventID
    const attendEventButton = $("#attend-event-button")
    eventID = attendEventButton.val()

    // Get the state from the button
    const type = attendEventButton.attr("data-state")
    state = getState(type);

    hasNoPrice = $("#price").length === 0;

    // FInd all the subEvents
    $(".join-subevent-button").each((e, element) => {
        let subEvent = {id: parseInt(element.value)}
        subEvent.state = getState(element.getAttribute("data-state"))
        subEvents.push(subEvent)
    })

    // get the csrf token
    csrftoken = getCookie('csrftoken')

    // if user is guest, set guest user to true
    if ($('#guestUserModal').length) {
        isGuestUser = true;
    }

    /**
     * Configure stripe
     */
    handler = StripeCheckout.configure({
        key: 'pk_test_TagT9jGDj7CN9NOQfTnueTxz',
        image: "/static/img/ntnui2.svg",
        locale: lang,
        token: (token) => {
            processStripeToken(token);
        }
    });
})

/**
 * Finds the state for a given string
 * @param type
 * @returns {*}
 */
function getState(type) {
    if (type === "wait-list") {
        return States.WAIT_LIST
    } else if (type === "unattend") {
        return States.UNATTEND
    } else if (type === "on-waiting-list") {
        return States.ON_WAITING_LIST
    } else {
        return States.ATTEND
    }
}

/**
 * Sends a attend event request to the server
 */
$("#attend-event-button").click((e) => {
    e.preventDefault()
    const button = getButton(e);
    if (!$(button).prop('disabled')) {
        switch (state) {
            case States.UNATTEND:
                modalType = ModalTypes.UNATTEND_EVENT
                $("#deleteModal").modal("show");
                break;
            case States.ATTEND:
                $(button).prop("disabled", true).addClass("disabled");
                if (isGuestUser) {
                    showGuestModal();
                } else {
                    if (hasNoPrice) {
                        attendEvent(button)
                    } else {
                        attendPayedEvent(button)
                    }
                }
                break;
            case States.WAIT_LIST:
                $(button).prop("disabled", true).addClass("disabled");
                attendWaitingList(button)
                break;
            case States.ON_WAITING_LIST:
                $("#deleteModal").modal("show");
                modalType = ModalTypes.UNATTEND_EVENT
                break;
        }
    }
})

/**
 * Sends a attend subevet request
 */
$(".join-subevent-button").click((e) => {
    const button = getButton(e)

    if (!$(button).prop('disabled')) {

        let subEvent = subEvents.filter((event) => event.id == parseInt(button.value))
        subEventIndex = subEvents.indexOf(subEvent[0])
        // IF the first sign is a - we want to remove attending event
        switch (subEvent[0].state) {
            case States.ATTEND:
                if (isGuestUser) {
                    guestSubEventButton = button;
                    guestSubEventObject = subEvent[0]
                    showGuestModal();
                } else {
                    $(button).prop("disabled", true).addClass("disabled");
                    if (!$(button).closest(".sub-event-container").find(".price").length) {
                        attendEvent(button, subEvent[0])
                    } else {
                        attendPayedEvent(button, subEvent[0])
                    }
                }
                break;
            case States.UNATTEND:
                modalType = ModalTypes.UNATTEND_SUB_EVENT
                $("#deleteModal").modal("show");
                break;
            case States.ON_WAITING_LIST:
                $(button).prop("disabled", true).addClass("disabled");
                removeAttendEvent(button, subEvent[0])
                break;
            case States.WAIT_LIST:
                $(button).prop("disabled", true).addClass("disabled");
                attendWaitingList(button, subEvent[0])
                break;
        }
    }
})

/**
 * onClick for the remove button on the delete modal
 */
$("#remove-attend-event-button-modal").click(() => {
    switch (modalType) {
        case ModalTypes.UNATTEND_EVENT:
            removeAttendEvent($("#attend-event-button")[0])
            break;
        case ModalTypes.UNATTEND_SUB_EVENT:
            $(".join-subevent-button").each((e, element) => {
                if (element.value == subEvents[subEventIndex].id) {
                    $(element).prop("disabled", true).addClass("disabled");
                    removeAttendEvent(element, subEvents[subEventIndex])
                }
            })
            break;
    }
})

/**
 * On Click for the guest modal
 */
$("#guest-data-form").on('submit', async (e) => {
    // Get all values from the modal
    firstName = $("#first-name").val();
    lastName = $("#last-name").val();
    phone = $("#phone").val();
    email = $("#input-email").val();

    if ($("#price").length > 0 && !guestSubEventObject) {
        attendPayedEvent($("#attend-event-button"))
    } else if (guestSubEventObject && $(guestSubEventButton).closest(".sub-event-container").find(".price").length) {
        attendPayedEvent(guestSubEventButton, guestSubEventObject);
        guestSubEventObject = null;
        guestSubEventButton = null;
    } else {
        let postData = $("#guest-data-form").serialize();
        postData = postData + '&csrfmiddlewaretoken=' + csrftoken;
        if(!guestSubEventObject) {
            postData = postData + '&event_id=' + eventID;
        }
        else {
            postData = postData + '&sub_event_id=' + guestSubEventObject.id;
            guestSubEventObject = null;
            guestSubEventButton = null;
        }
        let result = await sendAjax(postData, '/ajax/events/attend-event');
        if (result) {
            printMessage(MsgType.SUCCESS, result.message)
        }
        hideGuestModal()
    }
    e.preventDefault();
})


/**
 * Sends a ajax request with the given data, and a given url and type(POST; GET)
 * @param data
 * @param url
 * @param type
 * @param button
 * @returns {Promise.<*>}
 */
async function sendAjax(data, url, type, button) {
    data.csrfmiddlewaretoken = csrftoken;
    try {
        let result = await $.ajax({
            type: type || 'POST',
            data: data,
            url: url
        })
        return result;
    } catch (error) {
        if (error.responseJSON) {
            printMessage(MsgType.ERROR, error.responseJSON.message)
        } else {
            printMessage(MsgType.ERROR, gettext("Your request could not be processed"))
        }
        if (button) {
            $(button).find('.loader').remove();
            if ($(button).prop('disabled')) {
                $(button).prop("disabled", false).removeClass("disabled");
            }
        }
    }
}

/**
 * Returnes the button press from a event
 * @param e
 * @returns {*}
 */
function getButton(e) {
    const event = e || window.event
    const element = event.target
    return $(element).closest("button")[0]
}

/**
 * Possess a given strope tokenn, before its sendt to the server
 * @param token
 * @returns {Promise.<void>}
 */
async function processStripeToken(token) {
    let data = {
        csrfmiddlewaretoken: csrftoken,
        stripeToken: token.id,
        stripeEmail: token.email,
    }

    let subEvent = paymentSubEvent
    if (paymentSubEvent) {
        data.sub_event_id = subEvent.id;
    }
    else {
        data.event_id = eventID;
    }
    paymentSubEvent = null;
    if (isGuestUser) {
        data.email = email
        data.first_name = firstName
        data.last_name = lastName
        data.phone = phone;
    }

    let result = await sendAjax(data, '/ajax/events/attend-payment-event')
    if (result) {
        if (subEvent) {
            $(".join-subevent-button").each((e, button) => {
                if (parseInt(button.value) === subEvent.id) {
                    updateButton(button, gettext('Unattend'), States.UNATTEND, subEvent)
                }
            })
        } else {
            updateButton($("#attend-event-button")[0], gettext('Unattend'), States.UNATTEND)
        }
        printMessage(MsgType.SUCCESS, result.message)
    }
    hideGuestModal()
}

/**
 * Opens the guest modal
 */
function showGuestModal() {
    $("#guestUserModal").modal('show')
}

/**
 * hides the guest modal
 */
function hideGuestModal() {
    $("#guestUserModal").modal('hide')
}

/**
 * Updates the tilte and the style of a button
 * @param button
 * @param title
 * @param type
 */
function updateButton(button, title, state, subEvent) {
    $(button).find(".button-title-container").html(title);
    switch (state) {
        case States.UNATTEND:
            button.setAttribute('class', 'btn btn-danger');
            break;
        case States.ATTEND:
            button.setAttribute("class", "btn btn-success")
            break;
        case States.WAIT_LIST:
            button.setAttribute("class", "btn btn-info")
            break;
        case States.ON_WAITING_LIST:
            button.setAttribute("class", "btn btn-secondary")
            break;
    }
    if (subEvent) {
        button.setAttribute("class", ("join-subevent-button " + button.getAttribute("class")))
    }
    $(button).find(".loader").remove();

    if ($(button).prop('disabled')) {
        $(button).prop("disabled", false).removeClass("disabled");
    }
}

function setButtonLoader(button, color) {
    if (!$(button).find(".loader").length) {
        button.innerHTML = ('<div style="border: .1rem solid ' + color + '; border-top: .1rem solid white" class="loader"></div>')
            + button.innerHTML;
    }
}

/**
 * Function used to get the infromation needed to attend a payed event
 * @param button
 * @param subEvent
 * @returns {Promise.<void>}
 */
async function attendPayedEvent(button, subEvent) {
    const URL = !subEvent ? ('/ajax/events/' + eventID) : ('/ajax/events/sub-event/' + subEvent.id)
    paymentButton = button;
    setButtonLoader(button)
    const event = await sendAjax({id: (subEvent ? subEvent.id : eventID)}, URL, 'POST', button)
    if (event) {
        let user = {}
        if (!isGuestUser) {
            user = await sendAjax({}, '/ajax/accounts', 'GET')
            if (!user) {
                return
            }
        } else {
            user.email = email
        }
        if (subEvent) {
            paymentSubEvent = subEvent
        }
        handler.open({
            amount: parseInt(event.price) * 100,
            currency: "nok",
            name: event.host,
            description: event.name,
            email: user.email,
        });
    }
}

/**
 * Gather information and send a request to the server in order to let the user attend a given event
 * @param button
 * @param subEvent
 * @returns {Promise.<void>}
 */
async function attendEvent(button, subEvent) {
    setButtonLoader(button, '#00AA00')
    let response;
    if (subEvent) {
        response = await sendAjax({sub_event_id: subEvent.id}, '/ajax/events/attend-event', 'POST', button);
    } else {
        response = await sendAjax({event_id: eventID}, '/ajax/events/attend-event', 'POST', button);
    }
    if (response) {
        updateButton(button, gettext('Unattend'), States.UNATTEND, subEvent)
        if (subEvent) {
            subEvents[subEvents.indexOf(subEvent)].state = States.UNATTEND
        } else {
            $("#attendance").html(response.number_of_participants + (response.attendance_cap ? ("/" + response.attendance_cap) : ""))
            state = States.UNATTEND
        }
        printMessage(MsgType.SUCCESS, response.message);
    }
}

/**
 * Gather information and send a request to the server in order to let the user be place on the waiting
 * @param button
 * @param subEvent
 * @returns {Promise.<void>}
 */
async function attendWaitingList(button, subEvent) {
    setButtonLoader(button, '#0000AA')
    let response;
    if (subEvent) {
        response = await sendAjax({sub_event_id: subEvent.id}, '/ajax/events/waiting-list', 'POST', button);
    } else {
        response = await sendAjax({event_id: eventID}, '/ajax/events/waiting-list', 'POST', button);
    }
    if (response) {
        updateButton(button, gettext('Remove me from the wait list'), States.ON_WAITING_LIST, subEvent)
        if (subEvent) {
            subEvents[subEvents.indexOf(subEvent)].state = States.ON_WAITING_LIST
        } else {
            $("#attendance").html(response.number_of_participants + (response.attendance_cap ? ("/" + response.attendance_cap) : ""))
            state = States.ON_WAITING_LIST
        }
        printMessage(MsgType.SUCCESS, response.message);
    }
}

/**
 * Removes the user from attending a given event
 * @param button
 * @param subEvent
 * @returns {Promise.<void>}
 */
async function removeAttendEvent(button, subEvent) {
    if (subEvent && subEvent.state === States.ON_WAITING_LIST) {
        setButtonLoader(button, '#AAAAAA')
    } else if (state == States.ON_WAITING_LIST) {
        setButtonLoader(button, '#AAAAAA')
    } else {
        setButtonLoader(button, '#AA0000')
    }

    let response;
    if (subEvent) {
        response = await sendAjax({sub_event_id: subEvent.id}, '/ajax/events/unattend-event', 'POST', button)
    } else {
        response = await sendAjax({event_id: eventID}, '/ajax/events/unattend-event', 'POST', button)
    }
    if (response) {
        if (parseInt(response.number_of_participants) >= parseInt(response.attendance_cap)) {
            updateButton(button, gettext('Put me on the wait list'), States.WAIT_LIST, subEvent)
            if (subEvent) {
                subEvents[subEvents.indexOf(subEvent)].state = States.WAIT_LIST
            } else {
                $("#attendance").html(response.number_of_participants + (response.attendance_cap ? ("/" + response.attendance_cap) : ""))
                state = States.WAIT_LIST
            }
        } else {
            updateButton(button, gettext('Attend event'), States.ATTEND, subEvent)
            if (subEvent) {
                subEvents[subEvents.indexOf(subEvent)].state = States.ATTEND
            } else {
                $("#attendance").html(response.number_of_participants + (response.attendance_cap ? ("/" + response.attendance_cap) : ""))
                state = States.ATTEND
            }
            printMessage(MsgType.SUCCESS, response.message)
        }
    }
}

// Close Checkout on page navigation:
window.addEventListener('popstate', function () {
    handler.close();
});


// from django website https://docs.djangoproject.com/en/2.0/ref/csrf/
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Prints message to screen, using a dialog box
 * @param msgType
 * @param msg
 */

function printMessage(msgType, msg) {
    //checks the msgType, to get the right color for the alert
    let type = ''
    let msgIdentifier;
    switch (msgType) {
        case MsgType.ERROR:
            type = 'danger'
            msgIdentifier = gettext('Error')
            break
        case MsgType.SUCCESS:
            type = 'success'
            msgIdentifier = gettext('Success')
            break
    }
    //print message to screen
    $(".alert-message-container").html(() => {
        return "<div class=\"alert alert-" + type + " show fade \" role=\"alert\"> <strong>" + msgIdentifier + ":</strong>" +
            " " + msg + "</div>"
    })

    //set timeout
    setTimeout(() => {
        //slide up the alert
        $(".alert").slideUp()
        //sets the amount of ms before the alert is closed
    }, 2000)
}