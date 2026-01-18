import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const PHONE_NUMBER = "918148010579";
let cart = JSON.parse(localStorage.getItem('mrym-cart')) || [];
let currentUser = null;

// --- 1. Header & Auth Logic ---
onAuthStateChanged(auth, async (user) => {
    const authContainer = document.getElementById('auth-container');

    if (user) {
        currentUser = user;
        
        if(authContainer) {
            authContainer.innerHTML = `
                <div class="profile-dropdown">
                    <button class="profile-btn" onclick="toggleProfileMenu()">
                        Hi, ${user.displayName ? user.displayName.split(' ')[0] : 'User'} ▼
                    </button>
                    <div id="dropdown-menu" class="dropdown-menu">
                        <a href="account.html">Account Settings</a>
                        <button onclick="handleLogout()" style="color:red;">Logout</button>
                    </div>
                </div>
            `;
        }

        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists() && docSnap.data().cart) {
            cart = docSnap.data().cart;
            updateCartUI();
        }
    } else {
        currentUser = null;
        if(authContainer) {
            authContainer.innerHTML = `
                <a href="signup.html" style="text-decoration:none; color:inherit; font-weight:500;">Signup</a>
                <a href="login.html" class="btn-sm">Login</a>
            `;
        }
    }
});

window.toggleProfileMenu = function() {
    const menu = document.getElementById("dropdown-menu");
    if(menu) menu.classList.toggle("show");
}

window.onclick = function(event) {
    if (!event.target.matches('.profile-btn')) {
        const dropdowns = document.getElementsByClassName("dropdown-menu");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].classList.contains('show')) {
                dropdowns[i].classList.remove('show');
            }
        }
    }
}

window.handleLogout = async function() {
    try {
        await signOut(auth);
        cart = [];
        localStorage.removeItem('mrym-cart');
        window.location.href = "login.html";
    } catch (error) {
        alert("Logout failed: " + error.message);
    }
};

// --- 2. THE ADD TO CART FUNCTION ---
window.addToCart = async function(product) {
    console.log("Cart received:", product); // Debug check

    const existing = cart.find(item => item.name === product.name);
    if (existing) {
        existing.quantity++;
    } else {
        // Ensure price is a number
        const price = parseFloat(product.price) || 0;
        cart.push({ ...product, price: price, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
    openCart();
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
};

async function saveCart() {
    if (currentUser) {
        await updateDoc(doc(db, "users", currentUser.uid), { cart: cart });
    } else {
        localStorage.setItem('mrym-cart', JSON.stringify(cart));
    }
}

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    if(countEl) countEl.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
    
    const container = document.getElementById('cart-items');
    if(!container) return;

    container.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
            <div><h4>${item.name}</h4><p>₹${item.price} x ${item.quantity}</p></div>
            <button class="remove-btn" onclick="removeFromCart(${index})">×</button>
        `;
        container.appendChild(div);
    });
    
    const totalEl = document.getElementById('cart-total');
    if(totalEl) totalEl.textContent = "₹" + total.toFixed(2);
}

window.checkout = async function() {
    if (cart.length === 0) return alert("Cart is empty!");

    let addressInfo = "";
    if (currentUser) {
        const docSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (docSnap.exists() && docSnap.data().address) {
            addressInfo = `\n\n*Shipping Address:*\n${docSnap.data().address}`;
        }
    }

    let msg = "👋 Hi MRYM Studio! New Order:\n\n";
    let total = 0;
    cart.forEach(item => {
        msg += `- ${item.name} (x${item.quantity}): ₹${(item.price*item.quantity).toFixed(2)}\n`;
        total += item.price * item.quantity;
    });
    msg += `\n*Total: ₹${total.toFixed(2)}*`;
    msg += addressInfo;
    msg += `\n\nPlease send payment QR.`;
    
    window.open(`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
};

window.toggleCart = () => document.getElementById('cart-modal').classList.toggle('active');
window.openCart = () => document.getElementById('cart-modal').classList.add('active');
window.closeCart = () => document.getElementById('cart-modal').classList.remove('active');

document.addEventListener('DOMContentLoaded', updateCartUI);

// --- 3. NEW: LISTENER FOR PRODUCT LOADER ---
// This catches the 'add-to-cart' signal from the product page
document.addEventListener('add-to-cart', (event) => {
    const productData = event.detail;
    if(productData) {
        window.addToCart(productData);
    }
});