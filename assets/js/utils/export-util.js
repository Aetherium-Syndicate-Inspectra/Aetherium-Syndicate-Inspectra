export class ExportUtil {
    static toJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    static toCSV(data, filename) {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${filename}-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
