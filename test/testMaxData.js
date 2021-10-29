const testMaxData = {
    name: "Max",
    docs: [
        {
            filename: "meinbuch",
            code: false,
            title: "Das Buch",
            content: "Das ist ein buch. Das ist mein Buch",
            comments: [
                { nr: 1, text: "Kommentar 1" },
                { nr: 2, text: "Kommentar 2" }
            ],
            allowedusers: [ "max@mustermann.de", "lisa@mustermann.de", "johnny@mustermann.de" ]
        },
        {
            filename: "daszweite",
            code: false,
            title: "Buch 2",
            content: "Hier ist ein Buch, das ich geschrieben habe.",
            comments: [
                { nr: 2, text: "Kommentar 2" },
                { nr: 4, text: "Kommentar 4" }
            ],
            allowedusers: [ "max@mustermann.de", "pelle@mustermann.de", "johnny@mustermann.de" ]
        },
        {
            filename: "kod",
            code: true,
            title: "My code",
            content: "console.log('hej');",
            comments: [],
            allowedusers: [ "max@mustermann.de", "johnny@mustermann.de", "lisa@mustermann.de" ]
        },
        {
            filename: "kod2",
            code: true,
            title: "My code again",
            content: "console.log('hej igen');",
            comments: [],
            allowedusers: [ "max@mustermann.de", "pelle@mustermann.de", "lisa@mustermann.de", "johnny@mustermann.de" ]
        }
    ],
    email: "max@mustermann.de",
    password: "$2a$10$sDMqioEmfkbrHr2TvD/IrOoJ1ZanQfrQ.03hym6SKNdSZ59oicUry"
};

module.exports = testMaxData;
