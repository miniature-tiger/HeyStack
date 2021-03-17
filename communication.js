// COMMUNICATION BAR
// -----------------

let communication = {

    // Communication bar node
    node: document.getElementById('communication'),

    // Add transition animation
    setup: function() {
        this.node.classList.add(this.slowTransition);
    },

    // Create new message and slide on - click listener for message off
    message: async function(text) {
        this.changeText(text);
        this.slideOn();
        this.clickListenerOn();
    },

    // Change text of message
    changeText: function(text) {
        this.node.innerHTML = text;
    },

    // Add line to message
    addLineToMessage: function(text) {
        this.node.innerHTML += '<br>' + text;
    },

    // Slide message off
    messageOff: function() {
        this.slideOff();
        this.clickListenerOff();
    },

    // Slide communication bar onto screen
    slideOn: function() {
        this.node.style.transform = 'translateY(0%)';
    },

    // Slide communication bar off screen
    slideOff: function() {
        this.node.style.transform = 'translateY(100%)';
    },

    // Bar click listener on
    clickListenerOn: function() {
        this.node.addEventListener('click', this.clickHandler.bind(this));
    },

    // Bar click listener off
    clickListenerOff: function() {
        this.node.removeEventListener('click', this.clickHandler);
    },

    // Bar click handler
    clickHandler: function() {
        this.messageOff();
    }
}
