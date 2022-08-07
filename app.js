const express = require("express");
const ejs = require('ejs');
const fetch = require('node-fetch');
const url = require('url');
const bodyParser = require('body-parser')

process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err)
});

const formsUrl = process.env.FORMS_URL;
const formsAccessKey = process.env.FORMS_ACCESS_KEY;
const formsSecretKey = process.env.FORMS_SECRET_KEY;

if (
    !formsAccessKey ||
    !formsSecretKey ||
    !formsUrl
) {
    throw new Error(`must set environment variables FORMS_ACCESS_KEY, FORMS_SECRET_KEY, FORMS_URL`);
}

const userPass64 = Buffer.from(formsUsername + ":" + formsPassword).toString('base64');
const basicAuth = 'Basic ' + userPass64;
console.log(`basic auth header: ${basicAuth}`);

const app = express();
app.use(bodyParser.raw({ inflate: true, limit: '100kb', type: '*/*' }));
app.engine('html', ejs.renderFile);

app.get("/", function(request, response) {
    response.render("form.html")
});

app.post("/form", function(request, response) {
//    console.log(`request body:\n${request.body}`);
    fetch(formsUrl, {
        method: 'POST',
        headers: { 'Authorization': basicAuth },
        body: request.body      // this is a pass-through of the "raw" body contents
    })
    .then(formsResponse => {
        if ( !formsResponse.ok ) {
            (async () => {
                const errorBody = await formsResponse.text();
                const errorMessage = `form processor returned error: ${errorBody}`;
                console.error(errorMessage);
                response.render('error.html', {'errorMessage': errorMessage});
            })();
        } else {
            formsResponse.json()
            .then(json => {
                console.log(`received form processor response:`);
                for (const [key, value] of Object.entries(json)) {
                    console.log(`${key} = ${value}`)
                }
                response.render("success.html", json);
            })
            ; // expecting a json response
        }
    })
    .catch(error => {
        console.error(`error when processing form: ${error}`);
        response.render('error.html', {'errorMessage': error.message});
    });
});

const host = '0.0.0.0';
const port = 8000;
app.listen(port, host, () => {
  console.log(`Form data sample app is listening on host ${host} and port ${port}!`)
});
