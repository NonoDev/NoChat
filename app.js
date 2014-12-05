var express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io").listen(server);

// Escucha del servidor para el proyecto en remoto
server.listen(process.env.PORT, process.env.IP);

// Escucha para el proyecto en local
//server.listen(8000);

// Cuando exista alguna petición, devolvemos el archivo "index.html"
app.get('/', function(request, response){
    response.sendfile(__dirname + '/index.html');
});

// Variable para los usuarios conectados
var usuariosOnline = {};
// Conexion
// Cada vez que alguien se conecte, se crea un nuevo socket
io.sockets.on('connection', function(socket){
    // Comprobación de que el usuario está conectado
    socket.on("loginUser", function(username)
    {
        //si existe el nombre de usuario en el chat
        if(usuariosOnline[username])
        {
            socket.emit("userInUse");
            return;
        }
        //Guardamos el nombre de usuario en la sesión del socket para este cliente
        socket.username = username;
        //añadimos al usuario a la lista global donde almacenamos usuarios
        usuariosOnline[username] = socket.username;
        //mostramos al cliente como que se ha conectado
        socket.emit("refreshChat", "yo", "Bienvenido " + socket.username + ", te has conectado correctamente.");
        //mostramos de forma global a todos los usuarios que un usuario
        //se acaba de conectar al chat
        socket.broadcast.emit("refreshChat", "conectado", "El usuario " + socket.username + " se ha conectado al chat.");
        //actualizamos la lista de usuarios en el chat del lado del cliente
        io.sockets.emit("updateSidebarUsers", usuariosOnline);
    });
    
    // Se crea y se envia el mensaje a todo el mundo conectado
    socket.on('sendMessage', function(data){
       io.sockets.emit('newMessage', {msg: data}); 
    });
    
    //cuando el usuario cierra o actualiza el navegador
    socket.on("disconnect", function()
    {
        //si el usuario, por ejemplo, sin estar logueado refresca la
        //página, el typeof del socket username es undefined, y el mensaje sería 
        //El usuario undefined se ha desconectado del chat, con ésto lo evitamos
        if(typeof(socket.username) == "undefined")
        {
            return;
        }
        //en otro caso, eliminamos al usuario
        delete usuariosOnline[socket.username];
        //actualizamos la lista de usuarios en el chat, zona cliente
        io.sockets.emit("updateSidebarUsers", usuariosOnline);
        //emitimos el mensaje global a todos los que están conectados con broadcasts
        socket.broadcast.emit("refreshChat", "desconectado", "El usuario " + socket.username + " se ha desconectado del chat.");
    });

});

