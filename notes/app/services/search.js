import Service from "@ember/service";
import { set } from "@ember/object";
export default Service.extend({
  query: "",
  updateQuery(newQuery) {
    set(this, "query", newQuery);
  },
});
