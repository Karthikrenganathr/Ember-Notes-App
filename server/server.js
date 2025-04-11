const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
 
const app = express();
const PORT = 5070;
 
// Middleware
app.use(cors());
app.use(bodyParser.json({ type: ['application/json', 'application/vnd.api+json'] }));
 
// In-memory data store
let notesId = 4; // Start at 4 since we'll have 3 initial notes
let notes = [];
let unPinOrderId = 3; // Start at 3 for unpinned notes (2 initial unpinned notes)
let pinOrderId = 2; // Start at 2 for pinned notes (1 initial pinned note)
let TrashOrder = 1;
 
// Initialize with sample data
function initializeData() {
  // Add initial notes
  notes = [
    {
      id: 1,
      title: "Hi",
      text: "Welcome to ZoomRX",
      category: "mainNote",
      isPinned: false,
      orderId: 1
    },
    {
      id: 2,
      title: "Welcome",
      text: "to Javascript",
      category: "mainNote",
      isPinned: false,
      orderId: 2
    },
    {
      id: 3,
      title: "test",
      text: "view",
      category: "mainNote",
      isPinned: true,
      orderId: 1
    }
  ];
 
  console.log("Server initialized with sample data:", notes);
}
 
// Helper function to convert note to JSON:API format
function noteToJsonAPI(note) {
  return {
    id: note.id.toString(),
    type: "note", // Changed from "notes" to "note" to match singular model name
    attributes: {
      title: note.title,
      text: note.text,
      category: note.category,
      isPinned: note.isPinned,
      orderId: note.orderId
    }
  };
}
 
// Get notes with optional category filter
app.get('/notes', (req, res) => {
  const url = new URL(`http://localhost:${PORT}${req.url}`);
  const category = url.searchParams.get("category");

  // clone before modifying
  let clonedNotes = [...notes];

  // filter if needed
  if (category) {
    clonedNotes = clonedNotes.filter((note) => note.category === category);
  }

  // sort cloned, filtered list
  const sortedNotes = clonedNotes.sort((a, b) => b.orderId - a.orderId);

  // convert to JSON:API format
  const jsonApiNotes = sortedNotes.map(noteToJsonAPI);

  res.json({ data: jsonApiNotes });
});

 
// Get a single note
app.get('/notes/:id', (req, res) => {
  const noteId = Number(req.params.id);
  const note = notes.find((n) => n.id === noteId);
 
  if (!note) {
    return res.status(404).json({
      errors: [{ status: '404', title: 'Note not found' }]
    });
  }
 
  // Format for JSON:API
  res.json({ data: noteToJsonAPI(note) });
});
 
// Create a new note
app.post('/notes', (req, res) => {
  let requestData;
 
  if (req.body.data && req.body.data.attributes) {
    // Handle JSON:API format from Ember Data
    const attrs = req.body.data.attributes;
    requestData = {
      title: attrs.title,
      text: attrs.text,
      isPinned: attrs.isPinned !== undefined ? attrs.isPinned : false
    };
  } else {
    // Handle direct format
    requestData = req.body;
  }
 
  if (!requestData.title && !requestData.text) {
    return res.status(400).json({
      errors: [{ status: '400', title: 'Title or text is required' }]
    });
  }
 
  let order = requestData.isPinned ? pinOrderId++ : unPinOrderId++;
 
  const newNote = {
    id: notesId++,
    title: requestData.title || '',
    text: requestData.text || '',
    category: "mainNote",
    isPinned: !!requestData.isPinned,
    orderId: order,
  };
 
  notes.push(newNote);
 
  console.log("New note added:", newNote);
 
  // Format response for JSON:API
  res.status(201).json({
    data: noteToJsonAPI(newNote)
  });
});
 
// Update a note
app.patch('/notes/:id', (req, res) => {
  const noteId = Number(req.params.id);
  const note = notes.find((n) => n.id === noteId);
  let order;
 
  if (!note) {
    return res.status(404).json({
      errors: [{ status: '404', title: 'Note not found' }]
    });
  }
 
  // Handle JSON:API format
  let requestData;
 
  if (req.body.data && req.body.data.attributes) {
    const attrs = req.body.data.attributes;
    requestData = {
      title: attrs.title,
      text: attrs.text,
      category: attrs.category,
      isPinned: attrs.isPinned
    };
  } else {
    requestData = req.body;
  }
 
  const { title, text, category, isPinned } = requestData;
 
  if (title !== undefined) {
    note.title = title;
  }
 
  if (text !== undefined) {
    note.text = text;
  }
 
  if (category !== undefined) {
    note.category = category;
  }
  
  if (isPinned !== undefined) {
    note.isPinned = isPinned;
  }
  
  if (category !== undefined || isPinned !== undefined) {
    if (category === 'trashNote') {
      order = TrashOrder++;
    } else if (note.isPinned) {
      order = pinOrderId++;
    } else {
      order = unPinOrderId++;
    }
  
    note.orderId = order;
  }
  
 
  console.log("Note updated:", note);
 
  // Format response for JSON:API
  res.json({ data: noteToJsonAPI(note) });
});
 
// Delete a note
app.delete('/notes/:id', (req, res) => {
  const noteId = Number(req.params.id);
  const noteIndex = notes.findIndex((n) => n.id === noteId);
 
  if (noteIndex === -1) {
    return res.status(404).json({
      errors: [{ status: '404', title: 'Note not found' }]
    });
  }
 
  const deletedNote = notes[noteIndex];
  notes.splice(noteIndex, 1);
  console.log("Note deleted:", deletedNote);
 
  // Return a valid JSON:API response
  res.json({
    meta: {
      success: true
    }
  });
});
 
// Sync notes
app.post('/notes/sync', (req, res) => {
  const { notes: updateNotes } = req.body;
  if (!updateNotes || !updateNotes.length) {
    return res.status(400).json({
      errors: [{ status: '400', title: 'Notes are required' }]
    });
  }
  updateNotes.forEach((noteObj) => {
    let id = parseInt(Object.keys(noteObj)[0], 10);
    let value = noteObj[id];
    if (id >= 1000) {
      const newNote = {
        id: notesId++,
        title: value.title || "",
        text: value.text || "",
        category: value.category ? value.category : "mainNote",
        isPinned: value.isPinned,
      };
      if (newNote.category!=="mainNote") {
        newNote.orderId= TrashOrder++;
      }
      else {
        newNote.orderId=value.isPinned ? pinOrderId++ : unPinOrderId++
      }
      notes.push(newNote);
    } else if (Object.keys(value).length === 0) {
      const noteIndex = notes.findIndex((n) => n.id === id);
      if (noteIndex !== -1) {
        notes.splice(noteIndex, 1);
      }
    } else {
      const note = notes.find((n) => n.id === id);
      if (note) {
        if (value.title !== undefined) note.title = value.title;
        if (value.text !== undefined) note.text = value.text;
        if (value.category !== undefined) {
          note.category = value.category;
          if (value.category === 'mainNote') {
            note.orderId = unPinOrderId++;
            note.isPinned = false;
          } else if (value.category === 'trashNote') {
            note.orderId = TrashOrder++;
          }
        }
        if (value.isPinned !== undefined) {
          note.isPinned = value.isPinned;
          note.orderId = value.isPinned ? pinOrderId++ : unPinOrderId++;
        }
      }
    }
  });

  console.log("Notes synced, updated notes:", notes);
  res.json({ success: true });
});

 
 
// Support for the GET reorder endpoint (but recommend using POST instead)
app.post('/notes/reorder', (req, res) => {
  console.log("Reorder request received:", req.body);
  const { orderMap } = req.body;

  // Update only the orderIds for notes included in the orderMap
  orderMap.forEach(({ id, orderId }) => {
    let note = notes.find(note => note.id === Number(id));
    if (note) {
      note.orderId = orderId;
      console.log(`Updated note with id: ${id}, new orderId: ${note.orderId}`);
    }
  });

  // Optional: Sort full notes array in-memory if needed
  notes.sort((a, b) => a.orderId - b.orderId);

  // Only return updated notes to frontend
  const updatedNotes = notes.filter(note =>
    orderMap.some(mapped => Number(mapped.id) === note.id)
  );

  const jsonApiNotes = updatedNotes.map(noteToJsonAPI);

  res.json({
    data: jsonApiNotes,
    meta: { success: true }
  });
});


 
// Initialize data
initializeData();
 
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Visit http://localhost:${PORT}/notes to see all notes`);
});
 
// Export for testing purposes if needed
module.exports = app;
 