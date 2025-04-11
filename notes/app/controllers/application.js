import Controller from "@ember/controller";
import { inject as service } from "@ember/service";
import { throttle } from "@ember/runloop";
export default Controller.extend({
  search: service(),
  actions: {
    updateQuery(event) {
      let value = event.target.value;
      throttle(
        this,
        function () {
          this.get("search").updateQuery(value);
        },
        300
      );
    },
    clearSearch() {
      this.get("search").updateQuery("");
    },
  },
});
