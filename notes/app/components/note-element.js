import Component from "@ember/component";
import Ember from "ember";
import updateLocalStorage from "../utils/changeLocalStorage";
let draggedNote = null;
let startOrderId = null;
let startContainerClass = null;
export default Component.extend({
  router: Ember.inject.service(),
  attributeBindings: ["draggable"],
  draggable: "true",
  didInsertElement() {
    this._super(...arguments);
    this.element.addEventListener("dragstart", this.handleDragStart.bind(this));
    this.element.addEventListener("dragover", this.handleDragOver.bind(this));
    this.element.addEventListener("dragenter", this.handleDragEnter.bind(this));
    this.element.addEventListener("dragleave", this.handleDragLeave.bind(this));
    this.element.addEventListener("drop", this.handleDrop.bind(this));
    this.element.addEventListener("dragend", this.handleDragEnd.bind(this));
  },
  willDestroyElement() {
    this._super(...arguments);
    this.element.removeEventListener("dragstart", this.handleDragStart);
    this.element.removeEventListener("dragover", this.handleDragOver);
    this.element.removeEventListener("dragenter", this.handleDragEnter);
    this.element.removeEventListener("dragleave", this.handleDragLeave);
    this.element.removeEventListener("drop", this.handleDrop);
    this.element.removeEventListener("dragend", this.handleDragEnd);
  },
  handleDragStart(e) {
    this.element.style.opacity = "0.4";
    draggedNote = this;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", this.get("note.id"));
    startOrderId = this.get("note.orderId");
    startContainerClass = this.element.parentElement.className;
  },
  handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    return false;
  },
  handleDragEnter() {
    this.element.classList.add("dragover");
  },
  handleDragLeave() {
    this.element.classList.remove("dragover");
  },
  async handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (draggedNote !== this) {
      let sourceContainer = draggedNote.element.parentElement;
      let targetContainer = this.element.parentElement;
      if (sourceContainer !== targetContainer) return false;

      if (targetContainer && draggedNote) {
        let endOrderId = this.get("note.orderId");
        this.get("reorderNotes")(
          startOrderId,
          endOrderId,
          startContainerClass == "notes__pin__noteCon"
        );
      }
    }
    return false;
  },

  handleDragEnd() {
    this.element.style.opacity = "1";
    let parentNode = this.element.parentElement;
    Array.from(parentNode.children).forEach((child) => {
      child.classList.remove("dragover");
    });
    draggedNote = null;
    startOrderId = null;
    startContainerClass = null;
  },

  actions: {
    togglePin() {
      const note = this.get("note");
      const newIsPinned = !note.get("isPinned");
      note.set("isPinned", newIsPinned);
      if (navigator.onLine) {
        note
          .save()
          .then(() => {
            this.get("changePin")(note);
          })
          .catch((error) => {
            console.error("Error updating note:", error);
          });
      } else {
        updateLocalStorage(note.get("id"), { isPinned: newIsPinned });
        this.get("changePin")(note);
      }
    },

    archiveNote() {
      const note = this.get("note");
      this.get("archiveNote")(note);
    },

    openNote() {
      this.get("router").transitionTo("main-page.note", this.get("note.id"));
    },
  },
});
