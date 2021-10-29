/**
 * @fileOverview Convert file contents = a HTML string, to a PDF blob to allow
 * printing.
 * @author - xlsson
 */

"use strict";

const express = require('express');
const app = express();
const htmlPdfNode = require('html-pdf-node');
const path = require('path');
const fs = require('fs');

/**
 * Convert file contents = a HTML string, to a PDF blob to allow printing
 *
 * @async
 *
 * @param {object} req                   Request object, consisting of:
 * @param {string} req.body.html         HTML representation of the file title
 *                                       and its content.
 *
 * @return {res}                         WriteStream carrying the generated PDF
 *                                       ReadStream.
 */
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
        file.pipe(res.status(200));
    });

});

module.exports = app;
