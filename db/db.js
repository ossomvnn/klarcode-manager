function giveCode(name, part, count) {
    const data = loadData();
    const today = new Date().toISOString().split('T')[0];
    const existing = data.find(r => r.name === name);

    if (existing) {
        const lastDate = new Date(existing.lastDate);
        const diffDays = Math.floor((new Date() - lastDate) / (1000*60*60*24));
        if (diffDays < 28) {
            const nextAvailable = new Date(lastDate);
            nextAvailable.setDate(nextAvailable.getDate() + 28);
            return { 
                success: false, 
                message: `${name} already has a code.`, 
                nextAvailable: nextAvailable.toISOString().split('T')[0] 
            };
        }
        existing.totalCodes += count;
        existing.lastDate = today;
    } else {
        data.push({ name, part, totalCodes: count, lastDate: today });
    }

    saveData(data);
    return { success: true, message: `Code successfully given to ${name} on ${today}` };
}
