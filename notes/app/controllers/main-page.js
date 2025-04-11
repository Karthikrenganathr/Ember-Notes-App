import Controller from "@ember/controller";
import { inject as service } from "@ember/service";
import { computed } from "@ember/object";
import updateLocalStorage from "../utils/changeLocalStorage";
let defaultStoreIndex = 1000;
export default Controller.extend({
  showheader: false,
  newNote_title: "",
  newNote_content: "",
  newNote_isPinned: false,
  search: service(),
  newNote_pinImageSrc: computed("newNote_isPinned", function () {
    return this.get("newNote_isPinned")
      ? "./img/note/unpin.svg"
      : "./img/notes/pin.svg";
  }),

  newNote_pinImageAlt: computed("newNote_isPinned", function () {
    return this.get("newNote_isPinned") ? "pin note" : "unPin note";
  }),

  filterPinnedNotes: computed(
    "search.query",
    "pinnedNotes",
    "pinnedNotes.@each.{title,text}",
    function () {
      let query = this.get("search.query").trim().toLowerCase();
      if (!query) {
        return [];
      }
      return this.get("pinnedNotes").filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.text.toLowerCase().includes(query)
      );
    }
  ),

  filterUnpinnedNotes: computed(
    "search.query",
    "unpinnedNotes",
    "unpinnedNotes.@each.{title,text}",
    function () {
      let query = this.get("search.query").trim().toLowerCase();
      if (!query) {
        return [];
      }
      return this.get("unpinnedNotes").filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.text.toLowerCase().includes(query)
      );
    }
  ),
  afterNoteCreated(newNote, isPinned) {
    if (isPinned) {
      this.get("pinnedNotes").unshiftObject(newNote);
    } else {
      this.get("unpinnedNotes").unshiftObject(newNote);
    }
    this.clearitem();
  },
  clearitem() {
    this.setProperties({
      showheader: false,
      newNote_title: "",
      newNote_content: "",
      newNote_isPinned: false,
    });
  },

  actions: {
    headerPinUnpin() {
      this.toggleProperty("newNote_isPinned");
    },

    expandTitle() {
      this.set("showheader", true);
    },

    clearNotes() {
      this.clearitem();
    },

    saveNote() {
      let newNote;
      const isPinned = this.get("newNote_isPinned");
      const title = this.get("newNote_title");
      const text = this.get("newNote_content");
      if (navigator.onLine) {
        newNote = this.store.createRecord("note", { title, text, isPinned });
        newNote
          .save()
          .then(() => {
            this.afterNoteCreated(newNote, isPinned);
          })
          .catch((error) => {
            console.error("Error saving note:", error);
          });
      } else {
        newNote = Ember.Object.create({
          id: defaultStoreIndex,
          title: title,
          text: text,
          isPinned,
          category: "mainNote",
          orderId: 0,
        });
        localStorage.setItem(defaultStoreIndex, JSON.stringify(newNote));
        defaultStoreIndex++;
        this.afterNoteCreated(newNote, isPinned);
      }
    },
    changePin(note) {
      const isPinned = note.get("isPinned");
      if (isPinned) {
        this.get("unpinnedNotes").removeObject(note);
        this.get("pinnedNotes").unshiftObject(note);
      } else {
        this.get("pinnedNotes").removeObject(note);
        this.get("unpinnedNotes").unshiftObject(note);
      }
    },
    archiveNote(note) {
      if (navigator.onLine) {
        note.set("category", "trashNote");
        note
          .save()
          .then(() => {
            if (note.get("isPinned")) {
              this.pinnedNotes.removeObject(note);
            } else {
              this.unpinnedNotes.removeObject(note);
            }
          })
          .catch((error) => {
            console.error("Error archiving note:", error);
          });
      } else {
        updateLocalStorage(note.get("id"), {
          category: "trashNote",
        });

        if (note.get("isPinned")) {
          this.pinnedNotes.removeObject(note);
        } else {
          this.unpinnedNotes.removeObject(note);
        }
      }
    },
    reorderNotes(startOrder, endOrder, isPinned) {
      let notes = isPinned
        ? this.get("pinnedNotes")
        : this.get("unpinnedNotes");
      let filtered = notes.filter((note) => {
        let order = note.get("orderId");
        return (
          order >= Math.min(startOrder, endOrder) &&
          order <= Math.max(startOrder, endOrder)
        );
      });
      filtered.sort((a, b) => b.get("orderId") - a.get("orderId"));
      let changeId = endOrder;
      let tempStore;
      let orderMap = [];
      if (startOrder > endOrder) {
        changeId = startOrder;
        for (let i = 1; i < filtered.length; i++) {
          tempStore = filtered[i].get("orderId");
          filtered[i].set("orderId", changeId);
          orderMap.push({ id: filtered[i].get("id"), orderId: changeId });
          changeId = tempStore;
        }
        filtered[0].set("orderId", changeId);
        orderMap.push({ id: filtered[0].get("id"), orderId: changeId });
      } else {
        for (let i = filtered.length - 1; i >= 0; i--) {
          tempStore = filtered[i].get("orderId");
          filtered[i].set("orderId", changeId);
          orderMap.push({ id: filtered[i].get("id"), orderId: changeId });
          changeId = tempStore;
        }
      }
      let requestData = { orderMap: orderMap };
      console.log(requestData);
      fetch("http://localhost:5070/notes/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })
        .then((response) => response.json())
        .then((data) => {
          this.store.pushPayload("note", data);
          if (isPinned) {
            let sortedPinned = this.pinnedNotes
              .toArray()
              .sort((a, b) => b.get("orderId") - a.get("orderId"));
            this.set("pinnedNotes", sortedPinned);
          } else {
            let sortedUnpinned = this.unpinnedNotes
              .toArray()
              .sort((a, b) => b.get("orderId") - a.get("orderId"));
            this.set("unpinnedNotes", sortedUnpinned);
          }
        })
        .catch((error) => {
          console.error("Error reordering notes:", error);
        });
    },
  },
});
