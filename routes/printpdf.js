"use strict";

const express = require('express');
const app = express();
const htmlPdfNode = require('html-pdf-node');
const path = require('path');
const fs = require('fs');

app.post("/printpdf", async function(req, res) {

    const html = req.body.html;

    let options = {
        format: 'A4',
        path: './temppdf/temp.pdf'
    };

    let file = { content: html };

    htmlPdfNode.generatePdf(file, options)
    .then(pdfBuffer => {
        let pdffolder = path.join(__dirname, '../temppdf/');
        var file = fs.createReadStream(`${pdffolder}temp.pdf`);
        file.pipe(res);
    });

});

module.exports = app;
