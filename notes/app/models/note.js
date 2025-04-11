import DS from "ember-data";

export default DS.Model.extend({
  title: DS.attr("string"),
  text: DS.attr("string"),
  category: DS.attr("string"),
  isPinned: DS.attr("boolean"),
  orderId: DS.attr("number"),
});
