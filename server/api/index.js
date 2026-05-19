import app from "../server.js";

export default function handler(req, res) {
  req.url = "/";
  return app(req, res);
}
