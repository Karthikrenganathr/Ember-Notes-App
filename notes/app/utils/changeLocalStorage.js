export default function updateLocalStorage(id, newNode) {
  let existingNote = localStorage.getItem(id);
  let note = existingNote ? JSON.parse(existingNote) : {};
  for (let key of Object.keys(newNode)) {
    note[key] = newNode[key];
  }
  localStorage.setItem(id, JSON.stringify(note));
  return { success: true };
}
export async function syncOfflineNotes() {
  console.log("online");
  if (!navigator.onLine) return;
  let keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    keys.push(localStorage.key(i));
  }
  keys.sort((a, b) => parseInt(a) - parseInt(b));
  let notesArray = [];
  keys.forEach((key) => {
    let storedData = localStorage.getItem(key);
    let parsedData = JSON.parse(storedData);
    notesArray.push({ [key]: parsedData });
  });
  if (notesArray.length > 0) {
    try {
      let response = await fetch("http://localhost:5070/notes/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notesArray }),
      });
      if (!response.ok) {
        throw new Error(`Failed with status code: ${response.status}`);
      }
      let result = await response.json();
      if (result.success) {
        localStorage.clear();
        location.reload();
      }
    } catch (error) {
      console.error("Failed to sync offline notes:", error);
    }
  }
}
