// BUTTONS AND BUTTON RANGES
// -------------------------

class Button {
    // Initialisation
    // - setting createNode as true allows button to be fully generated simply with a spec
    constructor(spec, createNode, range, box, parentWidthPix, parentHeightPix) {
        // Definitions
        this.id = spec.id;
        this.type = spec.type;
        this.text = spec.text;
        if (spec.hasOwnProperty('values')) {
            this.values = spec.values;
        }
        // Colours
        this.className = spec.className;
        this.setColours();
        this.setTransitions();
        // Range and box
        this.range = range;
        this.box = box;
        // Visibility true unless based on range
        if (this.range !== false) {
            this.visible = range.visible;
        } else {
            this.visible = true;
        }
        // Size
        this.widthPerc = spec.widthPerc;
        this.heightToWidth = spec.heightToWidth;
        this.widthPix = parentWidthPix * this.widthPerc/100;
        this.heightPix = this.widthPix * this.heightToWidth/100;
        // Handlers
        this.target = spec.target;
        this.buttonHandler = spec.buttonHandler;
        this.handlerSpecifics(spec);
        // Create node
        if (createNode === true) {
            this.createNodeAndListeners();
        }
    }

    // Set colour css for button
    setColours() {
        this.colourNeutral = 'colourNeutral';
        this.colourGo = 'colourNeutralShadow';
        this.colourNoGo = 'colourNoGo';
        this.setStartColour();
    }

    // Set start colour
    setStartColour() {
        this.currentColour = this.colourNeutral;
    }

    // Set transition css for button
    setTransitions() {
        this.slowTransition = 'slowTransition';
        this.fastTransition = 'fastTransition';
    }

    // Specific construction for handlers - will differ by button type
    handlerSpecifics(spec) {
        this.active = false;
    }

    // Create node and listeners
    createNodeAndListeners() {
        this.createNode();
        this.clickListenerOn();
    }

    // Create the button node
    createNode() {
        // Create div
        let divButton = document.createElement("div");
        // Id and class
        divButton.setAttribute('id', this.id);
        divButton.setAttribute('class', this.className);
        divButton.classList.add(this.currentColour);
        divButton.classList.add(this.fastTransition);
        // Size
        divButton.style.width = (this.widthPix * 0.90).toFixed(0) + 'px';
        divButton.style.paddingLeft = (this.widthPix * 0.05).toFixed(0) + 'px';
        divButton.style.paddingRight = (this.widthPix * 0.05).toFixed(0) + 'px';
        divButton.style.height = (this.heightPix * 0.95).toFixed(0) + 'px';
        divButton.style.marginBottom = (this.heightPix * 0.05).toFixed(0) + 'px';
        // Text
        divButton.textContent = this.text;
        // Visibility
        if (this.visible === false) {
            divButton.classList.add('hidden');
        }
        this.node = divButton;
    }

    // Button click listener on
    clickListenerOn() {
        this.node.addEventListener("click", this.clickHandler.bind(this));
    }

    // Handler for click on button
    clickHandler(e) {
        // Only activate if there is a buttonHandler
        if (this.buttonHandler !== false) {
            // Activate if not active
            if (this.active === false) {
                // Button view press effect
                this.changeToActive();
                // Click action
                this.clickAction();
            }
        }
    }

    changeToActive() {
        // Change active status
        this.active = true;
        // Change node colour
        this.visualEffectOnActivation();
    }

    changeToDeactive() {
        // Change active status
        this.active = false;
        // Change node colour and remove scale
        this.visualEffectOnDeactivation(this.colourNeutral);
    }

    clickAction() {
        // Action!
        let action = this.buttonHandler.bind(this.target);
        action();
    }

    // Handler for end of button transition
    endTransitionHandler(e) {
        if (this.active === true) {
            this.changeToDeactive();
        } else if (this.active === false) {
            this.transitionEndListenerOff();
        }
    }

    // Chamge colour and 'depress' button by scaling
    visualEffectOnActivation() {
        this.transitionEndListenerOn();
        this.changeColour(this.colourGo);
        this.scale(0.97);
    }

    // Chamge colour and 'unpress' button by scaling
    visualEffectOnDeactivation(endColour) {
        this.changeColour(endColour);
        this.removeScale();
    }

    changeColour(newColour) {
        // Change colour of node through class list add/remove
        this.changeClassList(this.currentColour, newColour);
        // Change current colourRef
        this.currentColour = newColour;
    }

    changeClassList(from, to) {
        // Change node colour
        this.node.classList.remove(from);
        this.node.classList.add(to);
    }

    scale(widthPerc) {
        let heightPerc = (1 - (1 - widthPerc) * (this.widthPix / this.heightPix));
        this.node.style.transform = 'scale(' + widthPerc + ',' + heightPerc + ')';
    }

    removeScale() {
        this.node.style.transform = 'none';
    }

    transitionEndListenerOn() {
        this.node.addEventListener('transitionend', this.transitionEndRef = this.endTransitionHandler.bind(this));
    }

    transitionEndListenerOff() {
        this.node.removeEventListener('transitionend', this.transitionEndRef);
    }

    showButton() {
        this.visible === true;
        this.node.style.display = 'flex';
    }

    hideButton() {
        this.visible === false;
        this.node.style.display = 'none';
    }

    get page() {
        return this.box.page;
    }
}

// Left / right scrolling activated through hovering over arrows
class ScrollButton extends Button {

    // Create node and listeners
    createNodeAndListeners() {
        // Create button node
        this.createNode();
        // Remove text node from div prior to set up of arrows and body
        this.node.textContent = '';
        // Create arrows and svg text
        this.createLeftArrow();
        this.node.appendChild(this.leftArrow.node);
        this.createBody();
        this.node.appendChild(this.buttonBody);
        this.createRightArrow();
        this.node.appendChild(this.rightArrow.node);
        // Button values set externally from spec (e.g. on switch to page)
        if (this.text === false) {
            // Remove text node
            this.text = '';
            this.values = [];
        // Button values set internally from spec (e.g. list of set values)
        } else {
            this.setValues(this.values);
        }
    }

    createBody() {
        this.buttonBody = this.createBodyDiv(6/8 * 100, 100, 'scrollButton', 'buttonBody')

        this.leftBody = this.createBodyDiv(100, 100, 'scrollButtonOption', 'leftBody');
        this.buttonBody.appendChild(this.leftBody)

        this.centreBody = this.createBodyDiv(100, 100, 'scrollButtonOption', 'centreBody');
        this.buttonBody.appendChild(this.centreBody)

        this.rightBody = this.createBodyDiv(100, 100, 'scrollButtonOption', 'rightBody');
        this.buttonBody.appendChild(this.rightBody)
    }

    createBodyDiv(width, height, className, id) {
        let div = document.createElement("div");
        div.setAttribute('class', className);
        div.setAttribute('id', id);
        div.style.width = width + '%';
        div.style.height = height + '%';
        return div;
    }

    createTextSVG(text) {
        let width = this.widthPix * (6/8);
        let height = Math.floor(this.heightPix - 1);
        // Create layer
        let textLayer = this.createLayer(width, height);
        // Create layer
        textLayer.appendChild(this.textLabel(width, height, text));
        return textLayer;

    }

    // Create chart SVG layer element
    createLayer(width, height) {
        let layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        layer.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        layer.setAttribute('width', width + '%');
        layer.setAttribute('height', height + '%');
        layer.setAttribute('viewBox', '0, 0, 100, 100');
        layer.setAttribute('class', 'buttonLayer');
        return(layer);
    }

    leftArrowPath() {
        let borderSpace = 0;
        let arrowSize = 100 / 2;
        let arrowPath =
          ' M ' + borderSpace + ' ' + arrowSize +
          ' L ' + (borderSpace + arrowSize) + ' ' + (arrowSize + arrowSize / 2) +
          ' L ' + (borderSpace + arrowSize) + ' ' + (arrowSize - arrowSize / 2);
        return arrowPath;
    }

    rightArrowPath() {
        let borderSpace = 0;
        let arrowSize = 100 / 2;
        let arrowPath =
          ' M ' + (100 - borderSpace) + ' ' + arrowSize +
          ' L ' + (100 - borderSpace - arrowSize) + ' ' + (arrowSize + arrowSize / 2) +
          ' L ' + (100 - borderSpace - arrowSize) + ' ' + (arrowSize - arrowSize / 2);
        return arrowPath;
    }

    textLabel(width, height, label) {
        let element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        let text = document.createTextNode(label);
        element.appendChild(text);
        element.setAttribute('font-size', 12);
        element.setAttribute('fill', 'rgba(39, 68, 89, 1)');
        element.setAttribute('x', width / 2);
        element.setAttribute('y', height / 2);
        element.setAttribute('text-anchor', 'middle');
        element.setAttribute('alignment-baseline', 'central');
        return element;
    }

    // Draw SVG plotLine
    drawPath(path, lineColour, fillColour, id) {
        let plotLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        plotLine.setAttribute('d', path);
        plotLine.setAttribute('stroke-opacity', '0');
        plotLine.setAttribute('class', 'path');
        plotLine.setAttribute('id', id);
        plotLine.style.strokeWidth = '1px';
        return plotLine;
    }

    setValues(values) {
        // Set the possible scroll values
        this.values = values;
        // Set the current scroll number in the range
        this.currentValuePosition = this.values.indexOf(this.text);
        if (this.currentValuePosition === -1) {
            this.currentValuePosition = 0;
        }
        this.setup(this.currentValuePosition);
    }

    setup(position) {
        // Clear all
        this.resetButtton();
        // Set central
        if (this.values.length > 0) {
            this.setText(this.values[position], 1);
        }
        // Set left
        if (position > 0) {
            // Set text and activate arrow
            this.setText(this.values[position-1], 0);
            //this.activateArrow(this.leftArrow);
            //this.showArrow(this.leftArrow);
            if (this.leftArrow.status === 'scrollingGo') {
                this.scrollArrow(this.leftArrow);
            } else {
                this.setArrowStatus(this.leftArrow, 'listening');
            }
        } else {
            this.setArrowStatus(this.leftArrow, 'hidden');
        }
        // Set right
        if (this.values.length - 1 > position) {
            // Set text and activate arrow
            this.setText(this.values[position+1], 2);
            if (this.rightArrow.status === 'scrollingGo') {
                this.scrollArrow(this.rightArrow);
            } else {
                this.setArrowStatus(this.rightArrow, 'listening');
            }
        } else {
            this.setArrowStatus(this.rightArrow, 'hidden');
        }
        // Handler from new value
        if (this.buttonHandler !== false) {
            // Action!
            let action = this.buttonHandler.bind(this.target, this.text);
            action();
        }
    }

    endTransitionHandler(e) {
        if (this.active === true) {
            this.changeToDeactive();
        } else if (this.active === false) {
            this.transitionEndListenerOff();
        }
    }

    createLeftArrow() {
        let width = 1/8 * 100;
        let height = 100;
        // Create layer
        this.leftArrow = {node: this.createLayer(width, height), status: 'notListening', startHoverTime: 0, transformationClass: "translateX(0%)", direction: -1};
        // Draw arrow
        this.leftArrow.node.appendChild(this.drawPath(this.leftArrowPath(width, height)), this.node.style.color, this.node.style.color, 'left');
        // Deactivate arrow until setup
        this.setArrowStatus(this.leftArrow, 'hidden');
    }

    createRightArrow() {
        let width = 1/8 * 100;
        let height = 100;
        // Create layer
        this.rightArrow = {node: this.createLayer(width, height), status: 'notListening', startHoverTime: 0, transformationClass: "translateX(-200%)", direction: 1};
        // Draw arrow
        this.rightArrow.node.appendChild(this.drawPath(this.rightArrowPath(width, height)), this.node.style.color, this.node.style.color, 'right');
        // Deactivate arrow until setup
        this.setArrowStatus(this.rightArrow, 'hidden');
    }

    // Possible statuses - scrollingGo, scrollingStop, listening, hidden
    // Always listening - actions determined by handlers
    setArrowStatus(arrow, newStatus) {
        if (newStatus !== arrow.status) {
            // If previous status was hidden - show arrow and switch on listeners
            // - listeners stay on until arrow hidden again
            if (arrow.status === 'hidden') {
                this.showArrow(arrow);
                this.arrowHoverListenersOn(arrow);
            } else if (newStatus === 'hidden') {
                this.arrowHoverListenersOff(arrow);
                this.hideArrow(arrow);
            }
            // Set new status
            arrow.status = newStatus;
        }
    }

    arrowHoverListenersOn(arrow) {
        arrow.node.addEventListener("mouseover", arrow.hoverOverRef = this.arrowHoverOverHandler.bind(this, arrow));
        arrow.node.addEventListener("mouseout", arrow.hoverOutRef = this.arrowHoverOffHandler.bind(this, arrow));
    }

    arrowHoverListenersOff(arrow) {
        arrow.node.removeEventListener("mouseover", arrow.hoverOverRef);
        arrow.node.removeEventListener("mouseout", arrow.hoverOutRef);
    }

    arrowHoverOverHandler(arrow) {
        if (this.page.buttonTransitionStatus === false || this.page.buttonTransitionStatus === arrow) {
            if (arrow.status === 'scrollingGo') {
                // Do nothing, already scrolling
            } else if (arrow.status === 'scrollingStop') {
                // Moved off arrow and returned while scrolling
                this.setArrowStatus(arrow, 'scrollingGo');
            } else if (arrow.status === 'listening') {
                this.setArrowStatus(arrow, 'scrollingGo');
                arrow.startHoverTime = new Date();
                this.delayedScrollStart(arrow);
            }
        }
    }

    delayedScrollStart(arrow) {
        if (arrow.status === 'scrollingGo') {
            if (new Date() - arrow.startHoverTime > 100) {
                // Scroll arrow once initial delay passed
                arrow.startHoverTime = 0;
                this.scrollArrow(arrow);
            } else {
                // Check scroll still required after initial delay
                setTimeout(this.delayedScrollStart.bind(this, arrow), 100);
            }
        } else if (arrow.status === 'scrollingStop') {
            // Moved off arrow within delay time - reset to listening
            this.setArrowStatus(arrow, 'listening');
        }
    }

    async scrollArrow(arrow) {
        this.page.buttonTransitionStatus = arrow;
        // Delay
        await logistics.delayInMs(100);
        // Listener to check when transition is complete
        this.transitionEndListenerOn();
        // Scroll buttonBody childnodes
        for (const childNode of this.buttonBody.childNodes) {
            childNode.classList.add('scrollTransition');
            childNode.style.transform = arrow.transformationClass;
        }
        // Set new currentValuePosition and text
        this.currentValuePosition = this.currentValuePosition + arrow.direction;
        this.text = this.values[this.currentValuePosition];
    }

    arrowHoverOffHandler(arrow) {
        if (arrow.status === 'scrollingGo') {
            this.setArrowStatus(arrow, 'scrollingStop');
            arrow.startHoverTime = 0; // reset hover start time
        }
    }

    endTransitionHandler(e) {
        if (e.srcElement.id === 'centreBody') {
            this.transitionEndListenerOff();
            this.page.buttonTransitionStatus = false;

            // Setup button again
            this.setup(this.currentValuePosition);
        }
    }

    activateArrow(arrow) {
        if (arrow.active === false) {
            arrow.active = true;
            // Turn on hover handler
            arrow.node.addEventListener("mouseover", arrow.hoverRef = this.hoverHandler.bind(this, arrow));
        }
    }

    showArrow(arrow) {
        // Show arrow
        arrow.node.firstChild.classList.remove('hidden');
    }

    deactivateArrow(arrow) {
        arrow.active = false;
        // Turn off hover handler
        arrow.node.removeEventListener("mouseover", arrow.hoverRef);
    }

    hideArrow(arrow) {
        // Hide left arrow
        arrow.node.firstChild.classList.add('hidden');
    }

    resetButtton() {
        for (const childNode of this.buttonBody.childNodes) {
            // Remove
            childNode.classList.remove('scrollTransition');
            childNode.textContent = '';
            childNode.style.transform = "translateX(-100%)";
        }
    }

    setText(value, childNumber) {
        if (childNumber === 1) {
            this.text = value;
        }
        this.buttonBody.childNodes[childNumber].textContent = value.toUpperCase();
    }
}

// Text input
class InputButton extends Button {
    // Create the button node
    createNode() {
        super.createNode();
        // Node created is stored as this.node by super
        this.node.setAttribute("contenteditable", true);
        this.hoverListenerOn();
        this.node.setAttribute("spellcheck", false);
    }

    // Set colour css for button
    setColours() {
        this.colourNeutral = 'colourInputNeutral';
        this.colourGo = 'colourInputGo';
        this.colourNoGo = 'colourNoGo';
        this.setStartColour();
    }

    // Click handler - organises various actions and effects
    clickHandler() {
        // Activate if not active
        if (this.active === false) {
            // Button view press effect
            this.changeToActive();
            // No click 'action' for input - text is removed in visualEffectOnActivation
        }
    }

    // Button action
    clickAction() {
        // No action!
    }

    visualEffectOnActivation() {
        // Just remove text
        this.node.innerHTML = '';
    }

    visualEffectOnDeactivation() {
        // Restore text
        this.node.innerHTML = this.text;
    }

    hoverListenerOn() {
        this.node.addEventListener("mouseover", this.hoverRef = this.hoverHandler.bind(this));
        this.node.addEventListener("mouseout", this.hoverRef = this.hoverOffHandler.bind(this));
    }

    hoverHandler() {
        // Only handle if menu button is not already active button
        this.changeColour(this.colourGo);
    }

    hoverOffHandler() {
        // Only handle if menu button is not already active button
        this.changeColour(this.colourNeutral);
    }
}

// Double click button with time delay to prevent accidental button press
class SafetyButton extends Button {

    // Set start colour
    setStartColour() {
        this.currentColour = this.colourNoGo;
    }

    // Create node and listeners
    createNodeAndListeners() {
        super.createNodeAndListeners();
        // Add locked to text
        this.addLockedText();
    }

    // Specific construction for handlers - will differ by button type
    handlerSpecifics(spec) {
        // Active status is set to 'safety' to prevent inadvertent clicking
        this.active = 'safety';
    }

    addLockedText() {
        this.node.innerHTML = 'X - ' + this.node.innerHTML + ' - X';
    }

    removeLockedText() {
        this.node.innerHTML = this.node.innerHTML.replace('X - ', '');
        this.node.innerHTML = this.node.innerHTML.replace(' - X', '');
    }

    // Click handler - organises various actions and effects
    clickHandler() {
        // Activate if not active
        if (this.active === 'safety') {
            // Button view press effect
            this.removeSafety();
        } else if (this.active === false) {
            // Button view press effect
            this.changeToActive();
            // Click action
            this.clickAction();
        }
    }

    endTransitionHandler(e) {
        if (this.active === false) {
            // Colour remains same - just removes scale effect
            this.visualEffectOnDeactivation('colourNeutral');
            this.transitionEndListenerOff();
        } else if (this.active === true) {
            // Change node colour and remove scale
            this.restoreSafety();
        } else if (this.active === 'safety') {
            // Restore locked text
            this.addLockedText();
            this.transitionEndListenerOff();
        }
    }

    // Remove safety for short period
    removeSafety() {
        // Change active status
        this.active = false;
        // Remove locked text
        this.removeLockedText();
        // Transition to neutral
        this.transitionEndListenerOn();
        this.visualEffectOnRemoveSafety();
        // Restore safety after 5 seconds
        setTimeout( () => {
            if (this.active === false) {
                this.transitionEndListenerOn();
                this.restoreSafety();
            }
        }, 3000);
    }


    // Restore safety
    restoreSafety() {
        // Change active status
        this.active = 'safety';
        // Transition back to safety colour
        this.visualEffectOnDeactivation('colourNoGo');
    }

    visualEffectOnRemoveSafety() {
        this.changeClassList(this.slowTransition, this.fastTransition);
        this.changeColour(this.colourNeutral);
        this.scale(0.98);
    }
}

// Base class for menu buttons
class RangeButton extends Button {
    // Initialisation
    constructor(spec, createNode, range, box, parentWidthPix, parentHeightPix) {
        super(spec, createNode, range, box, parentWidthPix, parentHeightPix)
    }

    // Set colour css for button
    setColours() {
        this.colourNeutral = 'colourNeutral';
        this.colourGo = 'colourGo';
        this.colourNoGo = 'colourNoGo';
        this.setStartColour();
    }
}

// Header which opens a drop down set of buttons when hovered over
class MenuHeaderButton extends RangeButton {

    // Set colour css for button
    setColours() {
        this.colourNeutral = 'colourMenuNeutral';
        this.colourGo = 'colourMenuGo';
        this.colourNoGo = '';
        this.setStartColour();
    }

    // Create node and listeners
    createNodeAndListeners() {
        super.createNodeAndListeners();
        this.hoverListenerOn();
    }

    changeToActive() {
        // Set button to active and change colours
        super.changeToActive();
        // Range hover listeners off
        this.range.hoverListenersOff();
    }

    changeToDeactive() {
        // Set button to deactive and change colours
        super.changeToDeactive();
        // Range hover listeners off
        this.range.hoverListenersOn();
    }

    visualEffectOnActivation() {
        this.changeClassList(this.slowTransition, this.fastTransition);
        this.changeColour(this.colourGo);
    }

    visualEffectOnDeactivation(endColour) {
        this.changeColour(endColour);
    }

    hoverListenerOn() {
        this.node.addEventListener("mouseover", this.hoverRef = this.hoverHandler.bind(this));
    }

    hoverListenerOff() {
        this.node.removeEventListener("mouseover", this.hoverRef);
    }

    // Open the menu for this button and close the menu for any others in the same range
    hoverHandler() {
        // Only handle if menu button is not already active button
        if (this.range.openButton !== this) {
            this.range.openButtonAndCloseOthers(this);
        }
    }

    get hoverRange() {
        //return this.range.parent.buttonRanges;
        if (this.range.box.buttonRanges.hasOwnProperty(this.id)) {
            return this.range.box.buttonRanges[this.id];
        } else {
            return false;
        }
    }

    openMenu() {
        // Set button as active in range
        this.range.openButton = this;
        // Show buttons in hover range
        const hoverRange = this.hoverRange;
        if (hoverRange !== false) {
            hoverRange.showButtons();
        }
    }

    closeMenu() {
        const hoverRange = this.hoverRange;
        // Hide buttons in hover range
        if (hoverRange !== false) {
            hoverRange.hideButtons();
        }
    }



}

// Selector buttons which form the menu under a MenuHeaderButton
class MenuSelectorButton extends RangeButton {

    // Specific construction for handlers - will differ by button type
    handlerSpecifics(spec) {
        // Active status of button
        this.active = false;
        // Click handler parameters for activation and deactivation of selector
        this.onParameters = spec.onParameters;
        this.offParameters = spec.offParameters;
        this.subHandler = spec.subHandler;
    }

    // Click handler
    clickHandler() {
        // Activate if not active
        if (this.active === false) {
            // Change colour of button
            this.range.activateButtonAndDeactivateOthers(this);
            // Change colour of parent button
            if (this.range.menuParent !== false) {
                this.range.menuParent.changeToActive();
            }
            // Click action
            this.clickAction(this.onParameters);
        // Deactivate if already active
        } else {
            // Change colour of button
            this.changeToDeactive();
            // Change colour of parent button
            if (this.range.menuParent !== false) {
                this.range.menuParent.changeToDeactive();
            }
            // Click action
            this.clickAction(this.offParameters);
        }
    }

    clickAction(onOffParameters) {
        // Click action if button has handler
        if (this.buttonHandler !== false) {
            // Set up subhandler in target
            if (this.subHandler !== false) {
                this.target.subHandler = this.subHandler;
            }
            // Action!
            let action = this.buttonHandler.bind(this.target, onOffParameters);
            action();
        }
    }

    visualEffectOnActivation() {
        this.changeClassList(this.slowTransition, this.fastTransition);
        this.changeColour(this.colourGo);
    }

    visualEffectOnDeactivation(endColour) {
        //this.changeClassList(this.fastTransition, this.slowTransition);
        this.changeColour(endColour);
    }
}


// A collection of buttons
// - buttons are (typically) added to boxes by wrapping the buttons in a button range and adding the button range to the box
// - button ranges also allow interactions between buttons, such as menu buttons
class ButtonRange {
    // Initialisation
    constructor(rangeSpec, box) {
        this.id = rangeSpec.id;
        this.box = box;
        this.visible = rangeSpec.visible;
        this.buttons = {}; // object of buttons named by id
        this.specificConstruction(rangeSpec, box);
        this.addButtons(rangeSpec);
    }

    // Constructor actions for specific button ranges prior to creating buttons
    specificConstruction(rangeSpec, box) {
        // None for basic button range
    }

    // Returns buttons as iterable array
    get buttonsAsArray() {
        let buttonsArray = [];
        for (let buttonName of Object.keys(this.buttons)) {
            buttonsArray.push(this.buttons[buttonName]);
        }
        return buttonsArray;
    }

    // Create button, add to button array, and add button node to parent
    addButtons(rangeSpec) {
        for (const buttonSpec of rangeSpec.buttonSpecs) {
            // Create and add labelButton
            if (buttonSpec.label !== false) {
                let buttonLabel = new ButtonLabel(buttonSpec, true, this, this.box, this.box.widthPix, this.box.heightPix);
                // Add node to parent
                this.addButton(buttonLabel);
            }
            // Create button and node
            let newButton = this.createButton(buttonSpec);
            newButton.createNodeAndListeners();
            // Add node to parent
            this.addButton(newButton);
        }
    }

    // Add to button array and button node to parent
    addButton(newButton) {
        // Add to button array
        this.buttons[newButton.id] = newButton;
        // Add node to parent
        this.box.addButtonNode(newButton);
    }

    removeButtons() {
        for (const button in this.buttons) {
            this.removeButton(this.buttons[button]);
        }
    }

    removeButton(button) {
        // Add to button array
        delete this.buttons[button.id];
        // Remove node from parent
        button.node.parentNode.removeChild(button.node);
    }

    // Create button based on type, spec, and parent size
    createButton(buttonSpec) {
        let newButton;
        switch (buttonSpec.type) {
            case 'simple':
                newButton = new Button(buttonSpec, false, this, this.box, this.box.widthPix, this.box.heightPix);
                break;
            case 'safety':
                newButton = new SafetyButton(buttonSpec, false, this, this.box, this.box.widthPix, this.box.heightPix);
                break;
            case 'input':
                newButton = new InputButton(buttonSpec, false, this, this.box, this.box.widthPix, this.box.heightPix);
                break;
            case 'scroll':
                newButton = new ScrollButton(buttonSpec, false, this, this.box, this.box.widthPix, this.box.heightPix);
                break;
            case 'menuHeader':
                newButton = new MenuHeaderButton(buttonSpec, false, this, this.box, this.box.widthPix, this.box.heightPix);
                break;
            case 'menuSelector':
                newButton = new MenuSelectorButton(buttonSpec, false, this, this.box, this.box.widthPix, this.box.heightPix);
                break;
            default:
                // No actoin
        }
        return newButton;
    }

    // Make all buttons in range visible
    showButtons() {
        this.visible = true;
        for (const button of this.buttonsAsArray) {
            button.showButton();
        }
    }

    // Hide all buttons in range
    hideButtons() {
        this.visible = false;
        for (const button of this.buttonsAsArray) {
            button.hideButton();
        }
    }

    // Turn on all hover listeners for buttons in range
    hoverListenersOn() {
        for (const button of this.buttonsAsArray.filter(x => x.type !== 'label')) {
            button.hoverListenerOn();
        }
    }

    // Turn off all hover listeners for buttons in range
    hoverListenersOff() {
        for (const button of this.buttonsAsArray.filter(x => x.type !== 'label')) {
            button.hoverListenerOff();
        }
    }
}

// Range for buttons which form a menu
class MenuButtonRange extends ButtonRange {
    // Constructor actions for specific button ranges prior to creating buttons
    specificConstruction(rangeSpec, box) {
        this.menuParentNextSiblingNode = false;
        if (rangeSpec.parentRange === false) {
            this.menuParent = false;
        } else {
            this.menuParent = this.box.buttonRanges[rangeSpec.parentRange].buttons[this.id];
            this.menuParentNextSiblingNode = this.menuParent.node.nextSibling;
        }

        // Indicator for which header button in the range is currently open
        this.openButton = false;
    }

    // Add to button array and button node to parent
    // - additionally allows for insertion of lower level menu buttons under menuParent button
    addButton(newButton) {
        // Add to button array
        this.buttons[newButton.id] = newButton;
        // Add node to parent
        if (this.menuParent === false || this.menuParentNextSiblingNode === null) {
            this.box.addButtonNode(newButton);
        } else {
            this.box.insertButtonNode(newButton, this.menuParentNextSiblingNode);
        }
    }

    openButtonAndCloseOthers(buttonToOpen) {
        for (const button of this.buttonsAsArray.filter(x => x.type !== 'label')) {
            if (button === buttonToOpen) {
                button.openMenu();
            } else {
                button.closeMenu();
            }
        }
    }

    activateButtonAndDeactivateOthers(buttonToActivate) {
        for (const button of this.buttonsAsArray.filter(x => x.type !== 'label')) {
            if (button === buttonToActivate) {
                button.changeToActive();
            } else {
                button.changeToDeactive();
            }
        }
    }

    deactivateAllButtons() {
        for (const button of this.buttonsAsArray.filter(x => x.type !== 'label' && x.active !== false)) {
            button.changeToDeactive();
        }
    }

}

// Label for use with buttons
class ButtonLabel {
    // Initialisation
    // - createNode allows button to be fully generated simply with a spec and new Buttton
    constructor(spec, createNode, range, box, parentWidthPix, parentHeightPix) {
        // Definitions
        this.id = spec.id + '_label';
        //this.type = spec.type;
        this.type = 'label';
        this.text = spec.label;
        // Colours
        this.className = 'buttonLabel';
        // Range
        this.range = range;
        this.box = box;
        // Visibility true unless based on range
        if (this.range !== false) {
            this.visible = range.visible;
        } else {
            this.visible = true;
        }
        // Size
        this.widthPerc = spec.widthPerc;
        this.heightToWidth = spec.heightToWidth;
        this.widthPix = parentWidthPix * this.widthPerc/100;
        this.heightPix = this.widthPix * this.heightToWidth/100;
        // Create node
        if (createNode === true) {
            this.createNode();
        }
    }

    // Create node and listeners
    createNode() {
        this.createNode();
    }

    // Create the button node
    createNode() {
        // Create div
        let divButton = document.createElement("div");
        // Id and class
        divButton.setAttribute('id', this.id);
        divButton.setAttribute('class', this.className);
        // Size
        divButton.style.width = (this.widthPix * 0.90).toFixed(0) + 'px';
        divButton.style.paddingLeft = (this.widthPix * 0.05).toFixed(0) + 'px';
        divButton.style.paddingRight = (this.widthPix * 0.05).toFixed(0) + 'px';
        divButton.style.height = (this.heightPix * 0.95).toFixed(0) + 'px';
        divButton.style.marginBottom = (this.heightPix * 0.05).toFixed(0) + 'px';
        // Text
        divButton.innerHTML = this.text;
        // Visibility
        if (this.visible === true) {
            divButton.style.display = 'flex';
        } else {
            divButton.style.display = 'none';
        }
        this.node = divButton;
    }

    showButton() {
        this.visible === true;
        this.node.style.display = 'flex';
    }

    hideButton() {
        this.visible === false;
        this.node.style.display = 'none';
    }

}
