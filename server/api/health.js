import app from "../server.js";

export default function handler(req, res) {
  req.url = "/health";
  return app(req, res);
}
