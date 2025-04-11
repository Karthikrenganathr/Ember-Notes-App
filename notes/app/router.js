import EmberRouter from "@ember/routing/router";
import config from "./config/environment";

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL,
});

Router.map(function () {
  this.route("mainPage");
  this.route("trashPage");

  this.route("main-page", function () {
    this.route("note", { path: "/note/:id" });
  });
});

export default Router;
