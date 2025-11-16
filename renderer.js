const { ipcRenderer } = require('electron');

// --- Give Code ---
async function giveCodeForm() {
    const name = document.getElementById('nameInput').value;
    const part = document.getElementById('partSelect').value;
    const count = parseInt(document.getElementById('countInput').value);

    if (!name || !part || !count) {
        alert('Please fill all fields!');
        return;
    }

    const result = await ipcRenderer.invoke('give-code', { name, part, count });

    if (result.success) {
        alert(`✅ ${result.message}`);  // Success message in green style
    } else {
        let msg = `❌ ${result.message}`;  // Error message in red style
        if (result.nextAvailable) {
            msg += ` Next available: ${result.nextAvailable}`;
        }
        alert(msg);
    }

    loadResidents(); // Refresh Residents page/table
}

// --- Load Residents ---
async function loadResidents() {
    const residents = await ipcRenderer.invoke('get-residents'); // Fetch all residents from db
    const table = document.getElementById('residentsTable');

    if (!table) return; // Make sure table exists on the page

    // Clear table
    table.innerHTML = `
        <tr>
            <th>Name</th>
            <th>Part</th>
            <th>Total Codes</th>
            <th>Last Date</th>
            <th>Next Available</th>
        </tr>
    `;

    // Add residents
    residents.forEach(r => {
        const lastDate = new Date(r.lastDate);
        const nextAvailable = new Date(lastDate);
        nextAvailable.setDate(nextAvailable.getDate() + 28);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${r.name}</td>
            <td>${r.part}</td>
            <td>${r.totalCodes}</td>
            <td>${r.lastDate}</td>
            <td>${nextAvailable.toISOString().split('T')[0]}</td>
        `;
        table.appendChild(row);
    });
}

async function addNewResident() {
    const name = document.getElementById('nameInput').value.trim();
    const part = document.getElementById('partInput').value;
    const count = parseInt(document.getElementById('countInput').value);
    const lastDate = document.getElementById('dateInput').value;

    if (!name || !part || !count || !lastDate) {
        showMessage("❌ Bitte füllen Sie alle Felder aus!", "red");
        return;
    }
function showMessage(msg, color) {
    const messageBox = document.getElementById('message');
    messageBox.textContent = msg;
    messageBox.style.color = color;
    setTimeout(() => { messageBox.textContent = ""; }, 4000);
}
    const result = await ipcRenderer.invoke('add-resident-manual', { name, part, count, lastDate });

    // Show message depending on success
    if (result.success) {
        showMessage(`✅ ${result.message}`, "green");
    } else {
        // This will also show the 28-day restriction message
        showMessage(`❌ ${result.message}`, "red");
    }

    // Reload the table
    loadResidents();
}



// --- On Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadResidents();
});
