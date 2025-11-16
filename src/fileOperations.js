// ==== ./src/fileOperations.js ====
export function downloadFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error('File reading failed.'));
    
    reader.readAsText(file);
  });
}
