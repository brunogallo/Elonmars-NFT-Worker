const mysql = require('mysql2');

let db_con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: '',
    database: 'fish_db',
    multipleStatements: true
});

db_con.connect((err) => {
    if (err) {
      //console.log("Database Connection Failed !!!", err);
    } else {
      //console.log("connected to Database");
    }
});

module.exports = db_con;

// Execute uma consulta a cada X minutos para manter a conexão ativa
setInterval(() => {
  db_con.query("SELECT 1", error => {
    if (error) throw error;
    console.log("Consulta realizada com sucesso para manter a conexão ativa.");
  });
}, 5 * 60 * 1000); // X representa o número de minutos

// const pool = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "fish_db",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// const collector = {
//   release: function(connection) {
//     pool.releaseConnection(connection);
//   }
// };

// pool.on("acquire", function (connection) {
//   console.log("Connection %d acquired", connection.threadId);
// });

// pool.on("connection", function (connection) {
//   connection.on("end", function() {
//     collector.release(connection);
//   });
// });

// module.exports = {
//   pool: pool,
//   collector: collector
// };