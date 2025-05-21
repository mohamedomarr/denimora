//==========popup Functionality===============
// Show popup automatically
window.onload = function() {
    document.getElementById('popup').style.display = 'flex';
}
// Close the popup
function closePopup() {
    document.getElementById('popup').style.display = 'none';
}
// Switch between Login and Sign Up
function showTab(tab) {
    document.getElementById('login').style.display = (tab === 'login') ? 'block' : 'none';
    document.getElementById('signup').style.display = (tab === 'signup') ? 'block' : 'none';

    let tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => btn.classList.remove('active'));
    if (tab === 'login') tabs[0].classList.add('active');
    else tabs[1].classList.add('active');
}





// ====================Mobile Menu Functionality===================
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobileMenu');
function openMobileMenu() {
    mobileMenu.classList.add('active');
}
function closeMobileMenu() {
    mobileMenu.classList.remove('active');
}
menuBtn.addEventListener('click', openMobileMenu);
// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        closeMobileMenu();
    }
});
// Close mobile menu when clicking on a link
const mobileMenuLinks = mobileMenu.querySelectorAll('nav a');
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});




// ====================Cart Menu Functionality===================
const cartBtn = document.getElementById('cart-btn');
const cartMenu = document.getElementById('cartMenu');
function openCartMenu() {
    cartMenu.classList.add('active');
}
function closeCartMenu() {
    cartMenu.classList.remove('active');
}
cartBtn.addEventListener('click', openCartMenu);
// Close cart menu when clicking outside
document.addEventListener('click', (e) => {
    if (!cartMenu.contains(e.target) && !cartBtn.contains(e.target)) {
        closeCartMenu();
    }
});




//===================side bar size chart======================
const sizeChartBtn = document.getElementById('size-chart-btn');
const sizeChart = document.getElementById('size-chart');
const closeSizeChartBtn = document.getElementById('close-size-chart-btn');
function openSizeChart() {
    sizeChart.classList.add('active');
}
function closeSizeChart() {
    sizeChart.classList.remove('active');
}
sizeChartBtn.addEventListener('click', openSizeChart);
closeSizeChartBtn.addEventListener('click', closeSizeChart);
// Close size chart when clicking outside
document.addEventListener('click', (e) => {
    if (!sizeChart.contains(e.target) && !sizeChartBtn.contains(e.target)) {
        closeSizeChart();
    }
});



//===================Shop Page Item Functionality======================
// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const productName = urlParams.get('name');
const productPrice = urlParams.get('price');
const productImage = urlParams.get('image');

// Update page content
document.getElementById('productName').textContent = productName;
document.getElementById('productPrice').textContent = `LE ${productPrice}.00`;
document.getElementById('productPriceDisplay').textContent = `LE ${productPrice}.00`;
document.getElementById('productImage').src = `Assets/Shop/${productImage}`;
document.getElementById('productImage').alt = productName;

// Update page title
document.title = `DENIMORA - ${productName}`;

// Quantity functions
function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    if (quantityInput.value > 1) {
        quantityInput.value = parseInt(quantityInput.value) - 1;
    }
}

function increaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    quantityInput.value = parseInt(quantityInput.value) + 1;
}

// Add to cart function
function addToCart() {
    const quantity = document.getElementById('quantity').value;
    // Add your cart functionality here
    alert(`Added ${quantity} ${productName} to cart!`);
}




