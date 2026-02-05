// Claude: Added localStorage persistence - default data used when no saved state exists
let defaultInventory = [
    {
        category: 'Fruits',
        products: [
            { product: 'Apples', quantity: 10 },
            { product: 'Bananas', quantity: 5 },
            { product: 'Oranges', quantity: 8 },
        ]
    },
    {
        category: 'Vegetables',
        products: [
            { product: 'Tomatoes', quantity: 15 },
            { product: 'Carrots', quantity: 12 },
            { product: 'Peppers', quantity: 9 },
        ]
    }
];

// global variables
let categoryMenu = document.getElementById('categoryInput');
let productMenu = document.getElementById('productInput');
let inventory = [];
let shipment = [];
let order = [];

// Claude: Load data from localStorage, or use defaults if nothing is saved
// Claude: Shipment/order data changed from aggregated totals to timestamped log entries
function loadData() {
    let saved = localStorage.getItem('inventoryAppData');
    if (saved) {
        let data = JSON.parse(saved);
        inventory = data.inventory;
        // If old aggregated format is detected, reset to empty logs
        if (data.shipment && data.shipment.length > 0 && data.shipment[0].category && !data.shipment[0].date) {
            shipment = [];
            order = [];
        } else {
            shipment = data.shipment || [];
            order = data.order || [];
        }
    } else {
        inventory = JSON.parse(JSON.stringify(defaultInventory));
    }
}

// Claude: Save all data to localStorage after every change
function saveData() {
    localStorage.setItem('inventoryAppData', JSON.stringify({
        inventory: inventory,
        shipment: shipment,
        order: order
    }));
}

// Claude: In-page message banner replacing alert() calls
let messageBanner = document.getElementById('messageBanner');
let messageTimeout = null;
function showMessage(text, type) {
    clearTimeout(messageTimeout);
    messageBanner.textContent = text;
    messageBanner.className = 'message-banner ' + type;
    messageTimeout = setTimeout(function() {
        messageBanner.className = 'message-banner hidden';
    }, 4000);
}

// Claude: Refactored - shared helpers to reduce duplication in addShipment/addOrder
function getFormInputs() {
    return {
        category: document.getElementById('categoryInput').value,
        product: document.getElementById('productInput').value,
        quantity: parseInt(document.getElementById('quantityInput').value)
    };
}

function validateBaseInputs(inputs) {
    if (!inputs.category) {
        showMessage('Please select a category.', 'error');
        return false;
    }
    if (!inputs.product) {
        showMessage('Please select a product.', 'error');
        return false;
    }
    if (isNaN(inputs.quantity) || inputs.quantity <= 0) {
        showMessage('Please enter a valid quantity greater than zero.', 'error');
        return false;
    }
    return true;
}

// Claude: Refactored - shared log display for shipment and order history
function displayLog(elementId, logArray, emptyMessage) {
    let display = document.getElementById(elementId);
    display.innerHTML = '';
    if (logArray.length === 0) {
        display.textContent = emptyMessage;
        return;
    }
    let sorted = logArray.slice().reverse();
    sorted.forEach(entry => {
        let entryDiv = document.createElement('div');
        entryDiv.textContent = entry.date + ": " + entry.product + " x" + entry.quantity + " (" + entry.category + ")";
        display.appendChild(entryDiv);
    });
}

// Claude: Highlight an inventory item after a shipment or order
function highlightProduct(categoryName, productName, type) {
    let selector = '[data-category="' + categoryName + '"][data-product="' + productName + '"]';
    let el = document.querySelector(selector);
    if (el) {
        el.classList.add('highlight-' + type);
        el.addEventListener('animationend', function() {
            el.classList.remove('highlight-' + type);
        }, { once: true });
    }
}

// display the inventory
function displayInventory() {
    // get inventory display HTML element and store it in a variable
    let inventoryDisplay = document.getElementById('inventoryDisplay');
    inventoryDisplay.innerHTML = '';

    // iterate through inventory and create HTML to display
    inventory.forEach(category => {
        // itemGroup contains ONE category and its item list
        // Claude: Fixed XSS - replaced innerHTML with createElement/textContent
        let itemGroup = document.createElement('div');
        let heading = document.createElement('strong');
        heading.textContent = category.category + ":";
        itemGroup.appendChild(heading);
        category.products.forEach(product => {
            let productDiv = document.createElement('div');
            // Claude: Added data attributes for highlight targeting
            productDiv.dataset.category = category.category;
            productDiv.dataset.product = product.product;
            productDiv.textContent = product.product + ": " + product.quantity;
            itemGroup.appendChild(productDiv);
        });
        inventoryDisplay.appendChild(itemGroup);
    });
}

function createCategories() {
    // this function populates the Category drop-down
    // works by building a collection of <option> tags for the products
    inventory.forEach(category => {
        let categoryOption = document.createElement("option");
        categoryOption.value = category.category;
        categoryOption.textContent = category.category;
        categoryMenu.appendChild(categoryOption);
    });
    
}

function createProducts() {
    productMenu.innerHTML = '';
    let selectedCategory = inventory.find(category => category.category === categoryMenu.value);
    if (selectedCategory) {
        selectedCategory.products.forEach(product => {
            let productOption = document.createElement('option');
            productOption.value = product.product;
            productOption.textContent = product.product;
            productMenu.appendChild(productOption);
        });
    }
}
categoryMenu.addEventListener('change', createProducts);

function addNewCategory() {
    // this function adds a new category to the inventory (but not products)
    let newCategoryInput = document.getElementById('newCategoryInput').value.trim();
    // Claude: Added input validation - check for empty and duplicate category names
    if (!newCategoryInput) {
        showMessage('Please enter a category name.', 'error');
        return;
    }
    if (inventory.find(cat => cat.category === newCategoryInput)) {
        showMessage('Category "' + newCategoryInput + '" already exists.', 'error');
        return;
    }
    inventory.push({
        category: newCategoryInput,
        products: []
    });
    // the code below adds the new category to the category dropdown list
    let categoryOption = document.createElement('option');
    categoryOption.value = newCategoryInput;
    categoryOption.textContent = newCategoryInput;
    categoryMenu.appendChild(categoryOption);
    document.getElementById('newCategoryInput').value = '';
    saveData();
    displayInventory();
    showMessage('Category "' + newCategoryInput + '" added.', 'success');
}
document.getElementById('addCategoryButton').addEventListener('click', addNewCategory);

// Claude: Added ability to add a new product to an existing category
function addNewProduct() {
    let categoryInput = document.getElementById('categoryInput').value;
    let newProductInput = document.getElementById('newProductInput').value.trim();

    if (!categoryInput) {
        showMessage('Please select a category first.', 'error');
        return;
    }
    if (!newProductInput) {
        showMessage('Please enter a product name.', 'error');
        return;
    }

    let category = inventory.find(cat => cat.category === categoryInput);
    if (!category) {
        showMessage('Category not found.', 'error');
        return;
    }
    if (category.products.find(prod => prod.product === newProductInput)) {
        showMessage('Product "' + newProductInput + '" already exists in ' + categoryInput + '.', 'error');
        return;
    }

    category.products.push({ product: newProductInput, quantity: 0 });
    document.getElementById('newProductInput').value = '';
    saveData();
    displayInventory();
    createProducts();
    showMessage('Product "' + newProductInput + '" added to ' + categoryInput + '.', 'success');
}
document.getElementById('addProductButton').addEventListener('click', addNewProduct);

function addShipment() {
    let inputs = getFormInputs();
    if (!validateBaseInputs(inputs)) return;

    let category = inventory.find(cat => cat.category === inputs.category);
    if (!category) {
        category = { category: inputs.category, products: [] };
        inventory.push(category);
    }

    let product = category.products.find(prod => prod.product === inputs.product);
    if (product) {
        product.quantity += inputs.quantity;
    } else {
        category.products.push({ product: inputs.product, quantity: inputs.quantity });
    }

    shipment.push({
        category: inputs.category,
        product: inputs.product,
        quantity: inputs.quantity,
        date: new Date().toLocaleString()
    });

    document.getElementById('quantityInput').value = '';
    saveData();
    displayInventory();
    highlightProduct(inputs.category, inputs.product, 'shipment');
    displayShipment();
    showMessage('Shipment recorded: ' + inputs.product + ' x' + inputs.quantity + '.', 'success');
}

function displayShipment() {
    displayLog('shipmentDisplay', shipment, 'No shipments recorded.');
}

function addOrder() {
    let inputs = getFormInputs();
    if (!validateBaseInputs(inputs)) return;

    let category = inventory.find(cat => cat.category === inputs.category);
    if (!category) {
        showMessage('Category not found in inventory.', 'error');
        return;
    }

    let product = category.products.find(prod => prod.product === inputs.product);
    if (!product || product.quantity < inputs.quantity) {
        let available = product ? product.quantity : 0;
        showMessage('Insufficient stock. Available: ' + available + ', requested: ' + inputs.quantity + '.', 'error');
        return;
    }
    product.quantity -= inputs.quantity;

    order.push({
        category: inputs.category,
        product: inputs.product,
        quantity: inputs.quantity,
        date: new Date().toLocaleString()
    });

    document.getElementById('quantityInput').value = '';
    saveData();
    displayInventory();
    highlightProduct(inputs.category, inputs.product, 'order');
    displayOrder();
    showMessage('Order recorded: ' + inputs.product + ' x' + inputs.quantity + '.', 'success');
}

function displayOrder() {
    displayLog('orderDisplay', order, 'No orders recorded.');
}


// Claude: Clear shipment and order history with confirmation
document.getElementById('clearShipmentsButton').addEventListener('click', function() {
    if (shipment.length === 0) {
        showMessage('No shipment history to clear.', 'error');
        return;
    }
    if (confirm('Clear all shipment history?')) {
        shipment = [];
        saveData();
        displayShipment();
        showMessage('Shipment history cleared.', 'success');
    }
});

document.getElementById('clearOrdersButton').addEventListener('click', function() {
    if (order.length === 0) {
        showMessage('No order history to clear.', 'error');
        return;
    }
    if (confirm('Clear all order history?')) {
        order = [];
        saveData();
        displayOrder();
        showMessage('Order history cleared.', 'success');
    }
});

// Claude: Dark mode toggle - load preference and wire up checkbox
let themeToggle = document.getElementById('themeToggle');
let savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.dataset.theme = 'dark';
    themeToggle.checked = true;
}
themeToggle.addEventListener('change', function() {
    if (themeToggle.checked) {
        document.body.dataset.theme = 'dark';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
});

// Claude: Load saved data before rendering
loadData();
displayInventory();
displayShipment();
displayOrder();
createCategories();
