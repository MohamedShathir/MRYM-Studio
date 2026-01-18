document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'all';

    const pageTitle = document.getElementById('page-title');
    if(pageTitle) pageTitle.textContent = category === 'all' ? "All Products" : category.charAt(0).toUpperCase() + category.slice(1);

    fetch('data/products.csv')
        .then(res => res.text())
        .then(csvText => {
            const products = csvToJSON(csvText);
            const grid = document.getElementById('product-grid');
            if(!grid) return;
            
            grid.innerHTML = '';
            const filtered = products.filter(p => category === 'all' || p.category.trim().toLowerCase() === category.toLowerCase());

            if(filtered.length === 0) {
                grid.innerHTML = '<p>No products found.</p>';
                return;
            }

            filtered.forEach(p => {
                const safeName = p.name.replace(/'/g, "\\'");
                const card = document.createElement('div');
                card.classList.add('product-card');
                card.innerHTML = `
                    <div class="product-img">
                        <img src="assets/images/${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://placehold.co/300?text=No+Image'">
                    </div>
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <div class="price-row">
                            <span>₹${parseFloat(p.price).toFixed(2)}</span>
                            <button class="btn-sm" onclick="addToCart({name:'${safeName}', price:${p.price}})">Add</button>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        });
});

function csvToJSON(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].trim().split(',');
    const result = [];
    for(let i=1; i<lines.length; i++) {
        if(!lines[i].trim()) continue;
        const obj = {};
        const currentline = lines[i].split(',');
        headers.forEach((h, j) => obj[h.trim()] = currentline[j].trim());
        result.push(obj);
    }
    return result;
}