const testUser2Data = {
    name: "Lisa",
    docs: [
        {
            filename: "lisasbok",
            code: false,
            title: "LisaBoken",
            content: "This is Lisas book",
            comments: [
                { nr: 1, text: "Comment 1" },
                { nr: 2, text: "Comment 2" }
            ],
            allowedusers: [ "lisa@mustermann.de", "max@mustermann.de", "johnny@mustermann.de" ]
        },
        {
            filename: "lisa2",
            code: false,
            title: "Lisas bok nr 2",
            content: "I wrote this",
            comments: [
                { nr: 2, text: "Comment nr 2" },
                { nr: 4, text: "Comment nr 4" }
            ],
            allowedusers: [ "lisa@mustermann.de", "johnny@mustermann.de", "svenne@mustermann.de" ]
        },
        {
            filename: "lisascode",
            code: true,
            title: "Code title",
            content: "console.log('Lisas code');",
            comments: [],
            allowedusers: [ "lisa@mustermann.de", "johnny@mustermann.de" ]
        },
        {
            filename: "lisas2code",
            code: true,
            title: "My code again",
            content: "console.log('hej igen lisa');",
            comments: [],
            allowedusers: [ "lisa@mustermann.de", "pelle@mustermann.de", "max@mustermann.de", "johnny@mustermann.de" ]
        }
    ],
    email: "lisa@mustermann.de",
    password: "$2a$10$nb.nCoRLDyK5a1gZfogx.e7aSvTYQPLWArEdHdvc33dsjnihDVac6"
};

module.exports = testUser2Data;
