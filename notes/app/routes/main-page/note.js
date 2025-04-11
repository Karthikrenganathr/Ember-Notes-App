import Route from "@ember/routing/route";
import EmberObject from "@ember/object";
export default Route.extend({
  async model(params) {
    try {
      return await this.store.findRecord("note", params.id);
    } catch (error) {
      if (!navigator.onLine) {
        let stored = localStorage.getItem(params.id);
        if (stored) {
          return EmberObject.create(JSON.parse(stored));
        }
      }
      throw new Error("Note not found");
    }
  },
  setupController(controller, model) {
    this._super(controller, model);
    controller.setProperties({
      title: model.title,
      text: model.text,
      isPinned: model.isPinned,
    });
  },
});
