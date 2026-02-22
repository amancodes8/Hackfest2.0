const app = require("./app");

const port = Number(process.env.PORT || 8000);

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
