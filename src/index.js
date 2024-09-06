const express = require('express')
const http = require('http')
const path = require('path')
const Filter = require('bad-words')
const {generateMessage, generateLocation} = require('./utils/messages')
const socketio = require('socket.io')
const { addUser,
    removeUser,
    getUser,
    getUsersInRoom} = require('./utils/user')
const port = process.env.PORT || 3000;

const app = express()
const server = http.createServer(app)
const io = socketio(server)

//defining paths
const pathToPublicDir = path.join(__dirname, '../public');

app.use(express.static(pathToPublicDir));

io.on('connection', (socket)=>{
 console.log('new web socket connection')


 socket.on('join', ({username, room}, callback)=>{
    const {error, user} = addUser({id: socket.id, username, room})

    if(error){
      return callback(error);
    }

    socket.join(user.room)

    socket.emit('message', generateMessage('Admin','Welcome!!')); // emit to the current one
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`)); // emit to all except the one sending

    // emit list to be rendered in left panel
    io.to(room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
    })
    callback()
 })


 socket.on('sendMessage', (data, callback) =>{
    const user = getUser(socket.id);
    const filter = new Filter();
    if(filter.isProfane(data)){
        return callback('Profanity is not allowed')
    }
    io.to(user.room).emit('message', generateMessage(user.username, data)); // to emit to all active connections
    callback();
})

socket.on('sendLocation', (data, callback)=>{
    const user = getUser(socket.id);
    io.to(user.room).emit('locationMessage', generateLocation(user.username, `https://www.google.com/maps?q=${data.latitude},${data.longitude}`))
    callback()
})



socket.on('disconnect', ()=>{
  const user = removeUser(socket.id);  
  if(user){
    io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
       // emit list to be rendered in left panel
       io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
    })
  }
})
})

server.listen(port, ()=>{
    console.log('App started on port '+ port);
})