const main = () => {
    if (process.env.NODE_ENV === "production") {
        console.log("Production environment");
    } else {
        console.log("Development environment");
    }
};

export default main;
