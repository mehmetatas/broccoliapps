import * as v from "valibot";
import { UserDetailPage } from "../../client";
import { page } from "../lambda";

page
  .route("/users/:id", UserDetailPage)
  .withRequest({ id: v.pipe(v.string(), v.minLength(1)) })
  .handler(async (req, res) => {
    // TODO: fetch from database
    return res.render({
      id: req.id,
      name: "Alice",
      email: "alice@example.com",
    });
  });
