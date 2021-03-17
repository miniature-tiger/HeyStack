// PAGE / DISPLAY / BOX
// --------------------

// Automated page constructor
class Page {
    // Initialisation
    constructor(sectionSpec, panelSpecs, boxSpecs) {
        // Set up section
        this.section = new Section(sectionSpec, '', this);
        // Set up panels
        this.panels = {};
        for (let panelSpec of panelSpecs) {
            panelSpec.topPerc = 0;
            this.panels[panelSpec.id] = new Panel(panelSpec, this.section, this);
            this.section.node.appendChild(this.panels[panelSpec.id].node);
        }
        // Set up boxes
        this.boxes = {};
        let parentId = '';
        let parentOffset = 0;
        for (let [i, boxSpec] of boxSpecs.entries()) {
            let parent = this.panels[boxSpec.parent];
            if (parent.id !== parentId) {
                parentId = parent.id;
                parentOffset = i;
            }
            boxSpec.topPerc = (i - parentOffset) * 2;
            this.boxes[boxSpec.id] = this.createBox(boxSpec, parent, this);
            parent.node.appendChild(this.boxes[boxSpec.id].node);
        }
        this.buttonTransitionStatus = false;
        this.subHandler;
    }

    // Set up buttons
    setupButtons(buttonSpecs) {
        this.buttons = {};
        for (let buttonSpec of buttonSpecs) {
            let parent = this.boxes[buttonSpec.box];
            parent.addButton(buttonSpec);
        }
    }

    // Set up button ranges
    addButtonRanges(rangeSpecs) {
        for (const rangeSpec of rangeSpecs) {
            // Create new button range, add to parent (box or other display) and add buttons
            let box = this.boxes[rangeSpec.box];
            box.addButtonRange(rangeSpec);
        }
    }

    // Remove a button range
    removeButtonRanges(rangeSpecs) {
        for (const rangeSpec of rangeSpecs) {
            // Create new button range, add to parent (box or other display) and add buttons
            let box = this.boxes[rangeSpec.box];
            box.removeButtonRange(rangeSpec);
        }

    }

    createBox(boxSpec, parent, page) {
        return new Box(boxSpec, parent, page);
    }

}

// Div containers for sections / panels / boxes
class Display {
    // Initialisation
    constructor(spec, parent, page) {
        this.page = page;
        this.parent = parent;
        this.id = spec.id;
        this.widthPerc = spec.widthPerc;
        this.heightPerc = spec.heightPerc;
        this.cssScheme = spec.cssScheme;
        this.content;
        this.chart;
        this.buttonRanges = {};
        this.buttons = [];
    }

    createNode(divId, className, width, height, top) {
        let divNode = document.createElement("div");
        divNode.setAttribute('id', divId);
        divNode.setAttribute('class', className);
        divNode.style.width = width.toFixed(2) + 'px';
        divNode.style.height = height.toFixed(2) + 'px';
        divNode.style.top = top.toFixed(2) + 'px';
        //divNode.style.backgroundColor = colour;
        return divNode;
    }

    addLineChart() {
        this.clear();
        this.content = 'lineChart';
        this.chart = new LineChart(this.widthPix, this.heightPix);
        this.node.appendChild(this.chart.node);
    }

    addCandleChart() {
        this.clear();
        this.content = 'candleChart';
        this.chart = new CandleChart(this.widthPix, this.heightPix);
        this.node.appendChild(this.chart.node);
    }

    addBarChart() {
        this.clear();
        this.content = 'barChart';
        this.chart = new BarChart(this.widthPix, this.heightPix);
        this.node.appendChild(this.chart.node);
    }

    addStackedBarChart() {
        this.clear();
        this.content = 'stackedBarChart';
        this.chart = new StackedBarChart(this.widthPix, this.heightPix);
        this.node.appendChild(this.chart.node);
    }

    addTextBox(id, cssScheme) {
        this.content = 'textBox';
        let spec = {parent: this, id: id, sizePerc: 95, cssScheme: cssScheme};
        this.textBox = new TextBox(spec);
        this.node.appendChild(this.textBox.node);
    }

    addTable(headerSpec, columnSpec, rowKey, data, handlerSpec) {
        this.clear();
        this.content = 'table';
        this.table = new Table(headerSpec, columnSpec, rowKey, data, handlerSpec, this.widthPix, this.heightPix);
        this.node.appendChild(this.table.node);
    }

    clear() {
        this.content = '';
        this.chart = '';
        this.table = '';
        this.clearNode();
    }

    clearNode() {
        while (this.node.firstChild) {
            this.node.removeChild(this.node.lastChild);
        }
    }

    addButton(spec) {
        let newButton = new Button(spec, this.widthPix, this.heightPix)
        //this.buttons.push(newButton);
        this.node.appendChild(newButton.node);
        return newButton;
    }

    addButtonNode(button) {
        this.node.appendChild(button.node);
    }

    insertButtonNode(button, insertBeforeThisNode) {
        insertBeforeThisNode.parentNode.insertBefore(button.node, insertBeforeThisNode);
    }

    addButtonRange(rangeSpec) {
        let newRange;
        switch (rangeSpec.type) {
            case 'simple':
                newRange = new ButtonRange(rangeSpec, this);
                break;
            case 'menu':
                newRange = new MenuButtonRange(rangeSpec, this);
                break;
            default:
                //
        }
        this.buttonRanges[newRange.id] = newRange;
    }

    removeButtonRange(rangeSpec) {
        this.buttonRanges[rangeSpec.id].removeButtons();
        delete this.buttonRanges[rangeSpec.id];
    }
}

class Section extends Display {
    // Initialisation
    constructor(spec, parent, page) {
        super(spec, parent, page);
        this.widthPix = window.innerWidth * spec.widthPerc/100;
        this.heightPix = window.innerWidth * spec.heightPerc/100;
        this.topPix = 0;
        this.node = document.getElementById(spec.id);
        this.node.style.width = spec.widthPix + 'px';
        this.node.style.height = spec.heightPix + 'px';
    }
}

class Panel extends Display {
    // Initialisation
    constructor(spec, parent, page) {
        super(spec, parent, page);
        this.widthPix = this.parent.widthPix * this.widthPerc/100;
        this.heightPix = this.parent.heightPix * this.heightPerc/100;
        this.topPix = this.parent.heightPix * spec.topPerc/100;
        this.node = this.createNode(this.id, 'panel ' + this.cssScheme, this.widthPix, this.heightPix, this.topPix);
    }
}

class Box extends Display {
    // Initialisation
    constructor(spec, parent, page) {
        super(spec, parent, page);
        this.widthPix = this.parent.widthPix * this.widthPerc/100;
        this.heightPix = this.parent.heightPix * this.heightPerc/100;
        this.topPix = this.parent.heightPix * spec.topPerc/100;
        this.node = this.createNode(this.id, 'box ' + this.cssScheme, this.widthPix, this.heightPix, this.topPix);
    }
}

// HEY SPECIFICS
// -------------

class HeyPage extends Page {
    createBox(boxSpec, parent, page) {
        return new HeyBox(boxSpec, parent, page);
    }
}

class HeyBox extends Box {

    addLineChart(chartData) {
        // Add chart, add data, draw chart
        super.addLineChart();
        this.chart.addDataRanges(chartData);
        this.chart.drawChart();
        // Listener currently disabled
        //this.chart.hoverListenerOn();
    }

    addBarChart(chartData) {
        // Add chart, add data, draw chart
        super.addBarChart();
        this.chart.addDataRanges(chartData);
        this.chart.drawChart();
        // Listener currently disabled
        //this.chart.hoverListenerOn();
    }

    addStackedBarChart(chartData, chartDataTotals) {
        // Add chart, add data, draw chart
        super.addStackedBarChart();
        this.chart.addDataRanges(chartData);
        this.chart.addTotalsData(chartDataTotals);
        this.chart.drawChart();
        // Listener currently disabled
        //this.chart.hoverListenerOn();
    }
}

// TEXT BOX
// --------

class TextBox {
    // Initialisation
    constructor(spec) {
        this.parent = spec.parent;
        this.id = spec.id;
        this.sizePerc = spec.sizePerc;
        this.heightPix = this.parent.heightPix * this.sizePerc/100;
        this.widthPix = this.parent.widthPix - (this.parent.heightPix - this.heightPix);
        this.cssScheme = spec.cssScheme;
        this.node = this.parent.createNode(this.id, 'textBox ' + this.cssScheme, this.widthPix, this.heightPix, 0);
    }

    changeText(text) {
        this.node.innerHTML = text;
    }
}
