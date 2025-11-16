const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// OLD: const dbPath = path.join(__dirname, 'residents.json');
// NEW: use app's user data folder so it works in packaged app
const dbPath = path.join(app.getPath('userData'), 'residents.json');

function loadData() {
    try {
        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, JSON.stringify([]));
        }
        const data = fs.readFileSync(dbPath);
        return JSON.parse(data);
    } catch (err) {
        console.error("Error loading data:", err);
        return [];
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error saving data:", err);
    }
}

function giveCode(name, part, count) {
    const data = loadData();
    const today = new Date().toISOString().split('T')[0];
    const existing = data.find(r => r.name.toLowerCase() === name.toLowerCase());

    if (existing) {
        const lastDate = new Date(existing.lastDate);
        const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays < 28) {
            const nextAvailable = new Date(lastDate);
            nextAvailable.setDate(nextAvailable.getDate() + 28);
            return {
                success: false,
                message: `${name} hat bereits einen Code.`,
                nextAvailable: nextAvailable.toISOString().split('T')[0]
            };
        }
        existing.totalCodes += count;
        existing.lastDate = today;
    } else {
        data.push({ name, part, totalCodes: count, lastDate: today });
    }

    saveData(data);
    return { success: true, message: `Code erfolgreich an ${name} vergeben am ${today}` };
}

function getAllResidents() {
    return loadData();
}

function addResidentManual({ name, part, count, lastDate }) {
    const data = loadData();
    const existing = data.find(r => r.name.toLowerCase() === name.toLowerCase());

    if (existing) {
        const last = new Date(existing.lastDate);
        const diffDays = Math.floor((new Date() - last) / (1000 * 60 * 60 * 24));
        if (diffDays < 28) {
            const nextAvailable = new Date(last);
            nextAvailable.setDate(nextAvailable.getDate() + 28);
            return {
                success: false,
                message: `${name} hat bereits einen Code. Nächster verfügbarer Code: ${nextAvailable.toISOString().split('T')[0]}`,
                nextAvailable: nextAvailable.toISOString().split('T')[0]
            };
        }
    }

    if (existing) {
        existing.part = part;
        existing.totalCodes += count;
        existing.lastDate = lastDate;
    } else {
        data.push({ name, part, totalCodes: count, lastDate });
    }

    saveData(data);
    return { success: true, message: `${name} wurde erfolgreich hinzugefügt.` };
}

function removeExpiredResidents() {
    const data = loadData();
    const today = new Date();
    const filtered = data.filter(r => {
        const last = new Date(r.lastDate);
        const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
        return diffDays < 28; // keep only under 28 days
    });
    saveData(filtered);
}

function removeResident(name) {
    let data = loadData();
    const index = data.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
    if (index === -1) return { success: false, message: `${name} nicht gefunden.` };

    data.splice(index, 1);
    saveData(data);
    return { success: true, message: `${name} wurde entfernt.` };
}

function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('home.html');
}

app.whenReady().then(createWindow);

ipcMain.handle('give-code', async (event, data) => giveCode(data.name, data.part, data.count));
ipcMain.handle('get-residents', async () => {
    removeExpiredResidents(); // Clean expired residents automatically
    return getAllResidents();
});
ipcMain.handle('add-resident-manual', async (event, data) => addResidentManual(data));
ipcMain.handle('remove-resident', async (event, name) => removeResident(name));

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
