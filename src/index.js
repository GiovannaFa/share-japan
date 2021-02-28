//configurar express:
const express = require('express');

const config = require("./server/config");
//database
require("./database");//ejecuta el codigo contenido en database.js

const app = config(express());
//starting server
app.listen(app.get('port'), () => {
    console.log("Server on port", app.get('port'));
});
