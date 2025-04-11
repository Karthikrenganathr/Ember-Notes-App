import Component from "@ember/component";

export default Component.extend({
  actions: {
    restoreNote() {
      const note = this.get("note");
      this.get("restoreNote")(note);
    },
    deleteNote() {
      const note = this.get("note");
      this.get("deleteNote")(note);
    },
  },
});
