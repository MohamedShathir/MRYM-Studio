document.addEventListener('DOMContentLoaded', () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'all';

    const pageTitle = document.getElementById('page-title');
    if(category !== 'all') {
        pageTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    } else {
        pageTitle.textContent = "All Products";
    }

    fetch('data/products.csv')
        .then(response => response.text())
        .then(csvText => {
            const products = csvToJSON(csvText);
            const productGrid = document.getElementById('product-grid');
            productGrid.innerHTML = ''; 

            const filteredProducts = products.filter(product => {
                if (category === 'all') return true;
                return product.category.trim().toLowerCase() === category.toLowerCase();
            });

            if (filteredProducts.length === 0) {
                productGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No products found in this category.</p>';
                return;
            }

            filteredProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.classList.add('product-card');
                
                const safeName = product.name.replace(/'/g, "\\'");

                productCard.innerHTML = `
                    <div class="product-img">
                        <img src="assets/images/${product.image}" 
                             alt="${product.name}" 
                             style="width: 100%; height: 100%; object-fit: cover;"
                             onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=No+Image';">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <div class="price-row">
                            <span class="price">₹${parseFloat(product.price).toFixed(2)}</span>
                            
                            <button class="btn-sm" 
                                onclick="addToCart({
                                    name: '${safeName}', 
                                    price: ${product.price}
                                })">
                                Add to Cart
                            </button>

                        </div>
                    </div>
                `;
                productGrid.appendChild(productCard);
            });
        })
        .catch(error => console.error('Error loading products:', error));
});

function csvToJSON(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].trim().split(',');
    
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const currentLine = lines[i].split(',');
        const obj = {};

        for (let j = 0; j < headers.length; j++) {
            const key = headers[j].trim();
            const value = currentLine[j] ? currentLine[j].trim() : "";
            obj[key] = value;
        }
        result.push(obj);
    }
    return result;
}