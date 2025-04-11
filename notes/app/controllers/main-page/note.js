import Controller from "@ember/controller";
import { getOwner } from "@ember/application";
import updateLocalStorage from "../../utils/changeLocalStorage";
export default Controller.extend({
  updatePinState(model, isPinned) {
    const owner = getOwner(this);
    const mainPageController = owner.lookup("controller:main-page");
    if (isPinned) {
      mainPageController.get("unpinnedNotes").removeObject(model);
      mainPageController.get("pinnedNotes").unshiftObject(model);
    } else {
      mainPageController.get("pinnedNotes").removeObject(model);
      mainPageController.get("unpinnedNotes").unshiftObject(model);
    }
  },
  actions: {
    togglePin() {
      this.toggleProperty("isPinned");
    },
    saveAndClose() {
      const model = this.get("model");
      const { title, text, isPinned } = this.getProperties(
        "title",
        "text",
        "isPinned"
      );
      const wasPinned = model.get("isPinned");
      const changedFields = {};
      if (model.title !== title) changedFields.title = title;
      if (model.text !== text) changedFields.text = text;
      if (wasPinned !== isPinned) changedFields.isPinned = isPinned;
      if (Object.keys(changedFields).length === 0) {
        this.transitionToRoute("main-page");
        return;
      }
      model.setProperties(changedFields);
      if (navigator.onLine) {
        model
          .save()
          .then(() => {
            if (changedFields.isPinned !== undefined) {
              this.updatePinState(model, isPinned);
            }
            this.transitionToRoute("main-page");
          })
          .catch((err) => {
            console.error("Error saving note:", err);
          });
      } else {
        updateLocalStorage(model.id, changedFields);
        if (changedFields.isPinned !== undefined) {
          this.updatePinState(model, isPinned);
        }
        this.transitionToRoute("main-page");
      }
    },
  },
});
