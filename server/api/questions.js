import app from "../server.js";

export default function handler(req, res) {
  req.url = "/api/questions";
  return app(req, res);
}
