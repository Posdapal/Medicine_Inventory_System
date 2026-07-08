const { Sequelize } = require("sequelize");


const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "mysql",
        logging: false,
    }
);



const connectDB = async () => {

    try {

        await sequelize.authenticate();

        console.log("✅ MySQL Database Connected");


    } catch(error) {

        console.log(
            "❌ MySQL Connection Failed:",
            error.message
        );

    }

};



module.exports = {
    sequelize,
    connectDB
};