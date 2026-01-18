import { db } from "./firebase-config.js";
import { collection, getDocs, orderBy, query, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Admin Security Check (Simple Password)
const isAuthenticated = sessionStorage.getItem('admin_auth');
if (!isAuthenticated) {
    const password = prompt("Enter Admin Password:");
    if (password === "admin123") {
        sessionStorage.setItem('admin_auth', 'true');
    } else {
        alert("Access Denied");
        window.location.href = "index.html";
    }
}

// Global variable to store fetched orders
let allOrders = [];

// 2. Load Data on Start
document.addEventListener('DOMContentLoaded', async () => {
    await fetchOrders();
    
    // Listen for Filter Changes
    document.getElementById('time-filter').addEventListener('change', (e) => {
        renderDashboard(e.target.value);
    });
});

// 3. Fetch Orders from Firebase
async function fetchOrders() {
    const container = document.getElementById('orders-container');
    try {
        const q = query(collection(db, "custom_orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        allOrders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure date object exists for filtering
            dateObj: new Date(doc.data().createdAt)
        }));

        renderDashboard('all');

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="color:red; text-align:center;">Error: ${error.message}</p>`;
    }
}

// 4. Render Logic (Filtering & Grouping)
function renderDashboard(filterType) {
    const container = document.getElementById('orders-container');
    container.innerHTML = '';

    // A. Filter by Date
    const now = new Date();
    const filteredOrders = allOrders.filter(order => {
        if (filterType === 'all') return true;
        
        const orderDate = order.dateObj;
        if (filterType === 'month') {
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        }
        if (filterType === 'week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            return orderDate >= oneWeekAgo;
        }
    });

    // B. Calculate & Update Stats
    updateStats(filteredOrders);

    // C. Group by User ID
    const grouped = {};
    filteredOrders.forEach(order => {
        const uid = order.userId || "guest";
        if (!grouped[uid]) {
            grouped[uid] = { 
                name: order.userName || "Unknown", 
                email: order.userEmail, 
                orders: [] 
            };
        }
        grouped[uid].orders.push(order);
    });

    // D. Build HTML for Groups
    if (Object.keys(grouped).length === 0) {
        container.innerHTML = '<p style="text-align:center;">No orders found for this period.</p>';
        return;
    }

    Object.keys(grouped).forEach(userId => {
        const user = grouped[userId];
        const groupDiv = document.createElement('div');
        groupDiv.className = 'user-group';
        
        groupDiv.innerHTML = `
            <div class="user-header" onclick="this.nextElementSibling.classList.toggle('active')">
                <div>
                    <strong>${user.name}</strong> <span style="color:#666; font-size:0.9rem;">(${user.email})</span>
                </div>
                <div>
                    <span style="background:#eee; padding:2px 8px; border-radius:10px; font-size:0.8rem;">
                        ${user.orders.length} Files
                    </span> 
                    ▼
                </div>
            </div>
            <div class="user-orders active">
                <table class="admin-table" style="width:100%; border-collapse:collapse;">
                    ${user.orders.map(order => createOrderRow(order)).join('')}
                </table>
            </div>
        `;
        container.appendChild(groupDiv);
    });
}

// 5. Helper: Create Table Row HTML
function createOrderRow(order) {
    // Determine button class based on status
    let statusClass = 'status-pending';
    let label = 'Pending';
    
    if (order.status === 'production') { statusClass = 'status-production'; label = 'In Production'; }
    else if (order.status === 'delivered') { statusClass = 'status-delivered'; label = 'Delivered'; }
    else if (order.status === 'rejected') { statusClass = 'status-rejected'; label = 'Rejected'; }

    return `
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:15px;">${order.projectName}</td>
            <td style="padding:15px;">
                <a href="${order.modelUrl}" target="_blank" style="color:#007bff; text-decoration:none; font-weight:bold;">⬇ STL File</a>
                ${order.referenceImgUrl ? `<br><a href="${order.referenceImgUrl}" target="_blank" style="font-size:0.8rem; color:#666;">View Image</a>` : ''}
            </td>
            <td style="padding:15px; color:#555; font-size:0.9rem;">${order.instructions || "No instructions"}</td>
            <td style="padding:15px;">${order.dateObj.toLocaleDateString()}</td>
            <td style="padding:15px; text-align:right;">
                <button 
                    id="btn-${order.id}" 
                    class="status-btn ${statusClass}" 
                    onclick="window.cycleStatus('${order.id}', '${order.status}')">
                    ${label}
                </button>
            </td>
        </tr>
    `;
}

// 6. Update Stats Logic
function updateStats(orders) {
    document.getElementById('stat-total').textContent = orders.length;
    document.getElementById('stat-production').textContent = orders.filter(o => o.status === 'production').length;
    document.getElementById('stat-delivered').textContent = orders.filter(o => o.status === 'delivered').length;
    document.getElementById('stat-rejected').textContent = orders.filter(o => o.status === 'rejected').length;
}

// 7. Global Function: Cycle Status (Pending -> Production -> Delivered -> Rejected)
window.cycleStatus = async function(orderId, currentStatus) {
    let newStatus = 'pending';
    
    // Cycle Logic
    if (!currentStatus || currentStatus === 'pending_review' || currentStatus === 'pending') newStatus = 'production';
    else if (currentStatus === 'production') newStatus = 'delivered';
    else if (currentStatus === 'delivered') newStatus = 'rejected';
    else if (currentStatus === 'rejected') newStatus = 'pending';

    // Update UI immediately (Optimistic UI)
    const btn = document.getElementById(`btn-${orderId}`);
    btn.textContent = "Updating...";
    
    try {
        // Update Firebase
        const orderRef = doc(db, "custom_orders", orderId);
        await updateDoc(orderRef, { status: newStatus });
        
        // Update Local Data & Re-render
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if (orderIndex > -1) {
            allOrders[orderIndex].status = newStatus;
            // Get current filter to stay on same view
            const currentFilter = document.getElementById('time-filter').value;
            renderDashboard(currentFilter);
        }
    } catch (error) {
        alert("Error updating status: " + error.message);
    }
};