import Route from "@ember/routing/route";
export default Route.extend({
  model() {
    return this.store.query("note", { category: "mainNote" });
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.setProperties({
      pinnedNotes: model.filterBy("isPinned", true),
      unpinnedNotes: model.filterBy("isPinned", false),
    });
  },
});
