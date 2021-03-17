// TABLES
// ------

class Table {
    // Initialisation
    constructor(headerSpec, columnSpec, rowKey, data, handlerSpec, width, height) {
        this.width = width;
        this.height = height;
        this.keys = columnSpec.map(x => x.key);
        this.headerHeight = headerSpec.heightPerc;
        this.headerLabels = columnSpec.map(x => x.label);
        this.textFormats = columnSpec.map(x => x.textFormat);
        this.columnWidths = columnSpec.map(x => x.widthPerc);
        this.columnFormats = columnSpec.map(x => x.columnFormat);
        this.rowKey = rowKey;
        this.data = data;
        this.node = this.createLayer('table');

        // Handlers
        this.target = handlerSpec.target;
        this.tableHandler = handlerSpec.tableHandler;

        // Sorting
        this.currentSortColumn = false;
        this.currentSortDirection = 1;

        this.buildTable(columnSpec);
    }

    get dataLength() {
        return Object.keys(this.dataRanges).length;
    }

    // Create table base node
    createLayer(className) {
        let layer = document.createElement("div");
        layer.style.width = this.width.toFixed(2) + 'px';
        layer.style.height = this.height.toFixed(2) + 'px';
        layer.setAttribute('class', className);
        return(layer);
    }

    // Build the table
    buildTable(columnSpec) {
        // Curve top row
        this.node.appendChild(this.createCurveRow());
        // Add table body
        this.tableBodyNode = this.createTableBody();
        this.node.appendChild(this.tableBodyNode);
        // Curve bottom row
        this.node.appendChild(this.createCurveRow());
        // Define grid
        this.defineGridTemplateColumns(columnSpec);
        this.defineGridTemplateRows();

        this.addRowsToHeader();
        this.addDataToTable();
    }

    createCurveRow() {
        let div = document.createElement("div");
        div.style.height = '2%';
        div.style.width = '100%';
        div.setAttribute('class', 'tableCurve');
        return div;
    }

    createTableBody() {
        let div = document.createElement("div");
        div.setAttribute('class', 'tableBody');
        div.style.display = 'grid';
        div.style.overflow = 'auto';
        div.style.height = '96%';
        div.style.width = '100%';
        return div;
    }

    defineGridTemplateColumns(columnSpec) {
        let gridColumnString = '';
        for (let column of columnSpec) {
            gridColumnString += '[' + column.key + '] ' + column.widthPerc + ' ';
        }
        this.tableBodyNode.style.gridTemplateColumns = gridColumnString;
    }

    defineGridTemplateRows() {
        if (this.data.length === 0) {
            this.tableBodyNode.style.gridTemplateRows = '[header] ' + this.headerHeight + '%';
        } else {
            this.tableBodyNode.style.gridTemplateRows = '[header] ' + this.headerHeight + '% repeat(' + this.data.length + ', [body] 10%)';
        }
    }

    addRowsToHeader() {
        let rowData = this.headerLabels;
        this.fillHeaderRow(1, rowData);
    }

    addDataToTable(rowNumber) {
        for (const [i, datum] of this.data.entries()) {
            let rowData = this.keys.map(x => datum[x]);
            this.fillRow(i+1, rowData);
        }
    }

    // Update table data
    updateTableData(data) {
        // Update data storage and sort
        this.data = data;
        this.sortByColumnAndDirection(this.currentSortColumn, this.currentSortDirection);
        // Redraw table
        this.clearAndRedraw();
    }

    sortByColumnAndDirection(column, direction) {
        if (this.currentSortColumn !== false) {
            this.data.sort((a, b) => {
                if (b[column] > a[column]) {
                    return direction;
                } else {
                    return direction * -1;
                }
            });
        }
    }

    // Sort for use in header handler
    sortByAndRedraw(column) {
        this.sortBy(column);
        this.clearAndRedraw(this.data);
    }

    sortBy(column) {
        this.checkFlipAndColumn(column);
        this.sortByColumnAndDirection(column, this.currentSortDirection);
    }

    checkFlipAndColumn(column) {
        if (this.currentSortColumn === column) {
            this.currentSortDirection *= -1;
        } else {
            this.currentSortColumn = column;
            this.currentSortDirection = 1;
        }
    }

    clearAndRedraw() {
        // Clear table body (removes table rows)
        this.clearData();
        // Redefines grid for rows incase table now needs fewer / more rows
        this.defineGridTemplateRows();
        // Add data
        this.addDataToTable();
    }

    // Remove all rows from table body
    clearData() {
        // Collects all table body cells to delete - delete after loop to prevent skipping
        let cellsToDelete = [];
        for (const cell of this.tableBodyNode.childNodes) {
            if (cell.style.gridRowStart.includes('body')) {
                cellsToDelete.push(cell);
            }
        }
        // Deletes collected cells
        for (const cell of cellsToDelete) {
            this.tableBodyNode.removeChild(cell);
        }
    }

    // Fill headers and rows
    fillHeaderRow(headerRowNumber, rowData) {
        for (let [i, value] of rowData.entries()) {
            this.tableBodyNode.appendChild(this.createTableDiv('header ' + headerRowNumber, this.keys[i], value, 'string', this.columnFormats[i] + ' tableHeaderDiv'))
        }
    }

    fillRow(rowNumber, rowData) {
        for (let [i, value] of rowData.entries()) {
            this.tableBodyNode.appendChild(this.createTableDiv('body ' + rowNumber, this.keys[i], value, this.textFormats[i], this.columnFormats[i] + ' tableBodyDiv'))
        }
    }

    // Create cell for table
    createTableDiv(row, column, value, textFormat, className) {
        let div = document.createElement("div");
        div.setAttribute('class', className);
        // Grid info
        div.style.gridRowStart = row;
        div.style.gridColumnStart = column;
        // Format text
        div.innerHTML = value;
        if (value !== '') {
            if (textFormat === 'currencyUSD') {
                div.innerHTML = new NumberFormatHelper(value).currency('USD');
            } else if (textFormat === 'currencyGBP') {
                div.innerHTML = new NumberFormatHelper(value).currency('GBP');
            } else if (textFormat.substring(0,5) === 'comma') {
                let splitString = textFormat.split("-");
                div.innerHTML = new NumberFormatHelper(value).comma(splitString[1]);
            } else if (textFormat === 'dateToText') {
                div.innerHTML = new DateHelper(value).dateToText();
            }
        }
        return div;
    }

    // LISTENERS
    // ---------

    // Table click listener on
    tableListenersOn() {
        this.node.addEventListener("click", this.clickHandler.bind(this));
    }

    // Click handler - organises various actions and effects
    clickHandler(e) {
        //let gridRow = itemClicked.style.gridRowStart.split(' ');
        let gridRow = e.target.style.gridRowStart;
        let gridRowSplit = gridRow.split(' ');
        let gridRowNumber = Number(gridRowSplit[0]);
        let gridRowSection = gridRowSplit[1];
        let gridColumn = e.target.style.gridColumnStart;

        // Ignore clicks that do not hit a header or body row
        if (gridRow !== "") {
            // Header - sort table or reverse sort
            if (gridRowSection === 'header') {
                this.sortByAndRedraw(gridColumn);
            } else if (gridRowSection === 'body') {
                // Highlight / dehighlight rows
                this.highlightRow(gridRowNumber);
                // If table has handler then action
                if (this.tableHandler !== false) {
                    this.clickAction(this.data[gridRowNumber-1]);
                }
            }
        }
    }

    // Action handler
    clickAction(rowData) {
        let action = this.tableHandler.bind(this.target, rowData);
        action();
    }

    // Highlight row
    highlightRow(gridRowNumber) {
        for (const cell of this.tableBodyNode.childNodes) {
            if (Number(cell.style.gridRowStart.split(' ')[0]) === gridRowNumber && cell.style.gridRowStart.split(' ')[1] === 'body') {
                cell.classList.add('tableBodyDivHighlight');
                cell.classList.remove('tableBodyDiv');
            } else if (cell.classList.contains('tableBodyDivHighlight')) {
                cell.classList.remove('tableBodyDivHighlight');
                cell.classList.add('tableBodyDiv');
            }
        }
    }

    // Highlight row based on given key:value pair
    highlightRowByData(keyValues) {
        let rowNumber = false;
        for (let [i, datum] of this.data.entries()) {
            let result = true;
            for (const key in keyValues) {
                if (datum[key] !== keyValues[key]) {
                    result = false;
                }
            }
            if (result === true) {
                rowNumber = i;
                break;
            }
        }
        if (rowNumber !== false) {
            this.highlightRow(rowNumber+1);
        }
    }

    // Scrolls to bottom of table
    scrollToBottom() {
        this.tableBodyNode.scrollTop = this.tableBodyNode.scrollHeight;
    }

    // Clear highlighting
    dehighlightAllRows() {
        for (const cell of this.tableBodyNode.childNodes) {
            if (cell.classList.contains('tableBodyDivHighlight')) {
                cell.classList.remove('tableBodyDivHighlight');
                cell.classList.add('tableBodyDiv');
            }
        }
    }
}
