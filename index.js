var url = 'https://swapi.dev/api/people';

window.addEventListener('load', () => {
    let getBtn = document.querySelector('.get-button');
    let clearBtn = document.querySelector('.clear-button');
    let nextBtn = document.querySelector('.btn.next');
    let prevBtn = document.querySelector('.btn.prev');
    let dataParsed = getData();
    btnDisabler(dataParsed);

    if (dataParsed) {
        draw(dataParsed);
    }

    getBtn.addEventListener('click', (e) => loadData(url));
    clearBtn.addEventListener('click', clear);
    nextBtn.addEventListener('click', nextPage);
    prevBtn.addEventListener('click', prevPage);
});

function draw(dataParsed = getData()) {
    if (!dataParsed.pages) {
        return;
    }
    let table = document.querySelector('.table');
    let paginationCount = document.querySelector('.pagination-wrapper .pages-count');
    table.innerHTML = `<thead><tr>
        <th id="name" style="${dataParsed.cols_width && "width:" + dataParsed.cols_width[0]}" class="${dataParsed.sortCol === "name" ? "sort " + dataParsed.sortOrder : ""}">
            Name
        </th>
        <th id="height" style="${dataParsed.cols_width && "width:" + dataParsed.cols_width[1]}" class="${dataParsed.sortCol === "height" ? "sort " + dataParsed.sortOrder : ""}">
            Height
        </th>
        <th id="mass" style="${dataParsed.cols_width && "width:" + dataParsed.cols_width[2]}" class="${dataParsed.sortCol === "mass" ? "sort " + dataParsed.sortOrder : ""}">
            Mass
        </th>
        <th id="birth_year" style="${dataParsed.cols_width && "width:" + dataParsed.cols_width[3]}" class="${dataParsed.sortCol === "birth_year" ? "sort " + dataParsed.sortOrder : ""}">
            Birth year
        </th>
        <th id="gender" style="${dataParsed.cols_width && "width:" + dataParsed.cols_width[4]}" class="${dataParsed.sortCol === "gender" ? "sort " + dataParsed.sortOrder : ""}">
            Gender
        </th>
    </tr></thead>`;
    let tbody = document.createElement('tbody');
    table.appendChild(tbody);

    dataParsed.pages[dataParsed.curPage].forEach((item, i) => {
        let tr = createRow(item, i);
        tbody.appendChild(tr);
    })

    setTableEvents(tbody);
    document.querySelector('.info').classList.add('hidden');
    document.querySelector('.table').classList.remove('hidden');
    paginationCount.innerHTML = `${dataParsed.curPage} / ${Math.ceil(dataParsed.total / 10)}`;
    createResizableTable(table);
    loaderToggler('close');
};

function createRow(item, i) {
    let tr = document.createElement('tr');
    tr.draggable = true;
    tr.classList.add('row');
    tr.setAttribute('data-index', i);

    const cells = [
        item.name,
        item.height,
        item.mass,
        item.birth_year,
        item.gender
    ];

    cells.forEach((cellContent, i) => {
        const td = document.createElement('td');
        td.innerHTML = cellContent;
        if (i === 4) {
            const del = document.createElement('button');
            del.innerHTML = 'X';
            del.classList.add('btn');
            del.classList.add('btn-danger');
            del.classList.add('delete');
            del.addEventListener('click', (e) => deleteRow(e));
            td.appendChild(del);
        }
        tr.appendChild(td);
    });

    tr.style.height = item.row_height || '';
    return tr;
};

function deleteRow(e) {
    let index = e.target.parentElement.parentElement.getAttribute('data-index');
    let dataParsed = getData();
    dataParsed.pages[dataParsed.curPage].splice(index, 1);

    if (dataParsed.pages[dataParsed.curPage].length === 0) {
        dataParsed.pages.splice(dataParsed.curPage, 1);
        dataParsed.curPage = 1;
    }

    localStorage.setItem('ut-test-data', JSON.stringify(dataParsed));
    draw(dataParsed);
};

function setTableEvents(tbody) {
    var tableRow;
    tbody.ondragstart = (e) => {
        e.stopPropagation();

        tableRow = e.target;
    }

    tbody.ondragend = (e) => {
        e.stopPropagation();
        e.preventDefault();

        let dataParsed = getData();
        let newPositionNumberTable;
        let positionInLocalData = Number(tableRow.getAttribute('data-index'));
        let tableRowData = dataParsed.pages[dataParsed.curPage][positionInLocalData];

        var i = 0;
        while (tableRow = tableRow.previousSibling) {
            tableRow.nodeType == 1 && i++;
        }
        newPositionNumberTable = i;

        if (newPositionNumberTable == positionInLocalData) {
            return;
        }

        let difPosition = newPositionNumberTable - positionInLocalData;
        dataParsed.pages[dataParsed.curPage].splice(positionInLocalData, 1);
        dataParsed.pages[dataParsed.curPage].splice(positionInLocalData + difPosition, 0, tableRowData);

        localStorage.setItem("ut-test-data", JSON.stringify(dataParsed));
        dataParsed = JSON.parse(localStorage.getItem("ut-test-data"));
        draw();
    };

    tbody.ondragover = (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (Number(e.target.parentNode.getAttribute('data-index')) > Number(tableRow.getAttribute('data-index'))) {
            e.target.parentNode.after(tableRow);
        } else {
            e.target.parentNode.before(tableRow);
        }
    };
};

function getNextElement(cursorPosition, currentElement) {
    const currentElementCoord = currentElement.getBoundingClientRect();
    const currentElementCenter = currentElementCoord.y + currentElementCoord.height / 2;

    return (cursorPosition < currentElementCenter ||
        (cursorPosition > currentElementCenter && cursorPosition < currentElementCoord.bottom))
        ? currentElement
        : currentElement.nextElementSibling || currentElement;
};

function loadData(url) {
    loaderToggler('open');
    fetch(url)
        .then(res => res.json())
        .then(data => {
            items = [];
            items[1] = data && data.results;
            let obj = {
                curPage: 1,
                nextPage: data && data.next,
                prevPage: data && data.previous,
                total: data.count,
                sortOrder: null,
                sortCol: null,
                pages: items
            }

            localStorage.setItem('ut-test-data', JSON.stringify(obj));
            btnDisabler(obj);
            draw(obj);
        })
}

function nextPage() {
    loaderToggler('open');
    let dataParsed = getData();
    let nextP = ++dataParsed.curPage;

    if (dataParsed.pages[nextP]) {
        dataParsed.curPage = nextP;
        localStorage.setItem('ut-test-data', JSON.stringify(dataParsed));
        draw(dataParsed);
    } else if (Math.ceil(dataParsed.total / 10) >= nextP) {
        fetch(`${url}?page=${nextP}`)
            .then(res => res.json())
            .then(data => {
                dataParsed.curPage = nextP;
                dataParsed.nextPage = data && data.next;
                dataParsed.prevPage = data && data.previous;
                dataParsed.pages[nextP] = data && data.results;
                localStorage.setItem('ut-test-data', JSON.stringify(dataParsed));
                draw(dataParsed);
            })
    } else {
        dataParsed.curPage = 1;
        localStorage.setItem('ut-test-data', JSON.stringify(dataParsed));
        draw(dataParsed);
    }
}

function prevPage() {
    loaderToggler('open');
    let dataParsed = getData();
    let prevP = --dataParsed.curPage;

    if (dataParsed.pages[prevP]) {
        dataParsed.curPage = prevP;
        localStorage.setItem('ut-test-data', JSON.stringify(dataParsed));
        draw(dataParsed);
    } else if (prevP > 0 || !dataParsed.pages[Math.ceil(dataParsed.total / 10)]) {
        prevP = dataParsed.pages[Math.ceil(dataParsed.total / 10)] ? prevP : Math.ceil(dataParsed.total / 10);
        fetch(`${url}?page=${prevP}`)
            .then(res => res.json())
            .then(data => {
                dataParsed.curPage = prevP;
                dataParsed.nextPage = data && data.next;
                dataParsed.prevPage = data && data.previous;
                dataParsed.pages[prevP] = data && data.results;
                localStorage.setItem('ut-test-data', JSON.stringify(dataParsed));
                draw(dataParsed);
            })
    } else {
        dataParsed.curPage = dataParsed.pages[Math.ceil(dataParsed.total / 10)] ? Math.ceil(dataParsed.total / 10) : 1;
        localStorage.setItem('ut-test-data', JSON.stringify(dataParsed));
        draw(dataParsed);
    }
}

function clear() {
    localStorage.removeItem('ut-test-data');
    let table = document.querySelector('.table');
    document.querySelector('.info').classList.remove('hidden');
    table.classList.add('hidden');
    table.innerHTML = '';
    btnDisabler({ pages: [] });
}

function getData() {
    let data = localStorage.getItem('ut-test-data');
    return JSON.parse(data);
}

function sortBy(id) {
    let dataParsed = getData();
    let allPages = [];
    dataParsed.pages.forEach((page, i) => {
        if (i !== 0) {
            allPages = [...allPages, ...page];
        }
    });

    if (dataParsed.sortOrder === null || dataParsed.sortCol !== id || dataParsed.sortOrder === 'desc') {
        dataParsed.sortCol = id;
        dataParsed.sortOrder = 'asc';
        allPages.sort((a, b) => {
            if (a[id] < b[id]) {
                return -1;
            }
            if (a[id] > b[id]) {
                return 1;
            }
            return 0;
        })
    } else {
        dataParsed.sortOrder = 'desc';
        allPages.reverse();
    }

    dataParsed.pages.forEach((page, i) => {
        if (i !== 0) {
            dataParsed.pages[i] = allPages.slice((i - 1) * 10, i * 10);
        }
    })
    localStorage.setItem('ut-test-data', JSON.stringify(dataParsed));
    draw(dataParsed);
}

function move(from, to) {
    let dataParsed = getData();
    const toMove = dataParsed.pages[dataParsed.curPage][from];

    const newArr = [
        ...dataParsed.pages[dataParsed.curPage].slice(0, from),
        ...dataParsed.pages[dataParsed.curPage].slice(from + 1)
    ];
    newArr.splice(to, 0, toMove);
    dataParsed.pages[dataParsed.curPage] = newArr;

    localStorage.setItem('ut-test-data', JSON.stringify(dataParsed));
}

const createResizableTable = (table) => {
    const cols = table.querySelectorAll('th');
    const rows = table.querySelectorAll('tr');

    cols.forEach((col, i) => {
        const resizerCol = document.createElement('div');
        resizerCol.style.height = `${table.offsetHeight}px`;
        resizerCol.classList.add('resizerCol');

        col.appendChild(resizerCol);
        col.addEventListener('click', (e) => {
            e.stopPropagation();
            let index = e.target.id;
            sortBy(index);
        })
        createResizableColumn(col, resizerCol, i);
    });

    rows.forEach((col) => {
        const resizerRow = document.createElement('div');
        resizerRow.style.width = '100%';
        resizerRow.classList.add('resizerRow');

        col.appendChild(resizerRow);
        createResizableRow(col, resizerRow);
    });
};

const createResizableColumn = (col, resizer, index) => {
    let x = 0;
    let w = 0;

    const mouseDownHandler = (e) => {
        x = e.clientX;
        const styles = window.getComputedStyle(col);
        w = parseInt(styles.width, 10);

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        resizer.classList.add('resizing');
    };

    const mouseMoveHandler = (e) => {
        const dx = e.clientX - x;
        col.style.width = `${w + dx}px`;
    };

    const mouseUpHandler = (e) => {
        let col = resizer.parentElement;
        let dataParsed = getData();

        dataParsed.cols_width = dataParsed.cols_width || [];
        dataParsed.cols_width[index] = col.style.width;

        localStorage.setItem('ut-test-data', JSON.stringify(dataParsed));
        resizer.classList.remove('resizing');

        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    resizer.addEventListener('mousedown', mouseDownHandler);
};

const createResizableRow = (row, resizer) => {
    let Y = 0;
    let h = 0;

    const mouseDownHandler = (e) => {
        let row = e.target.parentElement;
        const styles = window.getComputedStyle(row);
        row.draggable = false;

        Y = e.clientY;
        h = parseInt(styles.height, 10);

        resizer.classList.add('resizing');
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = (e) => {
        const dy = e.clientY - Y;
        row.style.height = `${h + dy}px`;
    };

    const mouseUpHandler = (e) => {
        let row = resizer.parentElement;
        let dataParsed = getData();
        row.draggable = true;

        dataParsed.pages[dataParsed.curPage][row.getAttribute('data-index')].row_height = row.style.height;
        localStorage.setItem('ut-test-data', JSON.stringify(dataParsed));

        resizer.classList.remove('resizing');
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    resizer.addEventListener('mousedown', mouseDownHandler);
};

function loaderToggler(mode) {
    if (mode === "open") {
        const loaderWrapper = document.createElement('div');
        loaderWrapper.classList.add('loader-wrapper');
        const loader = document.createElement('span');
        loader.classList.add('loader');
        loaderWrapper.appendChild(loader);
        document.body.querySelector(".container").classList.add("loading");
        document.body.appendChild(loaderWrapper);
    } else {
        document.body.querySelector(".loader-wrapper") && document.body.querySelector(".loader-wrapper").remove();
        document.body.querySelector(".container").classList.remove("loading");
    }
}

function btnDisabler(data) {
    let getBtn = document.querySelector('.get-button');
    let clearBtn = document.querySelector('.clear-button');
    if (data.pages.length > 0) {
        getBtn.disabled = true;
        clearBtn.disabled = false;
    } else {
        getBtn.disabled = false;
        clearBtn.disabled = true;
    }
}