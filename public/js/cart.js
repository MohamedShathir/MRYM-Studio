// CONFIGURATION
const PHONE_NUMBER = "918148010579"; // Your WhatsApp Number
const UPI_ID = "mshathir2312@oksbi";       // <--- REPLACE THIS WITH YOUR ACTUAL UPI ID (e.g., mobile@okaxis)
const PAYEE_NAME = "MRYM Studio";    // The name displayed in GPay

// State
let cart = JSON.parse(localStorage.getItem('mrym-cart')) || [];

// --- 1. Add to Cart ---
function addToCart(product) {
    const existingItem = cart.find(item => item.name === product.name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: product.name,
            price: parseFloat(product.price),
            quantity: 1
        });
    }
    saveCart();
    updateCartUI();
    openCart();
}

// --- 2. Save & Update UI ---
function saveCart() {
    localStorage.setItem('mrym-cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    // Update Badge
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalQty;
    
    // Calculate Total
    let totalPrice = 0;
    cartItemsContainer.innerHTML = '';

    cart.forEach((item, index) => {
        totalPrice += item.price * item.quantity;
        
        const itemEl = document.createElement('div');
        itemEl.classList.add('cart-item');
        itemEl.innerHTML = `
            <div class="item-details">
                <h4>${item.name}</h4>
                <p>₹${item.price.toFixed(2)} x ${item.quantity}</p>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${index})">×</button>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    cartTotal.textContent = "₹" + totalPrice.toFixed(2);
}

// --- 3. Remove Item ---
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

// --- 4. Toggle Cart Modal ---
function toggleCart() {
    // Reset to cart view if it was in payment mode
    document.getElementById('cart-view').style.display = 'block';
    document.getElementById('payment-view').style.display = 'none';
    document.getElementById('cart-modal').classList.toggle('active');
}
function openCart() {
    document.getElementById('cart-view').style.display = 'block';
    document.getElementById('payment-view').style.display = 'none';
    document.getElementById('cart-modal').classList.add('active');
}
function closeCart() {
    document.getElementById('cart-modal').classList.remove('active');
}

// --- 5. NEW: Proceed to Payment Screen ---
function showPaymentScreen() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

    // 1. Construct UPI Link
    // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${totalPrice}&cu=INR`;

    // 2. Generate QR Code (using free API)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;

    // 3. Update DOM Elements
    document.getElementById('pay-amount-display').textContent = "₹" + totalPrice;
    document.getElementById('upi-qr').src = qrCodeUrl;
    document.getElementById('pay-now-btn').href = upiLink;

    // 4. Switch Views
    document.getElementById('cart-view').style.display = 'none';
    document.getElementById('payment-view').style.display = 'block';
}

// --- 6. Final Step: WhatsApp Redirect ---
function sendOrderToWhatsApp() {
    let message = "Hi MRYM Studio! I have completed the payment.\n\n*Order Details:*\n";
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        message += `- ${item.name} (x${item.quantity}) : ₹${itemTotal.toFixed(2)}\n`;
        total += itemTotal;
    });

    message += `\n*Total Paid: ₹${total.toFixed(2)}*`;
    message += `\n\n(I will attach the payment screenshot in the next message)`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    
    // Optional: Clear cart after order is sent
    // cart = [];
    // saveCart();
    // updateCartUI();
    // closeCart();
}

document.addEventListener('DOMContentLoaded', updateCartUI);