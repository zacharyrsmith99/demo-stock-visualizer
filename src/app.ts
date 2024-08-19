import express from "express";

export default async function createApp() {
  const app = express();

  app.get("/", (req, res) => {
    res.send("test");
  });

  return app;
}
