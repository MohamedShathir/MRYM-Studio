// --- CONFIGURATION ---
const PRODUCTS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQN83ggn5haWWIJswdllwY6GGdCMlkMxoW0hJ_Tn0VncRTmr2KscgvyregR_MKWP7g31LwrW4QIRe5_/pub?gid=0&single=true&output=csv";

// --- GLOBAL MEMORY BANK ---
window.ALL_PRODUCTS = [];

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Script Started: product-loader.js is running.");

    const container = document.getElementById("product-container");
    if (!container) return console.error("CRITICAL ERROR: No #product-container found.");

    try {
        container.innerHTML = '<p style="text-align:center; padding: 20px;">Loading products...</p>';
        
        // 1. FETCH
        const response = await fetch(PRODUCTS_URL + "&t=" + Date.now());
        const data = await response.text();
        
        // 2. PARSE
        window.ALL_PRODUCTS = parseCSV(data);
        
        container.innerHTML = ""; 

        if(window.ALL_PRODUCTS.length === 0) {
            container.innerHTML = '<p style="text-align:center;">No products found.</p>';
            return;
        }

        // 3. RENDER
        window.ALL_PRODUCTS.forEach((product, index) => {
            const card = createProductCard(product, index);
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error("Error:", error);
        container.innerHTML = `<p style="text-align:center; color:red;">Error: ${error.message}</p>`;
    }
});

// --- HELPER 1: PARSE CSV ---
function parseCSV(csvText) {
    const lines = csvText.split("\n");
    const headers = lines[0].trim().replace(/^\uFEFF/, '').split(",").map(h => h.trim().replace(/"/g, '').toLowerCase()); 
    
    return lines.slice(1).map((line, rowIndex) => {
        if (!line.trim()) return null;
        
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        let obj = {};
        
        headers.forEach((header, i) => {
            let val = values[i] ? values[i].trim().replace(/^"|"$/g, '') : "";
            
            // MAP HEADERS
            if (header.includes('name') || header.includes('title')) header = 'name';
            if (header === 'id' || header.includes('id')) header = 'id';
            
            if (header.includes('price')) {
                const cleanPrice = val.replace(/[^0-9.]/g, ''); 
                val = parseFloat(cleanPrice) || 0;
                header = 'price';
            }
            
            if (header.includes('image') || header.includes('img')) {
                if(val.includes('drive.google.com')) val = convertDriveLink(val);
                header = 'image';
            }
            
            obj[header] = val;
        });

        // Ensure ID exists
        if (!obj.id) obj.id = `item_${rowIndex}`;
        
        return obj;
    }).filter(item => item && item.name);
}

// --- HELPER 2: DRIVE LINKS ---
function convertDriveLink(link) {
    try {
        const idMatch = link.match(/\/d\/(.*?)\//);
        if (idMatch && idMatch[1]) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
        return link;
    } catch (e) { return link; }
}

// --- HELPER 3: CREATE CARD ---
function createProductCard(product, index) {
    const div = document.createElement("div");
    div.className = "product-card"; 
    
    const imgUrl = product.image || 'https://placehold.co/400?text=No+Image';
    const formattedPrice = product.price.toFixed(2);
    
    // RENAMED FUNCTION: We use 'triggerCartEvent' so it NEVER conflicts with cart.js
    div.innerHTML = `
        <div class="product-image" style="height: 280px; width: 100%; overflow: hidden; background-color: #f5f5f5; display: flex; align-items: center; justify-content: center;">
            <img src="${imgUrl}" alt="${product.name}" loading="lazy" 
                 style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.src='https://placehold.co/400?text=Image+Error';">
        </div>
        
        <div class="product-info" style="padding: 15px;">
            <h3 style="margin: 0 0 10px 0; font-size: 1.1rem; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                ${product.name}
            </h3>
            
            <div class="price-row" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <span class="price" style="font-weight: bold; font-size: 1.1rem; color: #333;">₹${formattedPrice}</span>
                
                <button class="add-btn" 
                    onclick="triggerCartEvent(${index})"
                    style="padding: 8px 16px; background: #333; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
                    Add
                </button>
            </div>
        </div>
    `;
    return div;
}

// --- HELPER 4: TRIGGER EVENT ---
// This function name is now unique. It won't get overwritten.
window.triggerCartEvent = function(index) {
    const p = window.ALL_PRODUCTS[index];
    if (!p) return alert("Error: Product data missing.");

    console.log("Dispatching Event for:", p.name);

    // Send data to cart.js
    const event = new CustomEvent('add-to-cart', { detail: p });
    document.dispatchEvent(event);
};