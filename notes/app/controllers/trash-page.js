import Controller from "@ember/controller";
import { computed } from "@ember/object";
import { inject as service } from "@ember/service";
import updateLocalStorage from "../utils/changeLocalStorage";
export default Controller.extend({
  search: service(),
  filterTrashNote: computed("search.query", "trashNotes", function () {
    let query = this.get("search.query").trim().toLowerCase();
    if (!query) {
      return [];
    }
    return this.get("trashNotes").filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.text.toLowerCase().includes(query)
    );
  }),
  actions: {
    restoreNote(note) {
      note.set("category", "mainNote");
      note.set("isPinned", false);
      if (navigator.onLine) {
        note
          .save()
          .then(() => {
            this.trashNotes.removeObject(note);
          })
          .catch((error) => {
            console.error("Error restoring note:", error);
          });
      } else {
        updateLocalStorage(note.get("id"), {
          category: "mainNote",
        });
        this.trashNotes.removeObject(note);
      }
    },
    deleteNote(note) {
      if (navigator.onLine) {
        note
          .destroyRecord()
          .then(() => {
            this.trashNotes.removeObject(note);
          })
          .catch((error) => {
            console.error("Error deleting note:", error);
          });
      } else {
        localStorage.setItem(note.get("id"), JSON.stringify({}));
        this.trashNotes.removeObject(note);
      }
    },
  },
});
