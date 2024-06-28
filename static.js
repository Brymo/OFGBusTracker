const express = require("express");
const app = express();

app.use(express.static('./'))

const port = 3001;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});