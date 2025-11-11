interface Statement {
    title: string;
    link: string;
}

const currentStatements: Statement[] = [];

const pastStatements: Statement[] = [
    {
        title: "AI CAPTCHA Solver",
        link: "https://docs.google.com/document/d/1WAGW9vfuDpJDFCwbo0tla_n1eNT21JCawRRw7OEapbo/preview",
    },
    {
        title: "Flowchart Maker",
        link: "https://docs.google.com/document/d/1clXvAPFvjHbGQ9VllL7_TkIIOvqPFIxIIStKboi3BbY/preview",
    },
    {
        title: "String Matching",
        link: "https://docs.google.com/document/d/1ocGHfb4R72NqaelWS9AAM-t3tTzuYUnAhSzcZDhrP5M/preview",
    },
    {
        title: "Contact Sharing",
        link: "https://docs.google.com/document/d/1rcRB_D3H2O6oOaDeTmL0tBMxcgE8rzYmqzeogimlLcI/preview",
    },
    {
        title: "Traffic Management",
        link: "https://docs.google.com/document/d/1bFQErWKMvuH0hOcysGD9PIeiPPULy90DVy8xYm5OV1Y/preview",
    },
];

export { currentStatements, pastStatements, type Statement };