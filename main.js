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
        alert('Please enter a category name.');
        return;
    }
    if (inventory.find(cat => cat.category === newCategoryInput)) {
        alert('Category "' + newCategoryInput + '" already exists.');
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
}
document.getElementById('addCategoryButton').addEventListener('click', addNewCategory);

function addShipment() {
    // this code adds a shipment (incoming new inventory)

    let categoryInput = document.getElementById('categoryInput').value;
    let productInput = document.getElementById('productInput').value;
    let quantityInput = parseInt(document.getElementById('quantityInput').value);

    // Claude: Added input validation for shipments
    if (!categoryInput) {
        alert('Please select a category.');
        return;
    }
    if (!productInput) {
        alert('Please select a product.');
        return;
    }
    if (isNaN(quantityInput) || quantityInput <= 0) {
        alert('Please enter a valid quantity greater than zero.');
        return;
    }

    let category = inventory.find(cat => cat.category === categoryInput);
    if (!category) { // check: Why is this "not"? 
        category = { category: categoryInput, products: [] };
        inventory.push(category);
    }

    let product = category.products.find(prod => prod.product === productInput);
    if (product) {
        product.quantity += quantityInput;
    } else {
        category.products.push({ product: productInput, quantity: quantityInput });
    }

    // Claude: Changed to timestamped log entry instead of aggregated totals
    shipment.push({
        category: categoryInput,
        product: productInput,
        quantity: quantityInput,
        date: new Date().toLocaleString()
    });

    saveData();
    displayInventory();
    highlightProduct(categoryInput, productInput, 'shipment');
    displayShipment();
}

// Claude: Rewritten to display timestamped shipment log (newest first)
function displayShipment() {
    let shipmentDisplay = document.getElementById('shipmentDisplay');
    shipmentDisplay.innerHTML = '';
    if (shipment.length === 0) {
        shipmentDisplay.textContent = 'No shipments recorded.';
        return;
    }
    let sorted = shipment.slice().reverse();
    sorted.forEach(entry => {
        let entryDiv = document.createElement('div');
        entryDiv.textContent = entry.date + ": " + entry.product + " x" + entry.quantity + " (" + entry.category + ")";
        shipmentDisplay.appendChild(entryDiv);
    });
}

function addOrder() {
    let categoryInput = document.getElementById('categoryInput').value;
    let productInput = document.getElementById('productInput').value;
    let quantityInput = parseInt(document.getElementById('quantityInput').value);

    // Claude: Added input validation for orders (including stock check)
    if (!categoryInput) {
        alert('Please select a category.');
        return;
    }
    if (!productInput) {
        alert('Please select a product.');
        return;
    }
    if (isNaN(quantityInput) || quantityInput <= 0) {
        alert('Please enter a valid quantity greater than zero.');
        return;
    }

    let category = inventory.find(cat => cat.category === categoryInput);
    if (!category) {
        alert('Category not found in inventory.');
        return;
    }

    let product = category.products.find(prod => prod.product === productInput);
    if (!product || product.quantity < quantityInput) {
        let available = product ? product.quantity : 0;
        alert('Insufficient stock. Available: ' + available + ', requested: ' + quantityInput + '.');
        return;
    }
    product.quantity -= quantityInput;

    // Claude: Changed to timestamped log entry instead of aggregated totals
    order.push({
        category: categoryInput,
        product: productInput,
        quantity: quantityInput,
        date: new Date().toLocaleString()
    });

    saveData();
    displayInventory();
    highlightProduct(categoryInput, productInput, 'order');
    displayOrder();
}

// Claude: Rewritten to display timestamped order log (newest first)
function displayOrder() {
    let orderDisplay = document.getElementById('orderDisplay');
    orderDisplay.innerHTML = '';
    if (order.length === 0) {
        orderDisplay.textContent = 'No orders recorded.';
        return;
    }
    let sorted = order.slice().reverse();
    sorted.forEach(entry => {
        let entryDiv = document.createElement('div');
        entryDiv.textContent = entry.date + ": " + entry.product + " x" + entry.quantity + " (" + entry.category + ")";
        orderDisplay.appendChild(entryDiv);
    });
}


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
