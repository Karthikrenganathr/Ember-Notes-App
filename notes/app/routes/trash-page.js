import Route from "@ember/routing/route";
export default Route.extend({
  model() {
    return this.store.query("note", { category: "trashNote" });
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.set("trashNotes", model.toArray());
  },
});
